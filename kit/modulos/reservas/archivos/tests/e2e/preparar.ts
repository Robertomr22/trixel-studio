/**
 * Preparación global de las pruebas de navegador: aplica las migraciones en la base de
 * datos de .env.test antes de arrancar el servidor. Nunca contra una BD que no sea de pruebas.
 */
import { drizzle } from 'drizzle-orm/mysql2';
import { migrate } from 'drizzle-orm/mysql2/migrator';
import mysql from 'mysql2/promise';

export default async function preparar() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('Falta DATABASE_URL en .env.test');
  if (!/test|prueba/i.test(url)) throw new Error('La base de datos de pruebas debe llamarse *test* o *prueba*.');
  const conexion = await mysql.createConnection({ uri: url });
  try {
    await migrate(drizzle(conexion), { migrationsFolder: './drizzle' });
  } finally {
    await conexion.end();
  }
}
