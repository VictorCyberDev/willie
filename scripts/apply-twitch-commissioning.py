from pathlib import Path

# Apply the exact Twitch production commissioning changes tested in the Willie build sandbox.
p = Path("apps/server/src/app.ts")
s = p.read_text()
s = s.replace(
    "import {TwitchEventSub,type TwitchToken} from './eventsub.js';",
    "import {TwitchEventSub,type TwitchToken} from './eventsub.js';\nimport {registerTwitchWebhookSubscriptions} from './twitch-webhook.js';",
)

old = """ async function connectCreator(uid:string,token:TwitchToken,scope:string[]=[]){if(!pool||!env.TWITCH_CLIENT_ID||!env.TWITCH_CLIENT_SECRET||!env.TOKEN_ENCRYPTION_KEY)return;
 await transports.get(uid)?.stop();await freezeCreator(uid);
 const transport=new TwitchEventSub({clientId:env.TWITCH_CLIENT_ID,clientSecret:env.TWITCH_CLIENT_SECRET,userId:uid,token,fetcher,optionalScopes:scope,socketFactory:options.socketFactory?(url=>options.socketFactory!(uid,url)):undefined,
 onToken:async next=>{await pool.query('UPDATE provider_connections SET encrypted_token=$3 WHERE user_id=$1 AND provider=$2',[uid,'twitch',JSON.stringify(encrypt({...next,scope},env.TOKEN_ENCRYPTION_KEY!))]);},
 onNotice:async notice=>{if(safetyPending.has(uid))await freezeCreator(uid);await ingest(notice.id,notice.timestamp,notice.type,notice.event);},
 onGap:()=>freezeCreator(uid),onRevoked:()=>freezeCreator(uid,true)});
 transports.set(uid,transport);await transport.start();
 }
"""
new = """ async function connectCreator(uid:string,token:TwitchToken,scope:string[]=[]){if(!pool||!env.TWITCH_CLIENT_ID||!env.TWITCH_CLIENT_SECRET||!env.TOKEN_ENCRYPTION_KEY)return;
 await transports.get(uid)?.stop();transports.delete(uid);await freezeCreator(uid);
 if(env.NODE_ENV==='production'&&env.TWITCH_WEBHOOK_SECRET){await registerTwitchWebhookSubscriptions({clientId:env.TWITCH_CLIENT_ID,clientSecret:env.TWITCH_CLIENT_SECRET,callbackUrl:base+'/api/twitch/eventsub',webhookSecret:env.TWITCH_WEBHOOK_SECRET,fetcher},uid);return;}
 const transport=new TwitchEventSub({clientId:env.TWITCH_CLIENT_ID,clientSecret:env.TWITCH_CLIENT_SECRET,userId:uid,token,fetcher,optionalScopes:scope,socketFactory:options.socketFactory?(url=>options.socketFactory!(uid,url)):undefined,
 onToken:async next=>{await pool.query('UPDATE provider_connections SET encrypted_token=$3 WHERE user_id=$1 AND provider=$2',[uid,'twitch',JSON.stringify(encrypt({...next,scope},env.TOKEN_ENCRYPTION_KEY!))]);},
 onNotice:async notice=>{if(safetyPending.has(uid))await freezeCreator(uid);await ingest(notice.id,notice.timestamp,notice.type,notice.event);},
 onGap:()=>freezeCreator(uid),onRevoked:()=>freezeCreator(uid,true)});
 transports.set(uid,transport);await transport.start();
 }
 async function twitchTransportHealthy(uid:string){if(env.NODE_ENV==='production'&&env.TWITCH_WEBHOOK_SECRET){if(!pool)return false;const connected=await pool.query(\"SELECT 1 FROM provider_connections WHERE user_id=$1 AND provider='twitch' AND status='CONNECTED'\",[uid]);return Boolean(connected.rowCount);}return transports.get(uid)?.health==='HEALTHY';}
"""
if old not in s:
    raise SystemExit("connectCreator source block was not found")
s = s.replace(old, new, 1)

