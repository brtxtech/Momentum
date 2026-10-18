import fs from 'node:fs';import path from 'node:path';
const list=['feed','explore','reels','stories','messages','notifications','people','events','gallery','invitations','qr','create','profile','saved','insights','settings','help'];
for(const f of list){const folder=`src/app/features/${f}`;for(const file of ['domain.ts','feature-lab.ts','feature-behavior.ts','feature-collection.ts','feature-reader.service.ts']){if(!fs.existsSync(path.join(folder,file)))throw Error(`Missing ${f}/${file}`)}}
const routes=fs.readFileSync('src/app/app.routes.ts','utf8');for(const f of list)if(!routes.includes(`path: '${f}'`))throw Error(`Unrouted ${f}`);
console.log('PASS: 17 feature folders, all 5 core modules, and 17 routes');
