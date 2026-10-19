import type { Position } from '../game/types';
export const BOARD_WIDTH = 800, BOARD_HEIGHT = 540;
// Perspective in a fixed logical viewport. The very same corners render and hit-test.
const TOP_Y = 42, BOTTOM_Y = 490, TOP_HALF = 245, BOTTOM_HALF = 373, DEPTH = .72;
export function project(u: number, v: number) {
  const z = (1 - DEPTH) * v + DEPTH;
  const t = v / z;
  return { x: BOARD_WIDTH / 2 + (u - .5) * 2 * (TOP_HALF + (BOTTOM_HALF - TOP_HALF) * t), y: TOP_Y + (BOTTOM_Y - TOP_Y) * t };
}
export function unproject(x: number, y: number): Position | null {
  const t = (y - TOP_Y) / (BOTTOM_Y - TOP_Y);
  if (t < 0 || t >= 1) return null;
  const v = t * DEPTH / (1 - t * (1 - DEPTH));
  const half = TOP_HALF + (BOTTOM_HALF - TOP_HALF) * t;
  const u = .5 + (x - BOARD_WIDTH / 2) / (2 * half);
  if (u < 0 || u >= 1) return null;
  return { row: Math.floor(v * 8), col: Math.floor(u * 8) };
}
export function cellCorners(row: number, col: number) {
  return [project(col / 8, row / 8), project((col + 1) / 8, row / 8), project((col + 1) / 8, (row + 1) / 8), project(col / 8, (row + 1) / 8)];
}
export function cellCenter(row: number, col: number) { return project((col + .5) / 8, (row + .5) / 8); }
export function cellClip(row: number, col: number) {
  return `polygon(${cellCorners(row, col).map(p => `${p.x / BOARD_WIDTH * 100}% ${p.y / BOARD_HEIGHT * 100}%`).join(',')})`;
}
/** Local hit polygons retain a useful bounding box for keyboard and assistive tools. */
export function cellButtonStyle(row: number, col: number) {
  const points=cellCorners(row,col),left=Math.min(...points.map(p=>p.x)),top=points[0].y;
  const width=Math.max(...points.map(p=>p.x))-left,height=points[2].y-top;
  return { left:`${left/BOARD_WIDTH*100}%`,top:`${top/BOARD_HEIGHT*100}%`,width:`${width/BOARD_WIDTH*100}%`,height:`${height/BOARD_HEIGHT*100}%`,
    clipPath:`polygon(${points.map(p=>`${(p.x-left)/width*100}% ${(p.y-top)/height*100}%`).join(',')})` };
}
