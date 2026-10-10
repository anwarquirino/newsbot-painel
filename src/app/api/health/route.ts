import { isAuthEnabled } from '@/lib/env';
import { getRepositories } from '@/lib/repositories';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<Response> {
  const repositories = getRepositories();
  const info = {
    dataSource: repositories.source,
    authEnabled: isAuthEnabled(),
    timestamp: new Date().toISOString(),
  };
  try {
    await repositories.checkConnection();
    return Response.json({ data: { status: 'ok', ...info } });
  } catch (error) {
    console.error('[health] falha ao verificar a fonte de dados', error);
    return Response.json({ data: { status: 'degraded', ...info } }, { status: 503 });
  }
}
