import { handle, ok } from '@/lib/api/http';
import { getRepositories } from '@/lib/repositories';

export const dynamic = 'force-dynamic';

export async function POST(): Promise<Response> {
  return handle(async () => {
    const affected = await getRepositories().articles.retryAll();
    return ok({ affected });
  });
}
