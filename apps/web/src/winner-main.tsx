import React,{useEffect,useState}from'react';
import{createRoot}from'react-dom/client';
import'./winner.css';

type LivingState='SLEEPING'|'WAKING'|'ALIVE'|'CHARGING'|'READY'|'PREPARING'|'IN_TRANSIT'|'ARRIVED'|'AWAITING_ACCEPTANCE'|'RECEIVED'|'PAUSED'|'RECOVERING'|'EVOLVED';
type Relay={id:string;title:string;mission:string;origin:string;currentHolder:string;missionTarget:number;progress:number;communitiesVisited:number;successfulHandoffs:number;status:string;startedAt:number;completedAt?:number;currentWillieVersion:number;nextDestination?:string};
type Mark={id:string;mark_type:string;visual_result:{signature?:string;variant?:number;intensity?:number;orientation?:number};community_id:string;creator_id:string;created_at:number;willie_version:number;provenance_hash:string};
type Chapter={id:string;chapterNumber:number;community:string;creator:string;arrivalAt:number;departureAt?:number;whatCommunityAdded?:string;participationMetric:number;willieBefore:number;willieAfter?:number;markId?:string;relayProgress:number;nextDestination?:string;providerVerification?:{provider:string;evidenceClass:string;providerEventId:string};receiptId?:string;clipStatus?:string;clipUrl?:string};
type Story={willie:{id:string;version:number;livingState:LivingState;progress:number;currentHolder:string;paused:boolean};relay:Relay;metrics:{communitiesVisited:number;contributors:number;successfulHandoffs:number;marks:number;chapters:number;ageMs:number};marks:Mark[];chapters:Chapter[]};

const narrative:Record<LivingState,{kicker:string;title:string;body:string}>={
 SLEEPING:{kicker:'QUIET / READY TO BEGIN',title:'Willie is waiting for a community.',body:'The story begins when a community starts shaping the object.'},
 WAKING:{kicker:'COMMUNITY ENERGY',title:'Willie is waking.',body:'Participation is changing the object without changing custody.'},
 ALIVE:{kicker:'LIVE WITH THIS COMMUNITY',title:'Willie is alive here.',body:'Every contribution adds to a story that survives the next handoff.'},
 CHARGING:{kicker:'MISSION IN MOTION',title:'This community is changing Willie.',body:'Energy, progress and permanent marks accumulate without resetting.'},
 READY:{kicker:'READY FOR THE NEXT CHAPTER',title:'Willie can travel when the creator decides.',body:'Community influence never becomes custody authority.'},
 PREPARING:{kicker:'WILLIE WON’T JUMP YET',title:'Waiting for Twitch to verify the raid.',body:'The destination is planned, but Willie still belongs to the current creator.'},
 IN_TRANSIT:{kicker:'LOCK → COMPRESS → TRANSIT',title:'Willie is in transit.',body:'Provider evidence is being checked before the object can arrive.'},
 ARRIVED:{kicker:'ARRIVE → RECONSTRUCT',title:'Willie arrived at the destination.',body:'Arrival still does not transfer custody. The destination must explicitly receive.'},
 AWAITING_ACCEPTANCE:{kicker:'WILLIE ARRIVED',title:'The receiving creator must accept custody.',body:'Verified Twitch evidence is present. The chain only continues after Hold to Receive.'},
 RECEIVED:{kicker:'RECEIVE → STAMP',title:'A new chapter is live.',body:'Custody committed. Progress, marks and Passport memory survived intact.'},
 PAUSED:{kicker:'SAFE PAUSE',title:'Willie stopped without changing hands.',body:'The system froze the transition rather than guessing.'},
 RECOVERING:{kicker:'WILLIE STOPPED MID-JOURNEY',title:'No custody changed.',body:'Provider continuity was interrupted. Willie stays with the last verified owner while recovery completes.'},
 EVOLVED:{kicker:'MISSION ENERGY MAXED',title:'Willie evolved without resetting.',body:'The artifact carries the visible history of every community that helped build it.'},
};

function display(value:string){return value.replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase())}
function relative(ms:number){const h=Math.floor(ms/3_600_000);if(h<1)return'< 1 hour';const d=Math.floor(h/24);return d?`${d}d ${h%24}h`:`${h}h`}
function ensureMeta(title:string,description:string){document.title=title;let meta=document.querySelector('meta[property="og:title"]')as HTMLMetaElement|null;if(meta)meta.content=title;meta=document.querySelector('meta[property="og:description"]')as HTMLMetaElement|null;if(meta)meta.content=description;}

