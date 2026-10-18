import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, mkdtempSync, rmSync, existsSync} from 'node:fs';
import {resolve, join} from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';
const features=['feed','explore','reels','stories','messages','notifications','people','events','gallery','invitations','qr','create','profile','saved','insights','settings','help'];
const temp=mkdtempSync(join(tmpdir(),'moments-feature-tests-'));
const local=process.platform==='win32'?'node_modules/.bin/tsc.cmd':'node_modules/.bin/tsc';
const command=existsSync(local)?local:'tsc';
const tsc=spawnSync(command,[
 '--target','ES2022','--module','ES2022','--moduleResolution','bundler','--skipLibCheck',
 '--outDir',temp,...features.map(name=>`src/app/features/${name}/feature-lab.ts`)
],{encoding:'utf8'});
if(tsc.error||tsc.status!==0)throw Error(`TypeScript test compilation failed: ${tsc.stderr||tsc.stdout||tsc.error?.message}`);
process.on('exit',()=>rmSync(temp,{recursive:true,force:true}));
for(const name of features){
 test(name+' query/ownership/pagination/merging behavior',async()=>{
  const compiled=readFileSync(join(temp,name,'feature-lab.js'),'utf8');
  const m=await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
  const owner=m.OWNER_COLUMN,date=m.CREATED_COLUMN,title=m.TEXT_COLUMN;const sharedOwner=owner==='id';
  const a={id:'a',...(sharedOwner?{}:{[owner]:'ownerA'}),[date]:'2026-01-01T12:00:00Z',[title]:'Alpha wedding',revision:1};
  const b={id:'b',...(sharedOwner?{}:{[owner]:'ownerB'}),[date]:'2026-01-02T12:00:00Z',[title]:'Beta party',revision:2};
  const c={id:'c',...(sharedOwner?{}:{[owner]:'ownerA'}),[date]:'2026-01-03T12:00:00Z',[title]:'Alpha memory',revision:1};
  const records=[a,b,c];
  assert.deepEqual(m.sortNewest(records).map(x=>x.id),['c','b','a']);
  assert.deepEqual(m.search(records,'alpha').map(x=>x.id),['a','c']);
  assert.equal(m.countByOwner(records).get(sharedOwner?'a':'ownerA'),sharedOwner?1:2);
  assert.deepEqual(m.paginate(records,1,2).records.map(x=>x.id),['c']);
  assert.equal(m.query(records,{search:'alpha',page:0,pageSize:1}).total,2);
  assert.equal(m.removeById(records,'b').length,2);
  assert.deepEqual(m.updateById(records,'a',{revision:3})[0].revision,3);
  assert.equal(m.byId(records,'b')?.id,'b');
  assert.equal(m.validateEntity(a).length,0);
  assert.equal(m.mergeRevision(a,{...a,revision:4}).revision,4);
  assert.equal(m.ensureUnique([...records,a]).length,3);
  assert.throws(()=>m.paginate(records,-1,10));
  assert.throws(()=>m.editLocal(a,'intruder',{[title]:'attack'}));
  const csv=m.toCsv(records,['id',title]);
  assert.ok(csv.includes('Alpha wedding'));
  assert.equal(m.parseJson(m.exportJson(records)).length,3);
 });
}
