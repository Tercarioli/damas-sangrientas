import { describe, expect, it } from 'vitest';
import { LIMBS, limbPose } from './bodyMotion';
describe('Amputation into the wastebasket', () => {
  it('starts at the original joint, including for each limb in a multi-capture', () => {
    LIMBS.forEach((l,i)=>{expect(limbPose(i,0,0)).toMatchObject({x:140+l.x,y:l.y,settled:false});});
  });
  it('leaves every detached limb inside the basket at rest', () => {
    LIMBS.forEach((l,i)=>{const p=limbPose(i,1,0),tip={x:p.x-Math.sin(p.angle)*l.length,y:p.y+Math.cos(p.angle)*l.length};
      expect(p.settled).toBe(true);for(const point of [p,tip]){expect(point.x).toBeGreaterThan(56);expect(point.x).toBeLessThan(224);expect(point.y).toBeGreaterThan(310);expect(point.y).toBeLessThan(401);}
    });
  });
  it('staggered falls all finish within the injury sequence', () => {
    expect(limbPose(0,.08,0).y).not.toBe(LIMBS[0].y);expect(limbPose(3,.08,0).y).toBe(LIMBS[3].y);
    expect(limbPose(3,1,0).settled).toBe(true);
  });
  it('clamps delayed and overrun animation timestamps', () => {
    expect(limbPose(2,-1).y).toBe(LIMBS[2].y);expect(limbPose(2,2)).toEqual(limbPose(2,1));
  });
});
