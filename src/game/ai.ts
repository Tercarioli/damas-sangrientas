import { legalMoves, simulateTurn } from './engine';
import { other, type GameState, type Move, type Player } from './types';
import { BALANCE } from './balance';
export function evaluate(s: GameState, perspective: Player): number {
  if (s.result) return s.result.winner === null ? 0 : s.result.winner === perspective ? 1e6 : -1e6;
  let score = 0;
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    const p = s.board[r][c]; if (!p) continue;
    const advance = p.player === 'human' ? 7 - r : r;
    score += (p.player === perspective ? 1 : -1) * (p.king ? 180 : 100 + advance * 6) +
      (p.player === perspective ? 1 : -1) * (3.5 - Math.abs(3.5 - c)) * 4;
  }
  for (const p of [perspective, other(perspective)]) {
    const h = s.health[p], moves = legalMoves(s.board, p), sign = p === perspective ? 1 : -1;
    score += sign * (h.blood * 7 - h.bleeding * 15 + moves.length * 3 + moves.filter(m => m.captures.length).length * 9);
    if (h.bleeding > 0) {
      const turnsLeft = h.blood / h.bleeding;
      score -= sign * (turnsLeft <= 1 ? 1600 : turnsLeft <= 2 ? 750 : 180 / turnsLeft);
    }
  }
  return score;
}
export function chooseMove(state: GameState, depth = 4, timeMs = 700): Move | null {
  const moves = legalMoves(state.board, state.turn); if (!moves.length || state.result) return null;
  const perspective = state.turn, deadline = performance.now() + timeMs;
  let nodes = 0, best = moves[0];
  const ordered = (ms: Move[]) => ms.slice().sort((a, b) => b.captures.length - a.captures.length);
  function search(s: GameState, remaining: number, alpha: number, beta: number): number {
    if ((++nodes & 63) === 0 && performance.now() >= deadline) throw new Error('timeout');
    if (s.result) return evaluate(s, perspective) + (s.result.winner === null ? 0 : s.result.winner === perspective ? remaining : -remaining);
    if (remaining === 0) return evaluate(s, perspective);
    const next = ordered(legalMoves(s.board, s.turn));
    if (!next.length) return s.turn === perspective ? -1e6 : 1e6;
    const maximizing = s.turn === perspective; let value = maximizing ? -Infinity : Infinity;
    for (const move of next) {
      const score = search(simulateTurn(s, move), remaining - 1, alpha, beta);
      value = maximizing ? Math.max(value, score) : Math.min(value, score);
      if (maximizing) alpha = Math.max(alpha, value); else beta = Math.min(beta, value);
      if (beta <= alpha) break;
    }
    return value;
  }
  let root = ordered(moves);
  for (let d = 1; d <= depth; d++) {
    let candidate = best, highest = -Infinity; const ranks: { move: Move; score: number }[] = [];
    try {
      for (const move of root) {
        const value = search(simulateTurn(state, move), d - 1, highest, Infinity);
        ranks.push({ move, score: value });
        if (value > highest) { highest = value; candidate = move; }
      }
      best = candidate;
      root = ranks.sort((a, b) => b.score - a.score).map(r => r.move);
      if (highest >= 1e6 || performance.now() >= deadline) break;
    } catch { break; }
  }
  return best;
}
export const difficultyConfig = (d: keyof typeof BALANCE.depths) => ({ depth: BALANCE.depths[d], timeMs: BALANCE.searchMs[d] });
