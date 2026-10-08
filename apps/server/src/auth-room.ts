import { Room, type Client } from '@colyseus/core';
import { authenticatedJoinSchema, STARTER_MAP, MOVEMENT_MESSAGE, movementIntentSchema, type MovementIntent } from '@mmorpg/shared';
import { move, directionFor } from '@mmorpg/game-core';
import { WorldState, PlayerState } from './world-room.js';
import type { AuthService } from './auth.js';
export const RECONNECT_GRACE_MS = 30000;
type Connection = { client: Client; accountId: string; authId: string; token: string; characterId: string };
/** Authenticated re-join, not native seat reconnection: every reconnect validates the current DB session. */
export function authenticatedRoom(auth: AuthService): new () => Room<WorldState> {
  return class AuthenticatedWorldRoom extends Room<WorldState> {
    private connections = new Map<string, Connection>();
    private inputs = new Map<string, { input: MovementIntent; at: number }>();
    private pending = new Map<string, { until: number; authId: string; accountId: string }>();
    private busy = false;
    private disposed = false;
    private unsubscribe?: () => void;
    async onCreate() {
      await this.setMetadata({ mapId: STARTER_MAP.world.id, areaId: STARTER_MAP.area.id });
      this.setState(new WorldState()); this.setPatchRate(STARTER_MAP.world.tickMs);
      this.unsubscribe = auth.subscribe((accountId, authId) => {
        for (const connection of this.connections.values()) if (connection.accountId === accountId && connection.authId !== authId) this.remove(connection);
        for (const [id, pending] of this.pending) if (pending.accountId === accountId && pending.authId !== authId) { this.pending.delete(id); this.state.players.delete(id); }
      });
      this.onMessage(MOVEMENT_MESSAGE, (client, value: unknown) => {
        const connection = this.connections.get(client.sessionId), parsed = movementIntentSchema.safeParse(value);
        if (!connection || !parsed.success) return;
        const player = this.state.players.get(connection.characterId);
        if (!player || parsed.data.sequence <= Math.max(player.lastSequence, this.inputs.get(client.sessionId)?.input.sequence ?? -1)) return;
        // Applied only after DB session validation in tick; caller never supplies a position.
        this.inputs.set(client.sessionId, { input: parsed.data, at: auth.now() });
      });
      this.setSimulationInterval(() => { void this.tick(); }, STARTER_MAP.world.tickMs);
    }
    async onAuth(_client: Client, value: unknown) {
      const parsed = authenticatedJoinSchema.safeParse(value);
      if (!parsed.success) return false;
      try {
        const session = await auth.authenticate(parsed.data.token), character = session.account.character!;
        return character.mapId === STARTER_MAP.world.id && character.areaId === STARTER_MAP.area.id;
      } catch { return false; }
    }
    async onJoin(client: Client, value: unknown) {
      const options = authenticatedJoinSchema.parse(value), session = await auth.authenticate(options.token);
      const character = session.account.character!, pending = this.pending.get(character.id);
      if (this.disposed || character.mapId !== STARTER_MAP.world.id || character.areaId !== STARTER_MAP.area.id) throw new Error('INVALID_WORLD_SESSION');
      if (options.reconnect && (!pending || pending.authId !== session.id || pending.until <= auth.now())) throw new Error('RECONNECT_EXPIRED');
      for (const connection of this.connections.values()) if (connection.accountId === session.accountId) this.remove(connection);
      let player = this.state.players.get(character.id);
      if (!player || !pending || pending.authId !== session.id || pending.until <= auth.now()) {
        player = new PlayerState(); player.id = character.id;
        Object.assign(player, STARTER_MAP.world.spawn);
        this.state.players.set(character.id, player);
      }
      player.lastSequence = -1; // Sequence belongs to this transport, not character identity.
      this.pending.delete(character.id);
      this.autoDispose = this.pending.size === 0;
      this.connections.set(client.sessionId, { client, accountId: session.accountId, authId: session.id, token: options.token, characterId: character.id });
    }
    onLeave(client: Client, consented: boolean) {
      const connection = this.connections.get(client.sessionId);
      if (!connection) return;
      this.connections.delete(client.sessionId); this.inputs.delete(client.sessionId);
      if (consented) this.state.players.delete(connection.characterId);
      else this.pending.set(connection.characterId, { until: auth.now() + RECONNECT_GRACE_MS, authId: connection.authId, accountId: connection.accountId });
      // Keep an empty room only while authoritative reconnect grace is pending.
      this.autoDispose = this.pending.size === 0;
    }
    private remove(connection: Connection) {
      this.connections.delete(connection.client.sessionId); this.inputs.delete(connection.client.sessionId);
      this.pending.delete(connection.characterId); this.state.players.delete(connection.characterId);
      connection.client.leave(4001);
    }
    async tick() {
      if (this.busy || this.disposed) return;
      this.busy = true;
      try {
        for (const [id, pending] of this.pending) if (pending.until <= auth.now()) { this.pending.delete(id); this.state.players.delete(id); }
        this.autoDispose = this.pending.size === 0;
        for (const connection of this.connections.values()) {
          try { await auth.authenticate(connection.token); } catch { this.remove(connection); continue; }
          if (this.connections.get(connection.client.sessionId) !== connection) continue;
          const pending = this.inputs.get(connection.client.sessionId), player = this.state.players.get(connection.characterId);
          if (!player || !pending || auth.now() - pending.at > STARTER_MAP.world.inputTimeoutMs) continue;
          if (pending.input.sequence < player.lastSequence) continue;
          player.lastSequence = pending.input.sequence;
          const next = move(player, pending.input, STARTER_MAP.world.tickMs / 1000, STARTER_MAP.world);
          player.x = next.x; player.y = next.y; player.direction = directionFor(pending.input.x, pending.input.y, player.direction);
        }
      } finally { this.busy = false; }
    }
    onDispose() {
      this.disposed = true; this.unsubscribe?.();
      this.connections.clear(); this.inputs.clear(); this.pending.clear(); this.state.players.clear();
    }
  };
}
