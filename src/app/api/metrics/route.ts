import { handle, ok } from '@/lib/api/http';
import { computeMetrics, metricsWindowStart } from '@/lib/metrics';
import { getRepositories } from '@/lib/repositories';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<Response> {
  return handle(async () => {
    const now = new Date();
    const articles = await getRepositories().articles.listForMetrics(metricsWindowStart(now));
    return ok(computeMetrics(articles, now));
  });
}
