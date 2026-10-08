import { z } from 'zod';
export * from './numeric.js';
import { worldConfigSchema } from './config.js';
export { WORLD_UNIT, worldConfigSchema, gameplayConfigSchema, loadGameplayConfig } from './config.js';

export const PROTOCOL_VERSION = 1;
export const FOUNDATION_ROOM = 'foundation';
export const MOVEMENT_MESSAGE = 'movement';
export const PROTOCOL_ERROR_MESSAGE = 'protocol-error';
export const protocolErrorSchema = z.object({
  version: z.literal(PROTOCOL_VERSION),
  code: z.enum(['INVALID_INTENT', 'STALE_SEQUENCE'])
}).strict();
export type ProtocolError = z.infer<typeof protocolErrorSchema>;
export const movementIntentSchema = z.object({
  version: z.literal(PROTOCOL_VERSION), sequence: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER),
  x: z.number().int().min(-1).max(1), y: z.number().int().min(-1).max(1)
}).strict();
export type MovementIntent = z.infer<typeof movementIntentSchema>;
export type Direction = 'N' | 'E' | 'S' | 'W';
export interface Position { x: number; y: number }
export interface PlayerSnapshot extends Position { id: string; direction: Direction; lastSequence: number }
export interface WorldSnapshot { version: typeof PROTOCOL_VERSION; players: PlayerSnapshot[] }
export interface WorldRoomState { version: number; players: Map<string, PlayerSnapshot> }
export const joinOptionsSchema = z.object({ version: z.literal(PROTOCOL_VERSION) }).strict();
export interface Rect { x: number; y: number; width: number; height: number }
export interface WorldConfig {
  id: string; areaId: string; width: number; height: number; unit: number;
  spawn: Position; footprint: { halfWidth: number; halfHeight: number };
  moveSpeed: number; tickMs: number; inputTimeoutMs: number;
  renderScale: number; zoomMin: number; zoomMax: number; obstacles: Rect[];
}
// Dữ liệu kỹ thuật cho phòng thử local, không phải map/balance phát hành.
export const FOUNDATION_WORLD: WorldConfig = worldConfigSchema.parse({
  id: 'technical-fixture', areaId: 'movement-test', width: 960, height: 640, unit: 32,
  spawn: { x: 160, y: 320 }, footprint: { halfWidth: 10, halfHeight: 6 },
  moveSpeed: 160, tickMs: 50, inputTimeoutMs: 250,
  renderScale: 0.9, zoomMin: 0.5, zoomMax: 1.5,
  obstacles: [{ x: 384, y: 192, width: 96, height: 256 }]
});
