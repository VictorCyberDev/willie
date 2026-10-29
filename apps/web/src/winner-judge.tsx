import React,{useEffect,useRef,useState}from'react';
import{createRoot}from'react-dom/client';
import{accept,contribute,createDemo,evidence,prepare,type State}from'../../../packages/domain/src/index';
import{advanceRelay,createCommunityMark,createRelay,type CommunityMark,type Relay}from'../../../packages/winner/src/index';
import'./winner-judge.css';

type Step='COMMUNITY'|'MARK'|'DESTINATION'|'ARMED'|'ARRIVED'|'RECEIVE'|'PASSPORT';
const names:Record<string,string>={maya:'Maya',victor:'Victor',lex:'Lex'};

function initial(){const state=createDemo();return{state,relay:createRelay(state,{missionTarget:10},Date.now())};}
function label(value:string){return names[value]??value.replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase())}

function JudgeV2(){
 const first=useRef(initial());
 const[state,setState]=useState<State>(first.current.state),[relay,setRelay]=useState<Relay>(first.current.relay),[mark,setMark]=useState<CommunityMark|null>(null),[step,setStep]=useState<Step>('COMMUNITY'),[message,setMessage]=useState('A simulated Twitch community is ready to shape Willie.'),[hold,setHold]=useState(0);
 const timer=useRef<ReturnType<typeof setInterval>|null>(null),sequence=useRef(0);
 const handoff=state.handoff;
 useEffect(()=>()=>{if(timer.current)clearInterval(timer.current)},[]);
 function reset(){if(timer.current)clearInterval(timer.current);const next=initial();first.current=next;setState(next.state);setRelay(next.relay);setMark(null);setStep('COMMUNITY');setHold(0);setMessage('A simulated Twitch community is ready to shape Willie.');}
 function runCommunity(){let next=state;for(let i=0;i<72;i++)next=contribute(next,'judge-v2-'+(++sequence.current),'viewer-'+sequence.current,'!charge',Date.now()+i);setState(next);setRelay({...relay,currentWillieVersion:next.version});setStep('MARK');setMessage('72 simulated chat contributions changed Willie. Chat can influence the permanent mark, never custody.');}
 function approveMark(){const next=createCommunityMark({campaignId:state.campaignId,relayId:relay.id,willieId:state.willieId,community:state.custodian,creator:state.custodian,type:'SCAR',selectionMethod:'CHAT_VOTE_CREATOR_APPROVED',createdAt:Date.now(),willieVersion:state.version,passportChapterId:relay.id+':chapter:1'});setMark(next);setStep('DESTINATION');setMessage('Mutation Vote chose the Ember Scar. Maya explicitly approved the winning mark.');}
 function approveDestination(){setRelay({...relay,nextDestination:'victor'});setStep('ARMED');setMessage('Next Stop Vote chose Victor. Maya approved the destination; no custody changed.');}
 function arm(){const next=prepare(state,state.custodian,'victor',state.version,Date.now(),120000,'SIMULATED_JUDGE_REPLAY');setState(next);setStep('ARRIVED');setMessage('LOCK → COMPRESS. Willie is prepared. Waiting for simulated Twitch raid evidence.');}
 function raid(){if(!handoff)return;const next=evidence(state,'judge-v2-raid-'+(++sequence.current),handoff.source,handoff.destination,Date.now(),Date.now());setState(next);setStep('RECEIVE');setMessage('TRANSIT → ARRIVE → RECONSTRUCT. Matching simulated raid evidence arrived. Custody still belongs to Maya.');}
 function stopHold(){if(timer.current)clearInterval(timer.current);timer.current=null;setHold(0);}
 function receive(){const current=state.handoff;if(!current)return;const committedAt=Date.now(),next=accept(state,current.destination,state.version,committedAt);setState(next);setRelay(advanceRelay({...relay,currentWillieVersion:state.version},{destination:current.destination,newWillieVersion:next.version,committedAt}));setStep('PASSPORT');setMessage('RECEIVE → STAMP. Victor accepted. Relay, mark, progress and proof survived the handoff.');}
 function startHold(){if(step!=='RECEIVE'||timer.current)return;const started=performance.now();timer.current=setInterval(()=>{const elapsed=performance.now()-started;setHold(Math.min(1,elapsed/750));if(elapsed>=750){stopHold();receive();}},16);}
 const destination=relay.nextDestination??state.handoff?.destination??'victor';
 const progress=Math.round(state.progress);
 const phase=step==='COMMUNITY'?'SLEEPING':step==='MARK'||step==='DESTINATION'?'ALIVE':step==='ARMED'?'PREPARING':step==='ARRIVED'?'IN TRANSIT':step==='RECEIVE'?'AWAITING ACCEPTANCE':'RECEIVED';
 return <main className="judge-v2">
  <header className="judge-v2-header"><a href="/" className="judge-v2-wordmark">willie</a><div><b>SIMULATED WINNER RELEASE</b><span>JUDGE MODE V2 · NOT LIVE TWITCH</span></div><button onClick={reset}>Reset replay ↺</button></header>
  <section className="judge-v2-hero"><div className="judge-v2-copy"><p className="judge-signal">THE FIRST WILLIE RELAY</p><h1>Take Willie through <em>10 communities</em> without breaking the chain.</h1><p>One object. One current custodian. Every community can change the story; only the authority chain can change ownership.</p><div className="judge-authority"><span>COMMUNITY INFLUENCES</span><i>→</i><span>CREATOR AUTHORIZES</span><i>→</i><span>TWITCH VERIFIES</span><i>→</i><span>DESTINATION RECEIVES</span></div></div>
   <div className={'judge-object phase-'+step.toLowerCase()}><div className="judge-halo"/><div className="judge-shell">{Array.from({length:6},(_,i)=><span key={i} style={{'--i':i}as React.CSSProperties}/>) }<div className="judge-core" style={{opacity:.24+state.progress/140}}/>{mark&&<div className="judge-scar"/>}<strong>W / 007</strong></div><small>{phase}</small></div>
  </section>
  <section className="judge-dashboard">
   <div className="judge-metrics"><article><span>CURRENT COMMUNITY</span><strong>{label(state.custodian)}</strong></article><article><span>RELAY</span><strong>{relay.progress} / {relay.missionTarget}</strong></article><article><span>WILLIE ENERGY</span><strong>{progress}%</strong></article><article><span>PERMANENT MARK</span><strong>{mark?'EMBER SCAR':'—'}</strong></article></div>
   <div className="judge-story-panel"><div className="judge-step"><span>{String(['COMMUNITY','MARK','DESTINATION','ARMED','ARRIVED','RECEIVE','PASSPORT'].indexOf(step)+1).padStart(2,'0')} / 07</span><strong>{phase}</strong></div><p role="status" aria-live="polite">{message}</p>
    {step==='COMMUNITY'&&<button className="judge-primary" onClick={runCommunity}>Run chat contributions →</button>}
    {step==='MARK'&&<div className="judge-ritual"><div><span>MUTATION VOTE</span><strong>Ember Scar</strong><small>31 votes · simulated chat</small></div><button className="judge-primary" onClick={approveMark}>Approve Ember Scar →</button></div>}
    {step==='DESTINATION'&&<div className="judge-ritual"><div><span>NEXT STOP VOTE</span><strong>Victor</strong><small>44 votes · eligible simulated destination</small></div><button className="judge-primary" onClick={approveDestination}>Approve Victor as next stop →</button></div>}
    {step==='ARMED'&&<button className="judge-primary" onClick={arm}>Arm handoff →</button>}
    {step==='ARRIVED'&&<button className="judge-primary" onClick={raid}>Replay Twitch raid evidence →</button>}
    {step==='RECEIVE'&&<button className="judge-primary judge-hold" style={{'--hold':hold*100+'%'}as React.CSSProperties} onPointerDown={startHold} onPointerUp={stopHold} onPointerLeave={stopHold} onPointerCancel={stopHold} onKeyDown={event=>{if((event.key===' '||event.key==='Enter')&&!event.repeat){event.preventDefault();startHold();}}} onKeyUp={event=>{if(event.key===' '||event.key==='Enter')stopHold();}} aria-label="Hold to receive Willie for 750 milliseconds">Hold to Receive <b>{Math.round(hold*100)}%</b></button>}
    {step==='PASSPORT'&&<div className="judge-complete"><p>Nothing reset.</p><div><span>Relay</span><strong>{relay.progress} / {relay.missionTarget}</strong></div><div><span>Mark</span><strong>Ember Scar preserved</strong></div><div><span>Custody</span><strong>{label(state.custodian)}</strong></div><div><span>Version</span><strong>V{state.version}</strong></div></div>}
   </div>
  </section>
  <section className="judge-proof-grid">
   <article><span>COMMUNITY MARK</span><h2>{mark?'Ember Scar':'Waiting for community ritual'}</h2><p>{mark?'Deterministic signature '+mark.visualResult.signature+'. The mark remains attached after the handoff.':'Chat can influence the mark. The current creator must approve the result.'}</p></article>
   <article><span>NEXT DESTINATION</span><h2>{label(destination)}</h2><p>The vote records community preference. It does not prepare, verify or commit custody.</p></article>
   <article><span>PASSPORT CHAPTER</span><h2>{step==='PASSPORT'?'CHAPTER 01 — MAYA':'Opens after receive'}</h2><p>{step==='PASSPORT'?`${state.passport[0]?.contributionCount??72} people helped shape Willie. Maya sent Willie to Victor. Simulated Twitch raid evidence is preserved in the Receipt.`:'The human-readable chapter sits above the existing forensic Passport and Receipt.'}</p></article>
   <article><span>WATCH WILLIE</span><h2>{step==='PASSPORT'?'Follow the continuing story':'Waiting for committed custody'}</h2><p>The real public Watch route reads authoritative database state. This Judge replay intentionally does not masquerade as a live public Relay.</p>{step==='PASSPORT'&&<a href={'/willie/'+encodeURIComponent(state.willieId)}>Open truth-only Watch route ↗</a>}</article>
  </section>
  <section className="judge-receipt"><div><p className="judge-signal">TECHNICAL PROOF</p><h2>Same engine. Explicitly simulated evidence.</h2><p>Judge Mode V2 uses the deterministic custody engine for the replay, but labels its Twitch evidence as simulated. LIVE_ACCEPTED is reserved for genuine Twitch behavior.</p></div><pre>{state.receipts.length?JSON.stringify(state.receipts.at(-1),null,2):'Complete the handoff to generate the simulated Receipt.'}</pre></section>
  <footer><span>SIMULATED JUDGE REPLAY</span><strong>Twitch moves audiences. Willie gives them something worth following.</strong></footer>
 </main>
}
createRoot(document.getElementById('root')!).render(<JudgeV2/>);
