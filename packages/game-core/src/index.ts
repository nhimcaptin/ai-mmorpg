import type { Direction, Position, WorldConfig } from '@mmorpg/shared';

export function directionFor(x: number, y: number, previous: Direction): Direction {
  if (!x && !y) return previous;
  // Vertical ưu tiên khi hai thành phần bằng nhau, chỉ ảnh hưởng animation.
  return Math.abs(y) >= Math.abs(x) ? (y > 0 ? 'S' : 'N') : (x > 0 ? 'E' : 'W');
}
export function canOccupy(position: Position, world: WorldConfig): boolean {
  const { halfWidth: w, halfHeight: h } = world.footprint;
  if (position.x - w < 0 || position.y - h < 0 || position.x + w > world.width || position.y + h > world.height) return false;
  return !world.obstacles.some(r => position.x + w > r.x && position.x - w < r.x + r.width && position.y + h > r.y && position.y - h < r.y + r.height);
}
export function move(position: Position, input: Position, seconds: number, world: WorldConfig): Position {
  if (!Number.isFinite(seconds) || seconds < 0 || !Number.isFinite(input.x) || !Number.isFinite(input.y)) throw new Error('Invalid movement');
  const length = Math.hypot(input.x, input.y);
  if (!length) return { ...position };
  const distance = world.moveSpeed * seconds;
  // Substeps prevent crossing thin collision shapes on delayed ticks.
  const steps = Math.max(1, Math.ceil(distance / Math.min(world.footprint.halfWidth, world.footprint.halfHeight)));
  const dx = input.x / length * distance / steps, dy = input.y / length * distance / steps;
  const result = { ...position };
  for (let i = 0; i < steps; i++) {
    const nextX = { x: result.x + dx, y: result.y };
    if (canOccupy(nextX, world)) result.x = nextX.x;
    const nextY = { x: result.x, y: result.y + dy };
    if (canOccupy(nextY, world)) result.y = nextY.y;
  }
  return result;
}
