import type { Move } from '../game/types';
/** rAF timestamps can predate an event in the same frame; clamp both ends. */
export function motionFrame(move: Move, progress: number) {
  if (!move.path.length) return null;
  const clamped = Math.max(0, Math.min(1, Number.isFinite(progress) ? progress : 0));
  const scaled = clamped * move.path.length;
  const index = Math.min(move.path.length - 1, Math.floor(scaled));
  return { from: index === 0 ? move.from : move.path[index - 1], to: move.path[index], progress: scaled - index, traversed: scaled };
}
