import { PrismaClient } from '@prisma/client';
import { PrismaBetterSQLite3 } from '@prisma/adapter-better-sqlite3';
const globalDb = globalThis as unknown as { archiveDb?: PrismaClient };
export const db = globalDb.archiveDb ?? new PrismaClient({ adapter: new PrismaBetterSQLite3({ url: 'file:./prisma/archive.db' }) });
if (process.env.NODE_ENV !== 'production') globalDb.archiveDb = db;
export function view<T extends { tags: string; aliases: string; details: string }>(entry: T) {
  return { ...entry, tags: JSON.parse(entry.tags) as string[], aliases: JSON.parse(entry.aliases) as string[], details: JSON.parse(entry.details) as Record<string, unknown> };
}
