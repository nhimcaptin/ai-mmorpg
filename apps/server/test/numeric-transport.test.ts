import { it, expect } from 'vitest';
import { Room } from '@colyseus/core';
import { Client } from 'colyseus.js';
import type { AddressInfo } from 'node:net';
import { serializeGold, parseGold } from '@mmorpg/shared';
import { createGameServer } from '../src/server.js';

// Test-only transport room, no production economy endpoint or balance value.
class NumericTransportRoom extends Room {
  onCreate() {
    this.onMessage('read-gold', client => client.send('gold', { gold: serializeGold(9223372036854775807n) }));
  }
}
it('transmits BigInt as a lossless string over a real Colyseus WebSocket', async () => {
  const game = createGameServer();
  game.server.define('numeric-transport-test', NumericTransportRoom);
  try {
    await game.server.listen(0, '127.0.0.1');
    const client = new Client(`http://127.0.0.1:${(game.httpServer.address() as AddressInfo).port}`);
    const room = await client.joinOrCreate('numeric-transport-test');
    try {
      const response = new Promise<unknown>(resolve => room.onMessage('gold', resolve));
      room.send('read-gold');
      const received = await response as { gold: unknown };
      expect(typeof received.gold).toBe('string');
      expect(parseGold(received.gold)).toBe(9223372036854775807n);
    } finally { await room.leave(); }
  } finally { await game.server.gracefullyShutdown(false); }
}, 5000);
