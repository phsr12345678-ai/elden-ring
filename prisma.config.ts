import { defineConfig } from 'prisma/config';
import { PrismaBetterSQLite3 } from '@prisma/adapter-better-sqlite3';
export default defineConfig({
  schema: 'prisma/schema.prisma',
  experimental: { adapter: true },
  engine: 'js',
  adapter: async () => new PrismaBetterSQLite3({ url: 'file:./prisma/archive.db' }),
});
