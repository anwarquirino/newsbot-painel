import { handle, ok } from '@/lib/api/http';
import { getRepositories } from '@/lib/repositories';
import { STUCK_PROCESSING_MINUTES } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function POST(): Promise<Response> {
  return handle(async () => {
    const affected = await getRepositories().articles.unstick(STUCK_PROCESSING_MINUTES);
    return ok({ affected, olderThanMinutes: STUCK_PROCESSING_MINUTES });
  });
}
