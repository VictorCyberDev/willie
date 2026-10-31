import type {FastifyInstance} from 'fastify';
import {Pool} from 'pg';

export function registerReleaseHealth(app:FastifyInstance,databaseUrl?:string):void{
 const pool=databaseUrl?new Pool({connectionString:databaseUrl,max:1}):undefined;
 app.addHook('onClose',async()=>{if(pool)await pool.end();});
 app.get('/release-ready',async(_req,reply)=>{
  if(!pool)return reply.code(503).send({status:'not_ready',database:false,migrations:false,twitch:false,appUrl:false});
  try{
   const [migration,tables]=await Promise.all([
    pool.query<{version:number}>('SELECT COALESCE(MAX(version),0)::int version FROM schema_migrations'),
    pool.query<{name:string}>("SELECT to_regclass(name)::text name FROM unnest(ARRAY['relays','passport_chapters','community_marks','relay_votes','winner_clip_requests']) name"),
   ]);
   const version=migration.rows[0]?.version??0,required=['relays','passport_chapters','community_marks','relay_votes','winner_clip_requests'];
   const existing=new Set(tables.rows.map(row=>row.name).filter(Boolean));
   const missing=required.filter(name=>!existing.has(name));
   const twitch=Boolean(process.env.TWITCH_CLIENT_ID&&process.env.TWITCH_CLIENT_SECRET&&process.env.TWITCH_WEBHOOK_SECRET);
   const appUrl=Boolean(process.env.APP_URL);
   if(version<9||missing.length)return reply.code(503).send({status:'not_ready',database:true,migrations:false,migrationVersion:version,missing,twitch,appUrl});
   return{status:'ready',database:true,migrations:true,migrationVersion:version,twitch,appUrl};
  }catch{return reply.code(503).send({status:'not_ready',database:false,migrations:false,twitch:false,appUrl:Boolean(process.env.APP_URL)});}
 });
}
