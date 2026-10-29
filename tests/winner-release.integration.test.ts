import {afterAll,beforeAll,expect,it} from 'vitest';
import {randomUUID} from 'node:crypto';
import {createPool,migrate,Repository} from '../packages/db/src/index.js';
import {accept,contribute,evidence,initializeCampaign,joinMember,prepare} from '../packages/domain/src/index.js';
import {chapterFromStamp,createCommunityMark,createRelay} from '../packages/winner/src/index.js';

const url=process.env.TEST_DATABASE_URL;if(!url)throw new Error('TEST_DATABASE_URL must point to an isolated disposable Willie test database');
const pool=createPool(url),repo=new Repository(pool);const id='winner-'+randomUUID();
beforeAll(async()=>{await migrate(pool);},30000);afterAll(async()=>{await pool.end();});

it('persists relay progress, chapter memory and permanent marks across a real domain handoff',async()=>{
 let state=initializeCampaign({campaignId:id,willieId:'007-'+id,custodianId:'source-'+id,profile:{platform:'twitch',platformUserId:'source-'+id,displayName:'Source'},now:100,name:'Relay fixture'});
 state=joinMember(state,'dest-'+id,101,'twitch',{platform:'twitch',platformUserId:'dest-'+id,displayName:'Destination'});await repo.create(state);
 const relay=createRelay(state,{missionTarget:3},200),chapter=chapterFromStamp({relay,stamp:state.passport[0],chapterNumber:1});
 await pool.query(`INSERT INTO relays(id,campaign_id,willie_id,title,mission,origin,current_holder,mission_target,progress,communities_visited,successful_handoffs,status,started_at,current_willie_version,data) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,[relay.id,id,relay.willieId,relay.title,relay.mission,relay.origin,relay.currentHolder,relay.missionTarget,relay.progress,relay.communitiesVisited,relay.successfulHandoffs,relay.status,relay.startedAt,relay.currentWillieVersion,JSON.stringify(relay)]);
 await pool.query(`INSERT INTO passport_chapters(id,campaign_id,relay_id,chapter_number,community_id,creator_id,arrival_at,contribution_count,before_version,clip_status,data) VALUES($1,$2,$3,1,$4,$4,$5,0,$6,'UNAVAILABLE',$7)`,[chapter.id,id,relay.id,state.custodian,chapter.arrivalAt,chapter.willieBefore,JSON.stringify(chapter)]);
 state=await repo.mutate(id,1,x=>contribute(x,'chat-'+id,'viewer-'+id,'!charge',1000));
 expect((await pool.query('SELECT contribution_count FROM passport_chapters WHERE id=$1',[chapter.id])).rows[0].contribution_count).toBe(1);
 const mark=createCommunityMark({campaignId:id,relayId:relay.id,willieId:state.willieId,community:state.custodian,creator:state.custodian,type:'SCAR',selectionMethod:'CREATOR_SELECTED',createdAt:1100,willieVersion:state.version,passportChapterId:chapter.id});
 await pool.query(`INSERT INTO community_marks(id,campaign_id,relay_id,willie_id,community_id,creator_id,mark_type,visual_result,selection_method,created_at,willie_version,passport_chapter_id,provenance_hash) VALUES($1,$2,$3,$4,$5,$5,$6,$7,$8,$9,$10,$11,$12)`,[mark.id,id,relay.id,state.willieId,state.custodian,mark.type,JSON.stringify(mark.visualResult),mark.selectionMethod,mark.createdAt,mark.willieVersion,chapter.id,mark.provenanceHash]);
 await pool.query('UPDATE passport_chapters SET mark_id=$2 WHERE id=$1',[chapter.id,mark.id]);
 state=await repo.mutate(id,1,x=>prepare(x,x.custodian,'dest-'+id,x.version,2000,120000,'TWITCH_NATIVE_RAID'));
 state=await repo.mutate(id,1,x=>evidence(x,'raid-'+id,'source-'+id,'dest-'+id,2100,2200));
 state=await repo.mutate(id,1,x=>accept(x,'dest-'+id,x.version,2300));
 const persisted=await pool.query('SELECT current_holder,current_willie_version,successful_handoffs,communities_visited,progress FROM relays WHERE id=$1',[relay.id]);
 expect(persisted.rows[0]).toMatchObject({current_holder:'dest-'+id,current_willie_version:2,successful_handoffs:1,communities_visited:2,progress:2});
 const chapters=await pool.query('SELECT chapter_number,community_id,mark_id,receipt_id FROM passport_chapters WHERE relay_id=$1 ORDER BY chapter_number',[relay.id]);
 expect(chapters.rows).toHaveLength(2);expect(chapters.rows[0].mark_id).toBe(mark.id);expect(chapters.rows[0].receipt_id).toBeTruthy();expect(chapters.rows[1].community_id).toBe('dest-'+id);
 const restarted=createPool(url!);try{expect((await restarted.query('SELECT count(*)::int count FROM community_marks WHERE relay_id=$1',[relay.id])).rows[0].count).toBe(1);expect((await restarted.query('SELECT count(*)::int count FROM passport_chapters WHERE relay_id=$1',[relay.id])).rows[0].count).toBe(2);}finally{await restarted.end();}
});
