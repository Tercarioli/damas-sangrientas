export const noise = (n: number) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
export function line(ctx: CanvasRenderingContext2D, x: number, y: number, x2: number, y2: number, color: string, width = 1) {
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x2, y2); ctx.strokeStyle = color; ctx.lineWidth = width; ctx.stroke();
}
export function circle(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, color: string) {
  ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill();
}
export function wood(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, seed: number, light = false) {
  const g = ctx.createLinearGradient(x, y, x + w, y + h); g.addColorStop(0, light ? '#b9a181' : '#45372a'); g.addColorStop(.5, light ? '#998266' : '#352b23'); g.addColorStop(1, light ? '#b09a7c' : '#493c2e');
  ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  for (let i = 0; i < 22; i++) {
    const yy = y + noise(seed + i) * h;
    ctx.beginPath(); ctx.moveTo(x, yy); ctx.bezierCurveTo(x + w * .3, yy + noise(i) * 6, x + w * .7, yy - 3, x + w, yy + 1);
    ctx.strokeStyle = `rgba(20,12,6,${noise(i + seed) * .12})`; ctx.lineWidth = noise(i) * 1.2 + .3; ctx.stroke();
  }
  ctx.restore();
}
