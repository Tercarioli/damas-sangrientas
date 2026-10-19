import { useEffect, useState } from 'react';
import { BodyPanel } from './components/BodyPanel';
import { BoardView } from './components/BoardView';
import { Modal } from './components/Modal';
import { useGame } from './game/useGame';
import type { GameSettings } from './game/types';
import { sound } from './audio/sound';
const defaults: GameSettings = { difficulty: 'NORMAL', sound: true, volume: .35, effects: 'FULL' };
function loadSettings(): GameSettings {
  try { const s = JSON.parse(localStorage.getItem('last-move-settings') ?? '{}');
    return { difficulty: ['EASY', 'NORMAL', 'HARD'].includes(s.difficulty) ? s.difficulty : defaults.difficulty,
      sound: typeof s.sound === 'boolean' ? s.sound : defaults.sound,
      volume: typeof s.volume === 'number' && Number.isFinite(s.volume) ? Math.max(0, Math.min(1, s.volume)) : defaults.volume,
      effects: ['FULL', 'REDUCED', 'OFF'].includes(s.effects) ? s.effects : defaults.effects };
  } catch { return defaults; }
}
const reasonText = { blood: 'Bled out.', pieces: 'No pieces remaining.', blocked: 'No legal moves remaining.', repetition: 'Threefold repetition.', quiet: '80 turns without a capture or a man advancing.' };
export default function App() {
  const [settings, setSettings] = useState<GameSettings>(loadSettings);
  const [modal, setModal] = useState<'help' | 'settings' | 'leave' | null>(null);
  const game = useGame(settings), { state, phase } = game;
  const menu = phase === 'MENU', over = phase === 'GAME_OVER', ai = state.turn === 'ai';
  useEffect(() => { sound.enabled = settings.sound; sound.volume = settings.volume;
    try { localStorage.setItem('last-move-settings', JSON.stringify(settings)); } catch { /* Storage may be disabled. */ }
  }, [settings]);
  useEffect(() => () => sound.dispose(), []);
  const result = state.result;
  const humanPieces = state.board.flat().filter(p => p?.player === 'human').length;
  const aiPieces = state.board.flat().filter(p => p?.player === 'ai').length;
  return <main className={`scene ${menu ? 'in-menu' : ''} ${over ? 'ended' : ''} effects-${settings.effects.toLowerCase()}`}>
    <header className="topbar">
      <button className="wordmark" onClick={() => { if (!menu && !over) setModal('leave'); else game.reset(true); }}>LAST MOVE<span>THE BOARD TAKES MORE THAN PIECES.</span></button>
      <div className="edition"><i/> V.02 <span>THE SECOND OFFERING</span></div>
      <nav aria-label="Main navigation"><a className="archive-link" href="./v1/index.html">V1 ARCHIVE ↗</a><button onClick={() => setModal('help')}>HOW TO PLAY</button><button onClick={() => setModal('settings')}>SETTINGS</button><button className="sound-button" aria-label={`Sound ${settings.sound ? 'on' : 'off'}`} onClick={() => { sound.unlock(); setSettings(s => ({ ...s, sound: !s.sound })); }}>{settings.sound ? '♪' : '♩'}<span>{settings.sound ? 'ON' : 'OFF'}</span></button></nav>
    </header>
    <section className="ritual-stage" aria-label="Game table">
      <div className="scene-art" aria-hidden="true"/>
      <div className="candle-glows" aria-hidden="true"><i/><i/><i/><i/></div>
      <div className="dust" aria-hidden="true">{Array.from({length:9},(_,i)=><i key={i} style={{left:`${12+i*9}%`,top:`${18+(i*13)%50}%`,animationDelay:`${-i*1.7}s`}}/>)}</div>
      <div className="stage-whisper"><span>THE HOUSE IS WATCHING.</span><span>EVERY WOUND IS A DEBT.</span></div>
      <BodyPanel health={state.health.human} active={!menu && !over && !ai} injuryAt={game.injuryAt.human} dead={state.health.human.blood === 0} reduced={settings.effects !== 'FULL'}/>
      <section className="board-area" aria-label="Checkers">
        <div className="board-top"><span className="turn-indicator"><i className={!menu && !over ? 'lit' : ''}/>{menu ? 'TAKE YOUR SEAT' : over ? 'THE DEBT IS SETTLED' : ai ? 'THE KEEPER’S TURN' : 'YOUR TURN'}</span><span>TURN <b>{String(state.turns + (over ? 0 : 1)).padStart(2, '0')}</b></span></div>
        <BoardView board={game.preview} selectable={phase === 'PLAYING' && !ai ? game.selectable : []} selected={game.selected} targets={phase === 'PLAYING' && !ai ? game.targets : []} capture={game.forced} animation={game.animation} blood={state.health.human.blood} effects={settings.effects} shockAt={game.injuryAt.human} onSquare={game.click} enabled={phase === 'PLAYING' && !ai && !modal}/>
        <div className="board-bottom"><span><i className="piece-dot bone"/>YOU <b>{String(humanPieces).padStart(2, '0')}</b></span><span className={game.forced && !menu && !over ? 'capture-required' : ''}>{game.forced && !menu && !over ? 'CAPTURE IS COMPULSORY' : 'ENGLISH DRAUGHTS · NO MERCY'}</span><span>KEEPER <b>{String(aiPieces).padStart(2, '0')}</b><i className="piece-dot dark"/></span></div>
      </section>
      <BodyPanel keeper health={state.health.ai} active={!menu && !over && ai} injuryAt={game.injuryAt.ai} dead={state.health.ai.blood === 0} reduced={settings.effects !== 'FULL'}/>
      {menu && <section className="menu-overlay" aria-label="Main menu"><div className="menu-card"><div className="eyebrow">A GAME OF STRATEGY & SURVIVAL</div><h1>LAST MOVE<span>THE SECOND OFFERING</span></h1><p className="tagline">THE BOARD TAKES<br/>MORE THAN PIECES.</p><button className="primary" onClick={() => game.reset()}>BEGIN THE GAME <span>↗</span></button><p className="menu-quote">“Every piece you lose takes something from you.”</p><div className="menu-links"><button onClick={() => setModal('help')}>HOW TO PLAY</button><span>✧</span><button onClick={() => setModal('settings')}>SETTINGS</button></div></div></section>}
      {over && result && <section className="result-overlay" aria-label="Game result"><div className="result-card"><div className="eyebrow">THE FINAL ACCOUNT</div><div className="ornament">◇</div><h1>{result.winner === null ? 'DRAW' : result.winner === 'human' ? 'VICTORY' : 'YOU DIED'}</h1><p className="result-subtitle">{result.winner === null ? 'NEITHER SURVIVED THE GAME' : result.winner === 'human' ? result.reason === 'blood' ? 'YOUR OPPONENT HAS BLED OUT' : 'THE BOARD IS YOURS' : reasonText[result.reason]}</p><div className="result-stats"><div><span>TURNS PLAYED</span><b>{state.turns}</b></div><div><span>PIECES CAPTURED</span><b>{state.health.ai.lost}</b></div><div><span>YOUR BLOOD</span><b>{state.health.human.blood}<small> / 100</small></b></div><div><span>YOUR LIMBS LOST</span><b>{Math.min(4, state.health.human.lost)}</b></div></div><p className="end-reason">{reasonText[result.reason]}</p><button className="primary" onClick={() => game.reset()}>PLAY AGAIN <span>↗</span></button><button className="text-button" onClick={() => game.reset(true)}>MAIN MENU</button></div></section>}
    </section>
    <div className="table-footer"><span className="ritual-mark">✧</span><p role="status" aria-live="polite">{menu ? 'Every piece you lose takes something from you.' : game.message}</p><span className="ritual-mark">✧</span></div>
    <footer className="page-footer"><span>{!menu ? game.history[0] || 'THE OPENING · NO DEBTS YET' : 'A GAME OF STRATEGY & SURVIVAL'}</span><span>NOTHING LOST IS EVER RETURNED.</span>{!menu ? <button onClick={() => setModal('leave')}>LEAVE THE TABLE ↗</button> : <span>V.02 / PIXEL RITUAL</span>}</footer>
    {modal && <Modal title={modal === 'help' ? 'The rules of the table.' : modal === 'settings' ? 'Set the atmosphere.' : 'Leave the table?'} onClose={() => setModal(null)}>
      {modal === 'help' ? <><p className="intro">Play checkers. Lose a piece, lose a part of yourself. Every wound makes you bleed at the end of your turn. Win the board or outlive your opponent.</p><ol className="rules"><li>You play the bone pieces and move first. Click a piece, then a marked destination. Arrow keys and Enter also work.</li><li>Men move and capture forward. Kings move and jump in both directions, one step at a time.</li><li>Captures are compulsory. Continue every available jump with the same piece. Reaching the king row crowns a man and ends its turn.</li><li>Your first four losses take a limb: −8 blood and +3 bleeding each. Later losses: −5 blood and +1 bleeding.</li><li>You bleed once at the end of your own complete turn. Thinking takes no blood. Zero blood means death.</li><li>Take every enemy piece, leave no legal move, or outlive your opponent. Three identical positions or 80 quiet turns are a draw.</li></ol><p className="footnote">Blood and body state count toward repetition. A quiet turn means no capture and no movement by an uncrowned piece.</p><button className="primary" onClick={() => setModal(null)}>I UNDERSTAND <span>↗</span></button></> : modal === 'settings' ? <div className="settings"><label>THE KEEPER’S DIFFICULTY<select value={settings.difficulty} onChange={e => setSettings(s => ({ ...s, difficulty: e.target.value as GameSettings['difficulty'] }))}><option>EASY</option><option>NORMAL</option><option>HARD</option></select></label><p className="footnote">Applies to the next search. The Keeper considers blood as well as the board.</p><label>SOUND<button className="toggle" aria-pressed={settings.sound} aria-label={`Sound ${settings.sound ? 'on' : 'off'}`} onClick={() => { sound.unlock(); setSettings(s => ({ ...s, sound: !s.sound })); }}>{settings.sound ? 'ON' : 'OFF'}</button></label><label htmlFor="volume">MASTER VOLUME <span>{Math.round(settings.volume * 100)}%</span></label><input id="volume" type="range" min="0" max="1" step=".01" value={settings.volume} onChange={e => setSettings(s => ({ ...s, volume: Number(e.target.value) }))}/><label>PERCEPTION EFFECTS<select value={settings.effects} onChange={e => setSettings(s => ({ ...s, effects: e.target.value as GameSettings['effects'] }))}><option value="FULL">FULL</option><option value="REDUCED">REDUCED</option><option value="OFF">OFF</option></select></label><p className="footnote">Reduces blur, tunnel vision and ambient movement. Legal destinations always stay sharp. Settings are saved on this browser.</p><button className="primary" onClick={() => setModal(null)}>RETURN TO THE TABLE <span>↗</span></button></div> : <><p>The current game will be lost. The table will be set again.</p><button className="primary" onClick={() => { setModal(null); game.reset(true); }}>MAIN MENU <span>↗</span></button><button className="text-button" onClick={() => setModal(null)}>KEEP PLAYING</button></>}
    </Modal>}
  </main>;
}
