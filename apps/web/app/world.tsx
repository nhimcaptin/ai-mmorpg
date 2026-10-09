'use client';
import { useEffect, useRef, useState } from 'react';
import { FOUNDATION_WORLD, FOUNDATION_ROOM, STARTER_MAP, STARTER_ROOM, AUTHENTICATED_ROOM, PROTOCOL_VERSION, type WorldRoomState } from '@mmorpg/shared';
import { MOVEMENT_MESSAGE, PROTOCOL_ERROR_MESSAGE, protocolErrorSchema } from '@mmorpg/shared';
import { OcclusionManager, vertices } from '@mmorpg/shared';
import { acceptsWorldInput, MovementKeys } from './world-input';

export default function World({ starter = false, auth, onSessionInvalid }: { starter?: boolean; auth?: { token: string; characterId: string }; onSessionInvalid?: () => void }) {
  const host = useRef<HTMLDivElement>(null);
  const disconnect = useRef<(() => void) | null>(null);
  const [status, setStatus] = useState('Đang tải renderer');
  const [playerCount, setPlayerCount] = useState(0);
  const [generation, setGeneration] = useState(0);
  const invalidSession = useRef(onSessionInvalid);
  useEffect(() => { invalidSession.current = onSessionInvalid; }, [onSessionInvalid]);
  const token = auth?.token, characterId = auth?.characterId;
  useEffect(() => {
    const auth = token && characterId ? { token, characterId } : undefined;
    setStatus('Đang tải renderer'); setPlayerCount(0);
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
        private keys = new MovementKeys();
        private sequence = 0;
        private disposed = false;
        private props = new Map<string, { data: typeof STARTER_MAP.props[number]; image: import('phaser').GameObjects.Image }>();
        private occlusion = new OcclusionManager(starter ? STARTER_MAP.props : []);
        private propDiagnostics = new Map<string, {id:string;depth:number;alpha:number;target:number}>();
        private propsDirty = false;
        private overlay?: import('phaser').GameObjects.Graphics;
        private actorOverlay?: import('phaser').GameObjects.Graphics;
        preload() {
          this.load.image('test-character', '/assets/test/cultivation-idle-south.png');
          if (starter) { this.load.image('terrain', STARTER_MAP.ground); for (const prop of STARTER_MAP.props) this.load.image(prop.id, prop.image); }
        }
        create() {
          this.cameras.main.setBounds(0, 0, world.width, world.height);
          if (starter) {
            this.add.image(0, 0, 'terrain').setOrigin(0).setDepth(-1);
            for (const data of STARTER_MAP.props) {
              this.props.set(data.objectId, { data, image: this.add.image(data.x, data.y, data.id).setOrigin(0).setDisplaySize(data.width, data.height).setDepth(data.depth) });
              this.propDiagnostics.set(data.id,{id:data.id,depth:data.depth,alpha:1,target:1});
            }
            element.dataset.props=JSON.stringify([...this.propDiagnostics.values()]);
            element.dataset.mapId = world.id; element.dataset.areaId = STARTER_MAP.area.id; element.dataset.respawnId = STARTER_MAP.respawn.id;
            element.dataset.pkAllowed = String(STARTER_MAP.area.pkAllowed);
          } else {
          const grid = this.add.graphics().lineStyle(1, 0x2c414b, 0.6);
          for (let x = 0; x <= world.width; x += world.unit) grid.lineBetween(x, 0, x, world.height);
          for (let y = 0; y <= world.height; y += world.unit) grid.lineBetween(0, y, world.width, y);
          for (const r of world.obstacles) this.add.rectangle(r.x, r.y, r.width, r.height, 0x9b7650).setOrigin(0);
          }
          this.overlay=this.add.graphics().setDepth(Number.MAX_SAFE_INTEGER).setVisible(false);
          this.actorOverlay=this.add.graphics().setDepth(Number.MAX_SAFE_INTEGER);
          const debug=()=> { this.overlay!.setVisible(!this.overlay!.visible); element.dataset.debug=String(this.overlay!.visible); };
          element.addEventListener('toggle-debug',debug);
          for(const object of starter?STARTER_MAP.props:[]) {
            for(const [shapes,color] of [[object.collisionFootprint,0xffffff], [object.occlusionRegion?[object.occlusionRegion]:[],0x00ffff]] as const) {
              for(const shape of shapes) {const points=vertices(shape);this.overlay.lineStyle(2,color,1).strokePoints(points,true,true);}
            }
            this.overlay.lineStyle(2,0xffcc00).lineBetween(object.sortingAnchor.x-8,object.sortingAnchor.y,object.sortingAnchor.x+8,object.sortingAnchor.y).lineBetween(object.sortingAnchor.x,object.sortingAnchor.y-8,object.sortingAnchor.x,object.sortingAnchor.y+8);
          }
          const resize = () => this.setZoom(Math.min(this.scale.width / world.width, this.scale.height / world.height));
          resize(); this.scale.on('resize', resize);
          const stop = () => { this.keys.clear(); this.send(0, 0); };
          const active = () => acceptsWorldInput(document.hasFocus(), document.activeElement);
          const publishInput = () => {
            if (cancelled || this.disposed) return;
            const input = this.keys.intent(active()); this.send(input.x, input.y);
          };
          const keyboard = (event: KeyboardEvent) => {
            if (event.repeat || !this.keys.key(event.code, event.type === 'keydown', active())) return;
            if (active()) event.preventDefault();
            publishInput();
          };
          const focus = () => { if (!active()) stop(); };
          window.addEventListener('keydown', keyboard); window.addEventListener('keyup', keyboard);
          window.addEventListener('blur', stop); document.addEventListener('focusin', focus);
          document.addEventListener('visibilitychange', stop);
          const heartbeat = window.setInterval(publishInput, world.tickMs);
          this.game.events.on(Phaser.Core.Events.BLUR, stop);
          const cleanup = () => {
            if (this.disposed) return;
            this.disposed = true; this.scale.off('resize', resize);
            this.game.events.off(Phaser.Core.Events.BLUR, stop);
            window.clearInterval(heartbeat);
            window.removeEventListener('keydown', keyboard); window.removeEventListener('keyup', keyboard);
            window.removeEventListener('blur', stop); document.removeEventListener('focusin', focus);
            document.removeEventListener('visibilitychange', stop); this.keys.clear();
            element.removeEventListener('toggle-debug',debug); this.occlusion.clear();
            this.input.off('wheel', wheel);
            this.room?.onStateChange.clear(); this.room?.onLeave.clear(); this.room?.onError.clear();
            if (this.room?.connection.isOpen) void this.room.leave();
          };
          this.events.once(Phaser.Scenes.Events.SHUTDOWN, cleanup);
          this.events.once(Phaser.Scenes.Events.DESTROY, cleanup);
          close = () => { if (this.room?.connection.isOpen) void this.room.leave(); };
          disconnect.current = close;
          const wheel = (_pointer: unknown, _objects: unknown, _dx: number, dy: number) => {
            this.setZoom(this.cameras.main.zoom - dy * 0.001);
          };
          this.input.on('wheel', wheel);
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
        private applyOcclusionChanges() {
          for (const id of this.occlusion.changedObjectIds) {
            const prop=this.props.get(id);
            if (!prop) continue;
            const target=this.occlusion.target(id);
            this.tweens.killTweensOf(prop.image);
            const publish=()=> {
              this.propDiagnostics.set(prop.data.id,{id:prop.data.id,depth:prop.image.depth,alpha:prop.image.alpha,target});
              this.propsDirty=true;
            };
            this.tweens.add({targets:prop.image,alpha:target,duration:prop.data.fadeDurationMs,ease:'Linear',onUpdate:publish,onComplete:publish});
          }
          // Deterministic diagnostic work counts; no FPS or device target is invented.
          element.dataset.occlusionWork=JSON.stringify({candidates:this.occlusion.lastCandidateChecks,changed:this.occlusion.changedObjectIds.size});
        }
        private async connect(ClientClass: typeof Client) {
          try {
            setStatus('Đang kết nối server');
            const room = await new ClientClass(process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://127.0.0.1:2567').joinOrCreate<WorldRoomState>(auth ? AUTHENTICATED_ROOM : starter ? STARTER_ROOM : FOUNDATION_ROOM, { version: PROTOCOL_VERSION, ...(auth ? { token: auth.token } : {}) });
            if (this.disposed || cancelled) { await room.leave(); return; }
            this.room = room;
            room.onStateChange(state => {
              if (this.disposed || cancelled) return;
              const present = new Set<string>();
              const players: { id: string; x: number; y: number }[] = [];
              state.players.forEach((player, id) => {
                present.add(id); players.push({ id, x: player.x, y: player.y });
                let visual = this.sprites.get(id);
                if (!visual) {
                  visual = { image: this.add.image(player.x, player.y, 'test-character').setOrigin(57.7539 / 128, 114 / 128).setScale(world.renderScale), shadow: this.add.ellipse(player.x, player.y, 27, 9, 0x000000, 0.25) };
                  this.sprites.set(id, visual);
                }
                visual.image.setPosition(player.x,player.y);
                const depth=this.occlusion.actorDepth(player,visual.image.getBounds());
                visual.image.setPosition(player.x, player.y).setDepth(depth);
                visual.shadow.setPosition(player.x, player.y).setDepth(depth-0.1);
                if (id === (auth?.characterId ?? room.sessionId)) {
                  this.sequence = Math.max(this.sequence, player.lastSequence + 1);
                  this.cameras.main.startFollow(visual.image, true);
                }
              });
              for (const [id, visual] of this.sprites) if (!present.has(id)) { visual.image.destroy(); visual.shadow.destroy(); this.sprites.delete(id); }
              this.occlusion.update(players);
              this.applyOcclusionChanges();
              element.dataset.camera = JSON.stringify({ zoom: this.cameras.main.zoom, x: this.cameras.main.scrollX, y: this.cameras.main.scrollY });
              // Network positions stay in Phaser; DOM diagnostic avoids React movement state.
              element.dataset.players = JSON.stringify(players);
              element.dataset.rendering=JSON.stringify([...this.sprites].map(([id,v])=>({id,depth:v.image.depth,alpha:v.image.alpha})));
              element.dataset.localId = auth?.characterId ?? room.sessionId;
              element.dataset.status = 'connected';
              // Only coarse HUD values cross into React, never positions/tick state.
              setPlayerCount(previous => previous === players.length ? previous : players.length);
              setStatus('Đã kết nối');
            });
            room.onLeave(() => {
              if (cancelled || this.disposed) return;
              this.occlusion.clear(); this.applyOcclusionChanges();
              for(const visual of this.sprites.values()) {visual.image.destroy();visual.shadow.destroy();} this.sprites.clear();
              element.dataset.players='[]';
              element.dataset.status = 'disconnected';
              setPlayerCount(0);
              if (!cancelled) setStatus('Đã ngắt kết nối');
              if (auth && !cancelled && !this.disposed) invalidSession.current?.();
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
        update() {
          if(this.propsDirty) {
            element.dataset.props=JSON.stringify([...this.propDiagnostics.values()]);
            this.propsDirty=false;
          }
          if(this.overlay?.visible) {
            this.actorOverlay!.clear();
            for(const [id,v] of this.sprites) this.actorOverlay!.lineStyle(2,id===(auth?.characterId ?? this.room?.sessionId)?0x00ff00:0xff00ff).strokeRect(v.image.x-world.footprint.halfWidth,v.image.y-world.footprint.halfHeight,world.footprint.halfWidth*2,world.footprint.halfHeight*2);
            // Render authorized local/remote feet; no new visibility or networking channel.
            element.dataset.debugActors=JSON.stringify([...this.sprites].map(([id,v])=>({id,x:v.image.x,y:v.image.y,local:id===(auth?.characterId ?? this.room?.sessionId)})));
          } else this.actorOverlay?.clear();
        }
      }
      game = new Phaser.Game({ type: Phaser.AUTO, parent: element, backgroundColor: '#162a30', width: world.width, height: world.height, scene: Scene, scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH } });
    }
    void start().catch(() => { if (!cancelled) setStatus('Không thể tải renderer'); });
    return () => { cancelled = true; close?.(); disconnect.current = null; game?.destroy(true); };
  }, [starter, token, characterId, generation]);
  return <section aria-label="Cảnh multiplayer thử nghiệm">
    <div className="toolbar"><span role="status">{status}</span><span>Người trong phòng: <b data-testid="player-count">{playerCount}</b></span><button onClick={() => disconnect.current?.()}>Ngắt kết nối</button>{!auth && <button onClick={() => setGeneration(value => value + 1)}>Kết nối lại preview</button>}{starter && <><button onClick={()=>host.current?.dispatchEvent(new Event('toggle-debug'))}>Collision debug</button><a href="/tools/collision">Chỉnh footprint</a></>}</div>
    <div ref={host} data-testid="world" className="world" />
  </section>;
}
