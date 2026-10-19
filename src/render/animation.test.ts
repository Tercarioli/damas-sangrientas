import { describe, expect, it } from 'vitest';
import { motionFrame } from './animation';
const move = { from: { row: 6, col: 1 }, path: [{ row: 4, col: 3 }, { row: 2, col: 5 }], captures: [{ row: 5, col: 2 }, { row: 3, col: 4 }] };
describe('Animation boundaries', () => {
  it('clamps a frame timestamp preceding the move start', () => { expect(motionFrame(move, -.01)).toMatchObject({ from: move.from, to: move.path[0], progress: 0 }); });
  it('begins the second jump exactly at the midpoint', () => { expect(motionFrame(move, .5)).toMatchObject({ from: move.path[0], to: move.path[1], progress: 0 }); });
  it('finishes at the last destination without indexing past the path', () => { expect(motionFrame(move, 1.1)).toMatchObject({ from: move.path[0], to: move.path[1], progress: 1 }); });
  it('handles missing or invalid animation input', () => { expect(motionFrame({ ...move, path: [] }, 1)).toBeNull(); expect(motionFrame(move, NaN)?.progress).toBe(0); });
});
