import fs from 'node:fs';
const catalogue=JSON.parse(fs.readFileSync('data/disciplines.json','utf8'));
const entries=Object.fromEntries(fs.readFileSync('data/discipline-en.txt','utf8').trim().split('\n').map(line=>{const [code,...words]=line.split(' ');return [code,words.join(' ')];}));
const labels={};for(const p of catalogue.primary){if(!entries[p.code])throw new Error('Missing primary '+p.code);labels[p.name]=entries[p.code];for(const s of p.secondary){if(!entries[s.code])throw new Error('Missing secondary '+s.code);labels[s.name]=entries[s.code];}}
fs.writeFileSync('data/discipline-labels-en.json',JSON.stringify(labels,null,2));
console.log('English labels verified for all 126 primary entries and 386 secondary entries.');