marker = " app.get('/auth/twitch',async(req,reply)=>{"
config_route = " app.get('/api/twitch/config',()=>({configured:Boolean(env.TWITCH_CLIENT_ID&&env.TWITCH_CLIENT_SECRET&&(env.NODE_ENV!=='production'||env.TWITCH_WEBHOOK_SECRET)),clientIdConfigured:Boolean(env.TWITCH_CLIENT_ID),clientSecretConfigured:Boolean(env.TWITCH_CLIENT_SECRET),webhookSecretConfigured:Boolean(env.TWITCH_WEBHOOK_SECRET),mode:env.NODE_ENV==='production'?'webhook':'websocket',redirectUri:base+'/auth/twitch/callback',eventsubCallback:base+'/api/twitch/eventsub',requiredScopes:env.NODE_ENV==='production'?['user:read:chat','user:bot','channel:bot']:['user:read:chat']}));\n"
if marker not in s:
    raise SystemExit("Twitch OAuth route marker was not found")
s = s.replace(marker, config_route + marker, 1)

s = s.replace(
    "if(!env.TWITCH_CLIENT_ID||!env.TWITCH_CLIENT_SECRET||!env.SESSION_SECRET||!pool)return reply.code(503).send({code:'TWITCH_CONFIGURATION_REQUIRED',message:'Twitch connection is not configured.'});",
    "if(!env.TWITCH_CLIENT_ID||!env.TWITCH_CLIENT_SECRET||!env.SESSION_SECRET||!pool||(env.NODE_ENV==='production'&&!env.TWITCH_WEBHOOK_SECRET))return reply.code(503).send({code:'TWITCH_CONFIGURATION_REQUIRED',message:'Twitch connection is not configured.',redirectUri:base+'/auth/twitch/callback'});",
    1,
)
s = s.replace(
    "const scopes=['user:read:chat'];",
    "const scopes=['user:read:chat'];if(env.NODE_ENV==='production'&&env.TWITCH_WEBHOOK_SECRET)scopes.push('user:bot','channel:bot');",
    1,
)
s = s.replace(
    "response_type:'code',scope:scopes.join(' '),state:token",
    "response_type:'code',scope:scopes.join(' '),state:token,force_verify:'true'",
    1,
)

old_route_query = "SELECT m.user_id,u.display_name,m.ready,m.overlay_seen_at FROM campaign_members m JOIN users u ON u.id=m.user_id WHERE m.campaign_id=$1 AND m.active=true ORDER BY m.route_order,m.user_id"
new_route_query = "SELECT m.user_id,u.display_name,m.ready,m.overlay_seen_at,EXISTS(SELECT 1 FROM provider_connections p WHERE p.user_id=m.user_id AND p.provider='twitch' AND p.status='CONNECTED') AS twitch_connected FROM campaign_members m JOIN users u ON u.id=m.user_id WHERE m.campaign_id=$1 AND m.active=true ORDER BY m.route_order,m.user_id"
if old_route_query not in s:
    raise SystemExit("campaign route query was not found")
s = s.replace("pool!.query('" + old_route_query + "',[id])", 'pool!.query("' + new_route_query + '",[id])', 1)
s = s.replace(
    "providerHealth:transports.get(row.user_id)?.health??'DISCONNECTED'",
    "providerHealth:transports.get(row.user_id)?.health??(row.twitch_connected?'HEALTHY':'DISCONNECTED')",
    1,
)

s = s.replace(
    "transports.get(uid)?.health!=='HEALTHY'||transports.get(body.destination!)?.health!=='HEALTHY'",
    "!await twitchTransportHealthy(uid)||!await twitchTransportHealthy(body.destination!)",
    1,
)
s = s.replace(
    "transports.get(s.handoff.source)?.health!=='HEALTHY'||safetyPending.has(s.handoff.source)",
    "!await twitchTransportHealthy(s.handoff.source)||safetyPending.has(s.handoff.source)",
    1,
)
p.write_text(s)

