import { describe, expect, it } from 'vitest';
import { BOARD_HEIGHT, BOARD_WIDTH, cellButtonStyle, cellCenter, project, unproject } from './projection';
describe('Perspective interactions', () => {
  it('maps the center of every visible square to its original engine position', () => {
    for (let row = 0; row < 8; row++) for (let col = 0; col < 8; col++) {
      const p = cellCenter(row, col); expect(unproject(p.x, p.y)).toEqual({ row, col });
    }
  });
  it('rejects table and frame clicks', () => {
    expect(unproject(0, 0)).toBeNull(); expect(unproject(10, 70)).toBeNull(); expect(unproject(799, 480)).toBeNull(); expect(unproject(400, 535)).toBeNull();
  });
  it('maps points near all four corners correctly', () => {
    for (const [u, v, row, col] of [[.001,.001,0,0],[.999,.001,0,7],[.001,.999,7,0],[.999,.999,7,7]]) {
      const p = project(u, v); expect(unproject(p.x, p.y)).toEqual({row,col});
    }
  });
  it('keeps every button bounding-box center inside its visible square', () => {
    for(let row=0;row<8;row++)for(let col=0;col<8;col++){const s=cellButtonStyle(row,col),x=(parseFloat(s.left)+parseFloat(s.width)/2)/100*BOARD_WIDTH,y=(parseFloat(s.top)+parseFloat(s.height)/2)/100*BOARD_HEIGHT;expect(unproject(x,y)).toEqual({row,col});}
  });
  it('uses consistent coordinates when moving between adjacent squares', () => {
    const a = project(.125-.0001,.4), b=project(.125+.0001,.4);
    expect(unproject(a.x,a.y)?.col).toBe(0);expect(unproject(b.x,b.y)?.col).toBe(1);
  });
});
