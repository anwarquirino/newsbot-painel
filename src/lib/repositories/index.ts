import { getDatabaseUrl, resolveDataSource } from '@/lib/env';
import { createDemoRepositories } from './demo';
import { createMysqlRepositories } from './mysql';
import type { Repositories } from './types';

type GlobalWithRepositories = typeof globalThis & { __newsbotRepositories?: Repositories };

const globalRef = globalThis as GlobalWithRepositories;

function createRepositories(): Repositories {
  const source = resolveDataSource();
  const databaseUrl = getDatabaseUrl();
  if (source === 'mysql' && databaseUrl) {
    return createMysqlRepositories(databaseUrl);
  }
  if (process.env.DATA_SOURCE?.trim().toLowerCase() === 'mysql') {
    console.warn('[newsbot-painel] DATA_SOURCE=mysql sem DATABASE_URL; usando o modo demo.');
  }
  return createDemoRepositories();
}

/**
 * Instância única por processo. Fica em `globalThis` para sobreviver ao
 * hot reload do Next em desenvolvimento e manter o estado do modo demo.
 */
export function getRepositories(): Repositories {
  if (!globalRef.__newsbotRepositories) {
    globalRef.__newsbotRepositories = createRepositories();
  }
  return globalRef.__newsbotRepositories;
}

/** Descarta a instância atual (usado pelos testes para começar de um estado limpo). */
export function resetRepositories(): void {
  delete globalRef.__newsbotRepositories;
}
