export const LIMBS = [
  { x: -31, y: 102, length: 79, angle: .12, binX: 96, binY: 341, binAngle: -1.15 },
  { x: 17, y: 188, length: 90, angle: -.06, binX: 172, binY: 348, binAngle: 1.2 },
  { x: 31, y: 102, length: 79, angle: -.12, binX: 110, binY: 362, binAngle: -1.5 },
  { x: -17, y: 188, length: 90, angle: .06, binX: 165, binY: 374, binAngle: 1.55 },
] as const;
export function limbPose(index: number, progress: number, injuryFrom = index) {
  const limb = LIMBS[index], delay = Math.max(0, index - injuryFrom) * .1;
  const t = Math.min(1, Math.max(0, (progress - delay) / (1 - delay))), ease = t * t * (3 - 2 * t);
  return { x: 140 + limb.x + (limb.binX - 140 - limb.x) * ease,
    y: limb.y + (limb.binY - limb.y) * t * t - Math.sin(t * Math.PI) * 18,
    angle: limb.angle + (limb.binAngle - limb.angle) * ease, settled: t === 1 };
}
