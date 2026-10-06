import fs from 'node:fs';
import crypto from 'node:crypto';
const awaitHash=(s:string)=>crypto.createHash('sha256').update(s).digest('hex').slice(0,32);
import * as cheerio from 'cheerio';
import robotsParser from 'robots-parser';
import {fetch,EnvHttpProxyAgent} from 'undici';
import {buildDataset} from './dataset';
import {normalize,slug} from '../lib/catalog';
import {assertAllowed} from '../lib/validation';
const agent=new EnvHttpProxyAgent(),ua='ChatGPT-User; personal Elden Ring reference archive';
const output='data/enrichment/web.json';
const baseline=buildDataset();
const index=new Map(baseline.map(e=>[normalize(e.nameEn).replace(/[’]/g,"'"),e]));
const robots=new Map<string,ReturnType<typeof robotsParser>>();
const last=new Map<string,number>();const blocked=new Set<string>();
async function get(url:string){
 const u=new URL(url);if(blocked.has(u.hostname))throw Error('Host denied an earlier request'); if(!['namu.wiki','eldenring.wiki.gg'].includes(u.hostname))throw Error('Unapproved source');
 if(!robots.has(u.origin)){const r=await fetch(u.origin+'/robots.txt',{dispatcher:agent,headers:{'User-Agent':ua}});if(!r.ok)throw Error('robots unavailable');robots.set(u.origin,robotsParser(u.origin+'/robots.txt',await r.text()));}
 if(robots.get(u.origin)!.isAllowed(url,'ChatGPT-User')===false)throw Error('robots prohibited');
 const wait=Math.max(0,1200-(Date.now()-(last.get(u.origin)??0)));if(wait)await new Promise(r=>setTimeout(r,wait));last.set(u.origin,Date.now());
 const r=await fetch(url,{dispatcher:agent,headers:{'User-Agent':ua},signal:AbortSignal.timeout(30000)});if(r.status===403||r.status===429)blocked.add(u.hostname);if(!r.ok)throw Error(`HTTP ${r.status}`);const t=await r.text();if(t.length>8000000)throw Error('Response too large');return t;
}
const records=new Map<string,any>((fs.existsSync(output)?JSON.parse(fs.readFileSync(output,'utf8')):[]).map((e:any)=>[e.id,e]));
const report:{url:string;status:string;count?:number}[]=[];
const assets=new Map<string,any>((fs.existsSync('data/assets.json')?JSON.parse(fs.readFileSync('data/assets.json','utf8')):[]).map((e:any)=>[e.id,e]));
const today=new Date().toISOString();
function asset(url:string,source:string,kind='icon'){
 if(!url)return undefined;url=new URL(url,'https://eldenring.wiki.gg').href;
 if(!['eldenring.wiki.gg','i.namu.wiki'].includes(new URL(url).hostname))return undefined;
 const id='asset-'+(awaitHash(url));
 assets.set(id,{...assets.get(id),id,url,source,kind,rights:'게임 이미지: FromSoftware / Bandai Namco. 위키에서 참조한 개인용 로컬 캐시. 재배포 허가 확인 안 됨.'});return id;
}
function add(raw:any){assertAllowed(raw);const key=normalize(raw.nameEn).replace(/[’]/g,"'");const e=index.get(key);const id=e?.id??`${raw.category}-${slug(raw.nameEn)}`;const prev=records.get(id);if(raw.details?.defenceBasis==='최대 강화 표'&&prev?.details)delete prev.details.defence;if(raw.details?.scalingBasis==='최대 강화 표 (기본 보정 미수집)'&&prev?.details)delete prev.details.scaling;records.set(id,{...prev,...raw,nameKo:prev?.translationPending===false&&raw.translationPending===undefined?prev.nameKo:raw.nameKo,id,details:{...prev?.details,...raw.details},sources:[...new Map([...(prev?.sources??[]),...(raw.sources??[])].map((s:any)=>[s.url,s])).values()]});}
const labels:Record<string,string>={'근력':'str','기량':'dex','지력':'int','신앙':'fai','신비':'arc','물리':'physical','마력':'magic','화염':'fire','벼락':'lightning','신성':'holy','치명':'critical','가드 강도':'guardBoost'};
function num(v:string){if(/^\s*-\s*$/.test(v))return 0;const m=v.match(/\d+(?:\.\d+)?/);return m?Number(m[0]):undefined;}
export function parseWeapons(html:string,url:string){
 const $=cheerio.load(html);let count=0;
 $('h2,h3,h4,h5').each((_,heading)=>{
  const h=$(heading),original=h.text();let w=h;
  while(w.parent().length&&w.parent().find('h2,h3,h4,h5').length===1)w=w.parent();
  const body=w.next();const tables=body.find('table');if(!tables.length||!tables.first().text().includes('무기 상세 정보'))return;
  const clean=h.clone();clean.find('.wiki-fn-content,.wiki-edit-section,a[id]').remove();const ko=clean.text().replace(/^\s*\d[\d.]*\s*/,'').trim();
  const strong=body.find('.wiki-paragraph > strong').filter((_,e)=>/^[A-Za-z]/.test($(e).text())).first().text();
  const en=strong.split('/')[0].trim();if(!en||en.length>100||!ko)return;
  const details:Record<string,any>={},attack:Record<string,number>={},max:Record<string,number>={},defence:Record<string,number>={};let guardMaximumOnly=false;
  tables.first().find('tr').each((_,tr)=>{const cells=$(tr).children('td,th').map((_,x)=>$(x).text().trim()).get();for(let i=0;i<cells.length-1;i+=2){const k=cells[i],v=cells[i+1];if(k==='중량')details.weight=num(v);if(k==='무기 유형')details.weaponType=v;if(k==='속성')details.damageType=v.split('/').map(s=>s.trim());if(k==='전투 기술')details.skill=v;if(k==='소모 FP')details.fpCost=v;}});
  tables.each((_,table)=>{
   const t=$(table),text=t.text();const rows=t.find('tr').map((_,tr)=>[$(tr).children('td,th').map((_,td)=>$(td).text().trim()).get()]).get() as string[][];
   if(text.includes('전투 능력치')){guardMaximumOnly=text.includes('최대')&&!text.includes('기본');details.defenceBasis=guardMaximumOnly?'최대 강화 표':'기본 수치 표';}if(text.includes('전투 능력치'))for(const row of rows){if(row.length!==4)continue;const a=labels[row[0]],b=labels[row[2]];if(a){const parts=row[1].split(/~|～/);const first=num(parts[0]);if(first!==undefined){if(text.includes('기본'))attack[a]=first;if(parts.length>1)max[a]=num(parts[1])??first;else if(text.includes('최대')&&!text.includes('기본'))max[a]=first;}}if(b){const value=num(row[3]);if(value!==undefined)defence[b]=value;}}
   if(text.startsWith('필요 능력치')){const r=rows.findIndex(r=>r.includes('근력'));if(r>=0&&rows[r+1])details.requirements=Object.fromEntries(rows[r].map((k,i)=>[labels[k]??k,num(rows[r+1][i]??'-')??0]));}
   if(text.startsWith('능력 보정')){const r=rows.findIndex(r=>r.includes('근력'));if(r>=0&&rows[r+1]){const maximumOnly=text.includes('최대')&&!text.includes('기본');details.scalingBasis=maximumOnly?'최대 강화 표 (기본 보정 미수집)':'기본~최대 강화 표';const pairs=rows[r].map((k,i)=>[labels[k],rows[r+1][i]??'-']).filter(([k])=>['str','dex','int','fai','arc'].includes(k));if(!maximumOnly)details.scaling=Object.fromEntries(pairs.map(([k,v])=>[k,v.split(/\s+-\s+/)[0]]));details.scalingMax=Object.fromEntries(pairs.map(([k,v])=>[k,v.split(/\s+-\s+/).at(-1)]));}}
  });
  if(Object.keys(attack).length)details.attack=attack;if(Object.keys(max).length)details.attackMax=max;if(Object.keys(defence).length)details[guardMaximumOnly?'defenceMax':'defence']=defence;
  details.upgrade=original.includes('색단석')?'색 잃은 단석':'단석';details.maxUpgrade=original.includes('색단석')?10:25;
  const img=body.find('img').first().attr('src');const imageUrl=img?new URL(img,'https://namu.wiki').href:undefined;const assetId=imageUrl?asset(imageUrl,url):undefined;if(assetId)details.assetId=assetId;
  const anchor=h.find('span[id]').first().attr('id')??ko;
  const known=index.get(normalize(en).replace(/[’]/g,"'"));
  // New records require an explicit DLC marker. Unknown base names can be cut content.
  if(!known&&!original.includes('[DLC]'))return;
  try{add({nameKo:ko,nameEn:en,category:details.weaponType?.includes('방패')?'shields':'weapons',subtype:details.weaponType,content_type:original.includes('[DLC]')?'shadow_of_the_erdtree':known?.content_type??'base_game',translationPending:false,details,imageUrl,imageSource:imageUrl?url:undefined,sources:[{title:'나무위키 · 무기 표',url:url+'#'+encodeURIComponent(anchor),checkedAt:today,note:'정형 수치와 명칭만 추출. 기본·최대 강화 수치 구분. 설명문 복사 없음. 패치 및 표 오류 재검토 필요.'}]});count++;}catch{}
 });return count;
}
// Index pages supply imagery only for known entries; no automatic scope inference from a shared index.
function parseGallery(html:string,url:string){const $=cheerio.load(html);let count=0;$('.mw-parser-output .gallerybox').each((_,el)=>{const img=$(el).find('img').first(),link=$(el).find('a[title]').first(),en=link.attr('title')??img.attr('alt')??'';const key=normalize(en).replace(/[’]/g,"'");const e=index.get(key)??[...records.values()].find(r=>normalize(r.nameEn).replace(/[’]/g,"'")===key);if(!e)return;const src=img.attr('src');if(!src)return;const imageUrl=new URL(src.replace(/\/120px-/,'/240px-'),'https://eldenring.wiki.gg').href;const id=asset(imageUrl,url);if(!id)return;const existing=records.get(e.id);const keep=existing?.imageUrl?.includes('i.namu.wiki');add({nameEn:e.nameEn,nameKo:e.nameKo,category:e.category,content_type:e.content_type,imageUrl:keep?existing.imageUrl:imageUrl,imageSource:keep?existing.imageSource:url,details:{assetId:keep?existing.details.assetId:id},sources:[{title:'Eldenpedia · 이미지 목록',url,checkedAt:today,note:'그림 출처 확인. 수치의 독립 검증으로 간주하지 않음.'}]});count++;});return count;}
const weapons=['소형 무기','중형 무기','대형 무기','특대형 무기','긴 자루 무기','원거리 무기','촉매','방패'];
for(const name of weapons){const url='https://namu.wiki/w/'+encodeURIComponent('엘든 링/무기/'+name);try{const count=parseWeapons(await get(url),url);report.push({url,status:'ok',count});console.log(name,count);}catch(e){report.push({url,status:String(e)});console.log(name,String(e));}}
for(const page of (process.argv.includes('--saved')?['Weapons','Talismans']:['Weapons','Shields','Talismans','Armor','Sorceries','Incantations','Spirit_Ashes','Ashes_of_War'])){const url='https://eldenring.wiki.gg/wiki/'+page;try{const saved:Record<string,string>={Weapons:'/tmp/er-research/wiki-weapons.html',Talismans:'/tmp/er-research/wiki-talismans.html'};const html=process.argv.includes('--saved')&&saved[page]?fs.readFileSync(saved[page],'utf8'):await get(url);const count=parseGallery(html,url);report.push({url,status:'ok',count});console.log(page,count);}catch(e){report.push({url,status:String(e)});}}
fs.mkdirSync('data/enrichment',{recursive:true});fs.writeFileSync(output,JSON.stringify([...records.values()],null,2)+'\n');fs.writeFileSync('data/assets.json',JSON.stringify([...assets.values()],null,2)+'\n');fs.writeFileSync('data/enrichment/report.json',JSON.stringify({collectedAt:today,report,records:records.size,assets:assets.size,skipped:[{site:'Fextralife',reason:'robots explicitly forbids automated harvesting'},{site:'Naver Blog',reason:'robots prohibits retrieval/RAG'},{site:'wiki.gg map marker API',reason:'robots disallows /api.php and /rest.php'}]},null,2)+'\n');await agent.destroy();
