import { useEffect, useRef, useState } from 'react';
import { same, type Board, type Position } from '../game/types';
import { CELL, EDGE, SIZE, drawBoard, drawHints } from '../render/board';
import type { Animation } from '../game/useGame';
type Props = { board: Board; selectable: Position[]; selected: Position | null; targets: Position[]; capture: boolean; animation: Animation; blood: number; effects: string; shockAt: number; onSquare: (p: Position) => void; enabled: boolean };
export function BoardView(props: Props) {
  const art = useRef<HTMLCanvasElement>(null), hints = useRef<HTMLCanvasElement>(null), ghost = useRef<HTMLCanvasElement>(null);
  const [focus, setFocus] = useState<Position>({ row: 5, col: 0 });
  useEffect(() => {
    const a = art.current?.getContext('2d'), h = hints.current?.getContext('2d'); if (!a || !h) return;
    let id = 0;
    const frame = (now: number) => {
      const motion = props.animation ? { move: props.animation.move, progress: Math.min(1, (now - props.animation.start) / props.animation.duration) } : null;
      drawBoard(a, props.board, props.selected, motion, now);
      const double = ghost.current?.getContext('2d');
      if (double && art.current) { double.clearRect(0, 0, SIZE, SIZE); double.drawImage(art.current, 0, 0); }
      drawHints(h, props.selected, props.targets, props.capture, props.blood, props.effects, now);
      id = requestAnimationFrame(frame);
    };
    id = requestAnimationFrame(frame); return () => cancelAnimationFrame(id);
  }, [props]);
  const severity = props.effects === 'OFF' ? 0 : (100 - props.blood) / 100 * (props.effects === 'REDUCED' ? .35 : 1);
  const shock = props.effects !== 'OFF' && props.shockAt > 0 && performance.now() - props.shockAt < 780;
  const onKey = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const directions: Record<string, number[]> = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
    const d = directions[event.key];
    if (d) { event.preventDefault(); setFocus(p => ({ row: Math.max(0, Math.min(7, p.row + d[0])), col: Math.max(0, Math.min(7, p.col + d[1])) })); }
    else if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); props.onSquare(focus); }
  };
  return <div className={`board-shell ${shock ? 'shock' : ''}`}>
    <div className={`board-canvas ${props.enabled ? 'enabled' : ''}`} role="group" tabIndex={0} aria-label={`Checkers board. Arrow keys navigate, Enter selects. Focus ${'ABCDEFGH'[focus.col]}${8 - focus.row}. ${props.enabled ? 'Your turn.' : 'Please wait.'}`} onKeyDown={onKey}
      onClick={event => { const rect = event.currentTarget.getBoundingClientRect(), x = (event.clientX - rect.left) / rect.width * SIZE, y = (event.clientY - rect.top) / rect.height * SIZE;
        const p = { row: Math.floor((y - EDGE) / CELL), col: Math.floor((x - EDGE) / CELL) }; if (p.row >= 0 && p.row < 8 && p.col >= 0 && p.col < 8) { setFocus(p); props.onSquare(p); } }}>
      <canvas className="board-art" ref={art} width={SIZE} height={SIZE} style={{ filter: `blur(${Math.max(0, severity - .2) * 1.65}px) saturate(${1 - severity * .35})` }}/>
      {severity > .72 && <canvas className="double-vision" ref={ghost} width={SIZE} height={SIZE} aria-hidden="true"/>}
      <canvas className="board-hints" ref={hints} width={SIZE} height={SIZE}/>
      <div className="square-grid" aria-label="Board squares">{props.board.flatMap((row, r) => row.map((piece, c) => {
        const p = { row: r, col: c }, target = props.targets.some(t => same(t, p)), selectable = props.selectable.some(t => same(t, p));
        const name = `${'ABCDEFGH'[c]}${8 - r}, ${piece ? `${piece.player === 'human' ? 'your' : 'Keeper'} ${piece.king ? 'king' : 'man'}` : 'empty'}${target ? props.capture ? ', legal capture' : ', legal move' : selectable && !props.animation ? ', selectable' : ''}`;
        return <button key={`${r}-${c}`} tabIndex={-1} disabled={!props.enabled} aria-label={name} onClick={e => { e.stopPropagation(); setFocus(p); props.onSquare(p); }}/>;
      }))}</div>
      <div className="keyboard-square" style={{ left: `${(EDGE + focus.col * CELL) / SIZE * 100}%`, top: `${(EDGE + focus.row * CELL) / SIZE * 100}%`, width: `${CELL / SIZE * 100}%`, height: `${CELL / SIZE * 100}%` }}/>
    </div>
  </div>;
}
