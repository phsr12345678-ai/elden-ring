export const CONTENT_TYPES = ['base_game', 'shadow_of_the_erdtree'] as const;
export const CATEGORIES = {
  weapons: '무기', shields: '방패', armor: '방어구', talismans: '탈리스만',
  bosses: '보스', npcs: 'NPC', locations: '지역·던전', graces: '축복',
  sorceries: '마술', incantations: '기도', ashes: '전회', skills: '전투 기술',
  spirits: '영체', items: '아이템', materials: '재료', crafting: '제작',
  quests: '퀘스트', systems: '시스템', lore: '세계관', maps: '지도',
  shops: '상점', progression: '진행 가이드',
} as const;
export type Category = keyof typeof CATEGORIES;
export const GROUPS = [
  { name: '세계', categories: ['locations','maps','graces','shops'] },
  { name: '캐릭터', categories: ['bosses','npcs','lore'] },
  { name: '장비', categories: ['weapons','shields','armor','talismans'] },
  { name: '마법', categories: ['sorceries','incantations'] },
  { name: '전투', categories: ['ashes','skills','systems'] },
  { name: '아이템', categories: ['items','materials','crafting'] },
  { name: '플레이', categories: ['spirits','quests','progression'] },
] as const;
export const contentLabel = (value: string) => value === 'base_game' ? '본편' : 'Shadow of the Erdtree';
export function normalize(text: string) { return text.normalize('NFKC').toLowerCase().replace(/\s+/g, ' ').trim(); }
export function slug(text: string) { return normalize(text).replace(/[^a-z0-9가-힣]+/g, '-').replace(/^-|-$/g, ''); }
export const FIELD_LABELS: Record<string, string> = {
  defenceMax:'최대 강화 가드 수치',defenceBasis:'가드 수치 기준',
  scalingBasis:'보정 수치 기준',
  crossCheck:'출처 간 수치 비교',sourceDifferences:'출처별 다른 수치',agreed:'일치한 항목',needsReview:'검토할 차이',snapshot2022:'2022 공개 자료',namu:'나무위키 표',
  attackMax:'최대 강화 공격력',scalingMax:'최대 강화 보정',assetId:'로컬 그림 ID',navigation:'찾아가는 경로',weaponType:'무기 종류',
  attack:'기본 공격력 (+0)', defence:'가드 수치', damageNegation:'경감률', resistance:'내성',
  requirements:'필요 능력치', scaling:'능력치 보정 (+0)', weight:'중량', physical:'물리',
  magic:'마력', fire:'화염', lightning:'벼락', holy:'신성', critical:'치명', guardBoost:'가드 강도',
  str:'근력', dex:'기량', int:'지력', fai:'신앙', arc:'신비', vigor:'생명력', mind:'정신력', endurance:'지구력',
  skill:'전투 기술', skillChangeable:'전회 변경 가능', upgrade:'강화 방식', maxUpgrade:'최대 강화',
  hp:'HP (1회차)', region:'지역', location:'세부 위치', drops:'드랍 아이템', runes:'드랍 룬',
  required:'필수 보스', optional:'선택 보스', weakness:'약점', tips:'공략 팁', phases:'페이즈·패턴',
  parry:'패리', criticalPossible:'치명타 가능', spiritSummon:'영체 소환', npcSummon:'NPC 소환',
  poison:'독', rot:'부패', bleed:'출혈', frost:'동상', sleep:'수면', madness:'발광',
  fpCost:'FP 소비', hpCost:'HP 소비', staminaCost:'스태미나 소비', slots:'기억 슬롯',
  effect:'효과', affinity:'변질', role:'역할', level:'권장 레벨 (참고)', weaponLevel:'권장 강화 (참고)',
  chargeable:'차지 가능', damageType:'공격 속성', castType:'시전 방식', family:'계열',
  set:'방어구 세트', part:'부위', strike:'타격', slash:'참격', pierce:'관통', immunity:'면역',
  robustness:'강건', focus:'이성', vitality:'항사', poise:'강인도', variants:'관련 버전',
  route:'이동 경로', consequences:'선택·사망에 따른 변화', note:'참고', sourceVersion:'데이터 버전',
  legendary:'전설 장비', mapFragment:'지도 조각', goldenSeeds:'황금 종자', sacredTears:'성배의 물방울',
};
export type EntryView = {
  id: string; nameKo: string; nameEn: string; category: string; subtype: string;
  content_type: string; verification_status: string; summary: string; acquisition: string;
  tags: string[]; aliases: string[]; details: Record<string, unknown>; spoiler: boolean;
  translationPending: boolean; imageUrl?: string | null; imageSource?: string | null;
};
