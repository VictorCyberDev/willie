import {DomainError} from '../../../packages/domain/src/index.js';
import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
export const digest=(value:string|undefined)=>{if(value===undefined)throw new DomainError('AUTH_REQUIRED');return createHash('sha256').update(value).digest('hex');};
export function encrypt(value:unknown,key:string){if(!/^[a-f0-9]{64}$/i.test(key))throw new Error('Invalid TOKEN_ENCRYPTION_KEY');const iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',Buffer.from(key,'hex'),iv);const data=Buffer.concat([cipher.update(JSON.stringify(value),'utf8'),cipher.final()]);return {iv:iv.toString('hex'),tag:cipher.getAuthTag().toString('hex'),data:data.toString('hex')};}
export function decrypt(value:{iv:string;tag:string;data:string},key:string):unknown {const cipher=createDecipheriv('aes-256-gcm',Buffer.from(key,'hex'),Buffer.from(value.iv,'hex'));cipher.setAuthTag(Buffer.from(value.tag,'hex'));return JSON.parse(Buffer.concat([cipher.update(Buffer.from(value.data,'hex')),cipher.final()]).toString('utf8'));}
export function verifyWebhook(raw:string,headers:Record<string,string|undefined>,secret:string,now=Date.now()):boolean {const id=headers['twitch-eventsub-message-id'],timestamp=headers['twitch-eventsub-message-timestamp'],signature=headers['twitch-eventsub-message-signature'];if(!id||!timestamp||!signature||!/^sha256=[a-f0-9]{64}$/.test(signature))return false;const at=Date.parse(timestamp);if(!Number.isFinite(at)||Math.abs(now-at)>600000)return false;const expected='sha256='+createHmac('sha256',secret).update(id+timestamp+raw).digest('hex');return timingSafeEqual(Buffer.from(expected),Buffer.from(signature));}
export function secretToken(){return randomBytes(32).toString('base64url');}
export async function assertOAuthFresh(c:import('pg').PoolClient,uid:string,issuedAt:number,provider:string,identity:string):Promise<void>{
 const row=await c.query<{deleted_at:Date|null}>('SELECT deleted_at FROM users WHERE id=$1 FOR UPDATE',[uid]);
 const tombstone=await c.query<{revoked_at:Date}>('SELECT revoked_at FROM account_identity_tombstones WHERE provider=$1 AND identity_hash=$2',[provider,digest(JSON.stringify([provider,identity]))]);
 if(!Number.isFinite(issuedAt)||row.rows[0]?.deleted_at&&row.rows[0].deleted_at.getTime()>=issuedAt||tombstone.rows[0]?.revoked_at.getTime()>=issuedAt)throw new DomainError('OAUTH_ACCOUNT_REVOKED');
 await c.query('UPDATE users SET deleted_at=NULL WHERE id=$1',[uid]);
}
