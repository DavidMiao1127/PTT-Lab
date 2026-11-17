import {pseudonymize,pseudonymizeProfile} from '../../../lib/author-aliases.server';
import { env } from 'cloudflare:workers';
import { visiblePair,truth } from '../../../lib/pairs';
import { loadPairs,loadPairMetadata,pairInventory } from '../../../lib/pair-library';
import { sampleEvidence,drawRound,samplingPolicy,evidenceCount } from '../../../lib/sampling';
import { authorSubjects,classifyPeer,subjectNames,validSubject,catalogueVersion,authorMappingVersion,domains } from '../../../lib/study';
import { validateDimensions,dimensionLabels,dimensionVersion } from '../../../lib/dimensions';
import {eraseSession} from '../../../lib/reset';
import {displayText} from '../../../lib/passages';
import {validateSelectionDwell,selectionPolicy} from '../../../lib/selection-policy';
import {readingMaterial,readingVersion,minimumReadingSeconds} from '../../../lib/reading';
export const dynamic='force-dynamic';
type Item={id:string;flip:boolean};
const json=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
const db=()=>{if(!env.DB)throw new Error('数据库未连接');return env.DB;};
const tokenFrom=(req:Request)=>req.headers.get('cookie')?.split(';').map(x=>x.trim()).find(x=>x.startsWith('apt_session='))?.slice(12);
async function session(req:Request,instance?:string){const token=tokenFrom(req),uid=req.headers.get('oai-authenticated-user-id');const s=token?await db().prepare('SELECT * FROM sessions WHERE token=?').bind(token).first<any>():null;if(!s)throw new Error('请先创建标注任务');if(s.user_id&&s.user_id!==uid)throw new Error('无权访问此任务');const profile=JSON.parse(s.profile);if(profile.clientInstance&&profile.clientInstance!==(req.headers.get('x-apt-client-id')||instance))throw new Error('页面已重置，请从身份页重新开始');return s;}
const items=(s:any):Item[]=>JSON.parse(s.items);
function item(s:any,id:string){const i=items(s).find(x=>x.id===id);if(!i)throw new Error('题目不属于此任务');return i;}
export async function GET(req:Request){try{
 const u=new URL(req.url),mode=u.searchParams.get('mode');
 if(mode==='catalog'){const pairs=await pairInventory();return json({domains,total:pairs.length,ratio:samplingPolicy.ratio,catalogueVersion,authors:authorSubjects.map(a=>{const pool=pairs.filter(p=>p.author===a.name&&p.domain===a.domain);return {name:a.name,domain:a.domain,total:pool.length,maxCount:pool.length,methodCount:new Set(pool.map(p=>p.baseline)).size};})});}
 const s=await session(req);
 if(mode==='pair'){if(s.status==='reading')throw new Error('请先完成全部学者资料阅读');const id=u.searchParams.get('id')||'';const selected=item(s,id); const pair=(await loadPairs([id])).get(id); if(!pair)throw new Error('题库已更新，请从首页开始新一轮标注'); return json(visiblePair(pair,selected.flip));}
 const pairMap=s.status==='reading'?new Map():await loadPairMetadata(items(s).map(i=>i.id));
 const a=await db().prepare('SELECT pair_id,choice,confidence,active_ms FROM answers WHERE session_id=?').bind(s.id).all();
 const e=await db().prepare('SELECT pair_id,payload FROM evidence WHERE session_id=?').bind(s.id).all();
 return json({id:s.id,profile:pseudonymizeProfile(JSON.parse(s.profile)),status:s.status==='locking'?'judgment':s.status,items:s.status==='reading'?[]:items(s).map(i=>({id:i.id,author:pseudonymize(pairMap.get(i.id)!.author)})),answers:a.results,evidence:e.results,selected:JSON.parse(s.selected)});
 }catch(e){return json({error:(e as Error).message},400);}}
