/** Limited collection from a fixed, pre-DLC GitHub snapshot. No wiki crawling. */
import { mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fetch, EnvHttpProxyAgent } from 'undici';
import { assertAllowed } from '../lib/validation';
export const COMMIT = '1d2626ceda5eb8c08997e345e303344a64edc106'; // 2022-05-31
export const TABLES = ['weapons','armors','talismans','bosses','npcs','locations','sorceries','incantations','ashes','spirits','items','shields'];
const fields = new Set(['id','name','attack','defence','scalesWith','requiredAttributes','category','weight','dmgNegation','resistance','effect','effects','region','location','drops','healthPoints','role','type','cost','slots','requires','affinity','skill','fpCost','hpCost']);
await mkdir('data/upstream', { recursive:true });
await mkdir('data/quarantine', { recursive:true });
const report: unknown[] = [];
const dispatcher = new EnvHttpProxyAgent();
for (const table of TABLES) {
  const url = `https://raw.githubusercontent.com/deliton/eldenring-api/${COMMIT}/api/public/data/${table}.json`;
  const response = await fetch(url, { dispatcher, signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(`${table}: HTTP ${response.status}`);
  const raw = await response.text();
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed)) throw new Error(`${table}: expected array`);
  const accepted = [];
  for (const row of parsed) {
    try {
      assertAllowed(row);
      if (!row || typeof row.name !== 'string') throw new Error('Invalid name');
      accepted.push(Object.fromEntries(Object.entries(row).filter(([key])=>fields.has(key))));
    } catch (error) {
      await writeFile(`data/quarantine/${table}-${accepted.length}-${createHash('sha256').update(JSON.stringify(row)).digest('hex').slice(0,8)}.json`, JSON.stringify({ reason: String(error), candidate: row }, null,2));
    }
  }
  await writeFile(`data/upstream/${table}.json`, JSON.stringify(accepted,null,2)+'\n');
  report.push({ table, url, retrievedAt: new Date().toISOString(), count:accepted.length, rejected:parsed.length-accepted.length, rawSha256:createHash('sha256').update(raw).digest('hex') });
  console.log(`${table}: ${accepted.length}`);
}
await writeFile('data/collection-report.json',JSON.stringify(report,null,2)+'\n');
console.log('Collection only. Review files and run npm run data:validate then npm run db:seed. Existing DB edits are never overwritten by the seed.');
await dispatcher.close();
