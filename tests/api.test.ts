import { beforeEach, describe, expect, it } from 'vitest';
import { GET as getArticle, PATCH as patchArticle } from '@/app/api/articles/[id]/route';
import { POST as discardArticle } from '@/app/api/articles/[id]/discard/route';
import { POST as retryArticle } from '@/app/api/articles/[id]/retry/route';
import { POST as retryAll } from '@/app/api/articles/retry-all/route';
import { GET as listArticles } from '@/app/api/articles/route';
import { POST as unstick } from '@/app/api/articles/unstick/route';
import { GET as getHealth } from '@/app/api/health/route';
import { GET as getLogs } from '@/app/api/logs/route';
import { GET as getMetrics } from '@/app/api/metrics/route';
import { resetRepositories } from '@/lib/repositories';
import type { ArticleStatus } from '@/lib/types';

interface ListBody {
  data: Array<{ id: number; status: ArticleStatus; title: string }>;
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

interface ErrorBody {
  error: { code: string; message: string; details?: unknown };
}

const request = (path: string, init?: RequestInit) => new Request(`http://localhost${path}`, init);

const context = (id: string | number) => ({ params: Promise.resolve({ id: String(id) }) });

const jsonRequest = (path: string, method: string, body: unknown) =>
  request(path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });

async function firstIdWithStatus(status: ArticleStatus): Promise<number> {
  const response = await listArticles(request(`/api/articles?status=${status}&limit=1`));
  const body = (await response.json()) as ListBody;
  return body.data[0].id;
}

beforeEach(() => {
  resetRepositories();
});

describe('API em modo demo', () => {
  it('GET /api/health informa fonte de dados e autenticação', async () => {
    const response = await getHealth();
    expect(response.status).toBe(200);
    const body = (await response.json()) as { data: Record<string, unknown> };
    expect(body.data.status).toBe('ok');
    expect(body.data.dataSource).toBe('demo');
    expect(body.data.authEnabled).toBe(false);
  });

  it('GET /api/articles?status=fila devolve itens na fila com paginação', async () => {
    const response = await listArticles(request('/api/articles?status=fila&limit=5'));
    expect(response.status).toBe(200);
    const body = (await response.json()) as ListBody;
    expect(body.data.length).toBeGreaterThan(0);
    expect(body.data.length).toBeLessThanOrEqual(5);
    expect(body.data.every((item) => item.status === 'fila')).toBe(true);
    expect(body.pagination.total).toBe(13);
    expect(body.pagination.totalPages).toBe(3);
  });

  it('GET /api/articles rejeita parâmetros inválidos com 400', async () => {
    const badPage = await listArticles(request('/api/articles?page=0'));
    expect(badPage.status).toBe(400);
    const badPageBody = (await badPage.json()) as ErrorBody;
    expect(badPageBody.error.code).toBe('VALIDATION_ERROR');
    expect(badPageBody.error.details).toEqual([expect.objectContaining({ path: 'page' })]);

    const badStatus = await listArticles(request('/api/articles?status=inexistente'));
    expect(badStatus.status).toBe(400);
  });

  it('GET /api/articles/:id devolve o artigo completo ou 404', async () => {
    const found = await getArticle(request('/api/articles/1'), context(1));
    expect(found.status).toBe(200);
    const body = (await found.json()) as { data: { id: number; rewrittenContent: unknown } };
    expect(body.data.id).toBe(1);
    expect(body.data).toHaveProperty('rewrittenContent');

    const missing = await getArticle(request('/api/articles/99999'), context(99999));
    expect(missing.status).toBe(404);
    expect(((await missing.json()) as ErrorBody).error.code).toBe('NOT_FOUND');

    const invalid = await getArticle(request('/api/articles/abc'), context('abc'));
    expect(invalid.status).toBe(400);
  });

  it('PATCH /api/articles/:id edita itens na fila e valida o corpo', async () => {
    const id = await firstIdWithStatus('fila');
    const ok = await patchArticle(
      jsonRequest(`/api/articles/${id}`, 'PATCH', { title: 'Título ajustado pelo painel' }),
      context(id),
    );
    expect(ok.status).toBe(200);
    expect(((await ok.json()) as { data: { title: string } }).data.title).toBe(
      'Título ajustado pelo painel',
    );

    const empty = await patchArticle(jsonRequest(`/api/articles/${id}`, 'PATCH', {}), context(id));
    expect(empty.status).toBe(400);

    const broken = await patchArticle(
      jsonRequest(`/api/articles/${id}`, 'PATCH', '{nao-json'),
      context(id),
    );
    expect(broken.status).toBe(400);
    expect(((await broken.json()) as ErrorBody).error.code).toBe('INVALID_JSON');

    const publishedId = await firstIdWithStatus('publicado');
    const denied = await patchArticle(
      jsonRequest(`/api/articles/${publishedId}`, 'PATCH', { title: 'Tentativa indevida' }),
      context(publishedId),
    );
    expect(denied.status).toBe(409);
    expect(((await denied.json()) as ErrorBody).error.code).toBe('INVALID_STATUS');
  });

  it('POST /api/articles/:id/discard muda o status e rejeita repetição', async () => {
    const id = await firstIdWithStatus('fila');
    const first = await discardArticle(request(`/api/articles/${id}/discard`), context(id));
    expect(first.status).toBe(200);
    expect(((await first.json()) as { data: { status: string } }).data.status).toBe('descartado');

    const second = await discardArticle(request(`/api/articles/${id}/discard`), context(id));
    expect(second.status).toBe(409);
  });

  it('POST retry e retry-all devolvem erros à fila', async () => {
    const id = await firstIdWithStatus('erro');
    const retried = await retryArticle(request(`/api/articles/${id}/retry`), context(id));
    expect(retried.status).toBe(200);
    const body = (await retried.json()) as {
      data: { status: string; attempts: number; errorMessage: string | null };
    };
    expect(body.data).toMatchObject({ status: 'fila', attempts: 0, errorMessage: null });

    const all = await retryAll();
    expect(all.status).toBe(200);
    expect(((await all.json()) as { data: { affected: number } }).data.affected).toBe(5);
  });

  it('POST /api/articles/unstick devolve à fila os travados há mais de 10 minutos', async () => {
    const response = await unstick();
    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      data: { affected: number; olderThanMinutes: number };
    };
    expect(body.data).toEqual({ affected: 2, olderThanMinutes: 10 });
  });

  it('GET /api/metrics devolve a estrutura completa', async () => {
    const response = await getMetrics();
    expect(response.status).toBe(200);
    const body = (await response.json()) as { data: Record<string, unknown> };
    expect(body.data).toMatchObject({
      queued: 13,
      processing: 3,
      stuckProcessing: 2,
      errors: 6,
      windowDays: 30,
    });
    expect(body.data.publicationsByDay).toHaveLength(14);
    expect(Array.isArray(body.data.topSources)).toBe(true);
    expect(body.data.latestPublished).toHaveLength(10);
  });

  it('GET /api/logs filtra por status e valida parâmetros', async () => {
    const response = await getLogs(request('/api/logs?status=erro&limit=5'));
    expect(response.status).toBe(200);
    const body = (await response.json()) as { data: Array<{ status: string }> };
    expect(body.data.length).toBeLessThanOrEqual(5);
    expect(body.data.every((entry) => entry.status === 'erro')).toBe(true);

    const invalid = await getLogs(request('/api/logs?status=talvez'));
    expect(invalid.status).toBe(400);
  });
});
