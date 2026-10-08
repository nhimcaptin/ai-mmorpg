import { nonNegativeIntegerSchema } from '@mmorpg/shared';
export function roundAmount(value: number): number {
  if (!Number.isFinite(value) || value < 0 || value > Number.MAX_SAFE_INTEGER) throw new Error('Invalid or overflowing amount');
  return Math.floor(value);
}
export const roundDamage = roundAmount;
export const roundHealing = roundAmount;
export function applyDamage(current: number, amount: number): number {
  return Math.max(0, nonNegativeIntegerSchema.parse(current) - roundDamage(amount));
}
export function applyHealing(current: number, amount: number): number {
  return nonNegativeIntegerSchema.parse(nonNegativeIntegerSchema.parse(current) + roundHealing(amount));
}
export function changeGold(current: bigint, delta: bigint): bigint {
  if (typeof current !== 'bigint' || typeof delta !== 'bigint' || current < 0n || current + delta < 0n) throw new Error('Invalid or insufficient Gold');
  return current + delta;
}
