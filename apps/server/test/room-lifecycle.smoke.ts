import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import type { AddressInfo } from 'node:net';
import type { PrismaClient } from '@prisma/client';
import { matchMaker } from '@colyseus/core';
import { Client } from 'colyseus.js';
import { AUTHENTICATED_ROOM, type WorldRoomState } from '@mmorpg/shared';
import { AuthService } from '../src/auth.js';
import { createGameServer } from '../src/server.js';
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
async function until(predicate: () => boolean) { const end = Date.now() + 5000; while (!predicate()) { if (Date.now() > end) throw new Error('Room lifecycle timeout'); await sleep(25); } }
export async function testRoomLifecycle(database: PrismaClient) {
  let now = Date.now(); const auth = new AuthService(database, 120000, () => now);
  const records: { requestId: string; accountId: string; characterId: string; username: string; password: string }[] = [];
  const game = createGameServer(false, false, auth);
  try {
    for (let i = 0; i < 2; i++) {
      const requestId = randomUUID(), username = `room-${requestId}`, password = `room-test-${i}`;
      const result = await auth.register({ requestId, username, password, class: i ? 'MAGIC_DPS' : 'TANK' });
      records.push({ requestId, username, password, ...result });
    }
    const sessions = await Promise.all(records.map(({ username, password }) => auth.login({ username, password })));
    await game.server.listen(0, '127.0.0.1');
    const client = new Client(`http://127.0.0.1:${(game.httpServer.address() as AddressInfo).port}`);
    await assert.rejects(client.joinOrCreate(AUTHENTICATED_ROOM, { version: 1, token: '0'.repeat(64) }));
    await assert.rejects(client.joinOrCreate(AUTHENTICATED_ROOM, { version: 2, token: sessions[0]!.token }));
    await assert.rejects(client.joinOrCreate(AUTHENTICATED_ROOM, { version: 1, token: sessions[0]!.token, characterId: records[1]!.characterId }));
    const first = await client.joinOrCreate<WorldRoomState>(AUTHENTICATED_ROOM, { version: 1, token: sessions[0]!.token });
    const second = await client.joinById<WorldRoomState>(first.roomId, { version: 1, token: sessions[1]!.token });
    first.onLeave(() => {}); second.onLeave(() => {});
    await until(() => first.state?.players?.size === 2 && second.state?.players?.size === 2);
    assert.equal(first.roomId, second.roomId);
    const ids = records.map(r => r.characterId).sort();
    for (const room of [first, second]) assert.deepEqual([...room.state.players.keys()].sort(), ids);
    const serverRoom = matchMaker.getLocalRoomById(first.roomId);
    assert.deepEqual(serverRoom.metadata, { mapId: 'starter_village', areaId: 'area_01' });
    const credentials = await database.credential.findMany({ where: { accountId: { in: records.map(r => r.accountId) } } });
    for (const room of [first, second]) {
      const serialized = JSON.stringify(room.state), state = JSON.parse(serialized) as { version: number; players: Record<string, unknown> };
      assert.deepEqual(Object.keys(state).sort(), ['players', 'version']);
      for (const player of Object.values(state.players)) assert.deepEqual(Object.keys(player as object).sort(), ['direction', 'id', 'lastSequence', 'x', 'y']);
      for (const secret of [...records.flatMap(r => [r.accountId, r.username, r.password]), ...sessions.flatMap(s => [s.token, s.sessionId]), ...credentials.map(c => c.passwordHash)]) assert.equal(serialized.includes(secret), false);
    }
    first.send('movement', { version: 1, sequence: 0, x: 1, y: 0 });
    await until(() => second.state.players.get(records[0]!.characterId)!.x > 624);
    first.send('movement', { version: 1, sequence: 1, x: 0, y: 0 });
    await until(() => first.state.players.get(records[0]!.characterId)!.lastSequence === 1);
    const x = first.state.players.get(records[0]!.characterId)!.x;
    first.connection.close(); await sleep(150);
    assert.equal(second.state.players.size, 2); // Retained during the CHỐT reconnect grace.
    const restored = await client.joinById<WorldRoomState>(second.roomId, { version: 1, token: sessions[0]!.token, reconnect: true }); restored.onLeave(() => {});
    await until(() => restored.state?.players?.size === 2);
    assert.equal(restored.state.players.get(records[0]!.characterId)!.x, x);
    await restored.leave(); await until(() => second.state.players.size === 1);
    const roomId = second.roomId;
    second.connection.close(); await sleep(150);
    assert.ok(matchMaker.getLocalRoomById(roomId)); now += 30001;
    await until(() => !matchMaker.getLocalRoomById(roomId));
    assert.equal(serverRoom.state.players.size, 0);
    const fresh = await client.joinOrCreate<WorldRoomState>(AUTHENTICATED_ROOM, { version: 1, token: sessions[1]!.token }); fresh.onLeave(() => {});
    assert.notEqual(fresh.roomId, roomId); await until(() => fresh.state?.players?.has(records[1]!.characterId));
    const freshId = fresh.roomId; await fresh.leave(); await until(() => !matchMaker.getLocalRoomById(freshId));
    await database.character.update({ where: { id: records[0]!.characterId }, data: { areaId: 'invalid-test-area' } });
    await assert.rejects(client.joinOrCreate(AUTHENTICATED_ROOM, { version: 1, token: sessions[0]!.token }));
    console.log('Authenticated rooms: two accounts/one room/stable IDs, strict join, private state, 30s grace, clean leave/dispose/recreate and wrong-area refusal PASS');
  } finally {
    await game.server.gracefullyShutdown(false);
    for (const record of records) {
      const accountId = record.accountId;
      await database.emailChallenge.deleteMany({ where: { accountId } }); await database.gameplaySession.deleteMany({ where: { accountId } });
      await database.credential.deleteMany({ where: { accountId } }); await database.characterInitialization.deleteMany({ where: { characterId: record.characterId } });
      await database.character.deleteMany({ where: { accountId } }); await database.account.deleteMany({ where: { id: accountId } });
      await database.operationReceipt.deleteMany({ where: { scope: 'registration', key: record.requestId } });
    }
  }
}
