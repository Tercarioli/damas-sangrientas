import { BALANCE as B } from './balance';
import type { BodyPart, PlayerHealth } from './types';
export const AMPUTATION_ORDER: BodyPart[] = ['leftArm', 'rightLeg', 'rightArm', 'leftLeg'];
export const initialHealth = (): PlayerHealth => ({ blood: B.initialBlood, bleeding: 0, lost: 0, injuries: [] });
export function injure(health: PlayerHealth): PlayerHealth {
  const amputates = health.lost < B.limbs;
  return { blood: Math.max(0, health.blood - (amputates ? B.amputationDamage : B.aggravatedDamage)),
    bleeding: health.bleeding + (amputates ? B.amputationBleeding : B.aggravatedBleeding), lost: health.lost + 1,
    injuries: [...health.injuries, { part: AMPUTATION_ORDER[health.lost % B.limbs], aggravated: !amputates }] };
}
export const bleed = (h: PlayerHealth): PlayerHealth => ({ ...h, blood: Math.max(0, h.blood - h.bleeding) });
export const condition = (blood: number) => blood > 75 ? 'HEALTHY' : blood > 50 ? 'WOUNDED' : blood > 25 ? 'CRITICAL' : blood > 0 ? 'DYING' : 'DECEASED';
