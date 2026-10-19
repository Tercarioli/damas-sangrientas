import { useCallback, useEffect, useRef, useState } from 'react';
import { boardAfterMove, initialState, legalMoves, movesFrom, playTurn } from './engine';
import { same, type GamePhase, type GameSettings, type Move, type Position } from './types';
import { BALANCE as B } from './balance';
import { sound } from '../audio/sound';
export type Animation = { move: Move; start: number; duration: number } | null;
export function useGame(settings: GameSettings) {
  const [state, setState] = useState(initialState);
  const [phase, setPhase] = useState<GamePhase>('MENU');
  const [selected, setSelected] = useState<Position | null>(null);
  const [prefix, setPrefix] = useState<Position[]>([]);
  const [origin, setOrigin] = useState<Position | null>(null);
  const [animation, setAnimation] = useState<Animation>(null);
  const [injuryAt, setInjuryAt] = useState({ human: 0, ai: 0 });
  const [message, setMessage] = useState('The first move is yours.');
  const [history, setHistory] = useState<string[]>([]);
  const generation = useRef(0), timers = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());
  const worker = useRef<Worker | null>(null);
  const delay = (ms: number, token: number) => new Promise<boolean>(resolve => {
    const timer = setTimeout(() => { timers.current.delete(timer); resolve(generation.current === token); }, ms); timers.current.add(timer);
  });
  const cancel = useCallback(() => { generation.current++; worker.current?.terminate(); worker.current = null;
    for (const timer of timers.current) clearTimeout(timer); timers.current.clear(); }, []);
  useEffect(() => () => cancel(), [cancel]);
  function reset(menu = false) {
    cancel(); setState(initialState()); setSelected(null); setOrigin(null); setPrefix([]); setAnimation(null); setInjuryAt({ human: 0, ai: 0 });
    setHistory([]); setMessage('The first move is yours.'); setPhase(menu ? 'MENU' : 'PLAYING');
    sound.unlock(); if (!menu) sound.play('move');
  }
  const legal = legalMoves(state.board, state.turn);
  const candidates = (origin ? movesFrom(legal, origin) : selected ? movesFrom(legal, selected) : [])
    .filter(m => prefix.every((p, i) => same(p, m.path[i])));
  const targets = candidates.map(m => m.path[prefix.length]).filter((p, i, all) => p && all.findIndex(q => same(p, q)) === i);
  const preview = prefix.length && origin ? boardAfterMove(state.board, { from: origin, path: prefix, captures: candidates[0]?.captures.slice(0, prefix.length) ?? [] }) : state.board;
  async function finish(move: Move, token: number) {
    const result = playTurn(state, move), victim = state.turn === 'human' ? 'ai' : 'human';
    setAnimation(null); setPrefix([]); setOrigin(null); setSelected(null); setState(result);
    const from = `${'ABCDEFGH'[move.from.col]}${8 - move.from.row}`;
    const path = move.path.map(p => `${'ABCDEFGH'[p.col]}${8 - p.row}`).join(move.captures.length ? ' × ' : ' — ');
    const log = `${state.turn === 'human' ? 'YOU' : 'KEEPER'}  ${from}${move.captures.length ? ' × ' : ' — '}${path}`;
    setHistory(h => [log, ...h].slice(0, 6));
    setMessage(move.captures.length ? `${move.captures.length} piece${move.captures.length > 1 ? 's' : ''} taken. The body remembers.` : state.turn === 'human' ? 'The Keeper considers your offering.' : 'Your move. Choose what you can afford.');
    const end = move.path[move.path.length - 1];
    if (!state.board[move.from.row][move.from.col]?.king && result.board[end.row][end.col]?.king) sound.play('crown');
    if (move.captures.length) {
      setPhase('ANIMATING_INJURY'); setInjuryAt(a => ({ ...a, [victim]: performance.now() })); sound.play('capture'); sound.play('injury');
      if (!await delay(B.injuryMs, token)) return;
    }
    if (result.health[state.turn].bleeding && result.health[victim].blood > 0) sound.play('bleed');
    if (result.result) { sound.play(result.result.winner === 'human' ? 'victory' : 'death'); setPhase('GAME_OVER'); }
    else setPhase('PLAYING');
  }
  async function executeAI(move: Move, token: number) {
    setSelected(move.from); sound.play('select');
    if (!await delay(300, token)) return;
    setPhase('ANIMATING_MOVE'); const duration = B.moveMs * move.path.length;
    setAnimation({ move, start: performance.now(), duration }); sound.play('move');
    if (!await delay(duration, token)) return;
    await finish(move, token);
  }
  useEffect(() => {
    if (phase !== 'PLAYING' || state.turn !== 'ai' || state.result) return;
    const token = generation.current;
    setPhase('AI_THINKING'); setMessage('The Keeper is thinking.');
    const machine = new Worker(new URL('./ai.worker.ts', import.meta.url), { type: 'module' }); worker.current = machine;
    const started = performance.now();
    machine.onmessage = async (event: MessageEvent<Move | null>) => {
      machine.terminate(); if (worker.current === machine) worker.current = null;
      if (generation.current !== token) return;
      if (!await delay(Math.max(0, B.aiPauseMs - (performance.now() - started)), token)) return;
      if (event.data) void executeAI(event.data, token);
    };
    machine.onerror = () => {
      machine.terminate(); worker.current = null;
      if (generation.current === token && legal[0]) { setMessage('The Keeper makes its move.'); void executeAI(legal[0], token); }
    };
    machine.postMessage({ state, difficulty: settings.difficulty });
    // One worker per committed AI turn; phase changes must not cancel it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, phase, settings.difficulty]);
  useEffect(() => {
    if (state.health.human.blood > 50 || phase === 'MENU' || phase === 'GAME_OVER') return;
    const id = setInterval(() => sound.play('heart'), state.health.human.blood <= 25 ? 950 : 1500); return () => clearInterval(id);
  }, [state.health.human.blood, phase]);
  async function click(pos: Position) {
    if (phase !== 'PLAYING' || state.turn !== 'human' || state.result) return;
    sound.unlock();
    const matching = candidates.filter(m => same(m.path[prefix.length], pos));
    if (selected && matching.length) {
      const chosen = matching[0], newPrefix = [...prefix, pos], token = generation.current;
      const step: Move = { from: selected, path: [pos], captures: chosen.captures.length ? [chosen.captures[prefix.length]] : [] };
      setPhase('ANIMATING_MOVE'); setAnimation({ move: step, start: performance.now(), duration: B.moveMs }); sound.play('move');
      if (!await delay(B.moveMs, token)) return;
      if (chosen.path.length === newPrefix.length) await finish(chosen, token);
      else { setAnimation(null); setOrigin(chosen.from); setPrefix(newPrefix); setSelected(pos); setMessage('The taking is not finished. Continue the capture.'); setPhase('PLAYING'); }
    } else if (!prefix.length && movesFrom(legal, pos).length) {
      setSelected(pos); sound.play('select');
      setMessage(legal[0]?.captures.length ? 'A capture is owed. Choose a marked square.' : 'Choose a marked square.');
    } else if (!prefix.length && selected && same(pos, selected)) setSelected(null);
  }
  return { state, phase, selected, targets, preview, animation, injuryAt, message, history, forced: !!legal[0]?.captures.length, selectable: legal.map(m => m.from), click, reset };
}
