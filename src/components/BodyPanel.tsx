import { useEffect, useRef } from 'react';
import type { PlayerHealth } from '../game/types';
import { condition } from '../game/health';
import { drawBody, limbName } from '../render/body';
type Props = { health: PlayerHealth; keeper?: boolean; active: boolean; injuryAt: number; dead: boolean; reduced: boolean };
export function BodyPanel({ health, keeper = false, active, injuryAt, dead, reduced }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const previousLost = useRef(health.lost), injuryFrom = useRef(0);
  useEffect(() => {
    const ctx = ref.current?.getContext('2d'); if (!ctx) return;
    ctx.setTransform(2, 0, 0, 2, 0, 0);
    if (health.lost > previousLost.current) injuryFrom.current = previousLost.current;
    if (health.lost === 0) injuryFrom.current = 0;
    previousLost.current = health.lost;
    const collapseStart = performance.now();
    let id = 0;
    const frame = (now: number) => {
      const progress = injuryAt ? Math.min(1, (now - injuryAt) / 780) : null;
      drawBody(ctx, health, keeper, now, progress, dead, reduced, injuryFrom.current, reduced ? 1 : Math.min(1, Math.pow((now - collapseStart) / 700, 2))); id = requestAnimationFrame(frame);
    };
    id = requestAnimationFrame(frame); return () => cancelAnimationFrame(id);
  }, [health, keeper, injuryAt, dead, reduced]);
  return <aside className={`body-panel ${active ? 'active' : ''} ${dead ? 'dead' : ''}`}>
    <div className="subject-number"><span>{keeper ? 'SUBJECT II' : 'SUBJECT I'}</span><i className={active ? 'lit' : ''}/></div>
    <h2>{keeper ? 'THE KEEPER' : 'THE CHALLENGER'}</h2>
    <div className="subject-role">{keeper ? 'THE HOUSE ALWAYS COLLECTS' : 'SOMETHING LEFT TO LOSE'}</div>
    <div className="body-portrait"><canvas ref={ref} width={560} height={760} style={{ width: '100%', height: '100%' }} aria-label={`${keeper ? 'Keeper' : 'Challenger'} wooden automaton, ${Math.min(health.lost, 4)} missing limbs`} /></div>
    <div className="health-heading"><span>BLOOD REMAINING</span><span className={`condition ${condition(health.blood).toLowerCase()}`}>{condition(health.blood)}</span></div>
    <div className="blood-number">{String(health.blood).padStart(3, '0')}<span>/ 100</span><svg viewBox="0 0 20 26" aria-hidden="true"><path d="M10 1C8 7 2 13 2 18a8 8 0 0016 0C18 13 12 7 10 1z"/></svg></div>
    <div className="blood-track"><span style={{ width: `${health.blood}%` }}/></div>
    <div className="bleeding"><span>HEMORRHAGE</span><strong>{health.bleeding ? `−${health.bleeding}` : '—'}<small> / TURN</small></strong></div>
    <div className="injury-markers">{Array.from({ length: 4 }, (_, i) => <span key={i} className={health.lost > i ? 'lost' : ''} title={`${limbName(i)}: ${health.lost > i ? 'lost' : 'intact'}`}>{['I', 'II', 'III', 'IV'][i]}</span>)}<small>{health.lost ? `${Math.min(health.lost, 4)} LIMBS LOST` : 'BODY INTACT'}</small></div>
  </aside>;
}
