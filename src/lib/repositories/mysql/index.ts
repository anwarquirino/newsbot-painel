import type { Repositories } from '../types';
import { MysqlArticlesRepository } from './articles';
import { MysqlLogsRepository } from './logs';
import { createPool } from './pool';

export function createMysqlRepositories(databaseUrl: string): Repositories {
  const pool = createPool(databaseUrl);
  return {
    source: 'mysql',
    articles: new MysqlArticlesRepository(pool),
    logs: new MysqlLogsRepository(pool),
    async checkConnection() {
      await pool.query('SELECT 1');
    },
  };
}
