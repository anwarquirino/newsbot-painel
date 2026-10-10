import { handle, ok, unwrapOutcome } from '@/lib/api/http';
import { parseId } from '@/lib/api/schemas';
import { getRepositories } from '@/lib/repositories';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: RouteContext): Promise<Response> {
  return handle(async () => {
    const id = parseId((await context.params).id);
    const outcome = await getRepositories().articles.retry(id);
    return ok(unwrapOutcome(outcome, id, 'Só itens com erro podem ser reprocessados.'));
  });
}
