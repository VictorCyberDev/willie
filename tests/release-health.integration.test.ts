import{afterAll,beforeAll,describe,expect,it}from'vitest';
import{buildServer}from'../apps/server/src/app.js';
import{registerReleaseHealth}from'../apps/server/src/release-health.js';
import type{FastifyInstance}from'fastify';

const databaseUrl=process.env.TEST_DATABASE_URL;
const suite=databaseUrl?describe:describe.skip;

suite('winner release runtime readiness',()=>{
 let app:FastifyInstance;
 beforeAll(async()=>{
  app=await buildServer({env:{NODE_ENV:'test',DATABASE_URL:databaseUrl,APP_URL:'http://localhost:3000',SESSION_SECRET:'s'.repeat(32),TOKEN_ENCRYPTION_KEY:'a'.repeat(64)}});
  registerReleaseHealth(app,databaseUrl);
  await app.ready();
 });
 afterAll(async()=>{await app.close();});
 it('requires the complete winner schema through migration 9',async()=>{
  const response=await app.inject({method:'GET',url:'/release-ready'});
  expect(response.statusCode).toBe(200);
  expect(response.json()).toMatchObject({status:'ready',database:true,migrations:true,migrationVersion:9,twitch:false,appUrl:false});
 });
});
