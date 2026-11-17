import assert from 'node:assert/strict';
import fs from 'node:fs';
import {drawRound} from '../lib/sampling.ts';
const rows=JSON.parse(fs.readFileSync('data/pairs-release.json','utf8'));
assert.equal(rows.length,630);assert.equal(new Set(rows.map(r=>r.id)).size,630);
for(const domain of new Set(rows.map(row=>row.domain))){
 const pool=rows.filter(r=>r.domain===domain);
 for(const n of [1,2,3,30,60,90,120,pool.length].filter(n=>n<=pool.length)){
  const ids=drawRound(pool,n),chosen=ids.map(id=>pool.find(r=>r.id===id));assert.equal(new Set(ids).size,n);
  const counts=['passage','paragraph','sentence'].map(level=>chosen.filter(r=>r.level===level).length);assert.ok(Math.max(...counts)-Math.min(...counts)<=1);
 }
 for(const author of new Set(pool.map(r=>r.author))){const sub=pool.filter(r=>r.author===author);assert.equal(sub.length,30);assert.deepEqual(['passage','paragraph','sentence'].map(level=>sub.filter(row=>row.level===level).length),[10,10,10]);for(let i=0;i<10;i++){const ids=drawRound(sub,3);assert.equal(new Set(ids.map(id=>sub.find(r=>r.id===id).level)).size,3);}}
}
console.log('PASS: 630 pairs, unique draws, multi-scholar selection and balanced task levels for all presets and domains.');