p = Path("apps/server/src/release-health.ts")
s = p.read_text()
needle = "const twitch=Boolean(process.env.TWITCH_CLIENT_ID&&process.env.TWITCH_CLIENT_SECRET);"
if needle not in s:
    raise SystemExit("release-health Twitch check was not found")
s = s.replace(needle, "const twitch=Boolean(process.env.TWITCH_CLIENT_ID&&process.env.TWITCH_CLIENT_SECRET&&process.env.TWITCH_WEBHOOK_SECRET);", 1)
p.write_text(s)

p = Path("apps/web/src/LiveConsole.tsx")
s = p.read_text()
s = s.replace(
    "interface Member{user_id:string;display_name:string;ready:boolean;overlay_seen_at:number;providerHealth?:string;platform?:string}",
    "interface Member{user_id:string;display_name:string;ready:boolean;overlay_seen_at:number;providerHealth?:string;platform?:string}\ninterface TwitchConfig{configured:boolean;clientIdConfigured:boolean;clientSecretConfigured:boolean;webhookSecretConfigured:boolean;mode:string;redirectUri:string;eventsubCallback:string;requiredScopes:string[]}",
    1,
)
s = s.replace(
    " const[deleteConfirm,setDeleteConfirm]=useState('');",
    " const[deleteConfirm,setDeleteConfirm]=useState('');\n const[twitchConfig,setTwitchConfig]=useState<TwitchConfig|null>(null);",
    1,
)
needle = " const current=useRef<State|null>(null),timer=useRef<ReturnType<typeof setInterval>|null>(null),receive=useRef(()=>{});"
if needle not in s:
    raise SystemExit("LiveConsole current-ref marker was not found")
s = s.replace(needle, needle + "\n useEffect(()=>{let active=true;fetch('/api/twitch/config',{credentials:'same-origin'}).then(r=>r.json()).then((value:TwitchConfig)=>{if(active)setTwitchConfig(value)}).catch(()=>{});return()=>{active=false};},[]);", 1)
old_ui = '{!auth?<section className="panel document"><h2>{unavailable?"Creator connection is unavailable here.":"Connect your creator account."}</h2>{!unavailable&&<><p>Connect your account to manage a live campaign.</p><a className="button primary" href="/auth/twitch">Connect Twitch →</a><p><a className="button" href="/auth/youtube">Connect YouTube →</a> <a className="button" href="/auth/kick">Connect Kick →</a></p></>}<p><a href="/judge">Open simulated Judge Mode ↗</a></p></section>'
new_ui = '{!auth?<section className="panel document"><h2>{unavailable?"Creator connection is unavailable here.":"Connect your creator account."}</h2>{!unavailable&&<><p>Connect your account to manage a live campaign.</p>{twitchConfig?.configured?<><a className="button primary" href="/auth/twitch">Connect Twitch →</a><p>Twitch OAuth · {twitchConfig.mode} EventSub · signed callback verified</p></>:<div className="status-card"><strong>Twitch app configuration required</strong><p>Willie is ready, but Twitch OAuth credentials have not been installed yet.</p>{twitchConfig&&<><p><small>OAuth callback</small><br/><code>{twitchConfig.redirectUri}</code></p><p><small>EventSub callback</small><br/><code>{twitchConfig.eventsubCallback}</code></p></>}</div>}<p><a className="button" href="/auth/youtube">Connect YouTube →</a> <a className="button" href="/auth/kick">Connect Kick →</a></p></>}<p><a href="/judge">Open simulated Judge Mode ↗</a></p></section>'
if old_ui not in s:
    raise SystemExit("LiveConsole auth UI block was not found")
s = s.replace(old_ui, new_ui, 1)
p.write_text(s)

