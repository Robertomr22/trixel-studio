import { drizzle, type MySql2Database } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as esquema from './esquema';

export type BaseDeDatos = MySql2Database<typeof esquema>;

/** Crea una conexión (pool) a MySQL/MariaDB. Las fechas se manejan siempre como texto local. */
export function crearBaseDeDatos(url: string): { db: BaseDeDatos; cerrar: () => Promise<void> } {
  const pool = mysql.createPool({
    uri: url,
    connectionLimit: 5,
    dateStrings: true,
    timezone: 'Z',
    charset: 'utf8mb4',
  });
  return { db: drizzle(pool, { schema: esquema, mode: 'default' }), cerrar: () => pool.end() };
}
