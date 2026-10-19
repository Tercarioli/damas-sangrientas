import { same, type Board, type Move, type Position } from '../game/types';
import { motionFrame } from './animation';
import { BOARD_HEIGHT, BOARD_WIDTH, cellCenter, cellCorners, project } from './projection';
import { noise } from './primitives';
export type Motion = { move: Move; progress: number } | null;
type Point = { x: number; y: number };
function polygon(ctx: CanvasRenderingContext2D, points: Point[], fill: string, stroke?: string) {
  ctx.beginPath(); points.forEach((p,i)=> i ? ctx.lineTo(p.x,p.y) : ctx.moveTo(p.x,p.y)); ctx.closePath();
  ctx.fillStyle=fill; ctx.fill(); if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=2;ctx.stroke();}
}
function oval(ctx: CanvasRenderingContext2D, x: number,y: number, rx: number,ry: number,color: string) {
  ctx.beginPath();ctx.ellipse(Math.round(x),Math.round(y),rx,ry,0,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();
}
let backdrop: HTMLCanvasElement | null = null;
function makeBackdrop() {
  const canvas=document.createElement('canvas');canvas.width=BOARD_WIDTH/2;canvas.height=BOARD_HEIGHT/2;
  const ctx=canvas.getContext('2d')!;ctx.scale(.5,.5);ctx.imageSmoothingEnabled=false;
  polygon(ctx,[{x:8,y:510},{x:792,y:510},{x:790,y:534},{x:10,y:534}],'#1b0e0b','#08090b');
  for(let i=0;i<28;i++){ctx.fillStyle=i%3===0?'#5e341c':'#2e1810';ctx.fillRect(16+i*28,515,23,8);}
  polygon(ctx,[{x:136,y:14},{x:664,y:14},{x:792,y:510},{x:8,y:510}],'#321d12','#9b6b31');
  polygon(ctx,[{x:145,y:26},{x:655,y:26},{x:777,y:501},{x:23,y:501}],'#21160f','#b28545');
  for(let r=0;r<8;r++)for(let c=0;c<8;c++) {
    const light=(r+c)%2===0, seed=r*97+c*23, corners=cellCorners(r,c);
    polygon(ctx,corners,light?'#ae7d43':'#242526','#3a291b');ctx.save();
    ctx.beginPath();corners.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.clip();
    const x=Math.min(...corners.map(p=>p.x)),y=corners[0].y,w=Math.max(...corners.map(p=>p.x))-x,h=corners[2].y-y;
    const palette=light?['#c18c49','#d49b50','#9c6835','#bd8a47','#654425']:['#323233','#171b20','#3b3329','#48402e','#16191d'];
    for(let i=0;i<95;i++) {
      ctx.fillStyle=palette[i%palette.length];const xx=Math.floor((x+noise(seed+i*3)*w)/2)*2,yy=Math.floor((y+noise(seed+i*7+101)*h)/2)*2;
      ctx.fillRect(xx,yy,2+Math.floor(noise(i+seed)*4)*2,i%5===0?4:2);
    }
    // Hand-worn edges and tiny fixed dark stains, never flickering.
    ctx.fillStyle=light?'#ead29a60':'#ad794b22';ctx.fillRect(x,y+2,w,2);
    if(noise(seed+11)>.66)for(let i=0;i<10;i++) {ctx.fillStyle=i%3?'#54251a':'#692a1b';ctx.fillRect(Math.floor((x+w*.6+noise(i+seed)*15)/2)*2,Math.floor((y+h*.6+noise(i+33)*10)/2)*2,2+i%3*2,2);}
    ctx.restore();
  }
  // Brass inlay and worn studs around the wooden frame.
  ctx.font='12px monospace';ctx.textAlign='center';ctx.fillStyle='#cc9b53';
  for(let i=0;i<8;i++){const p=project((i+.5)/8,1);ctx.fillText('ABCDEFGH'[i],p.x,509);const n=project(0,(i+.5)/8);ctx.fillText(String(8-i),n.x-16,n.y+4);}
  for(const [x,y] of [[144,24],[656,24],[26,498],[774,498]]){
    ctx.fillStyle='#101316';ctx.fillRect(x-8,y-6,16,12);ctx.fillStyle='#b9893f';ctx.fillRect(x-5,y-4,10,8);ctx.fillStyle='#f1c273';ctx.fillRect(x-3,y-2,3,2);ctx.fillStyle='#4b2913';ctx.fillRect(x+1,y-2,2,5);
  }
  for(let i=0;i<50;i++){const p=project(noise(i+40),0);ctx.fillStyle=i%3?'#a2773b':'#e2b76c';ctx.fillRect(Math.round(p.x),20,4,2);}
  return canvas;
}
export function drawPiece(ctx: CanvasRenderingContext2D,x: number,y: number,human: boolean,king: boolean,row: number,selected=false) {
  const r=23+row*.9, ry=12+row*.48, lift=selected?9:0; x=Math.round(x);y=Math.round(y-lift);
  oval(ctx,x+3,y+12+lift,r+5,ry+3,'#090c0ed9');
  oval(ctx,x,y+7,r,ry,human?'#5d3b22':'#0a0e11');
  ctx.fillStyle=human?'#76502d':'#272728';ctx.fillRect(x-r,y,r*2,7);
  oval(ctx,x,y+3,r,ry,human?'#b5894e':'#4b4230');
  oval(ctx,x,y,r,ry,human?'#d7b477':'#66604a');
  oval(ctx,x,y,r-3,ry-2,human?'#937044':'#141b20');
  oval(ctx,x,y-1,r-5,ry-4,human?'#c5a374':'#303338');
  ctx.fillStyle=human?'#edca8c':'#9c8b61';ctx.fillRect(x-r+6,y-ry+3,12,2);ctx.fillRect(x-8,y-ry,9,2);
  ctx.fillStyle=human?'#7e5030':'#6f634a';ctx.fillRect(x-2,y-6,4,12);ctx.fillRect(x-7,y-1,14,2);
  for(let i=0;i<7;i++){ctx.fillStyle=human?'#86623b66':'#0a0f1466';ctx.fillRect(x-15+Math.round(noise(i+8)*30),y-5+Math.round(noise(i+25)*10),4,2);}
  if(king){
    oval(ctx,x,y-7,r-3,ry-2,human?'#b88b49':'#8e6d35');oval(ctx,x,y-9,r-6,ry-4,human?'#e4c28a':'#303132');
    ctx.fillStyle='#68421f';ctx.fillRect(x-9,y-13,18,7);ctx.fillStyle='#e7ba63';
    for(const dx of [-8,0,8])ctx.fillRect(x+dx-2,y-17,4,8);ctx.fillRect(x-10,y-10,20,3);
  }
}
export function drawBoard(ctx: CanvasRenderingContext2D,board: Board,selected: Position|null,motion: Motion,time: number) {
  ctx.clearRect(0,0,BOARD_WIDTH,BOARD_HEIGHT);backdrop??=makeBackdrop();ctx.imageSmoothingEnabled=false;
  ctx.drawImage(backdrop,0,0,BOARD_WIDTH,BOARD_HEIGHT);
  const frame=motion?motionFrame(motion.move,motion.progress):null;
  for(let r=0;r<8;r++)for(let c=0;c<8;c++){
    const piece=board[r][c];if(!piece || motion&&same(motion.move.from,{row:r,col:c}))continue;
    const captured=motion?.move.captures.findIndex(p=>same(p,{row:r,col:c}))??-1;
    if(captured>=0 && frame && frame.traversed>captured+.5)continue;
    const center=cellCenter(r,c);let shake=0;
    if(captured>=0&&frame&&Math.abs(frame.traversed-captured-.4)<.13)shake=Math.round(Math.sin(time/18)*3);
    drawPiece(ctx,center.x+shake,center.y,piece.player==='human',piece.king,r,!!selected&&same(selected,{row:r,col:c}));
  }
  if(motion&&frame){const piece=board[motion.move.from.row][motion.move.from.col];if(piece){
    const t=frame.progress,e=t*t*(3-2*t),row=frame.from.row+(frame.to.row-frame.from.row)*e,col=frame.from.col+(frame.to.col-frame.from.col)*e;
    const p=cellCenter(row,col);drawPiece(ctx,p.x,p.y-Math.sin(Math.PI*t)*10,piece.player==='human',piece.king,row,true);
  }}
}
export function drawHints(ctx: CanvasRenderingContext2D,selected: Position|null,targets: Position[],capture: boolean,blood: number,effects: string,time: number) {
  ctx.clearRect(0,0,BOARD_WIDTH,BOARD_HEIGHT);
  const severity=effects==='OFF'?0:(100-blood)/100*(effects==='REDUCED'?.35:1);
  if(severity>.1){const glow=ctx.createRadialGradient(400,270,150,400,270,440);glow.addColorStop(0,'transparent');glow.addColorStop(1,`rgba(12,3,8,${severity*.6+Math.sin(time/600)*severity*.04})`);ctx.fillStyle=glow;ctx.fillRect(0,0,BOARD_WIDTH,BOARD_HEIGHT);}
  if(selected){const ps=cellCorners(selected.row,selected.col);polygon(ctx,ps,'#ead39a12','#f5d99a');}
  for(const p of targets){const center=cellCenter(p.row,p.col),size=14+p.row*.7;
    oval(ctx,center.x,center.y,size,size*.5,capture?'#9c3525bb':'#d9be7b44');
    ctx.strokeStyle=capture?'#f0a15c':'#f7ddab';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(Math.round(center.x),Math.round(center.y),size,size*.5,0,0,Math.PI*2);ctx.stroke();
    ctx.fillStyle=capture?'#ffd393':'#f5ddb1';ctx.fillRect(Math.round(center.x)-2,Math.round(center.y)-2,4,4);
  }
}
