import { handle, ok, readJsonBody, unwrapOutcome } from '@/lib/api/http';
import { parseId, updateArticleSchema } from '@/lib/api/schemas';
import { AppError } from '@/lib/errors';
import { getRepositories } from '@/lib/repositories';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext): Promise<Response> {
  return handle(async () => {
    const id = parseId((await context.params).id);
    const article = await getRepositories().articles.findById(id);
    if (!article) throw new AppError(404, 'NOT_FOUND', `Artigo ${id} não encontrado.`);
    return ok(article);
  });
}

export async function PATCH(request: Request, context: RouteContext): Promise<Response> {
  return handle(async () => {
    const id = parseId((await context.params).id);
    const patch = updateArticleSchema.parse(await readJsonBody(request));
    const outcome = await getRepositories().articles.update(id, patch);
    return ok(unwrapOutcome(outcome, id, 'Só é possível editar artigos que estão na fila.'));
  });
}
