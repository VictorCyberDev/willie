import {describe,expect,it} from 'vitest';
import {accept,contribute,createDemo,evidence,joinMember,prepare} from '../packages/domain/src/index.js';
import {
  MARK_TYPES,
  advanceRelay,
  approveVote,
  assertRelayCurrent,
  castVote,
  chapterFromStamp,
  closeVote,
  createCommunityMark,
  createRelay,
  livingWillieState,
  openVote,
} from '../packages/winner/src/index.js';

function handoffOnce() {
  let state=createDemo();
  state=joinMember(state,'hector',1);
  state=prepare(state,'maya','victor',state.version,1000,120000,'TWITCH_NATIVE_RAID');
  state=evidence(state,'raid-1','maya','victor',1100,1200);
  state=accept(state,'victor',state.version,1300);
  return state;
}

describe('winner release relay',()=>{
  it('derives authoritative relay progress from custody history',()=>{
    const state=handoffOnce();
    const relay=createRelay(state,{},2000);
    expect(relay.title).toBe('THE FIRST WILLIE RELAY');
    expect(relay.communitiesVisited).toBe(2);
    expect(relay.successfulHandoffs).toBe(1);
    expect(relay.currentHolder).toBe('victor');
    expect(relay.currentWillieVersion).toBe(state.version);
    expect(()=>assertRelayCurrent(relay,state)).not.toThrow();
  });

  it('never regresses relay progress and requires exact next Willie version',()=>{
    const relay=createRelay(createDemo(),{missionTarget:3},100);
    const next=advanceRelay(relay,{destination:'victor',newWillieVersion:2,committedAt:200});
    expect(next.progress).toBeGreaterThanOrEqual(relay.progress);
    expect(next.successfulHandoffs).toBe(1);
    expect(()=>advanceRelay(next,{destination:'lex',newWillieVersion:2,committedAt:300})).toThrow('RELAY_VERSION_STALE');
    const complete=advanceRelay(next,{destination:'lex',newWillieVersion:3,committedAt:300});
    expect(complete.status).toBe('COMPLETED');
  });
});

describe('permanent community marks',()=>{
  it('is deterministic and replayable',()=>{
    const input={campaignId:'c',relayId:'r',willieId:'w',community:'maya',creator:'maya',type:'SCAR' as const,selectionMethod:'CHAT_VOTE_CREATOR_APPROVED' as const,createdAt:100,willieVersion:3,passportChapterId:'r:chapter:2'};
    const a=createCommunityMark(input),b=createCommunityMark({...input,createdAt:999});
    expect(a.id).toBe(b.id);
    expect(a.visualResult).toEqual(b.visualResult);
    expect(a.provenanceHash).toBe(b.provenanceHash);
  });
});

describe('community decision rituals',()=>{
  it('deduplicates voters, closes deterministically and requires creator approval',()=>{
    const session=openVote({campaignId:'c',relayId:'r',kind:'MUTATION',community:'maya',creator:'maya',willieVersion:2,candidates:[...MARK_TYPES].slice(0,3),opensAt:1000,closesAt:7000});
    let ballots=castVote(session,[],{voterKey:'u1',candidate:'SCAR',castAt:2000,providerEventId:'evt1'});
    ballots=castVote(session,ballots,{voterKey:'u2',candidate:'SCAR',castAt:2100,providerEventId:'evt2'});
    expect(()=>castVote(session,ballots,{voterKey:'u1',candidate:'BAND',castAt:2200})).toThrow('DUPLICATE_VOTE');
    const closed=closeVote(session,ballots,7000);
    expect(closed.winnerCandidate).toBe('SCAR');
    expect(()=>approveVote(closed,'viewer','SCAR',7001)).toThrow('CREATOR_APPROVAL_REQUIRED');
    expect(approveVote(closed,'maya','SCAR',7001).status).toBe('APPROVED');
  });

  it('uses bounded candidates and deterministic first-listed tie handling',()=>{
    const session=openVote({campaignId:'c',relayId:'r',kind:'NEXT_STOP',community:'maya',creator:'maya',willieVersion:1,candidates:['victor','lex'],opensAt:0,closesAt:5000});
    const ballots=castVote(session,[],{voterKey:'u1',candidate:'lex',castAt:1000});
    const closed=closeVote(session,ballots,5000);
    expect(closed.winnerCandidate).toBe('lex');
    expect(()=>openVote({...session,id:undefined as never,candidates:['a','a']} as never)).toThrow();
  });
});

describe('passport v2 and living Willie',()=>{
  it('creates a human chapter without changing forensic receipt truth',()=>{
    const state=handoffOnce(),relay=createRelay(state,{},2000);
    const first=chapterFromStamp({relay,stamp:state.passport[0],nextStamp:state.passport[1],receipt:state.receipts[0],chapterNumber:1});
    expect(first.community).toBe('maya');
    expect(first.nextDestination).toBe('victor');
    expect(first.providerVerification?.provider).toBe('twitch');
    expect(first.receiptId).toBe(state.receipts[0].receiptId);
  });

  it('maps authoritative domain state to narrative states',()=>{
    let state=createDemo();
    expect(livingWillieState(state)).toBe('SLEEPING');
    state=contribute(state,'c1','u1','!charge',1000);
    expect(livingWillieState(state)).toBe('ALIVE');
    state=prepare(state,'maya','victor',state.version,2000);
    expect(livingWillieState(state)).toBe('PREPARING');
  });
});
