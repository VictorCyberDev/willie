import WebSocket from 'ws';
import {TwitchEventSub, type TwitchNotice} from '../apps/server/src/eventsub.js';

const source=process.env.CLI_SOURCE_ID??'111';
const destination=process.env.CLI_DESTINATION_ID??'222';
const websocketUrl=process.env.TWITCH_CLI_WS_URL??'ws://127.0.0.1:8080/ws';
const waitMs=Number(process.env.CLI_WAIT_MS??30000);
const notices:TwitchNotice[]=[];

const fetcher:typeof fetch=async(input)=>{
 const url=String(input);
 if(url==='https://id.twitch.tv/oauth2/validate')return new Response(JSON.stringify({client_id:'willie-cli-acceptance',user_id:source,login:'willie-source',scopes:['user:read:chat']}),{status:200,headers:{'content-type':'application/json'}});
 // The Twitch CLI mock server v1.1.24 does not expose every subscription type Willie requests
 // (notably chat/shared-chat). Subscription creation is already contract-tested separately; this
 // harness exercises the real Willie WebSocket parser/transport against the official CLI server.
 if(url==='https://api.twitch.tv/helix/eventsub/subscriptions')return new Response('{}',{status:202,headers:{'content-type':'application/json'}});
 throw new Error('UNEXPECTED_FETCH '+url);
};

async function main(){
 const transport=new TwitchEventSub({
  clientId:'willie-cli-acceptance',clientSecret:'not-used',userId:source,
  token:{access_token:'cli-token',refresh_token:'cli-refresh',expires_at:Date.now()+3600000},
  fetcher,socketFactory:()=>new WebSocket(websocketUrl),random:()=>0,validationIntervalMs:3600000,
  onToken:async()=>{},onNotice:async notice=>{notices.push(notice);console.log('NOTICE',JSON.stringify(notice));},
  onGap:async()=>console.log('GAP'),onRevoked:async()=>console.log('REVOKED'),
 });
 try{
  await transport.start();
  const deadline=Date.now()+8000;
  while(transport.health!=='HEALTHY'&&Date.now()<deadline)await new Promise(resolve=>setTimeout(resolve,50));
  if(transport.health!=='HEALTHY')throw new Error('CLI_TRANSPORT_NOT_HEALTHY');
  console.log('CLI_READY',JSON.stringify({health:transport.health,source,destination,websocketUrl}));
  await new Promise(resolve=>setTimeout(resolve,waitMs));
  const raid=notices.find(n=>n.type==='channel.raid'&&n.event.from_broadcaster_user_id===source&&n.event.to_broadcaster_user_id===destination);
  console.log('CLI_RESULT',JSON.stringify({health:transport.health,noticeCount:notices.length,raid:raid??null}));
  if(!raid)throw new Error('CLI_RAID_NOT_OBSERVED');
 }finally{await transport.stop();}
}

void main().catch(error=>{console.error(error);process.exitCode=1;});
