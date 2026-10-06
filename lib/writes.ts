import { db } from './db';
import { validateEntry, searchText } from './validation';
export async function saveEntry(raw: unknown) {
  const e = validateEntry(raw);
  const { relations, sources, questSteps, upgrades, ...fields } = e;
  const data = { ...fields, tags: JSON.stringify(e.tags), aliases: JSON.stringify(e.aliases), details: JSON.stringify(e.details), searchText: searchText(e) };
  return db.$transaction(async tx => {
    const ids = [...relations.map(r=>r.toId), ...questSteps.flatMap(s=>[s.locationId,s.npcId,...s.requiredItems].filter((x): x is string => Boolean(x)))];
    const existing = await tx.entry.findMany({ where: { id: { in: ids } }, select: { id: true } });
    const known = new Set([...existing.map(x=>x.id), e.id]);
    const missing = ids.find(id=>!known.has(id));
    if (missing) throw new Error(`존재하지 않는 연결 문서: ${missing}`);
    if (questSteps.length && e.category !== 'quests') throw new Error('퀘스트 문서에만 단계 데이터를 저장할 수 있습니다.');
    const stepIds = new Set(questSteps.map(s=>s.id));
    if (questSteps.some(s=>s.nextStepId && !stepIds.has(s.nextStepId))) throw new Error('다음 퀘스트 단계 ID를 확인하세요.');
    await tx.entry.upsert({ where: { id: e.id }, create: data, update: data });
    await tx.relation.deleteMany({ where: { fromId: e.id } });
    for (const r of relations) await tx.relation.create({ data: { ...r, fromId: e.id } });
    await tx.entrySource.deleteMany({ where: { entryId: e.id } });
    for (const s of sources) await tx.entrySource.create({ data: { ...s, checkedAt: s.checkedAt ? new Date(s.checkedAt) : null, entryId: e.id } });
    await tx.questStep.deleteMany({ where: { questId: e.id } });
    for (const s of questSteps) await tx.questStep.create({ data: { ...s, requiredItems: JSON.stringify(s.requiredItems), questId: e.id } });
    await tx.weaponUpgrade.deleteMany({ where: { entryId: e.id } });
    for (const u of upgrades) await tx.weaponUpgrade.create({ data: { ...u, attack: JSON.stringify(u.attack), scaling: JSON.stringify(u.scaling), entryId: e.id } });
    return e.id;
  });
}
