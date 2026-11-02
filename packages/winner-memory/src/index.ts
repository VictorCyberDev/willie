import {canonical, sha256} from '../../domain/src/index.js';

export type ClipMemoryStatus='UNAVAILABLE'|'REQUESTED'|'PENDING'|'AVAILABLE'|'FAILED';
export interface ClipMemory{
  id:string;
  campaignId:string;
  relayId:string;
  chapterId:string;
  broadcasterId:string;
  twitchClipId?:string;
  status:ClipMemoryStatus;
  requestedAt:number;
  resolvedAt?:number;
  url?:string;
  errorCode?:string;
}

export function clipMemoryId(input:{campaignId:string;relayId:string;chapterId:string;broadcasterId:string}):string{
  return 'clip_'+sha256(canonical(input)).slice(0,24);
}

export function requestedClipMemory(input:{campaignId:string;relayId:string;chapterId:string;broadcasterId:string;twitchClipId:string;requestedAt:number}):ClipMemory{
  if(!input.twitchClipId||!Number.isFinite(input.requestedAt))throw new Error('INVALID_CLIP_MEMORY');
  return {...input,id:clipMemoryId(input),status:'PENDING'};
}

export function safeTwitchClipUrl(value:string):string{
  const url=new URL(value);
  const host=url.hostname.toLowerCase();
  if(url.protocol!=='https:'||!(host==='clips.twitch.tv'||host==='www.twitch.tv'||host==='twitch.tv'))throw new Error('INVALID_TWITCH_CLIP_URL');
  return url.toString();
}

export function availableClipMemory(memory:ClipMemory,url:string,resolvedAt:number):ClipMemory{
  if(memory.status!=='PENDING'&&memory.status!=='REQUESTED')throw new Error('INVALID_CLIP_STATE');
  if(!Number.isFinite(resolvedAt)||resolvedAt<memory.requestedAt)throw new Error('INVALID_TIME');
  return {...memory,status:'AVAILABLE',url:safeTwitchClipUrl(url),resolvedAt,errorCode:undefined};
}

export function failedClipMemory(memory:ClipMemory,errorCode:string,resolvedAt:number):ClipMemory{
  if(memory.status==='AVAILABLE')throw new Error('INVALID_CLIP_STATE');
  if(!errorCode||!Number.isFinite(resolvedAt)||resolvedAt<memory.requestedAt)throw new Error('INVALID_CLIP_FAILURE');
  return {...memory,status:'FAILED',resolvedAt,errorCode,url:undefined};
}

export interface LegacyArtifact{
  title:string;
  willieId:string;
  chapterNumber:number;
  community:string;
  mark?:{id:string;type:string;signature?:string};
  contributors:number;
  sentTo?:string;
  currentHolder:string;
  chapterUrl:string;
  journeyUrl:string;
}

export function createLegacyArtifact(input:{
  willieId:string;
  chapterNumber:number;
  community:string;
  contributors:number;
  sentTo?:string;
  currentHolder:string;
  mark?:{id:string;type:string;signature?:string};
}):LegacyArtifact{
  if(!input.willieId||!input.community||!input.currentHolder||!Number.isSafeInteger(input.chapterNumber)||input.chapterNumber<1||!Number.isSafeInteger(input.contributors)||input.contributors<0)throw new Error('INVALID_LEGACY_ARTIFACT');
  const encoded=encodeURIComponent(input.willieId);
  return {...input,title:`WE CARRIED WILLIE #${input.willieId}`,chapterUrl:`/legacy/${encoded}/${input.chapterNumber}`,journeyUrl:`/willie/${encoded}`};
}
