export type Provider = 'twitch' | 'tiltify' | 'youtube' | 'kick' | 'generic';
export interface PlatformCapabilities { liveChat:boolean; viewerIdentity:boolean; nativeTransitionEvidence:boolean; monetizationEvents:boolean; moderationEvents:boolean; resumableChat:boolean; webhooks:boolean }
export interface NormalizedProviderEvent { provider:Provider; providerEventId:string; eventType:string; occurredAt:string; receivedAt:string; sourceIdentity:string; destinationIdentity?:string; payload:Record<string,unknown> }
export interface AdapterHealth { status:'DISCONNECTED'|'CONNECTING'|'HEALTHY'|'DEGRADED'; checkedAt:string; reason?:string }
export interface AdapterContext { fetch:typeof fetch; now:()=>number; emit:(event:NormalizedProviderEvent)=>Promise<void>; signal?:AbortSignal }
export interface WillieAdapter<C = Record<string,unknown>> { readonly id:string; configure(config:C):void; validateConfig():void; connect(context:AdapterContext):Promise<void>; health():AdapterHealth; consume(input:unknown):Promise<void>; disconnect():Promise<void> }
export interface ContributionProvider<C = Record<string,unknown>> extends WillieAdapter<C> { readonly contributionTypes:readonly string[] }
export interface TransitionEvidenceProvider<C = Record<string,unknown>> extends WillieAdapter<C> { readonly evidenceClasses:readonly string[] }
export interface PlatformTransport<C = Record<string,unknown>> extends WillieAdapter<C> { readonly capabilities:PlatformCapabilities }
export const capabilities:Record<'twitch'|'youtube'|'kick',PlatformCapabilities> = {
 twitch:{liveChat:true,viewerIdentity:true,nativeTransitionEvidence:true,monetizationEvents:true,moderationEvents:true,resumableChat:false,webhooks:true},
 youtube:{liveChat:true,viewerIdentity:true,nativeTransitionEvidence:false,monetizationEvents:true,moderationEvents:true,resumableChat:true,webhooks:false},
 kick:{liveChat:true,viewerIdentity:true,nativeTransitionEvidence:false,monetizationEvents:false,moderationEvents:true,resumableChat:false,webhooks:true}
};
export function requiredString(value:unknown,label:string):string { if(typeof value!=='string'||!value.trim())throw new Error('Invalid '+label);return value }
export function record(value:unknown):Record<string,unknown>{if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('Expected object');return value as Record<string,unknown>}
export function event(provider:Provider,id:string,type:string,source:string,time:string,now:number,payload:Record<string,unknown>,destination?:string):NormalizedProviderEvent { if(!Number.isFinite(Date.parse(time)))throw new Error('Invalid event timestamp');return {provider,providerEventId:requiredString(id,'event id'),eventType:type,sourceIdentity:requiredString(source,'source'),destinationIdentity:destination,occurredAt:time,receivedAt:new Date(now).toISOString(),payload} }