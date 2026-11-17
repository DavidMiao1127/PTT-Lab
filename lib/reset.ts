import {env} from 'cloudflare:workers';
export async function eraseSession(id:string){
 if(!env.DB)throw new Error('数据库未连接');
 await env.DB.batch([
  env.DB.prepare("UPDATE sessions SET status='resetting' WHERE id=?").bind(id),
  ...['answers','evidence','events','visits'].map(table=>env.DB!.prepare(`DELETE FROM ${table} WHERE session_id=?`).bind(id)),
  env.DB.prepare('DELETE FROM sessions WHERE id=?').bind(id)
 ]);
}
