import { describe, expect, it } from 'vitest';
import { boardAfterMove, emptyBoard, initialState, legalMoves, playTurn, positionKey } from './engine';
import { bleed, initialHealth, injure } from './health';
import { chooseMove } from './ai';
import type { GameState, Player, Position } from './types';
const pos = (row: number, col: number): Position => ({ row, col });
function setup(pieces: [number, number, Player, boolean?][], turn: Player = 'human'): GameState {
  const s = initialState(); s.board = emptyBoard(); s.turn = turn; s.repetitions = {};
  for (const [row, col, player, king = false] of pieces) s.board[row][col] = { id: `${row}-${col}`, player, king };
  return s;
}
function first(s: GameState) { return legalMoves(s.board, s.turn)[0]; }
describe('English draughts', () => {
  it('initializes 12 pieces per player on dark squares, human first', () => {
    const s = initialState();
    expect(s.turn).toBe('human');
    for (const p of ['human', 'ai']) expect(s.board.flat().filter(piece => piece?.player === p)).toHaveLength(12);
    s.board.forEach((row, r) => row.forEach((piece, c) => { if (piece) expect((r + c) % 2).toBe(1); }));
    expect(legalMoves(s.board, 'human')).toHaveLength(7);
  });
  it('accepts a simple move and preserves original state', () => {
    const s = initialState(), before = JSON.stringify(s), m = first(s), next = playTurn(s, m);
    expect(next.turn).toBe('ai'); expect(next.board[m.from.row][m.from.col]).toBeNull(); expect(JSON.stringify(s)).toBe(before);
  });
  it('rejects illegal, backward, and occupied movements', () => {
    const s = initialState(); expect(() => playTurn(s, { from: pos(5, 0), path: [pos(7, 2)], captures: [] })).toThrow('Illegal');
    expect(() => playTurn(s, { from: pos(5, 0), path: [pos(6, 1)], captures: [] })).toThrow();
  });
  it('forces captures globally', () => {
    const s = setup([[5, 2, 'human'], [5, 6, 'human'], [4, 3, 'ai']]);
    const moves = legalMoves(s.board, 'human'); expect(moves).toHaveLength(1); expect(moves[0].captures).toEqual([pos(4, 3)]);
    expect(() => playTurn(s, { from: pos(5, 6), path: [pos(4, 5)], captures: [] })).toThrow();
  });
  it('generates full multiple captures and rejects an incomplete chain', () => {
    const s = setup([[6, 1, 'human'], [5, 2, 'ai'], [3, 4, 'ai']]);
    const m = first(s); expect(m.path).toEqual([pos(4, 3), pos(2, 5)]); expect(m.captures).toHaveLength(2);
    expect(() => playTurn(s, { ...m, path: m.path.slice(0, 1), captures: m.captures.slice(0, 1) })).toThrow();
    const next = playTurn(s, m); expect(next.board.flat().filter(p => p?.player === 'ai')).toHaveLength(0);
  });
  it('allows any capture choice, without requiring the longest chain', () => {
    const s = setup([[5, 2, 'human'], [4, 1, 'ai'], [4, 3, 'ai'], [2, 5, 'ai']]);
    expect(legalMoves(s.board, 'human').map(m => m.captures.length).sort()).toEqual([1, 2]);
  });
  it('crowns men reaching the last row', () => {
    const s = setup([[1, 2, 'human'], [6, 7, 'ai']]);
    const m = first(s), end = m.path.at(-1)!; expect(playTurn(s, m).board[end.row][end.col]?.king).toBe(true);
  });
  it('ends a capture turn at coronation, even if a backward jump becomes available', () => {
    const s = setup([[2, 1, 'human'], [1, 2, 'ai'], [1, 4, 'ai']]);
    const m = first(s); expect(m.path).toEqual([pos(0, 3)]); expect(m.captures).toHaveLength(1);
    expect(playTurn(s, m).board[0][3]?.king).toBe(true);
  });
  it('kings jump backward and cannot fly or pass through pieces', () => {
    const s = setup([[3, 2, 'human', true], [4, 3, 'ai'], [7, 0, 'ai']]);
    expect(first(s).path).toEqual([pos(5, 4)]);
    expect(legalMoves(s.board, 'human').some(m => m.path.some(p => p.row === 6))).toBe(false);
  });
  it('declares loss for a player without legal moves', () => {
    const s = setup([[5, 0, 'human'], [7, 2, 'ai']]); expect(legalMoves(s.board, 'ai')).toHaveLength(0);
    expect(playTurn(s, first(s)).result).toEqual({ winner: 'human', reason: 'blocked' });
  });
  it('declares loss when all pieces are removed', () => {
    const s = setup([[5, 2, 'human'], [4, 3, 'ai']]); expect(playTurn(s, first(s)).result).toEqual({ winner: 'human', reason: 'pieces' });
  });
});
describe('Body and blood', () => {
  it('first loss amputates left arm: 8 immediate damage, 3 bleeding', () => {
    expect(injure(initialHealth())).toEqual({ blood: 92, bleeding: 3, lost: 1, injuries: [{ part: 'leftArm', aggravated: false }] });
  });
  it('fourth loss leaves 68 blood, 12 bleeding and precisely four amputations', () => {
    let h = initialHealth(); for (let i = 0; i < 4; i++) h = injure(h);
    expect([h.blood, h.bleeding, h.lost]).toEqual([68, 12, 4]);
    expect(h.injuries.map(i => i.part)).toEqual(['leftArm', 'rightLeg', 'rightArm', 'leftLeg']);
  });
  it('fifth loss aggravates a wound without amputating head or extra limbs', () => {
    let h = initialHealth(); for (let i = 0; i < 5; i++) h = injure(h);
    expect([h.blood, h.bleeding]).toEqual([63, 13]); expect(h.injuries[4].aggravated).toBe(true);
    expect(h.injuries.filter(i => !i.aggravated)).toHaveLength(4);
  });
  it('bleeds only the mover at end of own turn', () => {
    const s = initialState(); s.health.human = injure(initialHealth()); s.health.ai = injure(initialHealth());
    const n = playTurn(s, first(s)); expect(n.health.human.blood).toBe(89); expect(n.health.ai.blood).toBe(92);
  });
  it('bleeds once after a multiple capture', () => {
    const s = setup([[6, 1, 'human'], [5, 2, 'ai'], [3, 4, 'ai'], [0, 7, 'ai']]); s.health.human = injure(initialHealth());
    const n = playTurn(s, first(s)); expect(n.health.human.blood).toBe(89); expect(n.health.ai.blood).toBe(84); expect(n.health.ai.bleeding).toBe(6); expect(n.turns).toBe(1);
  });
  it('immediate damage kills and blood never goes below zero', () => {
    const s = setup([[5, 2, 'human'], [4, 3, 'ai'], [0, 7, 'ai']]); s.health.ai.blood = 3;
    const n = playTurn(s, first(s)); expect(n.health.ai.blood).toBe(0); expect(n.result).toEqual({ winner: 'human', reason: 'blood' });
    expect(bleed({ ...initialHealth(), blood: 2, bleeding: 10 }).blood).toBe(0);
  });
  it('own bleeding can cause death after a normal move', () => {
    const s = initialState(); s.health.human = { ...injure(initialHealth()), blood: 2 };
    expect(playTurn(s, first(s)).result).toEqual({ winner: 'ai', reason: 'blood' });
  });
  it('bleeding death takes priority over strategic victory', () => {
    const s = setup([[5, 2, 'human'], [4, 3, 'ai']]); s.health.human = { ...injure(initialHealth()), blood: 3 };
    expect(playTurn(s, first(s)).result).toEqual({ winner: 'ai', reason: 'blood' });
  });
  it('immediate lethal capture ends before attacker bleeding', () => {
    const s = setup([[5, 2, 'human'], [4, 3, 'ai']]); s.health.human = { ...injure(initialHealth()), blood: 1 }; s.health.ai.blood = 8;
    const n = playTurn(s, first(s)); expect(n.result).toEqual({ winner: 'human', reason: 'blood' }); expect(n.health.human.blood).toBe(1);
  });
  it('same resolution and amputation rules apply to AI', () => {
    const s = setup([[2, 1, 'ai'], [3, 2, 'human'], [7, 0, 'human']], 'ai'); s.health.ai = injure(initialHealth());
    const n = playTurn(s, first(s)); expect(n.health.human.blood).toBe(92); expect(n.health.ai.blood).toBe(89);
  });
  it('restart recreates all state independently', () => {
    const a = initialState(), b = initialState(); a.health.human = injure(a.health.human); a.board[5][0] = null; a.turns = 12;
    expect(b).toEqual(initialState()); expect(b.health.human.injuries).toHaveLength(0); expect(b.health.human.blood).toBe(100);
  });
});
describe('Draws and state identity', () => {
  it('uses positions, side to move, blood and body; piece IDs do not matter', () => {
    const a = initialState(), b = initialState(); b.board[0][1]!.id = 'different'; expect(positionKey(a)).toBe(positionKey(b));
    b.health.human.blood--; expect(positionKey(a)).not.toBe(positionKey(b)); b.health.human.blood++; b.turn = 'ai'; expect(positionKey(a)).not.toBe(positionKey(b));
  });
  it('draws on the third identical full position without killing either body', () => {
    const s = setup([[6, 1, 'human', true], [1, 6, 'ai', true]]), m = first(s), predicted = playTurn(s, m);
    s.repetitions[positionKey(predicted)] = 2;
    const n = playTurn(s, m); expect(n.result).toEqual({ winner: null, reason: 'repetition' }); expect(n.health.human.blood).toBe(100);
  });
  it('draws after 80 quiet complete turns and resets on man advance', () => {
    const s = setup([[6, 1, 'human', true], [1, 6, 'ai', true]]); s.quietTurns = 79;
    expect(playTurn(s, first(s)).result).toEqual({ winner: null, reason: 'quiet' });
    s.board[6][1]!.king = false; expect(playTurn(s, first(s)).quietTurns).toBe(0);
  });
  it('rejects any movement after game over', () => {
    const s = initialState(); s.result = { winner: 'human', reason: 'blood' }; expect(() => playTurn(s, first(s))).toThrow('ended');
  });
});
describe('AI', () => {
  it('always returns a legal complete move and does not mutate input', () => {
    let s = initialState();
    for (let i = 0; i < 16 && !s.result; i++) {
      const before = JSON.stringify(s), m = chooseMove(s, 2, 200)!;
      expect(legalMoves(s.board, s.turn)).toContainEqual(m); expect(JSON.stringify(s)).toBe(before); s = playTurn(s, m);
    }
  });
  it('respects mandatory multiple jumps and coronation', () => {
    const s = setup([[1, 0, 'ai'], [2, 1, 'human'], [4, 3, 'human'], [6, 5, 'human']], 'ai');
    const m = chooseMove(s, 4, 500)!; expect(m.captures).toHaveLength(3); expect(boardAfterMove(s.board, m)[7][6]?.king).toBe(true);
  });
  it('chooses an immediate blood victory even when its own bleeding is fatal', () => {
    const s = setup([[2, 3, 'ai'], [3, 2, 'human'], [3, 4, 'human'], [5, 6, 'human']], 'ai');
    s.health.human = { ...initialHealth(), blood: 16 }; s.health.ai = { ...injure(initialHealth()), blood: 1 };
    const m = chooseMove(s, 4, 500)!; expect(m.captures).toHaveLength(2); expect(playTurn(s, m).result).toEqual({ winner: 'ai', reason: 'blood' });
  });
  it('bounded iterative search returns a move even with a tiny budget', () => {
    expect(chooseMove(initialState(), 6, 1)).not.toBeNull();
  });
  it('returns null when game is finished', () => { const s = initialState(); s.result = { winner: null, reason: 'quiet' }; expect(chooseMove(s)).toBeNull(); });
});
describe('Complete games', () => {
  it.each([0, 1, 2])('finishes a complete match with stable state invariants (policy %s)', policy => {
    let s = initialState();
    for (let t = 0; t < 240 && !s.result; t++) {
      const legal = legalMoves(s.board, s.turn);
      const move = s.turn === 'ai' ? chooseMove(s, 2, 200)! : legal[(t + policy) % legal.length];
      const next = playTurn(s, move);
      for (const p of ['human', 'ai'] as const) {
        expect(next.health[p].blood).toBeGreaterThanOrEqual(0); expect(next.health[p].blood).toBeLessThanOrEqual(s.health[p].blood);
        expect(next.health[p].lost + next.board.flat().filter(piece => piece?.player === p).length).toBe(12);
        expect(next.health[p].injuries.filter(i => i.part === 'head')).toHaveLength(0);
      }
      expect(next.turns).toBe(t + 1); s = next;
    }
    expect(s.result).not.toBeNull();
  });
});
