import { db } from '../lib/db';
import { searchText } from '../lib/validation';
import { buildDataset } from './dataset';
const entries=buildDataset();
const added=new Set<string>();
try {
  // Create only: subsequent npm install/db:setup must preserve administrator edits/deletions.
  // Tombstones are handled by the DB-local seed registry below.
  const registry = await db.seedRegistry.findMany();
  const seeded = new Set(registry.map(x=>x.id));
  for(const e of entries) {
    if(seeded.has(e.id))continue;
    const exists=await db.entry.findUnique({where:{id:e.id}});
    if(!exists) {
      const {relations,sources,questSteps,upgrades,...fields}=e;
      await db.entry.create({data:{...fields,tags:JSON.stringify(e.tags),aliases:JSON.stringify(e.aliases),details:JSON.stringify(e.details),searchText:searchText(e)}});
      for(const source of sources)await db.entrySource.create({data:{...source,checkedAt:source.checkedAt?new Date(source.checkedAt):null,entryId:e.id}});
      added.add(e.id);
    }
    await db.seedRegistry.upsert({where:{id:e.id},create:{id:e.id},update:{}});
  }
  const known=new Set((await db.entry.findMany({select:{id:true}})).map(x=>x.id));
  for(const e of entries) {
    if(!added.has(e.id))continue;
    for(const r of e.relations)if(known.has(r.toId))await db.relation.upsert({where:{fromId_toId_label:{fromId:e.id,...r}},create:{fromId:e.id,...r},update:{}});
    for(const s of e.questSteps)await db.questStep.create({data:{...s,questId:e.id,requiredItems:JSON.stringify(s.requiredItems)}});
  }
  console.log(JSON.stringify({added:added.size,total:await db.entry.count(),base:await db.entry.count({where:{content_type:'base_game'}}),dlc:await db.entry.count({where:{content_type:'shadow_of_the_erdtree'}})},null,2));
} finally { await db.$disconnect(); }
