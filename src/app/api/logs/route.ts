import { handle, ok, searchParamsToObject } from '@/lib/api/http';
import { logsQuerySchema, toLogFilters } from '@/lib/api/schemas';
import { getRepositories } from '@/lib/repositories';

export const dynamic = 'force-dynamic';

export async function GET(request: Request): Promise<Response> {
  return handle(async () => {
    const query = logsQuerySchema.parse(searchParamsToObject(new URL(request.url)));
    const entries = await getRepositories().logs.list(toLogFilters(query));
    return ok(entries);
  });
}
