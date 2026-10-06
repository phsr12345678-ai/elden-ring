import fs from 'node:fs';
import {db,view} from '../lib/db';
import {buildDataset} from './dataset';
import {validateEntry,searchText} from '../lib/validation';
import {mergeFields} from '../lib/enrichment';
const old=new Map(buildDataset(false).map(e=>[e.id,e]));const incoming=buildDataset();
const statePath='data/enrichment/import-state.json';const state=fs.existsSync(statePath)?JSON.parse(fs.readFileSync(statePath,'utf8')):{};
let updated=0,added=0,protectedFields=0;
try{
const tombstones=new Set((await db.seedRegistry.findMany()).map(e=>e.id));
for(const e of incoming){const row=await db.entry.findUnique({where:{id:e.id}});if(!row){if(tombstones.has(e.id))continue;const {sources,relations,questSteps,upgrades,...fields}=e;await db.entry.create({data:{...fields,aliases:JSON.stringify(e.aliases),tags:JSON.stringify(e.tags),details:JSON.stringify(e.details),searchText:searchText(e)}});await db.seedRegistry.create({data:{id:e.id}});added++;}else{const current=view(row),base=state[e.id]??old.get(e.id);if(!base)continue;const fields=['nameKo','nameEn','subtype','content_type','translationPending','imageUrl','imageSource','acquisition','summary','details','aliases','tags'];const patch:Record<string,unknown>={};for(const k of fields){const merged=mergeFields((current as any)[k],base[k],(e as any)[k]);if(!(merged==null&&(current as any)[k]==null)&&JSON.stringify(merged)!==JSON.stringify((current as any)[k]))patch[k]=merged;else if(JSON.stringify((e as any)[k])!==JSON.stringify(base[k])&&JSON.stringify((current as any)[k])!==JSON.stringify(base[k]))protectedFields++;}if(Object.keys(patch).length){const candidate=validateEntry({...e,...current,...patch});await db.entry.update({where:{id:e.id},data:{...patch,details:JSON.stringify(candidate.details),aliases:JSON.stringify(candidate.aliases),tags:JSON.stringify(candidate.tags),searchText:searchText(candidate)}});updated++;}}
const previousImport=state[e.id];state[e.id]=e;
const existingSources=await db.entrySource.findMany({where:{entryId:e.id}});for(const s of e.sources){const existing=existingSources.find(x=>x.url===s.url);if(existing){if(s.checkedAt&&!existing.checkedAt&&existing.note.startsWith('직접 작성한 간결한 사실 요약.'))await db.entrySource.update({where:{id:existing.id},data:{title:s.title,note:s.note,checkedAt:new Date(s.checkedAt)}});continue;}await db.entrySource.create({data:{...s,checkedAt:s.checkedAt?new Date(s.checkedAt):null,entryId:e.id}});}
for(const u of e.upgrades){const key={entryId:e.id,level:u.level,affinity:u.affinity};const current=await db.weaponUpgrade.findUnique({where:{entryId_level_affinity:key}});const prior=previousImport?.upgrades?.find((x:any)=>x.level===u.level&&x.affinity===u.affinity);const untouched=current&&prior&&current.attack===JSON.stringify(prior.attack)&&current.scaling===JSON.stringify(prior.scaling);await db.weaponUpgrade.upsert({where:{entryId_level_affinity:key},create:{entryId:e.id,...u,attack:JSON.stringify(u.attack),scaling:JSON.stringify(u.scaling)},update:untouched?{attack:JSON.stringify(u.attack),scaling:JSON.stringify(u.scaling)}:{}});}
}
const known=new Set((await db.entry.findMany({select:{id:true}})).map(e=>e.id));for(const e of incoming)if(known.has(e.id))for(const r of e.relations)if(known.has(r.toId))await db.relation.upsert({where:{fromId_toId_label:{fromId:e.id,...r}},create:{fromId:e.id,...r},update:{}});
fs.writeFileSync(statePath,JSON.stringify(state));console.log({added,updated,protectedFields,total:await db.entry.count(),dlc:await db.entry.count({where:{content_type:'shadow_of_the_erdtree'}})});
}finally{await db.$disconnect();}
