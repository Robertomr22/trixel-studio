import { existsSync } from 'node:fs';
import { defineConfig } from 'drizzle-kit';

if (existsSync('.env') && !process.env.DATABASE_URL) process.loadEnvFile('.env');

export default defineConfig({
  dialect: 'mysql',
  schema: './src/lib/db/esquema.ts',
  out: './drizzle',
  dbCredentials: { url: process.env.DATABASE_URL ?? '' },
});
