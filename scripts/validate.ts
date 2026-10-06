import { buildDataset } from './dataset';
const entries=buildDataset();
const ids=new Set(entries.map(e=>e.id));
let relations=0,steps=0;
for(const e of entries) {
  for(const r of e.relations){if(!ids.has(r.toId))throw new Error(`Dangling link ${e.id} -> ${r.toId}`);relations++;}
  for(const s of e.questSteps){if(s.locationId&&!ids.has(s.locationId))throw new Error(`Unknown location ${s.locationId}`);if(s.npcId&&!ids.has(s.npcId))throw new Error(`Unknown NPC ${s.npcId}`);steps++;}
}
console.log(JSON.stringify({total:entries.length,base:entries.filter(e=>e.content_type==='base_game').length,dlc:entries.filter(e=>e.content_type==='shadow_of_the_erdtree').length,translated:entries.filter(e=>!e.translationPending).length,relations,questSteps:steps,categories:Object.fromEntries([...new Set(entries.map(e=>e.category))].map(c=>[c,entries.filter(e=>e.category===c).length]))},null,2));
