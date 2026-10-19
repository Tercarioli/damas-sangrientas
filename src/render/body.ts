import { AMPUTATION_ORDER } from '../game/health';
import type { PlayerHealth } from '../game/types';
import { circle, line, noise, wood } from './primitives';
const limbs = [
  { x: -34, y: 116, angle: .12, length: 94 },
  { x: 21, y: 204, angle: -.08, length: 110 },
  { x: 34, y: 116, angle: -.12, length: 94 },
  { x: -21, y: 204, angle: .09, length: 110 },
];
function joint(ctx: CanvasRenderingContext2D, x: number, y: number, radius = 7) {
  circle(ctx, x + 1, y + 2, radius + 2, '#15100d');
  const g = ctx.createRadialGradient(x - 2, y - 3, 1, x, y, radius); g.addColorStop(0, '#a99b77'); g.addColorStop(.5, '#61594d'); g.addColorStop(1, '#28251e');
  circle(ctx, x, y, radius, g as unknown as string); line(ctx, x - 3, y + 2, x + 3, y - 2, '#1b1916', 1.5);
}
function limb(ctx: CanvasRenderingContext2D, length: number, seed: number) {
  ctx.save(); ctx.beginPath(); ctx.roundRect(-9, 0, 18, length * .46, 7); ctx.clip(); wood(ctx, -10, 0, 20, length, seed, true); ctx.restore();
  joint(ctx, 0, length * .5, 6);
  ctx.save(); ctx.beginPath(); ctx.roundRect(-7, length * .54, 14, length * .46, 5); ctx.clip(); wood(ctx, -8, length * .54, 16, length * .5, seed + 4, true); ctx.restore();
  line(ctx, -4, 8, -3, length * .4, '#efd6a13b');
}
export function drawBody(ctx: CanvasRenderingContext2D, health: PlayerHealth, keeper: boolean, time: number, injuryProgress: number | null, dead: boolean, reduced: boolean, injuryFrom = 0, collapse = 1) {
  ctx.clearRect(0, 0, 280, 380); ctx.save();
  const sway = reduced ? 0 : Math.sin(time / (keeper ? 1700 : 2400)) * .009;
  const g = ctx.createRadialGradient(140, 190, 20, 140, 210, 175); g.addColorStop(0, keeper ? '#6d502417' : '#d5a45812'); g.addColorStop(1, '#00000000'); ctx.fillStyle = g; ctx.fillRect(0, 0, 280, 380);
  ctx.fillStyle = '#0005'; ctx.beginPath(); ctx.ellipse(140, 345, 85, 14, 0, 0, Math.PI * 2); ctx.fill();
  ctx.translate(140, dead ? 13 + 97 * collapse : 13); ctx.rotate(dead ? .6 * collapse : sway);
  // A suspended fairground automaton. Head remains attached in every state.
  line(ctx, -42, 18, -34, 113, '#99856522'); line(ctx, 42, 18, 34, 113, '#99856522'); line(ctx, 0, 0, 0, 55, '#a9987050');
  ctx.shadowColor = '#000'; ctx.shadowBlur = 14; ctx.shadowOffsetY = 7;
  ctx.save(); ctx.beginPath(); ctx.moveTo(-29, 106); ctx.bezierCurveTo(-47, 128, -28, 184, -26, 202); ctx.quadraticCurveTo(0, 220, 26, 202); ctx.bezierCurveTo(28, 184, 47, 128, 29, 106); ctx.closePath(); ctx.clip(); wood(ctx, -42, 100, 84, 112, keeper ? 85 : 43, true); ctx.restore();
  ctx.shadowColor = 'transparent';
  ctx.save(); ctx.beginPath(); ctx.ellipse(0, 73, 26, 36, -.08, 0, Math.PI * 2); ctx.clip(); wood(ctx, -30, 35, 60, 78, keeper ? 12 : 4, true); ctx.restore();
  joint(ctx, 0, 108, 8);
  ctx.strokeStyle = '#453325'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-1, 40); ctx.lineTo(-4, 65); ctx.lineTo(1, 80); ctx.lineTo(-3, 102); ctx.stroke();
  for (const x of [-10, 10]) { circle(ctx, x, 69, 5, '#171511'); circle(ctx, x - 1, 68, 1.2, keeper ? '#a16244' : '#a9976b'); }
  line(ctx, -9, 91, 9, 91, '#3d2e22', 2);
  for (let i = 0; i < 4; i++) line(ctx, -7 + i * 5, 88, -6 + i * 5, 94, '#3d2e22');
  // Mechanical rib plates, etched stitches, and a dark heart chamber.
  for (let i = 0; i < 4; i++) line(ctx, -19, 129 + i * 12, 18, 127 + i * 12, '#5b493257', 2);
  ctx.fillStyle = '#33291f'; ctx.fillRect(-11, 130, 22, 30); ctx.strokeStyle = '#76654b'; ctx.strokeRect(-11, 130, 22, 30);
  circle(ctx, 0, 145, 7, dead ? '#241815' : '#6e2320'); joint(ctx, 0, 184, 8);
  for (let i = 0; i < 7; i++) line(ctx, -26 + i * 8, 195, -22 + i * 8, 201, '#493b29');
  limbs.forEach((l, i) => {
    const lost = health.lost > i;
    const fresh = lost && injuryProgress !== null && i >= injuryFrom;
    if (!lost) {
      ctx.save(); ctx.translate(l.x, l.y); ctx.rotate(l.angle + (reduced ? 0 : Math.sin(time / 1200 + i) * .014)); limb(ctx, l.length, i * 13 + 8); ctx.restore(); joint(ctx, l.x, l.y);
    } else {
      circle(ctx, l.x, l.y, 9, '#461517'); circle(ctx, l.x - 2, l.y + 2, 4, '#7a2420');
      const t = fresh ? Math.min(1, Math.max(0, (injuryProgress! - (i - injuryFrom) * .1) / (1 - (i - injuryFrom) * .1))) : 1;
      ctx.save(); const side = l.x < 0 ? -1 : 1;
      ctx.translate(l.x + side * 35 * t, l.y + (323 - l.y + i * 6) * t);
      ctx.rotate(l.angle + side * t * (1.05 + i * .14)); limb(ctx, l.length, i * 13 + 8); ctx.restore();
      for (let n = 0; n < 7; n++) {
        const yy = l.y + noise(n + i * 8) * 24 + 4;
        circle(ctx, l.x + (noise(n + 50) - .5) * 24, yy, noise(n + 21) * 2.5 + .6, '#6a1a1a88');
      }
    }
  });
  ctx.restore();
  // Detached pieces and stains are persistent. Blood vessel is functional scenery.
  ctx.save(); ctx.translate(237, 258);
  ctx.fillStyle = '#d4c8b10c'; ctx.beginPath(); ctx.roundRect(-14, 0, 28, 78, [3, 3, 10, 10]); ctx.fill();
  const fill = health.blood / 100 * 64; ctx.fillStyle = '#7a1719'; ctx.fillRect(-10, 69 - fill, 20, fill);
  ctx.strokeStyle = '#8f806944'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.roundRect(-14, 0, 28, 78, [3, 3, 10, 10]); ctx.stroke();
  line(ctx, -8, 8, -8, 63, '#e5d8bc25', 2); ctx.fillStyle = '#71604a'; ctx.fillRect(-17, -4, 34, 8);
  for (let i = 1; i < 5; i++) line(ctx, 7, 70 - i * 13, 12, 70 - i * 13, '#c7b69455'); ctx.restore();
}
export const limbName = (index: number) => ({ leftArm: 'LEFT ARM', rightLeg: 'RIGHT LEG', rightArm: 'RIGHT ARM', leftLeg: 'LEFT LEG', head: 'HEAD' })[AMPUTATION_ORDER[index]];
