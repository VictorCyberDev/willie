import {buildServer} from './app.js';
import {registerWinnerReleaseRoutes} from './winner-release.js';
import {registerWinnerMemoryRoutes} from './winner-memory.js';
import {registerReleaseHealth} from './release-health.js';

const app=await buildServer();
registerWinnerReleaseRoutes(app,process.env.DATABASE_URL);
registerWinnerMemoryRoutes(app,process.env.DATABASE_URL);
registerReleaseHealth(app,process.env.DATABASE_URL);
await app.listen({host:'0.0.0.0',port:Number(process.env.PORT??3000)});
for(const signal of ['SIGINT','SIGTERM']as const)process.on(signal,()=>{void app.close().then(()=>process.exit(0));});
