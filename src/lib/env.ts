export type DataSource = 'demo' | 'mysql';

type Env = Record<string, string | undefined>;

function read(env: Env, key: string): string | undefined {
  const value = env[key]?.trim();
  return value ? value : undefined;
}

/**
 * Decide a fonte de dados. `DATA_SOURCE` manda, mas sem `DATABASE_URL`
 * o painel sempre cai para o modo demo (em memória).
 */
export function resolveDataSource(env: Env = process.env): DataSource {
  const requested = read(env, 'DATA_SOURCE')?.toLowerCase();
  const hasDatabaseUrl = Boolean(read(env, 'DATABASE_URL'));
  if (requested === 'demo') return 'demo';
  if (requested === 'mysql') return hasDatabaseUrl ? 'mysql' : 'demo';
  return hasDatabaseUrl ? 'mysql' : 'demo';
}

export function getDatabaseUrl(env: Env = process.env): string | undefined {
  return read(env, 'DATABASE_URL');
}

/** Autenticação só existe quando há senha configurada. */
export function isAuthEnabled(env: Env = process.env): boolean {
  return Boolean(read(env, 'PAINEL_SENHA'));
}

export function getPanelPassword(env: Env = process.env): string | undefined {
  return read(env, 'PAINEL_SENHA');
}

/** Segredo do HMAC da sessão; sem `SESSION_SECRET`, deriva da própria senha. */
export function getSessionSecret(env: Env = process.env): string | undefined {
  return read(env, 'SESSION_SECRET') ?? read(env, 'PAINEL_SENHA');
}

export function getWordpressUrl(env: Env = process.env): string | undefined {
  return read(env, 'WORDPRESS_URL')?.replace(/\/+$/, '');
}
