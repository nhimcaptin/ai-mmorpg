import express from 'express';
import { createServer } from 'node:http';
import { Server } from '@colyseus/core';
import { WebSocketTransport } from '@colyseus/ws-transport';
import { FOUNDATION_ROOM, FOUNDATION_WORLD, loadGameplayConfig, STARTER_ROOM, STARTER_MAP, AUTHENTICATED_ROOM } from '@mmorpg/shared';
import { FoundationRoom, StarterPreviewRoom } from './world-room.js';
import type { AuthService } from './auth.js';
import { mountAuth } from './auth-http.js';
import { authenticatedRoom } from './auth-room.js';

export function createGameServer(foundation = false, starterPreview = false, auth?: AuthService) {
  if ((foundation || starterPreview || auth) && process.env.NODE_ENV === 'production') throw new Error('Local development rooms cannot run in production');
  if (foundation) loadGameplayConfig({ worlds: [FOUNDATION_WORLD], areas: [{ id: FOUNDATION_WORLD.areaId, mapId: FOUNDATION_WORLD.id }] });
  if (starterPreview) loadGameplayConfig({ worlds: [STARTER_MAP.world], areas: [{ id: STARTER_MAP.area.id, mapId: STARTER_MAP.area.mapId }] });
  const app = express();
  if (auth) mountAuth(app, auth);
  app.get('/health', (_req, res) => res.json({ status: 'ok', foundation, starterPreview }));
  const httpServer = createServer(app);
  const server = new Server({ transport: new WebSocketTransport({ server: httpServer }), greet: false });
  if (foundation) server.define(FOUNDATION_ROOM, FoundationRoom);
  if (starterPreview) server.define(STARTER_ROOM, StarterPreviewRoom);
  if (auth) server.define(AUTHENTICATED_ROOM, authenticatedRoom(auth));
  return { server, httpServer };
}
