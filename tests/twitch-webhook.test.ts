import {describe,expect,it,vi} from 'vitest';
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