export async function POST(req:Request){try{
 if(req.headers.get('origin')!==new URL(req.url).origin)return json({error:'请求来源无效'},403);
 const raw=await req.text();if(raw.length>250000)return json({error:'请求过大'},413);const b=JSON.parse(raw);
 if(b.action==='reset'){
  const token=tokenFrom(req);if(token){const previous=await db().prepare('SELECT id,status,user_id FROM sessions WHERE token=?').bind(token).first<any>();if(previous&&(!previous.user_id||previous.user_id===req.headers.get('oai-authenticated-user-id'))&&previous.status!=='complete')await eraseSession(previous.id);}
  return Response.json({ok:true},{headers:{'Set-Cookie':`apt_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${new URL(req.url).protocol==='https:'?'; Secure':''}`,'Cache-Control':'no-store'}});
 }
 if(b.action==='start'){
  const p=b.profile,count=b.count;
  if(!p||!domains.some(d=>d.id===p.domain)||!p.consent||!['general','basic','full'].includes(p.role))throw new Error('请完成标注设置并同意数据记录说明');
  p.primary??='';p.secondary??='';p.familiarity??=0;
  if(p.role!=='general'&&!validSubject(p.primary,p.secondary))throw new Error('请选择专业方向');
  if(p.role==='full'&&(typeof p.researchArea!=='string'||!p.researchArea.trim()||typeof p.careerStage!=='string'||!['student','researcher','faculty','practitioner','other'].includes(p.careerStage)))throw new Error('请填写职业阶段和研究方向');
  if(p.role!=='general'&&(!Number.isInteger(p.familiarity)||p.familiarity<0||p.familiarity>5))throw new Error('请选择熟悉程度');
  if(!Array.isArray(p.authors)||!p.authors.length||p.authors.length>8||new Set(p.authors).size!==p.authors.length||!p.authors.every((name:string)=>authorSubjects.some(a=>a.name===name&&a.domain===p.domain)))throw new Error('请选择当前领域内的学者');
  if(b.ids!==undefined)throw new Error('题目由系统均衡随机抽取');
  if(p.role==='general'){p.primary='';p.secondary='';p.familiarity=0;}
  const pool=(await pairInventory(p.domain)).filter(x=>p.authors.includes(x.author)),ids=drawRound(pool,count);
  const clientInstance=req.headers.get('x-apt-client-id');if(!clientInstance||!/^[0-9a-f-]{36}$/i.test(clientInstance))throw new Error('页面已重置，请从身份页重新开始');
  const id=crypto.randomUUID(),token=crypto.randomUUID()+crypto.randomUUID(),subjects=subjectNames(p.primary,p.secondary),safe={name:'贡献者 '+id.slice(0,8).toUpperCase(),domain:p.domain,peer:p.role==='general'?'pending':classifyPeer(p.primary,p.secondary,p.authors[0]),peerByAuthor:Object.fromEntries(p.authors.map((a:string)=>[a,p.role==='general'?'pending':classifyPeer(p.primary,p.secondary,a)])),authors:p.authors,author:p.authors.join('、'),researchArea:p.role==='full'?p.researchArea.trim().slice(0,500):'',careerStage:p.role==='full'?p.careerStage:'',primary:p.primary,secondary:p.secondary,primaryName:subjects.primary,secondaryName:subjects.secondary,specialty:[subjects.primary,subjects.secondary].filter(Boolean).join(' / '),role:p.role,familiarity:p.familiarity,count,flowVersion:'v6',...(p.role!=='general'?{reading:{version:readingVersion,role:p.role,records:{}}}:{}),datasetVersion:ids.some(id=>id.startsWith('imp-'))?'release-630+imports':'release-630',clientInstance,evidenceRatio:samplingPolicy.ratio,evidenceCount:evidenceCount(count),catalogueVersion,authorMappingVersion,drawPolicyVersion:'level-author-method-v1',consent:true,consentVersion:'2026-11-selection-v2',selectionPolicy};
  await db().prepare('INSERT INTO sessions(id,token,user_id,profile,items,status,selected,created_at) VALUES(?,?,?,?,?,?,?,?)').bind(id,token,req.headers.get('oai-authenticated-user-id'),JSON.stringify(safe),JSON.stringify(ids.map(id=>({id,flip:crypto.getRandomValues(new Uint8Array(1))[0]%2===0}))),p.role==='general'?'judgment':'reading','[]',Date.now()).run();
  return Response.json({id},{headers:{'Set-Cookie':`apt_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=2592000${new URL(req.url).protocol==='https:'?'; Secure':''}`,'Cache-Control':'no-store'}});
 }
 const s=await session(req,b.clientInstance);
 if(['readOpen','readDone','finishReading'].includes(b.action)){
  if(s.status!=='reading')throw new Error('当前不在资料阅读阶段');
  const profile=pseudonymizeProfile(JSON.parse(s.profile)),reading=profile.reading;
  if(!reading||reading.version!==readingVersion)throw new Error('资料版本已更新，请重新开始');
  const authors=profile.authors as string[],next=authors.find(name=>!reading.records[name]?.completedAt);
  async function persist(status='reading'){
   const result=await db().prepare("UPDATE sessions SET profile=?,status=? WHERE id=? AND status='reading' AND profile=?").bind(JSON.stringify(profile),status,s.id,s.profile).run();
   if(!result.meta.changes)throw new Error('阅读记录已变化，请重试');
  }
  if(b.action==='finishReading'){
   if(next)throw new Error('请先完成全部学者资料阅读');
   reading.completedAt=Date.now();await persist('judgment');return json({ok:true});
  }
  if(!authors.includes(b.author)||(!reading.records[b.author]?.completedAt&&b.author!==next))throw new Error('请按顺序阅读所选学者资料');
  if(b.action==='readOpen'){
   if(!reading.records[b.author]){reading.records[b.author]={openedAt:Date.now()};try{await persist();}catch(e){const latest=await session(req);const saved=pseudonymizeProfile(JSON.parse(latest.profile)).reading?.records?.[b.author];if(!saved)throw e;reading.records[b.author]=saved;}}
   const metadata=await loadPairMetadata(items(s).map(i=>i.id));
   return json({material:readingMaterial(b.author,profile.role,[...metadata.values()]),minimumSeconds:minimumReadingSeconds,completed:!!reading.records[b.author].completedAt,version:readingVersion});
  }
  const record=reading.records[b.author];if(record?.completedAt)return json({ok:true});
  if(!record?.openedAt||b.reachedEnd!==true||b.confirmed!==true||!Number.isFinite(b.activeSeconds)||b.activeSeconds<minimumReadingSeconds||Date.now()-record.openedAt<minimumReadingSeconds*1000)throw new Error('请阅读至末尾并确认已阅读');
  reading.records[b.author]={...record,completedAt:Date.now(),activeSeconds:Math.min(Math.floor(b.activeSeconds),Math.floor((Date.now()-record.openedAt)/1000)),reachedEnd:true,confirmed:true};
  await persist();return json({ok:true});
 }
 if(s.status==='reading')throw new Error('请先完成全部学者资料阅读');

 async function displayedPair(id:string){const selected=item(s,id);const pair=(await loadPairs([id])).get(id);if(!pair)throw new Error('题库已更新，请从首页开始新一轮标注');return visiblePair(pair,selected.flip);}
 if(b.action==='visit'){item(s,b.pairId);if(s.status==='complete')throw new Error('任务已完成');await db().prepare("INSERT INTO visits(id,session_id,pair_id,opened_at) SELECT ?,?,?,? WHERE EXISTS(SELECT 1 FROM sessions WHERE id=? AND status IN('judgment','locking','evidence'))").bind(crypto.randomUUID(),s.id,b.pairId,Date.now(),s.id).run();return json({ok:true});}
 if(b.action==='events'){
  item(s,b.pairId);if(s.status==='complete')return json({ok:true});
  if(!Array.isArray(b.events)||b.events.length>300||typeof b.batchId!=='string')throw new Error('轨迹批次无效');
  const allowed=['move','click','scroll','hidden','visible','blur','focus','copy','paste','selection','choice','confidence','selection_dwell'];
  const displayed=b.events.some((event:any)=>event?.type==='selection_dwell')?await displayedPair(b.pairId):undefined;
  const ev=b.events.filter((x:any)=>allowed.includes(x.type)&&Number.isFinite(x.t)).map((x:any)=>({type:x.type,t:Math.max(0,Math.round(x.t)),x:Number.isFinite(x.x)?Math.round(x.x):null,y:Number.isFinite(x.y)?Math.round(x.y):null,w:Number.isFinite(x.w)?Math.round(x.w):null,h:Number.isFinite(x.h)?Math.round(x.h):null,scroll:Number.isFinite(x.scroll)?Math.round(x.scroll):null,value:['A','B',1,2,3,4,5].includes(x.value)?x.value:null,...(x.type==='selection_dwell'?{dwell:{...validateSelectionDwell(x.dwell,displayText(displayed!,x.dwell?.side),x.t),stage:s.status==='evidence'?'evidence':'judgment'}}:{})}));
  const count=await db().prepare('SELECT COUNT(*) n FROM events WHERE session_id=?').bind(s.id).first<any>();if(count.n>20000)throw new Error('轨迹记录超过限制');
  await db().prepare("INSERT OR IGNORE INTO events(id,session_id,pair_id,payload,received_at) SELECT ?,?,?,?,? WHERE EXISTS(SELECT 1 FROM sessions WHERE id=? AND status IN('judgment','locking','evidence'))").bind(s.id+':'+b.batchId.slice(0,100),s.id,b.pairId,JSON.stringify(ev),Date.now(),s.id).run();return json({ok:true});
 }
 if(b.action==='answer'){
  item(s,b.pairId);if(s.status!=='judgment')throw new Error('判断已锁定');
  if(!['A','B'].includes(b.choice)||!Number.isInteger(b.confidence)||b.confidence<1||b.confidence>5||!Number.isFinite(b.activeMs)||b.activeMs<0)throw new Error('请选择 A/B 和 1–5 分信心');
  const v=await db().prepare('SELECT MIN(opened_at) t FROM visits WHERE session_id=? AND pair_id=?').bind(s.id,b.pairId).first<any>();if(!v.t)throw new Error('请先打开题目');
  await db().prepare("INSERT INTO answers(id,session_id,pair_id,choice,confidence,active_ms,submitted_at) SELECT ?,?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM sessions WHERE id=? AND status='judgment') ON CONFLICT(id) DO UPDATE SET choice=excluded.choice,confidence=excluded.confidence,active_ms=excluded.active_ms,submitted_at=excluded.submitted_at").bind(s.id+':'+b.pairId,s.id,b.pairId,b.choice,b.confidence,Math.min(Math.round(b.activeMs),Date.now()-v.t),Date.now(),s.id).run();return json({ok:true});
 }
 if(b.action==='finishJudgment'){
  if(['evidence','complete'].includes(s.status))return json({ok:true});
  await db().prepare("UPDATE sessions SET status='locking' WHERE id=? AND status='judgment' AND (SELECT COUNT(*) FROM answers WHERE session_id=?)=json_array_length(items)").bind(s.id,s.id).run();
  const locked=await db().prepare('SELECT status FROM sessions WHERE id=?').bind(s.id).first<any>();if(!locked)throw new Error('页面已重置，请从身份页重新开始');if(locked.status!=='locking'){if(['evidence','complete'].includes(locked.status))return json({ok:true});throw new Error('请完成所有题目再继续');}
  const ar=await db().prepare('SELECT * FROM answers WHERE session_id=?').bind(s.id).all<any>();
  const pairMap=await loadPairMetadata(ar.results.map(a=>a.pair_id));
  const scored=ar.results.map(a=>{const p=pairMap.get(a.pair_id)!;return {pairId:a.pair_id,correct:a.choice===truth(p,item(s,p.id).flip),confidence:a.confidence,author:p.author,baseline:p.baseline,model:p.model,runId:p.run_id};});
  const profile=JSON.parse(s.profile),count=profile.evidenceCount||evidenceCount(scored.length),policy={...samplingPolicy,ratio:profile.evidenceRatio||samplingPolicy.ratio,count};
  const drawCounts=Object.fromEntries([...new Set(scored.map(x=>x.baseline))].map(method=>[method,scored.filter(x=>x.baseline===method).length]));
  await db().prepare("UPDATE sessions SET status='evidence',selected=?,summary=? WHERE id=? AND status='locking'").bind(JSON.stringify(sampleEvidence(scored,s.id,count)),JSON.stringify({policy,drawCounts,levelCounts:Object.fromEntries(['passage','paragraph','sentence'].map(level=>[level,scored.filter(x=>pairMap.get(x.pairId)?.level===level).length])),correct:scored.filter(x=>x.correct).length,total:scored.length,scored}),s.id).run();return json({ok:true});
 }
 if(b.action==='evidence'){
  if(s.status!=='evidence'||!JSON.parse(s.selected).includes(b.pairId))throw new Error('题目不在证据列表');const p=await displayedPair(b.pairId),entry=b.entry;
  if(!entry||typeof entry.reason!=='string'||entry.reason.trim().length<10||entry.reason.length>5000||!Array.isArray(entry.quotes)||entry.quotes.length<1||entry.quotes.length>12)throw new Error('请选择一级、二级维度，写至少 10 字说明，并添加原文证据');
  const v2=validateDimensions(entry.dimensions),legacy=!['v2','v3','v5','v6'].includes(JSON.parse(s.profile).flowVersion)&&entry.dimensions===undefined&&Array.isArray(entry.factors)&&entry.factors.length>0&&entry.factors.length<=8&&entry.factors.every((f:any)=>['术语与概念','学术立场','论证结构','语言风格','知识与事实','时代语境','其他'].includes(f));
  if(!v2&&!legacy)throw new Error('每个选中的一级维度，至少选择一个属于它的二级要素');
  for(const q of entry.quotes){const t=['A','B'].includes(q.side)?(q.scope==='full'?displayText(p,q.side):q.side==='A'?p.a:p.b):'';if(q.scope!==undefined&&q.scope!=='full')throw new Error('证据必须来自当前题目的准确原文');if(!Number.isInteger(q.start)||!Number.isInteger(q.end)||q.end<=q.start||typeof q.text!=='string'||q.text.length<2||t.slice(q.start,q.end)!==q.text)throw new Error('证据必须来自当前题目的准确原文');}
  const payload={reason:entry.reason.trim(),quotes:entry.quotes.map((q:any)=>({side:q.side,text:q.text,start:q.start,end:q.end,...(q.scope==='full'?{scope:'full'}:{})})),...(v2?{dimensions:entry.dimensions,dimensionVersion,factors:dimensionLabels(entry.dimensions)}:{factors:entry.factors})};
  await db().prepare("INSERT INTO evidence(id,session_id,pair_id,payload,submitted_at) SELECT ?,?,?,?,? WHERE EXISTS(SELECT 1 FROM sessions WHERE id=? AND status='evidence') ON CONFLICT(id) DO UPDATE SET payload=excluded.payload,submitted_at=excluded.submitted_at").bind(s.id+':'+b.pairId,s.id,b.pairId,JSON.stringify(payload),Date.now(),s.id).run();return json({ok:true});
 }
 if(b.action==='finishEvidence'){
  if(s.status==='complete')return json({ok:true});if(s.status!=='evidence')throw new Error('请先完成判断');const e=await db().prepare('SELECT COUNT(*) n FROM evidence WHERE session_id=?').bind(s.id).first<any>();if(e.n!==JSON.parse(s.selected).length)throw new Error('请完成全部 '+JSON.parse(s.selected).length+' 道证据标注');await db().prepare("UPDATE sessions SET status='complete',completed_at=? WHERE id=? AND status='evidence'").bind(Date.now(),s.id).run();return json({ok:true});
 }throw new Error('未知操作');
 }catch(e){return json({error:(e as Error).message},400);}}
