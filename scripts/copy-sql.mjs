import {cp,mkdir} from 'node:fs/promises';await mkdir('dist/server/packages/db/migrations',{recursive:true});await cp('packages/db/migrations','dist/server/packages/db/migrations',{recursive:true});