function LivingWillie({state,progress,marks=[],stage=false}:{state:LivingState;progress:number;marks?:Mark[];stage?:boolean}){
 const shown=marks.slice(-5);
 return <div className={`living-willie state-${state.toLowerCase()} ${stage?'is-stage':''}`} role="img" aria-label={`Willie ${display(state)}, ${Math.round(progress)} percent mission energy`}>
  <div className="willie-halo"/><div className="willie-shell">
   {Array.from({length:6},(_,i)=><div className="willie-segment" key={i} style={{'--segment':i}as React.CSSProperties}><span/></div>)}
   <div className="willie-core" style={{'--energy':Math.max(.08,progress/100)}as React.CSSProperties}/>
   <div className="willie-id">W / 007</div>
   {shown.map((mark,index)=><i key={mark.id} className={`permanent-mark mark-${mark.mark_type.toLowerCase()}`} style={{'--mark-index':index,'--mark-angle':`${mark.visual_result?.orientation??index*47}deg`}as React.CSSProperties} aria-hidden="true"/>)}
  </div><div className="willie-floor"/>
 </div>
}

function Header(){return <header className="winner-header"><a className="winner-wordmark" href="/">willie<span>CONTINUING STORY</span></a><nav><a href="/judge">Judge replay</a><a href="/app" className="winner-nav-cta">Creator console ↗</a></nav></header>}

function Landing(){useEffect(()=>ensureMeta('Willie — One live thing. Many communities. One continuing story.','A persistent social object that Twitch communities shape together and safely pass between live streams.'),[]);return <><Header/><main>
 <section className="winner-hero"><div className="hero-copy-winner"><p className="signal"><i/> TWITCH-NATIVE PERSISTENT SOCIAL OBJECT</p><h1>One live thing.<br/><em>Many communities.</em><br/>One continuing story.</h1><p className="lead">Willie is a living artifact that Twitch communities build together. Chat changes it. Communities mark it. Creators safely pass it forward. Nothing resets.</p><div className="hero-actions-winner"><a className="winner-button" href="/judge">Experience the handoff →</a><a href="/app" className="winner-link">Start a Relay ↗</a></div><div className="truth-line"><span>COMMUNITY INFLUENCES</span><b>→</b><span>CREATOR AUTHORIZES</span><b>→</b><span>TWITCH VERIFIES</span><b>→</b><span>DESTINATION RECEIVES</span></div></div>
 <div className="hero-object-winner"><LivingWillie state="ALIVE" progress={58}/><div className="object-label"><span>THE FIRST WILLIE RELAY</span><strong>Take Willie through 10 Twitch communities without breaking the chain.</strong><small>MISSION PREVIEW — LIVE COUNTERS APPEAR ONLY AFTER A RELAY IS COMMISSIONED</small></div></div></section>
 <section className="winner-story"><p className="signal">THE DIFFERENCE</p><h2>Follow the object,<br/>not only the creator.</h2><div className="story-grid"><article><span>01</span><h3>Shape it.</h3><p>Chat contributes to Willie’s energy and helps choose a permanent community mark.</p></article><article><span>02</span><h3>Send it.</h3><p>The community can influence the next stop. The creator still authorizes the journey.</p></article><article><span>03</span><h3>Verify it.</h3><p>A real Twitch raid is evidence of movement. It never auto-transfers custody.</p></article><article><span>04</span><h3>Remember it.</h3><p>Passport Chapters preserve what each community added and where Willie went next.</p></article></div></section>
 <section className="winner-statement"><p>TWITCH MOVES AUDIENCES.</p><h2>Willie gives them something worth following.</h2><a className="winner-button secondary" href="/judge">Run the explicit simulated replay →</a></section>
 </main><footer className="winner-footer"><span>WILLIE / 2026</span><span>ONE OBJECT · ONE CUSTODIAN · ONE CONTINUING STORY</span></footer></>}

function useStory(id:string){const[data,setData]=useState<Story|null>(null),[status,setStatus]=useState<'loading'|'ready'|'missing'>('loading');useEffect(()=>{let alive=true;setStatus('loading');fetch('/api/willie/'+encodeURIComponent(id)+'/story').then(async r=>{if(!r.ok)throw new Error(String(r.status));const value=await r.json()as Story;if(alive){setData(value);setStatus('ready')}}).catch(()=>{if(alive){setData(null);setStatus('missing')}});return()=>{alive=false}},[id]);return{data,status}}

function ChapterCard({chapter,index}:{chapter:Chapter;index:number}){return <article className="chapter-card"><div className="chapter-index">CHAPTER {String(chapter.chapterNumber??index+1).padStart(2,'0')}</div><h3>{display(chapter.community??'Community')}</h3><p>{chapter.participationMetric??0} people helped shape Willie in this chapter.</p>{chapter.whatCommunityAdded&&<strong>{chapter.whatCommunityAdded}</strong>}<dl><div><dt>Willie arrived</dt><dd>V{chapter.willieBefore??'—'}</dd></div><div><dt>Next stop</dt><dd>{chapter.nextDestination?display(chapter.nextDestination):'Still here'}</dd></div><div><dt>Proof</dt><dd>{chapter.providerVerification?.provider?display(chapter.providerVerification.provider):chapter.receiptId?'Verified':'Open chapter'}</dd></div></dl>{chapter.clipStatus==='AVAILABLE'&&chapter.clipUrl&&<a href={chapter.clipUrl} target="_blank" rel="noreferrer">Watch moment ↗</a>}</article>}

