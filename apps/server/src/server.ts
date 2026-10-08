import express from 'express';
import { createServer } from 'node:http';
import { Server } from '@colyseus/core';
import { WebSocketTransport } from '@colyseus/ws-transport';
import { FOUNDATION_ROOM, FOUNDATION_WORLD, loadGameplayConfig } from '@mmorpg/shared';
import { FoundationRoom } from './world-room.js';

export function createGameServer(foundation = false) {
  if (foundation && process.env.NODE_ENV === 'production') throw new Error('Foundation room is local development only');
  if (foundation) loadGameplayConfig({ worlds: [FOUNDATION_WORLD], areas: [{ id: FOUNDATION_WORLD.areaId, mapId: FOUNDATION_WORLD.id }] });
  const app = express();
  app.get('/health', (_req, res) => res.json({ status: 'ok', foundation }));
  const httpServer = createServer(app);
  const server = new Server({ transport: new WebSocketTransport({ server: httpServer }), greet: false });
  if (foundation) server.define(FOUNDATION_ROOM, FoundationRoom);
  return { server, httpServer };
}
