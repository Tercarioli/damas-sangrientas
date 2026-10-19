import { BALANCE } from './balance';
import { bleed, initialHealth, injure } from './health';
import { other, same, type Board, type GameState, type Move, type Piece, type Player, type Position } from './types';
export const emptyBoard = (): Board => Array.from({ length: 8 }, () => Array(8).fill(null));
export function initialBoard(): Board {
  const board = emptyBoard();
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++)
    if ((r + c) % 2 && (r < 3 || r > 4)) board[r][c] = { id: `${r}-${c}`, player: r < 3 ? 'ai' : 'human', king: false };
  return board;
}
const inside = (r: number, c: number) => r >= 0 && r < 8 && c >= 0 && c < 8;
const dirs = (piece: Piece) => piece.king ? [-1, 1] : [piece.player === 'human' ? -1 : 1];
const crownRow = (p: Player) => p === 'human' ? 0 : 7;
export const cloneBoard = (b: Board): Board => b.map(row => row.slice());
function capturesFrom(board: Board, from: Position, piece: Piece, path: Position[] = [], captures: Position[] = [], origin = from): Move[] {
  const found: Move[] = [];
  for (const dr of dirs(piece)) for (const dc of [-1, 1]) {
    const mid = { row: from.row + dr, col: from.col + dc };
    const end = { row: from.row + dr * 2, col: from.col + dc * 2 };
    if (!inside(end.row, end.col) || board[end.row][end.col] || board[mid.row][mid.col]?.player !== other(piece.player)) continue;
    const next = cloneBoard(board); next[from.row][from.col] = null; next[mid.row][mid.col] = null; next[end.row][end.col] = piece;
    const newPath = [...path, end], newCaps = [...captures, mid];
    const continuation = !piece.king && end.row === crownRow(piece.player) ? [] : capturesFrom(next, end, piece, newPath, newCaps, origin);
    found.push(...(continuation.length ? continuation : [{ from: origin, path: newPath, captures: newCaps }]));
  }
  return found;
}
export function legalMoves(board: Board, player: Player): Move[] {
  const captures: Move[] = [], moves: Move[] = [];
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    const p = board[r][c]; if (!p || p.player !== player) continue;
    const from = { row: r, col: c }; captures.push(...capturesFrom(board, from, p));
    for (const dr of dirs(p)) for (const dc of [-1, 1]) {
      const end = { row: r + dr, col: c + dc };
      if (inside(end.row, end.col) && !board[end.row][end.col]) moves.push({ from, path: [end], captures: [] });
    }
  }
  return captures.length ? captures : moves;
}
export const moveKey = (m: Move) => JSON.stringify(m);
export const positionKey = (s: GameState) => JSON.stringify([s.board.map(row => row.map(p => p ? `${p.player[0]}${p.king ? 'K' : 'm'}` : '.')), s.turn, s.health]);
export function initialState(): GameState {
  const state: GameState = { board: initialBoard(), turn: 'human', health: { human: initialHealth(), ai: initialHealth() }, turns: 0, quietTurns: 0, repetitions: {}, result: null };
  state.repetitions[positionKey(state)] = 1; return state;
}
export function boardAfterMove(board: Board, move: Move): Board {
  const next = cloneBoard(board), p = next[move.from.row][move.from.col];
  if (!p) throw new Error('No piece at origin');
  next[move.from.row][move.from.col] = null;
  for (const pos of move.captures) next[pos.row][pos.col] = null;
  const end = move.path[move.path.length - 1];
  next[end.row][end.col] = { ...p, king: p.king || end.row === crownRow(p.player) }; return next;
}
/** Resolve a validated COMPLETE turn. UI and AI use this exact transaction. */
export function simulateTurn(state: GameState, move: Move): GameState {
  const actor = state.turn, victim = other(actor), piece = state.board[move.from.row][move.from.col]!;
  const s: GameState = { ...state, board: boardAfterMove(state.board, move), health: { ...state.health }, turns: state.turns + 1,
    quietTurns: move.captures.length || !piece.king ? 0 : state.quietTurns + 1, repetitions: { ...state.repetitions }, result: null };
  for (const _ of move.captures) { void _; s.health[victim] = injure(s.health[victim]); }
  if (s.health[victim].blood === 0) { s.result = { winner: actor, reason: 'blood' }; return s; }
  s.health[actor] = bleed(s.health[actor]);
  if (s.health[actor].blood === 0) { s.result = { winner: victim, reason: 'blood' }; return s; }
  if (!s.board.some(row => row.some(p => p?.player === victim))) { s.result = { winner: actor, reason: 'pieces' }; return s; }
  if (!legalMoves(s.board, victim).length) { s.result = { winner: actor, reason: 'blocked' }; return s; }
  s.turn = victim;
  const key = positionKey(s); s.repetitions[key] = (s.repetitions[key] ?? 0) + 1;
  if (s.repetitions[key] >= BALANCE.repetitionLimit) s.result = { winner: null, reason: 'repetition' };
  else if (s.quietTurns >= BALANCE.quietTurnLimit) s.result = { winner: null, reason: 'quiet' };
  return s;
}
export function playTurn(state: GameState, move: Move): GameState {
  if (state.result) throw new Error('Game has ended');
  const legal = legalMoves(state.board, state.turn).find(m => moveKey(m) === moveKey(move));
  if (!legal) throw new Error('Illegal or incomplete move');
  return simulateTurn(state, legal);
}
export function movesFrom(moves: Move[], pos: Position) { return moves.filter(m => same(m.from, pos)); }
