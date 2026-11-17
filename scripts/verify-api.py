"""Local-only integration verification; never run against production."""
import json,urllib.request,urllib.error,http.cookiejar,time,uuid
from pathlib import Path
origin='http://127.0.0.1:5173'
jar=http.cookiejar.CookieJar();client=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))
instance=str(uuid.uuid4())
def call(action=None,body=None,path='/api/annotation',expected=200,anonymous=False,extra=None):
    data=json.dumps({'action':action,**(body or {})}).encode() if action else None
    req=urllib.request.Request(origin+path,data=data,headers={'Origin':origin,'Content-Type':'application/json','X-APT-Client-ID':instance,**(extra or {})})
    try:
        r=(urllib.request.urlopen(req) if anonymous else client.open(req));status=r.status;result=json.load(r)
    except urllib.error.HTTPError as e:status=e.code;result=json.load(e)
    assert status==expected,(action,path,status,result)
    return result
def finish_reading():
    state=call();assert state['status']=='reading' and state['items']==[]
    call('finishReading',expected=400)
    call(path='/api/annotation?mode=pair&id=pair_002b19277d600a659af2dd9a',expected=400)
    if len(state['profile']['authors'])>1:call('readOpen',dict(author=state['profile']['authors'][1]),expected=400)
    for author in state['profile']['authors']:
        material=call('readOpen',dict(author=author));assert 'persona' in material['material'] and 'biography' in material['material']
        assert ('examples' in material['material'])==(state['profile']['role']=='full')
        assert ('works' in material['material'])==(state['profile']['role']=='full')
        call('readDone',dict(author=author,reachedEnd=True,confirmed=True,activeSeconds=999),expected=400)
        time.sleep(material['minimumSeconds']+.1)
        call('readDone',dict(author=author,reachedEnd=False,confirmed=True,activeSeconds=material['minimumSeconds']),expected=400)
        call('readDone',dict(author=author,reachedEnd=True,confirmed=True,activeSeconds=material['minimumSeconds']))
    call('finishReading');assert call()['status']=='judgment'

setup=call(path='/api/annotation?mode=catalog');assert setup['total']==630 and len(setup['authors'])==21 and len(setup['domains'])==5
assert 'pairs' not in setup
profile=dict(domain='law',authors=['顾承远','沈怀川'],primary='03',secondary='0302',role='basic',familiarity=3,consent=True,peer='small')
call('start',dict(profile=profile,count=0),expected=400)
call('start',dict(profile=profile,count=12,ids=['fake']),expected=400)
call('start',dict(profile={**profile,'secondary':'0201'},count=12),expected=400)
call('start',dict(profile={**profile,'domain':'philosophy','authors':[]},count=12),expected=400)
call('start',dict(profile=profile,count=12));finish_reading();s=call();sid=s['id'];assert s['status']=='judgment' and s['profile']['peer']=='large'
assert s['profile']['evidenceCount']==2 and s['profile']['primary']=='03'
ids=[p['id'] for p in s['items']];assert len(ids)==len(set(ids))==12 and all(p['author'] in profile['authors'] for p in s['items'])
pool={p['id']:p for p in json.loads(Path('data/pairs-release.json').read_text())}
counts=[sum(pool[id]['level']==level for id in ids) for level in ['passage','paragraph','sentence']];assert counts==[4,4,4]
assert len(set(pool[id]['author'] for id in ids))==2
call('finishJudgment',expected=400)
call(path='/api/annotation?mode=pair&id=finance-scholar004_101',expected=400)
call(path='/api/admin',expected=403)
for i,id in enumerate(ids):
    p=call(path='/api/annotation?mode=pair&id='+id);assert 'real' not in p
    call('answer',dict(pairId=id,choice='A',confidence=6,activeMs=100),expected=400)
    call('visit',dict(pairId=id))
    call('answer',dict(pairId=id,choice='AB',confidence=3,activeMs=100),expected=400)
    call('answer',dict(pairId=id,choice='AB'[i%2],confidence=i%5+1,activeMs=100))
    batch=dict(pairId=id,batchId='dedup-'+str(i),events=[dict(type='move',t=int(time.time()*1000),x=100,y=200,w=1440,h=1000)])
    call('events',batch);call('events',batch)
