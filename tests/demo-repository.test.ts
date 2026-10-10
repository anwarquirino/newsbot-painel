import { describe, expect, it } from 'vitest';
import { startOfDay } from '@/lib/metrics';
import { createDemoRepositories } from '@/lib/repositories/demo';
import type { ArticleStatus } from '@/lib/types';

const NOW = new Date(2026, 9, 10, 15, 0, 0);
const ALL = { page: 1, limit: 100 };

function repositories() {
  return createDemoRepositories({ now: NOW, clock: () => NOW });
}

async function firstWithStatus(
  repos: ReturnType<typeof repositories>,
  status: ArticleStatus,
): Promise<number> {
  const result = await repos.articles.list({ status: [status] }, { page: 1, limit: 1 });
  return result.items[0].id;
}

function normalize(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

describe('repositório demo: dados', () => {
  it('gera 60 artigos cobrindo todos os status e 40 linhas de log', async () => {
    const repos = repositories();
    const all = await repos.articles.list({}, ALL);
    expect(all.pagination.total).toBe(60);
    expect(new Set(all.items.map((item) => item.status))).toEqual(
      new Set(['fila', 'processando', 'publicado', 'erro', 'descartado']),
    );
    expect(await repos.logs.list({ limit: 500 })).toHaveLength(40);
  });

  it('é determinístico para o mesmo instante de referência', async () => {
    const first = await repositories().articles.findById(7);
    const second = await repositories().articles.findById(7);
    expect(first).not.toBeNull();
    expect(first).toEqual(second);
  });

  it('lista facetas distintas e ordenadas', async () => {
    const facets = await repositories().articles.getFacets();
    expect(facets.categories).toHaveLength(7);
    expect(facets.sources).toContain('TechCrunch');
    expect([...facets.sources].sort((a, b) => a.localeCompare(b, 'pt-BR'))).toEqual(facets.sources);
  });
});

describe('repositório demo: filtros e paginação', () => {
  it('pagina com total e totalPages corretos', async () => {
    const repos = repositories();
    const page1 = await repos.articles.list({}, { page: 1, limit: 25 });
    const page3 = await repos.articles.list({}, { page: 3, limit: 25 });
    const page9 = await repos.articles.list({}, { page: 9, limit: 25 });
    expect(page1.items).toHaveLength(25);
    expect(page1.pagination).toEqual({ page: 1, limit: 25, total: 60, totalPages: 3 });
    expect(page3.items).toHaveLength(10);
    expect(page9.items).toHaveLength(0);
  });

  it('filtra por status, fonte e categoria', async () => {
    const repos = repositories();
    const queued = await repos.articles.list({ status: ['fila', 'processando'] }, ALL);
    expect(queued.pagination.total).toBe(16);
    expect(queued.items.every((item) => ['fila', 'processando'].includes(item.status))).toBe(true);

    const bySource = await repos.articles.list({ source: 'TechCrunch' }, ALL);
    expect(bySource.pagination.total).toBeGreaterThan(0);
    expect(bySource.items.every((item) => item.source === 'TechCrunch')).toBe(true);

    const byCategory = await repos.articles.list({ category: 'Saúde' }, ALL);
    expect(byCategory.pagination.total).toBe(10);
    expect(byCategory.items.every((item) => item.category === 'Saúde')).toBe(true);
  });

  it('busca por título ignorando acentos e maiúsculas', async () => {
    const repos = repositories();
    const result = await repos.articles.list({ q: 'SAUDE' }, ALL);
    expect(result.pagination.total).toBeGreaterThan(0);
    expect(result.items.every((item) => normalize(item.title).includes('saude'))).toBe(true);
  });

  it('filtra publicados por período de publicação', async () => {
    const repos = repositories();
    const today = await repos.articles.list(
      { status: ['publicado'], publishedFrom: startOfDay(NOW) },
      ALL,
    );
    expect(today.pagination.total).toBe(3);
    expect(
      today.items.every((item) => item.publishedAt && item.publishedAt >= startOfDay(NOW)),
    ).toBe(true);
  });

  it('ordena por data de coleta crescente quando solicitado', async () => {
    const repos = repositories();
    const result = await repos.articles.list(
      { status: ['fila'], sort: 'collectedAt', order: 'asc' },
      ALL,
    );
    const times = result.items.map((item) => item.collectedAt.getTime());
    expect(times).toEqual([...times].sort((a, b) => a - b));
  });

  it('resumos não carregam o conteúdo reescrito, mas o detalhe sim', async () => {
    const repos = repositories();
    const list = await repos.articles.list({ status: ['publicado'] }, { page: 1, limit: 1 });
    expect(list.items[0]).not.toHaveProperty('rewrittenContent');
    const full = await repos.articles.findById(list.items[0].id);
    expect(full?.rewrittenContent).toContain('<h2>');
  });
});

describe('repositório demo: ações', () => {
  it('edita título, resumo e tags apenas de itens na fila', async () => {
    const repos = repositories();
    const id = await firstWithStatus(repos, 'fila');
    const outcome = await repos.articles.update(id, { title: 'Título ajustado', tags: 'a, b' });
    expect(outcome.ok).toBe(true);
    if (outcome.ok) {
      expect(outcome.value.title).toBe('Título ajustado');
      expect(outcome.value.tags).toBe('a, b');
      expect(outcome.value.status).toBe('fila');
    }
    expect((await repos.articles.findById(id))?.title).toBe('Título ajustado');

    const publishedId = await firstWithStatus(repos, 'publicado');
    expect(await repos.articles.update(publishedId, { title: 'Não pode' })).toEqual({
      ok: false,
      reason: 'invalid_status',
    });
  });

  it('retorna not_found para identificadores inexistentes', async () => {
    const repos = repositories();
    expect(await repos.articles.findById(9999)).toBeNull();
    expect(await repos.articles.update(9999, { title: 'Qualquer' })).toEqual({
      ok: false,
      reason: 'not_found',
    });
    expect(await repos.articles.discard(9999)).toEqual({ ok: false, reason: 'not_found' });
    expect(await repos.articles.retry(9999)).toEqual({ ok: false, reason: 'not_found' });
  });

  it('descarta itens na fila ou com erro, nunca publicados ou em processamento', async () => {
    const repos = repositories();
    const queuedId = await firstWithStatus(repos, 'fila');
    const errorId = await firstWithStatus(repos, 'erro');
    const publishedId = await firstWithStatus(repos, 'publicado');
    const processingId = await firstWithStatus(repos, 'processando');

    const discarded = await repos.articles.discard(queuedId);
    expect(discarded.ok && discarded.value.status).toBe('descartado');
    expect((await repos.articles.discard(errorId)).ok).toBe(true);
    expect(await repos.articles.discard(publishedId)).toEqual({
      ok: false,
      reason: 'invalid_status',
    });
    expect(await repos.articles.discard(processingId)).toEqual({
      ok: false,
      reason: 'invalid_status',
    });
    expect(await repos.articles.discard(queuedId)).toEqual({
      ok: false,
      reason: 'invalid_status',
    });
  });

  it('reprocessa um erro devolvendo à fila com tentativas e mensagem zeradas', async () => {
    const repos = repositories();
    const id = await firstWithStatus(repos, 'erro');
    const outcome = await repos.articles.retry(id);
    expect(outcome.ok).toBe(true);
    if (outcome.ok) {
      expect(outcome.value.status).toBe('fila');
      expect(outcome.value.attempts).toBe(0);
      expect(outcome.value.errorMessage).toBeNull();
    }
    expect(await repos.articles.retry(id)).toEqual({ ok: false, reason: 'invalid_status' });
  });

  it('reprocessa todos os erros de uma vez', async () => {
    const repos = repositories();
    const before = await repos.articles.list({ status: ['erro'] }, ALL);
    const queuedBefore = await repos.articles.list({ status: ['fila'] }, ALL);
    expect(before.pagination.total).toBe(6);

    expect(await repos.articles.retryAll()).toBe(6);
    expect((await repos.articles.list({ status: ['erro'] }, ALL)).pagination.total).toBe(0);
    expect((await repos.articles.list({ status: ['fila'] }, ALL)).pagination.total).toBe(
      queuedBefore.pagination.total + 6,
    );
    expect(await repos.articles.retryAll()).toBe(0);
  });

  it('destrava apenas itens processando há mais do que o limite', async () => {
    const repos = repositories();
    expect(await repos.articles.unstick(10)).toBe(2);
    const remaining = await repos.articles.list({ status: ['processando'] }, ALL);
    expect(remaining.pagination.total).toBe(1);
    expect(NOW.getTime() - remaining.items[0].collectedAt.getTime()).toBeLessThan(10 * 60_000);
    expect(await repos.articles.unstick(10)).toBe(0);
  });

  it('listForMetrics inclui pendentes mesmo fora da janela', async () => {
    const repos = repositories();
    const farFuture = new Date(NOW.getTime() + 365 * 24 * 60 * 60_000);
    const items = await repos.articles.listForMetrics(farFuture);
    expect(items.length).toBe(22);
    expect(items.every((item) => ['fila', 'processando', 'erro'].includes(item.status))).toBe(true);
  });
});

describe('repositório demo: logs', () => {
  it('filtra por fluxo e status, do mais recente ao mais antigo, respeitando o limite', async () => {
    const repos = repositories();
    const flows = await repos.logs.listFlows();
    expect(flows).toContain('reescrita_ia');

    const errors = await repos.logs.list({ status: 'erro', limit: 200 });
    expect(errors).toHaveLength(8);
    expect(errors.every((entry) => entry.status === 'erro')).toBe(true);

    const flow = await repos.logs.list({ flow: 'publicacao_wp', limit: 3 });
    expect(flow).toHaveLength(3);
    expect(flow.every((entry) => entry.flow === 'publicacao_wp')).toBe(true);
    const times = flow.map((entry) => entry.createdAt.getTime());
    expect(times).toEqual([...times].sort((a, b) => b - a));
  });
});
