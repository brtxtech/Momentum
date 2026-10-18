import { spawnSync } from 'node:child_process';
import { readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
const root = 'src/app/features';
const names = ['domain.ts','feature-lab.ts','feature-behavior.ts','feature-collection.ts','feature-policy.ts','feature-queue.ts'];
const inputs = readdirSync(root).flatMap(directory => names.map(name => join(root,directory,name)).filter(existsSync));
const args = ['--noEmit','--strict','--target','es2022','--module','es2022','--moduleResolution','bundler','--skipLibCheck',...inputs];
const program = existsSync('node_modules/.bin/tsc') ? 'node_modules/.bin/tsc' : 'tsc';
const result = spawnSync(program,args,{stdio:'inherit'});
if(result.error){console.error('Install TypeScript or run npm install:',result.error.message);process.exit(1)}
process.exit(result.status ?? 1);