call('finishJudgment');s=call();assert s['status']=='evidence' and len(set(s['selected']))==2
assert 'summary' not in s and 'correct' not in json.dumps(s)
call('answer',dict(pairId=ids[0],choice='B',confidence=5,activeMs=1),expected=400)
call('finishEvidence',expected=400)
for id in s['selected']:
    p=call(path='/api/annotation?mode=pair&id='+id);q=p['a'][:30]
    entry=dict(dimensions=[dict(primary='style',secondary=['rhetoric','syntax']),dict(primary='topic',secondary=['object'])],reason='测试记录：该文段用语与论证语气构成选择依据。',quotes=[dict(side='A',text='伪造证据',start=0,end=4)])
    call('evidence',dict(pairId=id,entry=entry),expected=400)
    entry['quotes']=[dict(side='A',text=q,start=0,end=len(q))]
    call('evidence',dict(pairId=id,entry=entry))
    full=p['a'] if p['level']=='passage' else p['contextBefore']+p['a']+p['contextAfter']
    start=max(0,len(p['contextBefore'])-5) if p['level']!='passage' else 0
    entry['quotes']=[dict(side='A',text=full[start:start+30],start=start,end=start+30,scope='full')]
    call('evidence',dict(pairId=id,entry=entry))
call('finishEvidence');assert call()['status']=='complete'
key=Path('.dev.vars').read_text().strip().split('=',1)[1]
detail=call(path='/api/admin?id='+sid,extra={'Authorization':'Bearer '+key})
assert len(detail['answers'])==12 and len(detail['evidence'])==2 and len(detail['events'])==12
assert all(json.loads(e['payload'])['dimensionVersion']=='persona-evidence-v2' and json.loads(e['payload'])['quotes'][0]['scope']=='full' for e in detail['evidence'])
summary=call(path='/api/admin',extra={'Authorization':'Bearer '+key});assert any(r['id']==sid and r['summary']['total']==12 for r in summary['records'])
assert call(path='/api/annotation',anonymous=True,expected=400)
for author,primary,secondary,peer in [('沈怀川','03','0301','small'),('顾承远','03','0301','small'),('顾承远','02','0201','cross')]:
    call('start',dict(profile={**profile,'authors':[author],'primary':primary,'secondary':secondary,'peer':'wrong'},count=1));r=call();assert r['profile']['peer']==peer and r['profile']['evidenceCount']==1
call('start',dict(profile={**profile,'domain':'finance','authors':['John Maynard Keynes'],'primary':'02','secondary':'0201'},count=5));finish_reading();r=call();assert r['profile']['peer']=='small' and all(p['author']=='John Maynard Keynes' for p in r['items'])
unfinished=r['id'];id=r['items'][0]['id'];call('visit',dict(pairId=id));call('answer',dict(pairId=id,choice='A',confidence=3,activeMs=10))
call(path='/api/annotation',expected=400,extra={'X-APT-Client-ID':str(uuid.uuid4())})
call('reset');call(path='/api/annotation',expected=400)
call(path='/api/admin?id='+unfinished,extra={'Authorization':'Bearer '+key},expected=404)
completed=call(path='/api/admin?id='+sid,extra={'Authorization':'Bearer '+key});assert completed['session']['status']=='complete'
call('start',dict(profile={**profile,'role':'general'},count=3));assert call()['status']=='judgment'
call('readOpen',dict(author='顾承远'),expected=400)
call('reset')
call('start',dict(profile={**profile,'authors':['顾承远'],'role':'full','researchArea':'Local test','careerStage':'faculty'},count=1))
full=call('readOpen',dict(author='顾承远'));assert len(full['material']['examples'])==2 and len(full['material']['works'])==1
call('finishReading',expected=400);call('reset')
call('clearRecords',dict(confirmation='CLEAR_PREVIOUS_TEST_RECORDS'),path='/api/admin',expected=403)
cleared=call('clearRecords',dict(confirmation='CLEAR_PREVIOUS_TEST_RECORDS'),path='/api/admin',extra={'Authorization':'Bearer '+key});assert cleared['remaining']==0
assert call(path='/api/admin',extra={'Authorization':'Bearer '+key})['total']==0
print('PASS: reading-stage gates, role-specific materials, exact evidence plus page-instance isolation, refresh reset, deletion of unfinished rounds, preservation of fully submitted data, and authorized all-record cleanup. Local test database is empty.')
