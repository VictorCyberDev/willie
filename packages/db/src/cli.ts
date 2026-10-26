import {createPool,migrate} from './index.js';
const url=process.env.DATABASE_URL;if(!url)throw new Error('DATABASE_URL is required');
const pool=createPool(url);try{await migrate(pool);console.log('Willie migrations applied');}finally{await pool.end();}