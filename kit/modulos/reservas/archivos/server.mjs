/**
 * Punto de entrada en producción (Hostinger "Entry file": server.mjs).
 * 1. Aplica las migraciones pendientes de la base de datos.
 * 2. Arranca el servidor de Astro (lee HOST y PORT del entorno).
 * Si las migraciones fallan, el proceso termina con error y no sirve una web a medias.
 */
import { drizzle } from 'drizzle-orm/mysql2';
import { migrate } from 'drizzle-orm/mysql2/migrator';
import mysql from 'mysql2/promise';
import { existsSync } from 'node:fs';

if (existsSync('.env') && !process.env.DATABASE_URL) process.loadEnvFile('.env');

if (!process.env.DATABASE_URL) {
  console.error('[arranque] Falta DATABASE_URL. Revisa las variables de entorno.');
  process.exit(1);
}

const conexion = await mysql.createConnection({ uri: process.env.DATABASE_URL, multipleStatements: true });
try {
  await migrate(drizzle(conexion), { migrationsFolder: './drizzle' });
  console.info('[arranque] Base de datos al día.');
} catch (error) {
  console.error('[arranque] Error aplicando migraciones:', error);
  process.exit(1);
} finally {
  await conexion.end();
}

await import('./dist/server/entry.mjs');
