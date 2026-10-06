import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assertAllowed,validateEntry,searchText } from '../lib/validation';
import { buildDataset } from '../scripts/dataset';
const candidate={id:'weapons-test',nameKo:'테스트 무기',nameEn:'Test Weapon',category:'weapons',content_type:'base_game'};
test('only two content scopes are accepted',()=>{
 assert.equal(validateEntry(candidate).content_type,'base_game');
 assert.equal(validateEntry({...candidate,content_type:'shadow_of_the_erdtree'}).content_type,'shadow_of_the_erdtree');
 assert.throws(()=>validateEntry({...candidate,content_type:'other_game'}));
});
for(const term of ['Nightreign','ELDEN RING NIGHTREIGN','밤의 통치자','night-reign','Ｎｉｇｈｔｒｅｉｇｎ'])test(`excludes forbidden text in nested metadata: ${term}`,()=>{
 assert.throws(()=>validateEntry({...candidate,details:{note:term}}));
 assert.throws(()=>validateEntry({...candidate,sources:[{title:'Source',url:'https://example.com',note:term}]}));
 assert.throws(()=>validateEntry({...candidate,aliases:[term]}));
});
test('known exclusive names rejected; shared base entity remains allowed',()=>{
 assert.throws(()=>validateEntry({...candidate,nameEn:'Wylder'}));
 assert.doesNotThrow(()=>validateEntry({...candidate,nameEn:'Royal Revenant'}));
 assert.doesNotThrow(()=>assertAllowed({name:'Night\'s Cavalry'}));
});
test('verified entry requires evidence timestamp and valid source',()=>{
 assert.throws(()=>validateEntry({...candidate,verification_status:'verified'}));
 assert.doesNotThrow(()=>validateEntry({...candidate,verification_status:'verified',sources:[{title:'Game check',url:'https://example.com',checkedAt:'2026-10-06T00:00:00.000Z'}]}));
 assert.throws(()=>validateEntry({...candidate,sources:[{title:'Unsafe',url:'javascript:alert(1)'}]}));
});
test('search text indexes Korean, English, alias and location',()=>{
 const e=validateEntry({...candidate,nameKo:'명도 월은',nameEn:'Moonveil',aliases:['월은'],acquisition:'게르 갱도'});
 assert.ok(searchText(e).includes('moonveil'));
 assert.ok(searchText(e).includes('명도 월은'));
 assert.ok(searchText(e).includes('게르 갱도'));
});
test('collected dataset has valid relations, bilingual example and both scopes',()=>{
 const entries=buildDataset();const ids=new Set(entries.map(e=>e.id));
 assert.equal(ids.size,entries.length);assert.ok(entries.length>2000);
 assert.ok(entries.filter(e=>e.content_type==='shadow_of_the_erdtree').length>=60);
 const moonveil=entries.find(e=>e.nameEn==='Moonveil')!;
 assert.equal(moonveil.nameKo,'명도 월은');assert.ok(moonveil.relations.some(r=>r.toId==='locations-gael-tunnel'));
 for(const e of entries){assertAllowed(e);for(const r of e.relations)assert.ok(ids.has(r.toId));for(const s of e.questSteps){if(s.locationId)assert.ok(ids.has(s.locationId));if(s.npcId)assert.ok(ids.has(s.npcId));}}
});
