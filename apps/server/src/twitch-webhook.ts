import {z} from 'zod';

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
