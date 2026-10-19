import { useEffect, useRef } from 'react';
import type { PlayerHealth } from '../game/types';
import { condition } from '../game/health';
import { BALANCE } from '../game/balance';
import { drawBody, limbName } from '../render/body';
type Props={health:PlayerHealth;keeper?:boolean;active:boolean;injuryAt:number;dead:boolean;reduced:boolean};
export function BodyPanel({health,keeper=false,active,injuryAt,dead,reduced}:Props){
  const ref=useRef<HTMLCanvasElement>(null),previousLost=useRef(health.lost),injuryFrom=useRef(0);
  useEffect(()=>{
    const ctx=ref.current?.getContext('2d');if(!ctx)return;ctx.setTransform(.5,0,0,.5,0,0);ctx.imageSmoothingEnabled=false;
    if(health.lost>previousLost.current)injuryFrom.current=previousLost.current;if(health.lost===0)injuryFrom.current=0;previousLost.current=health.lost;
    const collapseStart=performance.now();let id=0;
    const frame=(now:number)=>{const progress=injuryAt?Math.max(0,Math.min(1,(now-injuryAt)/BALANCE.injuryMs)):null;
      drawBody(ctx,health,keeper,now,progress,dead,reduced,injuryFrom.current,reduced?1:Math.min(1,Math.pow((now-collapseStart)/700,2)));id=requestAnimationFrame(frame);};
    id=requestAnimationFrame(frame);return()=>cancelAnimationFrame(id);
  },[health,keeper,injuryAt,dead,reduced]);
  return <aside className={`body-panel ${keeper?'keeper':'challenger'} ${active?'active':''} ${dead?'dead':''}`} aria-label={keeper?'The Keeper’s blood and body':'Your blood and body'}>
    <div className="vitals">
    <div className="subject-number"><span>{keeper?'SUBJECT II':'SUBJECT I'}</span><i className={active?'lit':''}/></div>
    <h2>{keeper?'THE KEEPER':'THE CHALLENGER'}</h2>
    <div className="blood-readout"><svg viewBox="0 0 12 16" aria-hidden="true"><path d="M6 0 1 8v5l3 3h4l3-3V8z"/></svg><strong>{String(health.blood).padStart(3,'0')}<small> / 100</small></strong><span className={`condition ${condition(health.blood).toLowerCase()}`}>{condition(health.blood)}</span></div>
    <div className="blood-track" role="meter" aria-label={keeper?'Keeper blood':'Your blood'} aria-valuemin={0} aria-valuemax={100} aria-valuenow={health.blood}><span style={{width:`${health.blood}%`}}/></div>
    <div className="bleeding"><span>BLOOD REMAINING</span><strong>{health.bleeding?`−${health.bleeding}`:'−0'}<small> / TURN</small></strong></div>
    </div>
    <div className="body-portrait"><canvas ref={ref} width={140} height={210} aria-label={`${keeper?'Keeper':'Challenger'} pixel wooden automaton, ${Math.min(health.lost,4)} missing limbs, ${Math.min(health.lost,4)} limbs in wastebasket`}/></div>
    <div className="injury-markers">{Array.from({length:4},(_,i)=><span key={i} className={health.lost>i?'lost':''} title={`${limbName(i)}: ${health.lost>i?'in wastebasket':'intact'}`}>{['I','II','III','IV'][i]}</span>)}<small>{health.lost?`${Math.min(health.lost,4)} / 4 COLLECTED`:'NOTHING TO COLLECT. YET.'}</small></div>
  </aside>;
}
