import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Client, type Room } from 'colyseus.js';
import type { AddressInfo } from 'node:net';
import { FOUNDATION_ROOM, FOUNDATION_WORLD, type WorldRoomState } from '@mmorpg/shared';
import { createGameServer } from '../src/server.js';
import { PROTOCOL_ERROR_MESSAGE, protocolErrorSchema, type ProtocolError } from '@mmorpg/shared';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
async function waitFor(predicate: () => boolean) {
  const end = Date.now() + 4000;
  while (!predicate()) { if (Date.now() > end) throw new Error('State timeout'); await sleep(20); }
}
describe('real Colyseus clients', () => {
  const game = createGameServer(true);
  let client: Client;
  let first: Room<WorldRoomState>, second: Room<WorldRoomState>;
  const errors: ProtocolError[] = [];
  beforeAll(async () => {
    await game.server.listen(0, '127.0.0.1');
    client = new Client(`http://127.0.0.1:${(game.httpServer.address() as AddressInfo).port}`);
    first = await client.joinOrCreate(FOUNDATION_ROOM, { version: 1 });
    first.onMessage(PROTOCOL_ERROR_MESSAGE, (payload: unknown) => errors.push(protocolErrorSchema.parse(payload)));
    second = await client.joinOrCreate(FOUNDATION_ROOM, { version: 1 });
    await waitFor(() => first.state?.players.size === 2 && second.state?.players.size === 2);
  });
  afterAll(async () => {
    await game.server.gracefullyShutdown(false);
  });
  it('rejects incompatible protocol and caller-supplied positions', async () => {
    await expect(client.joinOrCreate(FOUNDATION_ROOM, { version: 2 })).rejects.toThrow();
    await expect(client.joinOrCreate(FOUNDATION_ROOM, { version: 1, x: 900 })).rejects.toThrow();
  });
  it('replicates movement, rejects stale/malformed input, and expires held intent', async () => {
    first.send('movement', { version: 1, sequence: 1, x: 1, y: 0 });
    await waitFor(() => (second.state.players.get(first.sessionId)?.x ?? 0) > FOUNDATION_WORLD.spawn.x);
    first.send('movement', { version: 1, sequence: 2, x: 0, y: 0 });
    await waitFor(() => first.state.players.get(first.sessionId)?.lastSequence === 2);
    const x = first.state.players.get(first.sessionId)!.x;
    first.send('movement', { version: 1, sequence: 1, x: -1, y: 0 });
    first.send('movement', { version: 1, sequence: 3, x: 1, y: 0, position: { x: 900 } });
    await sleep(150);
    expect(first.state.players.get(first.sessionId)!.x).toBe(x);
    expect(first.state.players.get(first.sessionId)!.lastSequence).toBe(2);
    expect(errors.map(error => error.code)).toEqual(['STALE_SEQUENCE', 'INVALID_INTENT']);
    first.send('movement', { version: 1, sequence: 4, x: 1, y: 0 });
    await sleep(400);
    const stopped = first.state.players.get(first.sessionId)!.x;
    await sleep(150);
    expect(first.state.players.get(first.sessionId)!.x).toBe(stopped);
  });
  it('removes disconnected clients from the replicated world', async () => {
    await second.leave();
    await waitFor(() => first.state.players.size === 1);
  });
});
