'use client';
import { useEffect, useRef, useState } from 'react';
import { FOUNDATION_WORLD, FOUNDATION_ROOM, PROTOCOL_VERSION, type WorldRoomState } from '@mmorpg/shared';
import { MOVEMENT_MESSAGE, PROTOCOL_ERROR_MESSAGE, protocolErrorSchema } from '@mmorpg/shared';

export default function World() {
  const host = useRef<HTMLDivElement>(null);
  const disconnect = useRef<(() => void) | null>(null);
  const [status, setStatus] = useState('Đang tải renderer');
  useEffect(() => {
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
        preload() { this.load.image('test-character', '/assets/test/cultivation-idle-south.png'); }
        create() {
          this.cameras.main.setBounds(0, 0, FOUNDATION_WORLD.width, FOUNDATION_WORLD.height);
          const grid = this.add.graphics().lineStyle(1, 0x2c414b, 0.6);
          for (let x = 0; x <= FOUNDATION_WORLD.width; x += FOUNDATION_WORLD.unit) grid.lineBetween(x, 0, x, FOUNDATION_WORLD.height);
          for (let y = 0; y <= FOUNDATION_WORLD.height; y += FOUNDATION_WORLD.unit) grid.lineBetween(0, y, FOUNDATION_WORLD.width, y);
          for (const r of FOUNDATION_WORLD.obstacles) this.add.rectangle(r.x, r.y, r.width, r.height, 0x9b7650).setOrigin(0);
          this.keys = this.input.keyboard?.addKeys('W,A,S,D') as Record<string, import('phaser').Input.Keyboard.Key> | undefined;
          const resize = () => this.cameras.main.setZoom(Phaser.Math.Clamp(Math.min(this.scale.width / FOUNDATION_WORLD.width, this.scale.height / FOUNDATION_WORLD.height), FOUNDATION_WORLD.zoomMin, FOUNDATION_WORLD.zoomMax));
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
            this.cameras.main.setZoom(Phaser.Math.Clamp(this.cameras.main.zoom - dy * 0.001, FOUNDATION_WORLD.zoomMin, FOUNDATION_WORLD.zoomMax));
          });
          void this.connect(Client);
        }
        private async connect(ClientClass: typeof Client) {
          try {
            setStatus('Đang kết nối server');
            const room = await new ClientClass(process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://127.0.0.1:2567').joinOrCreate<WorldRoomState>(FOUNDATION_ROOM, { version: PROTOCOL_VERSION });
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
                  visual = { image: this.add.image(player.x, player.y, 'test-character').setOrigin(57.7539 / 128, 114 / 128).setScale(FOUNDATION_WORLD.renderScale), shadow: this.add.ellipse(player.x, player.y, 27, 9, 0x000000, 0.25) };
                  this.sprites.set(id, visual);
                }
                visual.image.setPosition(player.x, player.y).setDepth(player.y + 0.1);
                visual.shadow.setPosition(player.x, player.y).setDepth(player.y);
                if (id === room.sessionId) this.cameras.main.startFollow(visual.image, true);
              });
              for (const [id, visual] of this.sprites) if (!present.has(id)) { visual.image.destroy(); visual.shadow.destroy(); this.sprites.delete(id); }
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
          this.nextSend = time + FOUNDATION_WORLD.tickMs;
          const active = document.hasFocus();
          this.send(active ? Number(this.keys.D?.isDown) - Number(this.keys.A?.isDown) : 0,
            active ? Number(this.keys.S?.isDown) - Number(this.keys.W?.isDown) : 0);
        }
      }
      game = new Phaser.Game({ type: Phaser.AUTO, parent: element, backgroundColor: '#162a30', width: FOUNDATION_WORLD.width, height: FOUNDATION_WORLD.height, scene: Scene, scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH } });
    }
    void start().catch(() => { if (!cancelled) setStatus('Không thể tải renderer'); });
    return () => { cancelled = true; close?.(); disconnect.current = null; game?.destroy(true); };
  }, []);
  return <section aria-label="Cảnh multiplayer thử nghiệm">
    <div className="toolbar"><span role="status">{status}</span><span>Người trong phòng: <b id="player-count">0</b></span><button onClick={() => disconnect.current?.()}>Ngắt kết nối</button></div>
    <div ref={host} data-testid="world" className="world" />
  </section>;
}
