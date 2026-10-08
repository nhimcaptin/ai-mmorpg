import { Room, type Client } from '@colyseus/core';
import { Schema, MapSchema, defineTypes } from '@colyseus/schema';
import { FOUNDATION_WORLD, movementIntentSchema, joinOptionsSchema, PROTOCOL_VERSION, type Direction, type MovementIntent } from '@mmorpg/shared';
import { move, directionFor } from '@mmorpg/game-core';
import { MOVEMENT_MESSAGE, PROTOCOL_ERROR_MESSAGE, type ProtocolError } from '@mmorpg/shared';

export class PlayerState extends Schema {
  id = ''; x = 0; y = 0; direction: Direction = 'S'; lastSequence = -1;
}
defineTypes(PlayerState, { id: 'string', x: 'number', y: 'number', direction: 'string', lastSequence: 'number' });
export class WorldState extends Schema {
  version = PROTOCOL_VERSION;
  players = new MapSchema<PlayerState>();
}
defineTypes(WorldState, { version: 'number', players: { map: PlayerState } });

export class FoundationRoom extends Room<WorldState> {
  now: () => number = Date.now;
  private inputs = new Map<string, { intent: MovementIntent; receivedAt: number }>();
  onCreate() {
    this.setState(new WorldState());
    this.setPatchRate(FOUNDATION_WORLD.tickMs);
    this.onMessage(MOVEMENT_MESSAGE, (client, payload: unknown) => {
      const parsed = movementIntentSchema.safeParse(payload);
      const player = this.state.players.get(client.sessionId);
      if (!player) return;
      const reject = (code: ProtocolError['code']) => client.send(PROTOCOL_ERROR_MESSAGE, { version: PROTOCOL_VERSION, code } satisfies ProtocolError);
      if (!parsed.success) { reject('INVALID_INTENT'); return; }
      if (parsed.data.sequence <= player.lastSequence) { reject('STALE_SEQUENCE'); return; }
      player.lastSequence = parsed.data.sequence;
      this.inputs.set(client.sessionId, { intent: parsed.data, receivedAt: this.now() });
    });
    this.setSimulationInterval(() => this.tick(this.now()), FOUNDATION_WORLD.tickMs);
  }
  onAuth(_client: Client, options: unknown) { return joinOptionsSchema.safeParse(options).success; }
  onJoin(client: Client) {
    const player = new PlayerState();
    player.id = client.sessionId;
    Object.assign(player, FOUNDATION_WORLD.spawn);
    this.state.players.set(client.sessionId, player);
  }
  onLeave(client: Client) {
    this.inputs.delete(client.sessionId);
    this.state.players.delete(client.sessionId);
  }
  tick(now: number) {
    for (const [id, player] of this.state.players) {
      const pending = this.inputs.get(id);
      if (!pending || now - pending.receivedAt > FOUNDATION_WORLD.inputTimeoutMs) continue;
      // Fixed server timestep: input spam never grants extra movement.
      const next = move(player, pending.intent, FOUNDATION_WORLD.tickMs / 1000, FOUNDATION_WORLD);
      player.x = next.x; player.y = next.y;
      player.direction = directionFor(pending.intent.x, pending.intent.y, player.direction);
    }
  }
}
