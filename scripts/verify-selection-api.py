"""Local-only targeted test, deletes only its own unfinished test round."""
import json,time,uuid,urllib.request,urllib.error,http.cookiejar
from pathlib import Path
origin='http://127.0.0.1:5173';jar=http.cookiejar.CookieJar();client=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar));instance=str(uuid.uuid4())
def call(action=None,body=None,path='/api/annotation',expected=200,headers=None):
 req=urllib.request.Request(origin+path,data=json.dumps({'action':action,**(body or {})}).encode() if action else None,headers={'Origin':origin,'Content-Type':'application/json','X-APT-Client-ID':instance,**(headers or {})})
 try:
  with client.open(req) as res:status=res.status;out=json.load(res)
 except urllib.error.HTTPError as e:status=e.code;out=json.load(e)
 assert status==expected,(action,status,out)
 return out
call('start',{'profile':{'domain':'law','authors':['顾承远'],'role':'general','consent':True},'count':3});s=call();sid=s['id'];assert s['profile']['selectionPolicy']['thresholdMs']==3000
try:
 for item in s['items']:
  id=item['id'];p=call(path='/api/annotation?mode=pair&id='+id);call('visit',{'pairId':id});full=p['a'] if p['level']=='passage' else p['contextBefore']+p['a']+p['contextAfter'];start=max(0,len(p['contextBefore'])-4) if p['level']!='passage' else 0;text=full[start:start+30];now=int(time.time()*1000)
  dwell={'id':str(uuid.uuid4()),'phase':'start','side':'A','text':text,'start':start,'end':start+len(text),'scope':'full','startedAt':now-3600,'durationMs':3500,'rects':[{'x':200,'y':300,'width':200,'height':22}]}
  batch={'pairId':id,'batchId':str(uuid.uuid4()),'events':[{'type':'move','t':now-2000,'x':200,'y':300,'w':1280,'h':720},{'type':'selection_dwell','t':now,'w':1280,'h':720,'dwell':dwell}]}
  call('events',batch);call('events',batch)
  for invalid in [{'text':'forged text'},{'durationMs':1000},{'start':-1},{'side':'C'}]:
   call('events',{'pairId':id,'batchId':str(uuid.uuid4()),'events':[{'type':'selection_dwell','t':now,'dwell':{**dwell,**invalid}}]},expected=400)
 key=Path('.dev.vars').read_text().strip().split('=',1)[1];detail=call(path='/api/admin?id='+sid,headers={'Authorization':'Bearer '+key});assert len(detail['events'])==3
 for row in detail['events']:
  events=json.loads(row['payload']);assert [e['type'] for e in events]==['move','selection_dwell'];assert events[1]['dwell']['durationMs']==3500 and events[1]['dwell']['stage']=='judgment'
 summary=next(r for r in call(path='/api/admin',headers={'Authorization':'Bearer '+key})['records'] if r['id']==sid);assert summary['eventCounts']['move']==3 and summary['eventCounts']['selection_dwell']==3
 print('PASS: dwell text and matching mouse events persist for passage/paragraph/sentence; exact offsets validated, forged/short records rejected, retries deduplicated, unfinished records inspectable.')
finally:call('reset')
