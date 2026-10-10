import mysql, { type Pool } from 'mysql2/promise';

/**
 * Pool de conexões a partir de `DATABASE_URL` (mysql://usuario:senha@host:3306/banco).
 * `timezone: 'local'` interpreta DATETIME no fuso do processo (variável TZ),
 * que deve ser o mesmo usado pelo n8n ao gravar as datas.
 */
export function createPool(databaseUrl: string): Pool {
  return mysql.createPool({
    uri: databaseUrl,
    waitForConnections: true,
    connectionLimit: 5,
    maxIdle: 5,
    idleTimeout: 60_000,
    timezone: 'local',
  });
}
