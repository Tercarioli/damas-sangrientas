import { useEffect, useRef, useState } from 'react';
import { same, type Board, type Position } from '../game/types';
import { drawBoard, drawHints } from '../render/board';
import { BOARD_HEIGHT, BOARD_WIDTH, cellButtonStyle, cellClip, unproject } from '../render/projection';
import type { Animation } from '../game/useGame';
type Props = { board: Board; selectable: Position[]; selected: Position | null; targets: Position[]; capture: boolean; animation: Animation; blood: number; effects: string; shockAt: number; onSquare: (p: Position) => void; enabled: boolean };
export function BoardView(props: Props) {
  const art=useRef<HTMLCanvasElement>(null),hints=useRef<HTMLCanvasElement>(null),ghost=useRef<HTMLCanvasElement>(null);
  const [focus,setFocus]=useState<Position>({row:5,col:0});
  const [keyboard,setKeyboard]=useState(false);
  useEffect(()=>{
    const a=art.current?.getContext('2d'),h=hints.current?.getContext('2d');if(!a||!h)return;
    a.setTransform(.5,0,0,.5,0,0);h.setTransform(.5,0,0,.5,0,0);let id=0;
    const frame=(now:number)=>{
      const motion=props.animation?{move:props.animation.move,progress:Math.max(0,Math.min(1,(now-props.animation.start)/props.animation.duration))}:null;
      drawBoard(a,props.board,props.selected,motion,now);
      const double=ghost.current?.getContext('2d');if(double&&art.current){double.clearRect(0,0,BOARD_WIDTH/2,BOARD_HEIGHT/2);double.drawImage(art.current,0,0);}
      drawHints(h,props.selected,props.enabled?props.targets:[],props.capture,props.blood,props.effects,now);
      id=requestAnimationFrame(frame);
    };id=requestAnimationFrame(frame);return()=>cancelAnimationFrame(id);
  },[props]);
  const severity=props.effects==='OFF'?0:(100-props.blood)/100*(props.effects==='REDUCED'?.35:1);
  const shock=props.effects!=='OFF'&&props.shockAt>0&&performance.now()-props.shockAt<780;
  const onKey=(event:React.KeyboardEvent<HTMLDivElement>)=>{
    const d:Record<string,number[]>={ArrowUp:[-1,0],ArrowDown:[1,0],ArrowLeft:[0,-1],ArrowRight:[0,1]};
    if(d[event.key]){event.preventDefault();setKeyboard(true);const [dr,dc]=d[event.key];setFocus(p=>({row:Math.max(0,Math.min(7,p.row+dr)),col:Math.max(0,Math.min(7,p.col+dc))}));}
    else if(event.key==='Enter'||event.key===' '){event.preventDefault();if(props.enabled)props.onSquare(focus);}
  };
  return <div className={`board-shell ${shock?'shock':''}`}>
    <div className={`board-canvas ${props.enabled?'enabled':''}`} role="group" tabIndex={0} aria-label={`Perspective checkers board. Arrow keys navigate, Enter selects. Focus ${'ABCDEFGH'[focus.col]}${8-focus.row}. ${props.enabled?'Your turn.':'Please wait.'}`} onKeyDown={onKey}
      onClick={e=>{setKeyboard(false);const rect=e.currentTarget.getBoundingClientRect(),p=unproject((e.clientX-rect.left)/rect.width*BOARD_WIDTH,(e.clientY-rect.top)/rect.height*BOARD_HEIGHT);if(p&&props.enabled){setFocus(p);props.onSquare(p);}}}>
      <canvas className="board-art" ref={art} width={BOARD_WIDTH/2} height={BOARD_HEIGHT/2} style={{filter:`blur(${Math.max(0,severity-.3)*.85}px) saturate(${1-severity*.3})`}}/>
      {severity>.72&&<canvas className="double-vision" ref={ghost} width={BOARD_WIDTH/2} height={BOARD_HEIGHT/2} aria-hidden="true"/>}
      <canvas className="board-hints" ref={hints} width={BOARD_WIDTH/2} height={BOARD_HEIGHT/2}/>
      <div className="square-grid" aria-label="Board squares">{props.board.flatMap((row,r)=>row.map((piece,c)=>{
        const p={row:r,col:c},target=props.enabled&&props.targets.some(t=>same(t,p)),selectable=props.selectable.some(t=>same(t,p));
        const name=`${'ABCDEFGH'[c]}${8-r}, ${piece?`${piece.player==='human'?'your':'Keeper'} ${piece.king?'king':'man'}`:'empty'}${target?props.capture?', legal capture':', legal move':selectable&&!props.animation?', selectable':''}`;
        return <button key={`${r}-${c}`} tabIndex={-1} disabled={!props.enabled} aria-label={name} style={cellButtonStyle(r,c)} onClick={e=>{e.stopPropagation();setKeyboard(false);setFocus(p);props.onSquare(p);}}/>;
      }))}</div>
      {keyboard&&<div className="keyboard-square" style={{clipPath:cellClip(focus.row,focus.col)}}/>}
    </div>
  </div>;
}