Path("apps/server/src/twitch-webhook.ts").write_text("""import {z} from 'zod';

export interface TwitchWebhookConfig{clientId:string;clientSecret:string;callbackUrl:string;webhookSecret:string;fetcher?:typeof fetch}
const AppToken=z.object({access_token:z.string().min(1)});
export async function registerTwitchWebhookSubscriptions(config:TwitchWebhookConfig,userId:string):Promise<void>{
 const fetcher=config.fetcher??fetch;
 const tokenResponse=await fetcher('https://id.twitch.tv/oauth2/token',{method:'POST',body:new URLSearchParams({client_id:config.clientId,client_secret:config.clientSecret,grant_type:'client_credentials'}),signal:AbortSignal.timeout(10000)});
 if(!tokenResponse.ok)throw new Error('TWITCH_APP_TOKEN_FAILED');
 const accessToken=AppToken.parse(await tokenResponse.json()).access_token;
 const subscriptions=[
  {type:'channel.raid',version:'1',condition:{from_broadcaster_user_id:userId}},
  {type:'channel.raid',version:'1',condition:{to_broadcaster_user_id:userId}},
  {type:'channel.chat.message',version:'1',condition:{broadcaster_user_id:userId,user_id:userId}},
 ];
 for(const subscription of subscriptions){
  const response=await fetcher('https://api.twitch.tv/helix/eventsub/subscriptions',{method:'POST',headers:{Authorization:`Bearer ${accessToken}`,'Client-Id':config.clientId,'Content-Type':'application/json'},body:JSON.stringify({...subscription,transport:{method:'webhook',callback:config.callbackUrl,secret:config.webhookSecret}}),signal:AbortSignal.timeout(10000)});
  if(response.status===409)continue;
  if(!response.ok)throw new Error(`TWITCH_EVENTSUB_SUBSCRIBE_FAILED:${subscription.type}:${response.status}`);
 }
}
""")

Path("tests/twitch-webhook.test.ts").write_text("""import {describe,expect,it,vi} from 'vitest';
import {registerTwitchWebhookSubscriptions} from '../apps/server/src/twitch-webhook.js';

describe('Twitch production webhook commissioning',()=>{
 it('uses an app token and registers raid-in, raid-out and chat subscriptions',async()=>{
  const calls:{url:string;init?:RequestInit}[]=[];
  const fetcher=vi.fn(async(input:string|URL|Request,init?:RequestInit)=>{
   const url=String(input);calls.push({url,init});
   if(url.includes('/oauth2/token'))return new Response(JSON.stringify({access_token:'app-token'}),{status:200,headers:{'content-type':'application/json'}});
   return new Response(JSON.stringify({data:[{id:'sub',status:'webhook_callback_verification_pending'}]}),{status:202,headers:{'content-type':'application/json'}});
  }) as unknown as typeof fetch;
  await registerTwitchWebhookSubscriptions({clientId:'client',clientSecret:'secret',callbackUrl:'https://willie.example/api/twitch/eventsub',webhookSecret:'webhook-secret-value',fetcher},'broadcaster-1');
  expect(calls).toHaveLength(4);
  const bodies=calls.slice(1).map(call=>JSON.parse(String(call.init?.body)));
  expect(bodies.map(body=>body.type)).toEqual(['channel.raid','channel.raid','channel.chat.message']);
  expect(bodies[0].condition).toEqual({from_broadcaster_user_id:'broadcaster-1'});
  expect(bodies[1].condition).toEqual({to_broadcaster_user_id:'broadcaster-1'});
  expect(bodies[2].condition).toEqual({broadcaster_user_id:'broadcaster-1',user_id:'broadcaster-1'});
  for(const body of bodies)expect(body.transport).toEqual({method:'webhook',callback:'https://willie.example/api/twitch/eventsub',secret:'webhook-secret-value'});
 });

 it('treats duplicate subscriptions as already commissioned',async()=>{
  let n=0;
  const fetcher=vi.fn(async()=>++n===1?new Response(JSON.stringify({access_token:'app-token'}),{status:200,headers:{'content-type':'application/json'}}):new Response('',{status:409})) as unknown as typeof fetch;
  await expect(registerTwitchWebhookSubscriptions({clientId:'client',clientSecret:'secret',callbackUrl:'https://willie.example/api/twitch/eventsub',webhookSecret:'webhook-secret-value',fetcher},'broadcaster-1')).resolves.toBeUndefined();
 });
});
""")
