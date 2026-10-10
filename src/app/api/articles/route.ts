import { handle, ok, searchParamsToObject } from '@/lib/api/http';
import { listArticlesQuerySchema, toArticleFilters } from '@/lib/api/schemas';
import { getRepositories } from '@/lib/repositories';

export const dynamic = 'force-dynamic';

export async function GET(request: Request): Promise<Response> {
  return handle(async () => {
    const query = listArticlesQuerySchema.parse(searchParamsToObject(new URL(request.url)));
    const result = await getRepositories().articles.list(toArticleFilters(query), {
      page: query.page,
      limit: query.limit,
    });
    return ok(result.items, { pagination: result.pagination });
  });
}
