import { annotationStatistics } from '../../../lib/admin-statistics.server';
import {pseudonymize,pseudonymizeProfile} from '../../../lib/author-aliases.server';
import {env} from 'cloudflare:workers';
import {truth} from '../../../lib/pairs';
import {loadPairMetadata} from '../../../lib/pair-library';
export const dynamic='force-dynamic';
export async function GET(req:Request){
 const secret=(env as unknown as {ADMIN_TOKEN?:string}).ADMIN_TOKEN;
 if(!secret||req.headers.get('authorization')!==`Bearer ${secret}`)return Response.json({error:'研究后台需要管理密钥'},{status:403,headers:{'Cache-Control':'no-store'}});
 if(!env.DB)return Response.json({error:'数据库未连接'},{status:503});
 const u=new URL(req.url),id=u.searchParams.get('id'),page=Math.max(0,Math.floor(Number(u.searchParams.get('page'))||0));
 if(u.searchParams.get('mode')==='statistics')return Response.json(await annotationStatistics(),{headers:{'Cache-Control':'no-store'}});
 if(id){const s=await env.DB.prepare('SELECT id,profile,items,status,selected,summary,created_at,completed_at FROM sessions WHERE id=?').bind(id).first<any>();if(!s)return Response.json({error:'记录不存在'},{status:404});const offset=Math.max(0,Math.floor(Number(u.searchParams.get('eventOffset'))||0)),pairId=u.searchParams.get('pairId');const where=pairId?'session_id=? AND pair_id=?':'session_id=?',bindings=pairId?[id,pairId]:[id];const results=await env.DB.batch([env.DB.prepare('SELECT * FROM answers WHERE session_id=?').bind(id),env.DB.prepare('SELECT * FROM evidence WHERE session_id=?').bind(id),env.DB.prepare('SELECT * FROM visits WHERE session_id=? ORDER BY opened_at').bind(id),env.DB.prepare(`SELECT * FROM events WHERE ${where} ORDER BY received_at,id LIMIT 500 OFFSET ?`).bind(...bindings,offset),env.DB.prepare(`SELECT COUNT(*) n FROM events WHERE ${where}`).bind(...bindings)]);const pairMetadata=[...(await loadPairMetadata(JSON.parse(s.items).map((item:{id:string})=>item.id))).values()].map(({id,item_id,author,domain,level,baseline,model,run_id})=>({id,item_id,author:pseudonymize(author),domain,level,method:baseline,model,run_id}));return Response.json({session:{...s,profile:JSON.stringify(pseudonymizeProfile(JSON.parse(s.profile))),summary:s.summary?JSON.stringify(pseudonymizeProfile(JSON.parse(s.summary))):null},pairMetadata,answers:results[0].results,evidence:results[1].results,visits:results[2].results,events:results[3].results,eventTotal:(results[4].results[0] as any).n,eventOffset:offset},{headers:{'Cache-Control':'no-store'}});}
 const total=await env.DB.prepare('SELECT COUNT(*) n FROM sessions').first<any>();
 const sessions=await env.DB.prepare('SELECT id,profile,items,status,selected,summary,created_at,completed_at FROM sessions ORDER BY created_at DESC LIMIT 25 OFFSET ?').bind(page*25).all<any>();
 const sids=sessions.results.map(s=>s.id),marks=sids.map(()=>'?').join(',');
 const collected=sids.length?await env.DB.batch([env.DB.prepare(`SELECT * FROM answers WHERE session_id IN (${marks})`).bind(...sids),env.DB.prepare(`SELECT session_id,pair_id,MIN(opened_at) first_open FROM visits WHERE session_id IN (${marks}) GROUP BY session_id,pair_id`).bind(...sids),env.DB.prepare(`SELECT b.session_id,json_extract(e.value,'$.type') type,COUNT(*) n FROM events b,json_each(b.payload) e WHERE b.session_id IN (${marks}) GROUP BY b.session_id,json_extract(e.value,'$.type')`).bind(...sids)]):[];
 const pairMap=await loadPairMetadata((collected[0]?.results||[]).map(a=>String((a as {pair_id:string}).pair_id)));
 const records=[];
 for(const s of sessions.results){const p=pseudonymizeProfile(JSON.parse(s.profile)),summary=s.summary?pseudonymizeProfile(JSON.parse(s.summary)):null;const answers=collected[0].results.filter((a:any)=>a.session_id===s.id) as any[];const visits=collected[1].results.filter((v:any)=>v.session_id===s.id) as any[];const counts=Object.fromEntries(collected[2].results.filter((e:any)=>e.session_id===s.id).map((e:any)=>[e.type,e.n]));const items=JSON.parse(s.items);const scored=answers.map(a=>{const pair=pairMap.get(a.pair_id),flip=items.find((i:any)=>i.id===a.pair_id)?.flip; if(!pair)return {...a,correct:null};return {...a,author:pseudonymize(pair.author),baseline:pair.baseline,model:pair.model,runId:pair.run_id,level:pair.level||'passage',real:truth(pair,flip),correct:a.choice===truth(pair,flip),wallMs:a.submitted_at-(visits.find((v:any)=>v.pair_id===pair.id)?.first_open||a.submitted_at)};});const flags=[];if(scored.some(a=>a.active_ms<10000))flags.push('存在活跃时间少于10秒的题目');if((counts.hidden||0)>3)flags.push('页面切换较多');if(!counts.move&&p.domain)flags.push('未记录鼠标移动（可能使用触屏或键盘）');records.push({...s,profile:p,summary,answers:scored,eventCounts:counts,flags});}
 return Response.json({total:total.n,page,pageSize:25,records},{headers:{'Cache-Control':'no-store'}});
}
export async function POST(req:Request){
 const secret=(env as unknown as {ADMIN_TOKEN?:string}).ADMIN_TOKEN;
 if(!secret||req.headers.get('authorization')!==`Bearer ${secret}`)return Response.json({error:'研究后台需要管理密钥'},{status:403});
 if(req.headers.get('origin')!==new URL(req.url).origin)return Response.json({error:'请求来源无效'},{status:403});
 if(!env.DB)return Response.json({error:'数据库未连接'},{status:503});
 const body=await req.json() as any;if(body.action!=='clearRecords'||body.confirmation!=='CLEAR_PREVIOUS_TEST_RECORDS')return Response.json({error:'清空参数无效'},{status:400});
 const before=await env.DB.prepare('SELECT COUNT(*) n FROM sessions').first<any>();
 await env.DB.batch([env.DB.prepare("UPDATE sessions SET status='resetting'"),...['answers','evidence','events','visits','sessions'].map(table=>env.DB!.prepare(`DELETE FROM ${table}`))]);
 const remaining=await env.DB.prepare('SELECT COUNT(*) n FROM sessions').first<any>();
 return Response.json({ok:true,cleared:before.n,remaining:remaining.n},{headers:{'Cache-Control':'no-store','Set-Cookie':'apt_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0'}});
}
