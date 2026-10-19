import { AMPUTATION_ORDER } from '../game/health';
import type { PlayerHealth } from '../game/types';
import { noise } from './primitives';
import { LIMBS, limbPose } from './bodyMotion';
function px(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,color:string){ctx.fillStyle=color;ctx.fillRect(Math.round(x/2)*2,Math.round(y/2)*2,Math.max(2,Math.round(w/2)*2),Math.max(2,Math.round(h/2)*2));}
function ellipse(ctx:CanvasRenderingContext2D,x:number,y:number,rx:number,ry:number,color:string){
  for(let dy=-ry;dy<=ry;dy+=2){const span=Math.sqrt(Math.max(0,1-dy*dy/(ry*ry)))*rx;px(ctx,x-span,y+dy,span*2,2,color);}
}
function joint(ctx:CanvasRenderingContext2D,x:number,y:number,r=7){
  ellipse(ctx,x,y,r+2,r+2,'#0b1013');ellipse(ctx,x,y,r,r,'#6c624b');ellipse(ctx,x-1,y-1,r-2,r-2,'#ae9060');px(ctx,x-2,y-2,4,4,'#1c2326');px(ctx,x-3,y-4,2,2,'#eed09a');
}
function plank(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,seed:number,dark=false){
  px(ctx,x-2,y-2,w+4,h+4,'#161c1e');px(ctx,x,y,w,h,dark?'#77532f':'#c19d66');px(ctx,x,y,4,h,dark?'#b18b4c':'#f0c990');px(ctx,x+w-4,y,4,h,'#5b3d28');
  for(let i=0;i<h/4;i++){const yy=y+i*4;px(ctx,x+4+Math.floor(noise(i+seed)*(w-8)/2)*2,yy,2,2+noise(i+6)*8,i%3?'#83623a':'#e3b577');}
}
function limb(ctx:CanvasRenderingContext2D,length:number,index:number,keeper:boolean){
  plank(ctx,-8,4,16,length*.43,index*21,keeper);joint(ctx,0,length*.5,6);plank(ctx,-6,length*.56,12,length*.39,index*31+5,keeper);
  // Carved fingers for arms, a squared shoe for legs.
  if(index===0||index===2){plank(ctx,-7,length-4,14,12,22,keeper);for(let n=0;n<3;n++)px(ctx,-5+n*4,length+3,2,7,'#3b2b20');}
  else{px(ctx,-7,length-2,18,8,'#2a251e');px(ctx,-7,length-2,14,3,'#947046');}
}
function basketBack(ctx:CanvasRenderingContext2D){
  ellipse(ctx,140,402,90,12,'#060b0dc9');
  ctx.beginPath();ctx.moveTo(47,311);ctx.lineTo(233,311);ctx.lineTo(218,398);ctx.lineTo(62,398);ctx.closePath();ctx.fillStyle='#0c1418';ctx.fill();
  ellipse(ctx,140,312,94,23,'#8d7547');ellipse(ctx,140,312,89,19,'#171d1e');ellipse(ctx,140,314,82,14,'#080e12');
  for(let n=0;n<7;n++)px(ctx,70+n*21,306,7,2,n%2?'#716345':'#b28d50');
}
function basketFront(ctx:CanvasRenderingContext2D,keeper:boolean){
  ctx.save();ctx.beginPath();ctx.moveTo(47,314);ctx.quadraticCurveTo(140,350,233,314);ctx.lineTo(218,398);ctx.quadraticCurveTo(140,415,62,398);ctx.closePath();ctx.clip();
  // Wire mesh allows the actual accumulated limbs to remain visible.
  for(let x=-80;x<380;x+=19){ctx.strokeStyle=x%3?'#364145':'#786640';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x,310);ctx.lineTo(x+90,414);ctx.stroke();ctx.strokeStyle='#0a1116';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,310);ctx.lineTo(x-90,414);ctx.stroke();}
  ctx.restore();
  ctx.strokeStyle='#786744';ctx.lineWidth=4;ctx.beginPath();ctx.ellipse(140,314,93,22,0,0,Math.PI);ctx.stroke();
  ctx.strokeStyle='#8d7041';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(47,312);ctx.lineTo(62,398);ctx.quadraticCurveTo(140,416,218,398);ctx.lineTo(233,312);ctx.stroke();
  px(ctx,122,378,36,19,'#20282a');px(ctx,124,380,32,15,'#6e5837');ctx.fillStyle='#ddbe80';ctx.font='12px monospace';ctx.textAlign='center';ctx.fillText(keeper?'II':'I',140,392);
  for(const x of [127,153])px(ctx,x,383,2,2,'#c9a360');
}
export function drawBody(ctx:CanvasRenderingContext2D,health:PlayerHealth,keeper:boolean,time:number,injuryProgress:number|null,dead:boolean,reduced:boolean,injuryFrom=0,collapse=1){
  ctx.clearRect(0,0,280,420);basketBack(ctx);
  const sway=reduced?0:Math.sin(time/(keeper?1800:2300))*.008;
  ctx.save();ctx.translate(140,dead?50*collapse:0);ctx.rotate(dead?.3*collapse:sway);
  // Hanging wooden automaton; the head is always present, even at zero blood.
  for(const x of [-31,0,31]){ctx.strokeStyle='#aa8b4b50';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x*.9,0);ctx.lineTo(x,x===0?37:102);ctx.stroke();}
  ctx.save();ctx.beginPath();ctx.moveTo(-27,96);ctx.lineTo(27,96);ctx.lineTo(23,170);ctx.lineTo(18,193);ctx.lineTo(-18,193);ctx.lineTo(-23,170);ctx.closePath();ctx.clip();plank(ctx,-30,94,60,104,15,keeper);ctx.restore();
  joint(ctx,0,94,7);ellipse(ctx,0,63,25,32,'#171b1d');ellipse(ctx,-1,61,23,31,keeper?'#927145':'#c8a670');
  for(let i=0;i<30;i++)px(ctx,-19+noise(i+7)*36,34+noise(i+31)*54,2,2,i%4?'#a17d4b':'#e7c18a');
  px(ctx,-7,33,2,21,'#5e422a');px(ctx,-5,53,2,19,'#715032');px(ctx,-8,71,2,18,'#745331');
  for(const x of [-10,10]){ellipse(ctx,x,59,5,5,'#171e22');px(ctx,x-2,57,2,2,keeper?'#e8a44e':'#d4ae6c');}
  px(ctx,-2,65,4,8,'#81603e');px(ctx,-9,80,18,2,'#493627');for(let i=0;i<4;i++)px(ctx,-7+i*5,78,2,6,'#3f3126');
  for(let i=0;i<4;i++){px(ctx,-18,114+i*12,36,2,'#745538');px(ctx,-16,116+i*12,32,2,'#dcac6a');}
  px(ctx,-12,119,24,30,'#272825');px(ctx,-10,121,20,26,'#171c1e');ellipse(ctx,0,134,7,8,dead?'#3d251e':'#852f21');px(ctx,-3,129,4,3,dead?'#554030':'#d4723e');
  joint(ctx,0,169,8);for(let i=0;i<5;i++){px(ctx,-18+i*8,181,4,6,'#655039');px(ctx,-17+i*8,181,2,2,'#eed39d');}
  LIMBS.forEach((l,i)=>{
    if(health.lost<=i){ctx.save();ctx.translate(l.x,l.y);ctx.rotate(l.angle+(reduced?0:Math.sin(time/1400+i)*.012));limb(ctx,l.length,i,keeper);ctx.restore();joint(ctx,l.x,l.y);}
    else{ellipse(ctx,l.x,l.y,8,8,'#3e1c18');px(ctx,l.x-4,l.y-3,7,6,'#a33c27');px(ctx,l.x-2,l.y+4,3,10,'#7b271e');}
  });
  ctx.restore();
  // Detached limbs fall independently, then persist in the same basket coordinates.
  LIMBS.forEach((l,i)=>{if(health.lost<=i)return;
    const fresh=injuryProgress!==null&&i>=injuryFrom,progress=fresh?injuryProgress!:1,p=limbPose(i,progress,injuryFrom);
    ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle);limb(ctx,l.length,i,keeper);ctx.restore();
    if(fresh&&progress<.55)for(let n=0;n<9;n++){const t=Math.max(0,progress*2);px(ctx,140+l.x+(noise(n+i*23)-.5)*70*t,l.y+45*t*t,2+(n%2)*2,2,n%3?'#a54428':'#cc6736');}
  });
  basketFront(ctx,keeper);
}
export const limbName=(index:number)=>({leftArm:'LEFT ARM',rightLeg:'RIGHT LEG',rightArm:'RIGHT ARM',leftLeg:'LEFT LEG',head:'HEAD'})[AMPUTATION_ORDER[index]];
