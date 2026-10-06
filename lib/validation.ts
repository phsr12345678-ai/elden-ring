import { z } from 'zod';
import { CATEGORIES, CONTENT_TYPES, normalize } from './catalog';
export const excluded = /night[\s_-]*reign|밤\s*의\s*통치자/i;
const excludedNames = new Set(['wylder','ironeye','raider','recluse','executor','revenant','duchess','nightlord','everdark sovereign','gladius, beast of night','adel, baron of night','gnostor, wisdom of night','maris, fathom of night','libra, creature of night','fulghor, champion of night','caligo, miasma of night','heolstor the nightlord','추적자','무뢰한','은둔자','철의 눈','집행자','레이디','복수자'].map(normalize));
// Scan keys and values, including URLs, aliases, source notes and relation labels.
export function assertAllowed(value: unknown) {
  const serialized = JSON.stringify(value).normalize('NFKC');
  if (excluded.test(serialized)) throw new Error('대상 외 게임 관련 문자열이 발견되었습니다. 저장을 거부하며 수동 검토가 필요합니다.');
  if(value && typeof value==='object') {
    const v=value as Record<string,unknown>;
    for(const key of ['name','nameEn','nameKo']) if(typeof v[key]==='string' && excludedNames.has(normalize(v[key] as string))) throw new Error('제외 대상 전용 이름입니다. 저장할 수 없습니다.');
  }
}
const httpUrl = z.string().url().refine(s => /^https?:\/\//i.test(s), 'HTTP(S) URL만 허용됩니다.');
export const sourceSchema = z.object({ title: z.string().min(1).max(200), url: httpUrl, note: z.string().max(2000).default(''), checkedAt: z.string().datetime().nullable().optional() });
export const stepSchema = z.object({
  id: z.string().min(1).max(120), position: z.number().int().nonnegative(), title: z.string().min(1).max(500),
  locationId: z.string().nullable().optional(), npcId: z.string().nullable().optional(),
  requiredItems: z.array(z.string()).default([]), prerequisites: z.string().default(''),
  nextStepId: z.string().nullable().optional(), failure: z.string().default(''), spoiler: z.boolean().default(false),
});
export const entrySchema = z.object({
  id: z.string().regex(/^[a-z0-9가-힣][a-z0-9가-힣-]*$/).max(140),
  nameKo: z.string().min(1).max(200), nameEn: z.string().min(1).max(200),
  category: z.enum(Object.keys(CATEGORIES) as [string, ...string[]]), subtype: z.string().max(100).default(''),
  content_type: z.enum(CONTENT_TYPES), verification_status: z.enum(['verified','needs_review']).default('needs_review'),
  summary: z.string().max(4000).default(''), acquisition: z.string().max(2000).default(''),
  tags: z.array(z.string().max(100)).max(50).default([]), aliases: z.array(z.string().max(200)).max(50).default([]),
  details: z.record(z.unknown()).default({}), spoiler: z.boolean().default(false),
  translationPending: z.boolean().default(false), imageUrl: httpUrl.nullable().optional(), imageSource: httpUrl.nullable().optional(),
  sources: z.array(sourceSchema).max(30).default([]),
  relations: z.array(z.object({ toId: z.string().min(1), label: z.string().min(1).max(100) })).max(100).default([]),
  questSteps: z.array(stepSchema).max(100).default([]),
  upgrades: z.array(z.object({ level: z.number().int().min(0).max(25), affinity: z.string().default('standard'), attack: z.record(z.number().nonnegative()), scaling: z.record(z.string()) })).max(1000).default([]),
});
export type EntryInput = z.infer<typeof entrySchema>;
export function validateEntry(raw: unknown) {
  assertAllowed(raw);
  const result = entrySchema.parse(raw);
  if (result.verification_status === 'verified' && !result.sources.some(s => s.checkedAt)) {
    throw new Error('검증 완료 표시에는 실제 확인한 출처와 checkedAt 확인 시각이 필요합니다.');
  }
  return result;
}
export function searchText(e: EntryInput) {
  return normalize([e.nameKo,e.nameEn,e.subtype,e.acquisition,...e.tags,...e.aliases].join(' '));
}
