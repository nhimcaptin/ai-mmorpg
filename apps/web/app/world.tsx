'use client';
import { useEffect, useRef, useState } from 'react';
import { FOUNDATION_WORLD, FOUNDATION_ROOM, STARTER_MAP, STARTER_ROOM, PROTOCOL_VERSION, type WorldRoomState } from '@mmorpg/shared';
import { MOVEMENT_MESSAGE, PROTOCOL_ERROR_MESSAGE, protocolErrorSchema } from '@mmorpg/shared';

export default function World({ starter = false }: { starter?: boolean }) {
  const host = useRef<HTMLDivElement>(null);
  const disconnect = useRef<(() => void) | null>(null);
  const [status, setStatus] = useState('Đang tải renderer');
  useEffect(() => {
    const world = starter ? STARTER_MAP.world : FOUNDATION_WORLD;
    const element = host.current!;
    let cancelled = false;
    let game: import('phaser').Game | undefined;
    let close: (() => void) | undefined;
    async function start() {
      const [{ default: Phaser }, { Client }] = await Promise.all([import('phaser'), import('colyseus.js')]);
      if (cancelled) return;
      class Scene extends Phaser.Scene {
        private room?: import('colyseus.js').Room<WorldRoomState>;
        private sprites = new Map<string, { image: import('phaser').GameObjects.Image; shadow: import('phaser').GameObjects.Ellipse }>();
        private keys?: Record<string, import('phaser').Input.Keyboard.Key>;
        private sequence = 0;
        private nextSend = 0;
        private disposed = false;
        private props: { data: typeof STARTER_MAP.props[number]; image: import('phaser').GameObjects.Image }[] = [];
        preload() {
          this.load.image('test-character', '/assets/test/cultivation-idle-south.png');
          if (starter) { this.load.image('terrain', STARTER_MAP.ground); for (const prop of STARTER_MAP.props) this.load.image(prop.id, prop.image); }
        }
        create() {
          this.cameras.main.setBounds(0, 0, world.width, world.height);
          if (starter) {
            this.add.image(0, 0, 'terrain').setOrigin(0).setDepth(-1);
            for (const data of STARTER_MAP.props) this.props.push({ data, image: this.add.image(data.x, data.y, data.id).setOrigin(0).setDisplaySize(data.width, data.height).setDepth(data.depth) });
            element.dataset.mapId = world.id; element.dataset.areaId = STARTER_MAP.area.id; element.dataset.respawnId = STARTER_MAP.respawn.id;
            element.dataset.pkAllowed = String(STARTER_MAP.area.pkAllowed);
          } else {
          const grid = this.add.graphics().lineStyle(1, 0x2c414b, 0.6);
          for (let x = 0; x <= world.width; x += world.unit) grid.lineBetween(x, 0, x, world.height);
          for (let y = 0; y <= world.height; y += world.unit) grid.lineBetween(0, y, world.width, y);
          for (const r of world.obstacles) this.add.rectangle(r.x, r.y, r.width, r.height, 0x9b7650).setOrigin(0);
          }
          this.keys = this.input.keyboard?.addKeys('W,A,S,D') as Record<string, import('phaser').Input.Keyboard.Key> | undefined;
          const resize = () => this.setZoom(Math.min(this.scale.width / world.width, this.scale.height / world.height));
          resize(); this.scale.on('resize', resize);
          const stop = () => this.send(0, 0);
          this.game.events.on(Phaser.Core.Events.BLUR, stop);
          this.events.once('shutdown', () => {
            this.disposed = true; this.scale.off('resize', resize);
            this.game.events.off(Phaser.Core.Events.BLUR, stop);
            if (this.room?.connection.isOpen) void this.room.leave();
          });
          close = () => { if (this.room?.connection.isOpen) void this.room.leave(); };
          disconnect.current = close;
          this.input.on('wheel', (_pointer: unknown, _objects: unknown, _dx: number, dy: number) => {
            this.setZoom(this.cameras.main.zoom - dy * 0.001);
          });
          void this.connect(Client);
        }
        private setZoom(value: number) {
          const camera = this.cameras.main;
          camera.setZoom(Phaser.Math.Clamp(value, world.zoomMin, world.zoomMax));
          if (starter) {
            // Center letterboxing when the world is smaller than the viewport at clamped zoom.
            const width = Math.min(this.scale.width, world.width * camera.zoom), height = Math.min(this.scale.height, world.height * camera.zoom);
            camera.setViewport((this.scale.width - width) / 2, (this.scale.height - height) / 2, width, height);
          }
        }
        private async connect(ClientClass: typeof Client) {
          try {
            setStatus('Đang kết nối server');
            const room = await new ClientClass(process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://127.0.0.1:2567').joinOrCreate<WorldRoomState>(starter ? STARTER_ROOM : FOUNDATION_ROOM, { version: PROTOCOL_VERSION });
            if (this.disposed || cancelled) { await room.leave(); return; }
            this.room = room;
            room.onStateChange(state => {
              if (this.disposed) return;
              const present = new Set<string>();
              const players: { id: string; x: number; y: number }[] = [];
              state.players.forEach((player, id) => {
                present.add(id); players.push({ id, x: player.x, y: player.y });
                let visual = this.sprites.get(id);
                if (!visual) {
                  visual = { image: this.add.image(player.x, player.y, 'test-character').setOrigin(57.7539 / 128, 114 / 128).setScale(world.renderScale), shadow: this.add.ellipse(player.x, player.y, 27, 9, 0x000000, 0.25) };
                  this.sprites.set(id, visual);
                }
                visual.image.setPosition(player.x, player.y).setDepth(player.y + 0.1);
                visual.shadow.setPosition(player.x, player.y).setDepth(player.y);
                if (id === room.sessionId) this.cameras.main.startFollow(visual.image, true);
              });
              for (const [id, visual] of this.sprites) if (!present.has(id)) { visual.image.destroy(); visual.shadow.destroy(); this.sprites.delete(id); }
              const local = players.find(player => player.id === room.sessionId);
              for (const prop of this.props) {
                const { data } = prop;
                const covered = local && data.kind === 'tree' && local.y < data.depth - 20 && local.y >= data.y && local.x >= data.x && local.x <= data.x + data.width;
                prop.image.setAlpha(covered ? 0.5 : 1);
              }
              element.dataset.props = JSON.stringify(this.props.map(({ data, image }) => ({ id: data.id, depth: image.depth, alpha: image.alpha })));
              element.dataset.camera = JSON.stringify({ zoom: this.cameras.main.zoom, x: this.cameras.main.scrollX, y: this.cameras.main.scrollY });
              // Network positions stay in Phaser; DOM diagnostic avoids React movement state.
              element.dataset.players = JSON.stringify(players);
              element.dataset.localId = room.sessionId;
              element.dataset.status = 'connected';
              const count = document.getElementById('player-count');
              if (count) count.textContent = String(players.length);
              setStatus('Đã kết nối');
            });
            room.onLeave(() => {
              element.dataset.status = 'disconnected';
              if (!cancelled) setStatus('Đã ngắt kết nối');
            });
            room.onMessage(PROTOCOL_ERROR_MESSAGE, (payload: unknown) => {
              const error = protocolErrorSchema.safeParse(payload);
              if (error.success && !cancelled) setStatus(`Input bị từ chối: ${error.data.code}`);
            });
            room.onError((_code, message) => { if (!cancelled) setStatus(`Lỗi server: ${message ?? 'không rõ'}`); });
          } catch {
            if (!cancelled) { element.dataset.status = 'error'; setStatus('Không thể kết nối server local'); }
          }
        }
        private send(x: number, y: number) {
          if (this.room?.connection.isOpen) this.room.send(MOVEMENT_MESSAGE, { version: PROTOCOL_VERSION, sequence: this.sequence++, x, y });
        }
        update(time: number) {
          if (time < this.nextSend || !this.keys) return;
          this.nextSend = time + world.tickMs;
          const active = document.hasFocus();
          this.send(active ? Number(this.keys.D?.isDown) - Number(this.keys.A?.isDown) : 0,
            active ? Number(this.keys.S?.isDown) - Number(this.keys.W?.isDown) : 0);
        }
      }
      game = new Phaser.Game({ type: Phaser.AUTO, parent: element, backgroundColor: '#162a30', width: world.width, height: world.height, scene: Scene, scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH } });
    }
    void start().catch(() => { if (!cancelled) setStatus('Không thể tải renderer'); });
    return () => { cancelled = true; close?.(); disconnect.current = null; game?.destroy(true); };
  }, [starter]);
  return <section aria-label="Cảnh multiplayer thử nghiệm">
    <div className="toolbar"><span role="status">{status}</span><span>Người trong phòng: <b id="player-count">0</b></span><button onClick={() => disconnect.current?.()}>Ngắt kết nối</button></div>
    <div ref={host} data-testid="world" className="world" />
  </section>;
}
