import{describe,expect,it}from'vitest';
import{createDemo,hash}from'../packages/domain/src/index.js';
import{availableClipMemory,createLegacyArtifact,failedClipMemory,requestedClipMemory,safeTwitchClipUrl}from'../packages/winner-memory/src/index.js';

describe('Twitch clip memory',()=>{
 it('keeps clip failure isolated from authoritative Willie custody',()=>{
  const state=createDemo(),before=hash(state),clip=requestedClipMemory({campaignId:state.campaignId,relayId:'relay-1',chapterId:'chapter-1',broadcasterId:state.custodian,twitchClipId:'clip-1',requestedAt:1000}),failed=failedClipMemory(clip,'TWITCH_CLIP_NOT_AVAILABLE',61_000);
  expect(failed.status).toBe('FAILED');expect(hash(state)).toBe(before);expect(state.custodian).toBe('maya');expect(state.version).toBe(1);
 });
 it('accepts only HTTPS Twitch clip URLs',()=>{
  expect(safeTwitchClipUrl('https://clips.twitch.tv/ExampleSlug')).toContain('clips.twitch.tv');
  const clip=requestedClipMemory({campaignId:'c',relayId:'r',chapterId:'ch',broadcasterId:'u',twitchClipId:'id',requestedAt:1});
  expect(availableClipMemory(clip,'https://www.twitch.tv/user/clip/Example',2).status).toBe('AVAILABLE');
  expect(()=>safeTwitchClipUrl('https://example.com/fake')).toThrow('INVALID_TWITCH_CLIP_URL');
 });
});

describe('community legacy',()=>{
 it('derives a share artifact that points back to the continuing object',()=>{
  const legacy=createLegacyArtifact({willieId:'007',chapterNumber:7,community:'maya',contributors:412,sentTo:'hector',currentHolder:'ana',mark:{id:'m7',type:'SCAR',signature:'ember'}});
  expect(legacy.title).toBe('WE CARRIED WILLIE #007');expect(legacy.chapterUrl).toBe('/legacy/007/7');expect(legacy.journeyUrl).toBe('/willie/007');expect(legacy.sentTo).toBe('hector');
 });
});
