import fs from 'node:fs';
import path from 'node:path';
import { normalize, slug } from '../lib/catalog';
import { validateEntry, type EntryInput } from '../lib/validation';
const COMMIT = '1d2626ceda5eb8c08997e345e303344a64edc106';
const translations: Record<string,string> = JSON.parse(fs.readFileSync('data/translations.json','utf8'));
const normalizedTranslations = new Map(Object.entries(translations).map(([k,v])=>[normalize(k),v]));
const fields: Record<string,string> = { Phy:'physical', Mag:'magic', Magic:'magic', Fire:'fire', Ligt:'lightning', Holy:'holy', Crit:'critical', Boost:'guardBoost', Str:'str', Dex:'dex', Int:'int', Fai:'fai', Arc:'arc', Intelligence:'int', Faith:'fai', Arcane:'arc', Strike:'strike', Slash:'slash', Pierce:'pierce', Immunity:'immunity', Robustness:'robustness', Focus:'focus', Vitality:'vitality', Poise:'poise' };
const subtypes: Record<string,string> = { Katana:'도', 'Curved Sword':'곡검', 'Curved Greatsword':'대곡검', Greatsword:'대검', 'Colossal Sword':'특대검', Sword:'직검', 'Straight Sword':'직검', Dagger:'단검', Axe:'도끼', Greataxe:'대형 도끼', Hammer:'망치', 'Great Hammer':'대형 망치', 'Colossal Weapon':'특대 무기', Spear:'창', 'Great Spear':'대형 창', Halberd:'도끼창', Reaper:'낫', Fist:'주먹', Claw:'손톱', Whip:'채찍', Twinblade:'쌍날검', 'Glintstone Staff':'지팡이', 'Sacred Seal':'성인', 'Leg Armor':'다리', 'Chest Armor':'몸통', 'Head Armor':'머리', 'Gauntlets':'팔', 'Light Bow':'소형 활', Bow:'활', Greatbow:'대궁', Crossbow:'석궁', Ballista:'발리스타' };
function stats(arr: unknown) {
  if (!Array.isArray(arr)) return undefined;
  return Object.fromEntries(arr.map(r=>[fields[r.name]??r.name,r.amount??r.scaling]));
}
// Known unobtainable/cut records in the upstream dump. Keep them out of a play database.
const unavailable = /Entwining Umbilical Cord|Deathbed Smalls|Brave's|Ragged |Miranda's Prayer|Grass Hair Ornament|Millicent's (Armor|Gloves|Boots)|Godfrey The Grafted|Bloodhunter Raz/i;
const endgame = /malenia|maliketh|elden beast|radagon of|mohg|hoarah|gideon ofnir|placidusax|farum azula|haligtree|elphael|consecrated|forge of the giants|mountaintops|castle sol|nokron|nokstella|lake of rot|moonlight altar|three fingers|dark moon greatsword|ranni's dark moon|shard of alexander|millicent's prosthesis|sacred relic sword/i;
export function buildDataset(includeEnrichment=true): EntryInput[] {
  const all = new Map<string,EntryInput>();
  const english = new Map<string,string>();
  for (const file of fs.readdirSync('data/upstream').filter(f=>f.endsWith('.json')).sort()) {
    const table = file.replace('.json','');
    const category = table === 'armors' ? 'armor' : table;
    const rows = JSON.parse(fs.readFileSync(path.join('data/upstream',file),'utf8'));
    for (const row of rows) {
      if (unavailable.test(row.name)) continue;
      const en = String(row.name).trim();
      let id = `${category}-${slug(en)}`;
      if (all.has(id)) id += '-'+row.id.slice(0,8);
      const ko = normalizedTranslations.get(normalize(en));
      const detail: Record<string,unknown> = {};
      for (const [target,key] of Object.entries({ attack:'attack', defence:'defence', scaling:'scalesWith', requirements:'requiredAttributes', damageNegation:'dmgNegation', resistance:'resistance' })) {
        const value = stats(row[key]); if (value) detail[target]=value;
      }
      if (row.requires) detail.requirements=stats(row.requires);
      for (const [target,key] of Object.entries({ weight:'weight', region:'region', location:'location', hp:'healthPoints', drops:'drops', role:'role', effect: row.effect?'effect':'effects', fpCost: row.cost!==undefined?'cost':'fpCost', slots:'slots', affinity:'affinity', skill:'skill', hpCost:'hpCost' })) {
        if (row[key] !== undefined && row[key] !== null && row[key] !== '???') detail[target]=row[key];
      }
      detail.sourceVersion='2022-05-31 공개 데이터 · 최신 패치 교차 확인 필요';
      let subtype=subtypes[row.category]??row.category??row.type??'';
      if (category==='locations') {
        subtype=/catacombs/i.test(en)?'지하묘지':/tunnel/i.test(en)?'갱도':/cave/i.test(en)?'동굴':/evergaol/i.test(en)?'봉인감옥':/castle|manor/i.test(en)?'던전':'장소';
      }
      const e=validateEntry({ id, nameKo:ko??en, nameEn:en, category, subtype, content_type:'base_game', translationPending:!ko, verification_status:'needs_review',
        acquisition:row.location??'', details:detail, spoiler:endgame.test(en+' '+(row.location??'')),
        sources:[{title:'Elden Ring API · 공개 사실 데이터',url:`https://github.com/deliton/eldenring-api/blob/${COMMIT}/api/public/data/${table}.json`,note:'2022-05-31 스냅샷. 수집한 수치이며 독립 교차 검증이 아닙니다. 설명문·이미지 제외.',checkedAt:null}],
      });
      all.set(id,e);
      if (!english.has(normalize(en))) english.set(normalize(en),id);
    }
  }
  for (const type of ['base-game','shadow-of-the-erdtree']) {
    const rows = JSON.parse(fs.readFileSync(`data/${type}/curated.json`,'utf8'));
    for (const raw of rows) {
      const id = english.get(normalize(raw.nameEn)) ?? `${raw.category}-${slug(raw.nameEn)}`;
      const prev = all.get(id);
      const e=validateEntry({ ...prev, ...raw, id, details:{...prev?.details,...raw.details}, sources:[...(prev?.sources??[]),{
        title:'Elden Ring Wiki · 검토용 문서',url:`https://eldenring.wiki.gg/wiki/${encodeURIComponent(raw.nameEn.replaceAll(' ','_'))}`,
        note:'직접 작성한 간결한 사실 요약. 링크는 검토용이며 이번 작업에서 해당 페이지를 읽거나 수치를 교차 확인하지 못했습니다.',checkedAt:null,
      }] });
      all.set(id,e); english.set(normalize(e.nameEn),id);
    }
  }
  function find(en:string) { return english.get(normalize(en)); }
  function link(from:string,to:string,label:string) {
    const a=find(from),b=find(to); if(!a||!b||a===b)return;
    const e=all.get(a)!; if(!e.relations.some(r=>r.toId===b&&r.label===label))e.relations.push({toId:b,label});
  }
  // Exact region/location/drop names generate relationships; never fuzzy-match unrelated entities.
  for (const e of all.values()) {
    for (const key of ['region','location']) {
      const n=e.details[key]; if(typeof n==='string') link(e.nameEn,n,key==='region'?'등장 지역':'위치');
    }
    if(Array.isArray(e.details.drops)) for(const n of e.details.drops) if(typeof n==='string')link(e.nameEn,n,'드랍');
  }
  const overrides: [string,string,string,Record<string,unknown>][] = [
    ['Moonveil','게르 갱도의 용암토룡 처치','지력·기량에 맞춘 도. 마력 피해와 출혈 축적을 함께 활용합니다.',{skill:'순간의 달그림자',skillChangeable:false,upgrade:'색 잃은 단석',maxUpgrade:10,damageType:['참격','관통'],effect:'출혈 축적'}],
    ['Dark Moon Greatsword','라니 퀘스트 완료','달빛으로 강화하는 지력 중심 대검입니다.',{skill:'월광검',upgrade:'색 잃은 단석',maxUpgrade:10,skillChangeable:false}],
    ['Bloodhound\'s Fang','주인 잃은 사냥개의 봉인감옥 · 대리윌 처치','기량 중심 대곡검. 고유 전투 기술로 공격과 후퇴를 이어갑니다.',{upgrade:'색 잃은 단석',maxUpgrade:10,skillChangeable:false}],
    ['Malenia, Blade Of Miquella','성수 최하층','미켈라의 성수 가장 깊은 곳에서 만나는 선택 보스입니다.',{region:'Miquella\'s Haligtree',location:'Haligtree Roots',optional:true,required:false,spiritSummon:true,parry:true,phases:{'1페이즈':'검격과 물새 난격. 공격이 막혀도 보스의 회복에 주의합니다.','2페이즈':'붉은 에오니아와 부패 공격이 추가됩니다.'},tips:'공격을 받아 회복시키지 않도록 회피와 안전한 반격을 우선합니다.'}],
    ['Ranni The Witch','라니의 마술사탑','카리아 왕가의 마녀. 여러 지하 지역과 이어지는 퀘스트의 중심 인물입니다.',{location:'Ranni\'s Rise',route:['엘레의 교회 (선택적 조우)','라니의 마술사탑','에인세르 강','월광의 제단']}],
    ['Dragoncrest Greatshield Talisman','성수 버팀목 에브레펠','물리 피해 경감에 활용하는 탈리스만입니다.',{effect:'물리 경감률 강화. PvE와 PvP 효과가 다르므로 수치 확인이 필요합니다.',legendary:true}],
  ];
  for (const [en,acquisition,summary,details] of overrides) {const id=find(en);if(id){const e=all.get(id)!;Object.assign(e,{acquisition,summary,details:{...e.details,...details}});}}
  const connections = [
    ['Moonveil','Gael Tunnel','획득 장소'],['Moonveil','Magma Wyrm','드랍 보스'],['Moonveil','Intelligence','요구 능력치'],['Moonveil','Blood Loss','특수 효과'],['Moonveil','Somber Smithing Stone','강화 재료'],
    ['Malenia, Blade Of Miquella','Miquella\'s Haligtree','지역'],['Malenia, Blade Of Miquella','Haligtree Roots','보스방'],['Malenia, Blade Of Miquella','Hand Of Malenia','교환 무기'],['Malenia, Blade Of Miquella','Scarlet Rot','상태 이상'],['Malenia, Blade Of Miquella','Remembrance of the Rot Goddess','드랍'],
    ['Ranni The Witch','Ranni Quest','퀘스트'],['Ranni Quest','Dark Moon Greatsword','보상'],['Ranni The Witch','Blaidd','관련 NPC'],['Ranni The Witch','War Counselor Iji','관련 NPC'],['Ranni The Witch','Preceptor Seluvis','관련 NPC'],
    ['Millicent','Millicent Quest','퀘스트'],['Iron Fist Alexander','Alexander Quest','퀘스트'],['Alexander Quest','Shard Of Alexander','보상'],
    ['Limgrave','Stormveil Castle','던전'],['Limgrave','Church Of Elleh','장소'],['Limgrave','Tree Sentinel','필드 보스'],['Stormveil Castle','Godrick The Grafted','보스'],['Church Of Elleh','Merchant Kalé','상인'],
    ['Gael Tunnel','Magma Wyrm','보스'],['Gravesite Plain','Backhand Blade','무기'],['Gravesite Plain','Belurat, Tower Settlement','던전'],['Belurat, Tower Settlement','Divine Beast Dancing Lion','보스'],['Castle Ensis','Rellana, Twin Moon Knight','보스'],['Rellana, Twin Moon Knight','Rellana\'s Twin Blades','추억 교환'],['Shadow Keep','Messmer the Impaler','보스'],['Messmer the Impaler','Spear of the Impaler','추억 교환'],
    ['Two-Headed Turtle Talisman','Green Turtle Talisman','같은 계열'],['Pearldrake Talisman +3','Pearldrake Talisman','같은 계열'],['Enter the Realm of Shadow','Mohg, Lord Of Blood','선행 보스'],['Enter the Realm of Shadow','Starscourge Radahn','선행 보스'],
  ];
  for(const [a,b,c] of connections)link(a,b,c);
  const quests: Record<string, [string,string,string,string,boolean][]> = {
    'Ranni Quest': [
      ['카리아 성관을 통과합니다.','Caria Manor','Ranni The Witch','친위기사 로레타를 처치하고 라니의 마술사탑으로 이동합니다.',false],
      ['라니의 제안을 받아들입니다.','Ranni\'s Rise','Ranni The Witch','블라이드·이지·셀브스와 대화합니다.',false],
      ['별 부수는 라단을 처치합니다.','Redmane Castle','Blaidd','축제 개최 조건을 충족합니다. 라단 처치로 노크론 접근 경로가 열립니다.',true],
      ['노크론에서 손가락 죽임의 칼날을 찾습니다.','Nokron, Eternal City','Ranni The Witch','라니에게 칼날을 전달합니다. 셀브스 관련 진행을 먼저 확인하세요.',true],
      ['레나의 마술사탑에서 지하로 이동합니다.','Renna\'s Rise','Ranni The Witch','작은 라니 인형을 얻고 축복에서 반복 대화합니다.',true],
      ['녹스텔라와 부패한 호수를 통과합니다.','Nokstella, Eternal City','Ranni The Witch','재앙의 그림자와 아스테르를 처치합니다. 레날라 방 상자의 반지를 확보합니다.',true],
      ['월광의 제단에서 마지막으로 만납니다.','Moonlight Altar','Ranni The Witch','마누스 셀레스 대교회 아래에서 반지를 사용합니다.',true],
    ],
    'Millicent Quest': [
      ['고리의 부탁을 듣습니다.','Gowry\'s Shack','Gowry','노장 오닐을 처치하고 무구한 금의 침을 수리합니다.',false],
      ['밀리센트에게 침을 전달합니다.','Church Of The Plague','Millicent','대화 후 축복에서 쉬고 다시 만납니다.',false],
      ['알터 고원에서 의수를 건넵니다.','Altus Plateau','Millicent','그늘성에서 전쟁 처녀의 의수를 확보합니다.',false],
      ['성수에서 협력 여부를 선택합니다.','Elphael, Brace of the Haligtree','Millicent','부패한 나무령 처치 후 소환 사인을 확인합니다. 선택별 보상이 다릅니다.',true],
    ],
    'Alexander Quest': [
      ['림그레이브에서 알렉산더를 돕습니다.','Limgrave','Iron Fist Alexander','첫 조우는 생략 가능한 단계입니다.',false],
      ['라단 축제에서 함께 싸웁니다.','Redmane Castle','Iron Fist Alexander','라단 처치 후 전장에서 대화합니다.',false],
      ['겔미어 화산에서 만납니다.','Mt. Gelmir','Iron Fist Alexander','용암 지대에서 대화를 마칩니다.',false],
      ['파름 아즈라에서 결투합니다.','Crumbling Farum Azula','Iron Fist Alexander','최종 결투 보상과 조기 사망 보상은 다릅니다.',true],
    ],
  };
  for(const [en,steps] of Object.entries(quests)) {
    const id=find(en);if(!id)continue;
    all.get(id)!.questSteps=steps.map(([title,loc,npc,pre,spoiler],i)=>({id:`${id}-step-${i+1}`,position:i+1,title,locationId:find(loc)??null,npcId:find(npc)??null,requiredItems:[],prerequisites:pre,nextStepId:i<steps.length-1?`${id}-step-${i+2}`:null,failure:'관련 NPC를 공격하거나 선택을 확정하기 전 진행 상태를 확인하세요.',spoiler}));
    for(const step of steps) {link(en,step[1],'퀘스트 경유지');link(en,step[2],'관련 NPC');}
  }
  if(includeEnrichment && fs.existsSync('data/enrichment/web.json')) {
    const records=JSON.parse(fs.readFileSync('data/enrichment/web.json','utf8'));
    for(const raw of records) {
      const prev=all.get(raw.id);
      const e=validateEntry({...prev,...raw,details:{...prev?.details,...raw.details},sources:[...(prev?.sources??[]),...raw.sources],relations:prev?.relations??[]});
      if(e.category==='weapons'&&e.details.attackMax&&typeof e.details.attackMax==='object')e.upgrades=[...e.upgrades,{level:Number(e.details.maxUpgrade??25),affinity:'standard',attack:e.details.attackMax as Record<string,number>,scaling:(e.details.scalingMax??{}) as Record<string,string>}];
      all.set(e.id,e);english.set(normalize(e.nameEn),e.id);
    }
    for(const file of ['locations.json','characters.json','blogs.json'])if(fs.existsSync('data/enrichment/'+file))for(const raw of JSON.parse(fs.readFileSync('data/enrichment/'+file,'utf8'))) {
      const prev=all.get(raw.id);const relations=(raw.relatedNames??[]).map((r:{name:string;label:string})=>({toId:find(r.name),label:r.label})).filter((r:{toId?:string})=>r.toId&&r.toId!==raw.id);
      const e=validateEntry({...prev,...raw,details:{...prev?.details,...raw.details},sources:[...(prev?.sources??[]),...raw.sources],relations:[...(prev?.relations??[]),...relations].filter((r,i,a)=>a.findIndex(x=>x.toId===r.toId&&x.label===r.label)===i)});all.set(e.id,e);
    }
  }
  return [...all.values()].map(validateEntry);
}