function Watch({stage=false}:{stage?:boolean}){const id=stage?(new URLSearchParams(location.search).get('willie')??''):decodeURIComponent(location.pathname.split('/')[2]??''),{data,status}=useStory(id);useEffect(()=>ensureMeta(id?`Willie ${id} — Follow the object`:'Willie — Stage Mode','Watch where Willie goes next and see the communities that changed it.'),[id]);
 if(!id)return <><Header/><main className="watch-empty"><p className="signal">STAGE MODE</p><h1>Waiting for a commissioned Relay.</h1><p>Open Stage Mode with <code>?willie=&lt;id&gt;</code>. No counters are invented before authoritative state exists.</p></main></>;
 if(status==='loading')return <><Header/><main className="watch-empty"><p className="signal">FOLLOW THE OBJECT</p><h1>Finding Willie…</h1></main></>;
 if(status==='missing'||!data)return <><Header/><main className="watch-empty"><p className="signal">NO AUTHORITATIVE RELAY FOUND</p><h1>Willie {id} is not public yet.</h1><p>This page refuses to invent a journey. Commission a Relay from the creator console, then return here.</p><a className="winner-button" href="/app">Open creator console →</a></main></>;
 const n=narrative[data.willie.livingState]??narrative.ALIVE;
 if(stage)return <main className="stage-mode"><div className="stage-top"><span>WILLIE {data.willie.id}</span><b>{display(data.willie.livingState)}</b></div><div className="stage-grid"><LivingWillie state={data.willie.livingState} progress={data.willie.progress} marks={data.marks} stage/><div className="stage-copy"><p className="signal">{n.kicker}</p><h1>{n.title}</h1><p>{data.relay.mission}</p><div className="stage-progress"><span>RELAY</span><strong>{data.relay.progress} / {data.relay.missionTarget}</strong><i><b style={{width:`${Math.min(100,data.relay.progress/data.relay.missionTarget*100)}%`}}/></i></div><div className="stage-destination"><span>CURRENT COMMUNITY</span><strong>{display(data.relay.currentHolder)}</strong>{data.relay.nextDestination&&<small>NEXT → {display(data.relay.nextDestination)}</small>}</div></div></div></main>;
 return <><Header/><main className="watch-page"><section className="watch-hero"><div className="watch-copy"><p className="signal">WATCH WHERE WILLIE GOES NEXT</p><h1>WILLIE <em>{data.willie.id}</em></h1><p className="current-community">LIVE WITH <strong>{display(data.relay.currentHolder)}</strong></p><div className="narrative-card"><span>{n.kicker}</span><h2>{n.title}</h2><p>{n.body}</p></div></div><LivingWillie state={data.willie.livingState} progress={data.willie.progress} marks={data.marks}/></section>
 <section className="relay-strip"><div><span>MISSION</span><strong>{data.relay.mission}</strong></div><div><span>PROGRESS</span><strong>{data.relay.progress} / {data.relay.missionTarget}</strong></div><div><span>COMMUNITIES</span><strong>{data.metrics.communitiesVisited}</strong></div><div><span>CONTRIBUTORS</span><strong>{data.metrics.contributors}</strong></div><div><span>AGE</span><strong>{relative(data.metrics.ageMs)}</strong></div></section>
 <section className="watch-section"><div className="section-heading"><p className="signal">PERMANENT COMMUNITY MARKS</p><h2>Every community leaves evidence on the object.</h2></div>{data.marks.length?<div className="marks-ledger">{data.marks.map(mark=><article key={mark.id}><i className={`mark-swatch mark-${mark.mark_type.toLowerCase()}`}/><div><span>{display(mark.mark_type)}</span><strong>{display(mark.community_id)}</strong><small>WILLIE V{mark.willie_version} · {mark.provenance_hash.slice(0,10)}</small></div></article>)}</div>:<p className="empty-truth">No permanent mark has been committed yet.</p>}</section>
 <section className="watch-section passport-v2"><div className="section-heading"><p className="signal">PASSPORT</p><h2>A human story with forensic proof underneath.</h2></div><div className="chapters-grid">{data.chapters.map((chapter,index)=><ChapterCard chapter={chapter} index={index} key={chapter.id??index}/>)}</div></section>
 </main><footer className="winner-footer"><span>FOLLOW THE OBJECT</span><span>Twitch moves audiences. Willie gives them something worth following.</span></footer></>}

function App(){const path=location.pathname;if(path==='/stage')return <Watch stage/>;if(path.startsWith('/willie/'))return <Watch/>;return <Landing/>}
createRoot(document.getElementById('root')!).render(<App/>);
