import { movementIntentSchema, type MovementIntent, type ProtocolError } from '@mmorpg/shared';

/** Both preview and authenticated rooms reject caller positions and reordered/duplicate packets. */
export function acceptMovementInput(value: unknown, lastApplied: number, lastQueued = -1): { intent: MovementIntent } | { error: ProtocolError['code'] } {
  const parsed = movementIntentSchema.safeParse(value);
  if (!parsed.success) return { error: 'INVALID_INTENT' };
  if (parsed.data.sequence <= Math.max(lastApplied, lastQueued)) return { error: 'STALE_SEQUENCE' };
  return { intent: parsed.data };
}
