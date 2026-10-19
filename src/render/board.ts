import type { Board, Move, Position } from '../game/types';
import { same } from '../game/types';
import { motionFrame } from './animation';
import { circle, line, noise, wood } from './primitives';
export const SIZE = 720, EDGE = 44, CELL = 79;
export type Motion = { move: Move; progress: number } | null;
export function drawPiece(ctx: CanvasRenderingContext2D, x: number, y: number, human: boolean, king: boolean, selected = false) {
  const r = CELL * .355; ctx.save();
  ctx.shadowColor = '#080604cc'; ctx.shadowBlur = selected ? 19 : 9; ctx.shadowOffsetY = selected ? 13 : 7;
  circle(ctx, x, y + 4, r, human ? '#6d5b45' : '#080807'); ctx.shadowColor = 'transparent';
  const g = ctx.createRadialGradient(x - 10, y - 12, 1, x, y, r);
  g.addColorStop(0, human ? '#e0d0b0' : '#555047'); g.addColorStop(.65, human ? '#b4a080' : '#2a2925'); g.addColorStop(1, human ? '#8a7559' : '#121310');
  circle(ctx, x, y, r, g as unknown as string);
  ctx.strokeStyle = human ? '#f5e6c533' : '#b6ac7e28'; ctx.lineWidth = 1.3;
  for (const rad of [r - 3, r - 7, r - 10]) { ctx.beginPath(); ctx.arc(x, y, rad, 0, Math.PI * 2); ctx.stroke(); }
  for (let i = 0; i < 5; i++) line(ctx, x - 16, y - 10 + i * 5, x + 16, y - 12 + i * 5, human ? '#4d3c2420' : '#bca5800c');
  ctx.strokeStyle = human ? '#6f5a3a' : '#8f8567'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(x, y - 10); ctx.lineTo(x + 7, y); ctx.lineTo(x, y + 10); ctx.lineTo(x - 7, y); ctx.closePath(); ctx.stroke();
  if (king) {
    circle(ctx, x, y - 3, r * .58, human ? '#c2ab7a' : '#74633f');
    ctx.strokeStyle = '#302419'; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(x - 12, y - 8); ctx.lineTo(x - 9, y + 6); ctx.lineTo(x + 9, y + 6); ctx.lineTo(x + 12, y - 8); ctx.lineTo(x + 4, y - 2); ctx.lineTo(x, y - 12); ctx.lineTo(x - 4, y - 2); ctx.closePath(); ctx.stroke();
  }
  ctx.restore();
}
let backdrop: HTMLCanvasElement | null = null;
function drawBackdrop(ctx: CanvasRenderingContext2D) {
  wood(ctx, 0, 0, SIZE, SIZE, 12); ctx.strokeStyle = '#87704c'; ctx.lineWidth = 2; ctx.strokeRect(9, 9, SIZE - 18, SIZE - 18);
  ctx.strokeStyle = '#17110c'; ctx.lineWidth = 10; ctx.strokeRect(EDGE - 4, EDGE - 4, 640, 640);
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    const x = EDGE + c * CELL, y = EDGE + r * CELL;
    wood(ctx, x, y, CELL, CELL, r * 31 + c * 7, (r + c) % 2 === 0);
    ctx.strokeStyle = '#130b0733'; ctx.lineWidth = 1; ctx.strokeRect(x + .5, y + .5, CELL - 1, CELL - 1);
  }
  // Old cuts and surface wear use a fixed seed: no flicker between frames.
  for (let i = 0; i < 70; i++) {
    const x = EDGE + noise(i + 55) * 630, y = EDGE + noise(i + 135) * 630;
    line(ctx, x, y, x + noise(i + 23) * 20, y - 2, '#160c0723', .8);
  }
  ctx.fillStyle = '#af9775'; ctx.font = '12px monospace'; ctx.textAlign = 'center';
  for (let i = 0; i < 8; i++) { ctx.fillText('ABCDEFGH'[i], EDGE + (i + .5) * CELL, SIZE - 15); ctx.fillText(String(8 - i), 22, EDGE + (i + .5) * CELL + 4); }
  for (const [x, y] of [[20, 20], [700, 20], [20, 700], [700, 700]]) { circle(ctx, x, y, 4, '#928062'); line(ctx, x - 2, y + 2, x + 2, y - 2, '#231a11'); }
}
export function drawBoard(ctx: CanvasRenderingContext2D, board: Board, selected: Position | null, motion: Motion, time: number) {
  ctx.clearRect(0, 0, SIZE, SIZE); ctx.save();
  if (!backdrop) {
    backdrop = document.createElement('canvas'); backdrop.width = SIZE; backdrop.height = SIZE;
    const background = backdrop.getContext('2d')!; drawBackdrop(background);
  }
  ctx.drawImage(backdrop, 0, 0);
  const frame = motion ? motionFrame(motion.move, motion.progress) : null;
  const segmentFloat = frame?.traversed ?? 0;
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    const p = board[r][c]; if (!p || (motion && same(motion.move.from, { row: r, col: c }))) continue;
    const capturedIndex = motion?.move.captures.findIndex(pos => same(pos, { row: r, col: c })) ?? -1;
    if (capturedIndex >= 0 && segmentFloat > capturedIndex + .48) continue;
    const sel = !!selected && same(selected, { row: r, col: c });
    drawPiece(ctx, EDGE + (c + .5) * CELL, EDGE + (r + .5) * CELL - (sel ? 4 : 0), p.player === 'human', p.king, sel);
  }
  if (motion) {
    const p = board[motion.move.from.row][motion.move.from.col];
    if (p && frame) {
      const a = frame.from, b = frame.to, t = frame.progress, ease = t * t * (3 - 2 * t);
      drawPiece(ctx, EDGE + (a.col + (b.col - a.col) * ease + .5) * CELL, EDGE + (a.row + (b.row - a.row) * ease + .5) * CELL - Math.sin(t * Math.PI) * 14, p.player === 'human', p.king, true);
    }
  }
  const glow = ctx.createRadialGradient(100, 20, 10, 260, 200, 780);
  glow.addColorStop(0, '#ffdc9914'); glow.addColorStop(1, '#00000035'); ctx.fillStyle = glow; ctx.fillRect(0, 0, SIZE, SIZE);
  void time; ctx.restore();
}
export function drawHints(ctx: CanvasRenderingContext2D, selected: Position | null, targets: Position[], capture: boolean, blood: number, effects: string, time: number) {
  ctx.clearRect(0, 0, SIZE, SIZE);
  const severity = effects === 'OFF' ? 0 : (100 - blood) / 100 * (effects === 'REDUCED' ? .45 : 1);
  const g = ctx.createRadialGradient(360, 360, 100 + blood * 1.4, 360, 360, 470);
  g.addColorStop(0, 'transparent'); g.addColorStop(1, `rgba(18,1,1,${.12 + severity * .7 + Math.sin(time / 550) * severity * .04})`);
  ctx.fillStyle = g; ctx.fillRect(0, 0, SIZE, SIZE);
  if (selected) {
    const x = EDGE + selected.col * CELL, y = EDGE + selected.row * CELL;
    ctx.strokeStyle = '#e6d7b1'; ctx.lineWidth = 2; ctx.strokeRect(x + 4, y + 4, CELL - 8, CELL - 8);
    ctx.fillStyle = '#efe0b014'; ctx.fillRect(x, y, CELL, CELL);
  }
  for (const p of targets) {
    const x = EDGE + (p.col + .5) * CELL, y = EDGE + (p.row + .5) * CELL;
    circle(ctx, x, y, 15, capture ? '#8e2524b8' : '#e0d2b23c'); circle(ctx, x, y, 4, capture ? '#f2aaa0' : '#ede0c5');
    ctx.strokeStyle = capture ? '#dd8779' : '#dfcfae'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x, y, 18, 0, Math.PI * 2); ctx.stroke();
  }
}
