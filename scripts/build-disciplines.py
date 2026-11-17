"""Extract official national catalogues; retain legacy hierarchy without invented remappings."""
import re,json
from pathlib import Path
from html.parser import HTMLParser
root=Path(__file__).resolve().parents[1]
class Text(HTMLParser):
 def __init__(self):super().__init__();self.parts=[]
 def handle_data(self,s):self.parts.append(s)
 def handle_starttag(self,tag,attrs):
  if tag in ['p','br','tr','td']:self.parts.append('\n')
p=Text();p.feed((root/'.sites-runtime/disciplines-1997.html').read_text());old=''.join(p.parts)
entries={code:re.sub(r'\s+',' ',name).strip() for code,name in re.findall(r'^\s*(\d{4}|\d{6})\s+([^\n]+)',old,re.M)}
legacyPrimary={k:v for k,v in entries.items() if len(k)==4};second={k:v for k,v in entries.items() if len(k)==6}
current={code:re.split(r'[（(]',name)[0].strip() for code,name in re.findall(r'^\s*(\d{4})\s+([^\n]+)',(root/'.sites-runtime/disciplines-2022.txt').read_text(),re.M) if code[2]<'5'}
assert len(legacyPrimary)==89,len(legacyPrimary)
assert len(second)==386,len(second)
assert len(current)==117 or len(current)==111,len(current)
out=[];used=set()
# Only names/codes unchanged or unambiguous official renamings share a hierarchy.
renamed={'1202':'工商管理学','1204':'公共管理学','1205':'信息资源管理'}
for code,name in sorted(current.items()):
 oldName=re.split(r'[（(]',legacyPrimary.get(code,''))[0].strip()
 matches=code in legacyPrimary and (oldName==name or renamed.get(code)==name)
 children=[{'code':k,'name':v,'version':'1997'} for k,v in second.items() if matches and k.startswith(code)]
 if matches:used.add(code)
 out.append({'code':code,'name':name,'version':'2022','secondary':children})
for code,name in sorted(legacyPrimary.items()):
 if code in used:continue
 out.append({'code':'legacy-'+code,'name':re.split(r'[（(]',name)[0].strip(),'version':'1997','secondary':[{'code':k,'name':v,'version':'1997'} for k,v in second.items() if k.startswith(code)]})
assert sum(len(p['secondary']) for p in out)==386
meta={'version':'moe-2022-primary+1997-secondary-v1','sources':[{'title':'研究生教育学科专业目录（2022年）','url':'https://www.moe.gov.cn/srcsite/A22/moe_833/202209/t20220914_660828.html'},{'title':'授予博士、硕士学位和培养研究生的学科、专业目录（1997年）','url':'https://www.moe.gov.cn/srcsite/A22/moe_833/moe_834/200512/t20051223_88437.html'}],'primary2022Count':len(current),'secondary1997Count':len(second),'primary':out}
(root/'data/disciplines.json').write_text(json.dumps(meta,ensure_ascii=False,indent=2))
print(json.dumps({'currentPrimary':len(current),'legacySupplement':len(out)-len(current),'secondary':len(second)},ensure_ascii=False))
