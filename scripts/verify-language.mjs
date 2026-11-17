import fs from 'node:fs';
import ts from 'typescript';
import assert from 'node:assert/strict';
const subjects=fs.readFileSync('data/discipline-labels-en.json','utf8');
const source=fs.readFileSync('lib/translations.ts','utf8').replace("import subjects from '../data/discipline-labels-en.json';",'const subjects='+subjects+';');
const compiled=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
const {translate}=await import('data:text/javascript;base64,'+Buffer.from(compiled).toString('base64'));
const missing=[];
for(const path of ['app/Platform.tsx','app/ScholarReading.tsx','app/admin/page.tsx','lib/dimensions.ts']){
 const src=ts.createSourceFile(path,fs.readFileSync(path,'utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
 function visit(n){if(ts.isStringLiteral(n)&&/[\u4e00-\u9fff]/.test(n.text)&&/[\u4e00-\u9fff]/.test(translate(n.text,'en')))missing.push({path,text:n.text});ts.forEachChild(n,visit);}visit(src);
}
assert.deepEqual(missing,[]);
const catalogue=JSON.parse(fs.readFileSync('data/discipline-selection.json','utf8'));for(const p of catalogue.primary){assert.ok(!/[\u4e00-\u9fff]/.test(translate(p.name,'en')));for(const s of p.secondary)assert.ok(!/[\u4e00-\u9fff]/.test(translate(s.name,'en')));}
assert.equal(translate('开始标注','zh'),'开始标注');assert.equal(translate('开始标注','en'),'Start annotating');assert.match(translate('为保证不同方法均衡，本作者本轮最多 94 题','en'),/94/);assert.match(translate('贡献者 ABCD1234','en'),/Contributor ABCD1234/);
console.log('PASS: all interface, dimension and discipline labels have English translations; canonical data and Chinese labels remain intact.');
