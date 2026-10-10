import { isStuckProcessing } from '@/lib/queue';
import type {
  ActionOutcome,
  Article,
  ArticleFilters,
  ArticleStatus,
  ArticleSummary,
  ArticleUpdate,
  Facets,
  LogEntry,
  LogFilters,
  Page,
  PageRequest,
  SortDirection,
  SortField,
} from '@/lib/types';
import type { ArticlesRepository, LogsRepository, Repositories } from '../types';
import { buildDemoDataset, type DemoDataset } from './dataset';

export interface DemoOptions {
  /** Instante de referência para gerar o conjunto de dados (padrão: agora). */
  now?: Date;
  /** Relógio usado pelas ações dependentes de tempo (padrão: `new Date()`). */
  clock?: () => Date;
}

const PENDING_STATUSES: ArticleStatus[] = ['fila', 'processando', 'erro'];

function normalize(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

function toSummary(article: Article): ArticleSummary {
  const { rewrittenContent: _content, ...summary } = article;
  return summary;
}

function matchesFilters(article: Article, filters: ArticleFilters): boolean {
  if (filters.status && filters.status.length > 0 && !filters.status.includes(article.status)) {
    return false;
  }
  if (filters.source && article.source !== filters.source) return false;
  if (filters.category && article.category !== filters.category) return false;
  if (filters.q && !normalize(article.title).includes(normalize(filters.q))) return false;
  if (
    filters.publishedFrom &&
    (!article.publishedAt || article.publishedAt < filters.publishedFrom)
  ) {
    return false;
  }
  if (filters.publishedTo && (!article.publishedAt || article.publishedAt > filters.publishedTo)) {
    return false;
  }
  return true;
}

function compareBy(field: SortField, order: SortDirection) {
  const sign = order === 'asc' ? 1 : -1;
  return (a: Article, b: Article): number => {
    const left = a[field]?.getTime() ?? 0;
    const right = b[field]?.getTime() ?? 0;
    return (left - right || a.id - b.id) * sign;
  };
}

function paginate<T>(items: T[], page: PageRequest): Page<T> {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / page.limit));
  const start = (page.page - 1) * page.limit;
  return {
    items: items.slice(start, start + page.limit),
    pagination: { page: page.page, limit: page.limit, total, totalPages },
  };
}

function distinctSorted(values: Array<string | null>): string[] {
  return [...new Set(values.filter((value): value is string => Boolean(value)))].sort((a, b) =>
    a.localeCompare(b, 'pt-BR'),
  );
}

class DemoArticlesRepository implements ArticlesRepository {
  constructor(
    private readonly data: DemoDataset,
    private readonly clock: () => Date,
  ) {}

  async list(filters: ArticleFilters, page: PageRequest): Promise<Page<ArticleSummary>> {
    const sorted = this.data.articles
      .filter((article) => matchesFilters(article, filters))
      .sort(compareBy(filters.sort ?? 'collectedAt', filters.order ?? 'desc'));
    const result = paginate(sorted, page);
    return { items: result.items.map(toSummary), pagination: result.pagination };
  }

  async findById(id: number): Promise<Article | null> {
    const found = this.data.articles.find((article) => article.id === id);
    return found ? { ...found } : null;
  }

  async listForMetrics(since: Date): Promise<ArticleSummary[]> {
    return this.data.articles
      .filter(
        (article) =>
          article.collectedAt >= since ||
          (article.publishedAt !== null && article.publishedAt >= since) ||
          PENDING_STATUSES.includes(article.status),
      )
      .map(toSummary);
  }

  async getFacets(): Promise<Facets> {
    return {
      sources: distinctSorted(this.data.articles.map((article) => article.source)),
      categories: distinctSorted(this.data.articles.map((article) => article.category)),
    };
  }

  async update(id: number, patch: ArticleUpdate): Promise<ActionOutcome<Article>> {
    return this.mutate(id, ['fila'], (article) => ({
      ...article,
      title: patch.title ?? article.title,
      sourceSummary:
        patch.sourceSummary === undefined ? article.sourceSummary : patch.sourceSummary,
      tags: patch.tags === undefined ? article.tags : patch.tags,
    }));
  }

  async discard(id: number): Promise<ActionOutcome<Article>> {
    return this.mutate(id, ['fila', 'erro'], (article) => ({ ...article, status: 'descartado' }));
  }

  async retry(id: number): Promise<ActionOutcome<Article>> {
    return this.mutate(id, ['erro'], (article) => ({
      ...article,
      status: 'fila',
      attempts: 0,
      errorMessage: null,
    }));
  }

  async retryAll(): Promise<number> {
    let affected = 0;
    this.data.articles.forEach((article, index) => {
      if (article.status !== 'erro') return;
      this.data.articles[index] = { ...article, status: 'fila', attempts: 0, errorMessage: null };
      affected += 1;
    });
    return affected;
  }

  async unstick(olderThanMinutes: number): Promise<number> {
    const now = this.clock();
    let affected = 0;
    this.data.articles.forEach((article, index) => {
      if (!isStuckProcessing(article, now, olderThanMinutes)) return;
      this.data.articles[index] = { ...article, status: 'fila' };
      affected += 1;
    });
    return affected;
  }

  private mutate(
    id: number,
    allowed: ArticleStatus[],
    change: (article: Article) => Article,
  ): ActionOutcome<Article> {
    const index = this.data.articles.findIndex((article) => article.id === id);
    if (index === -1) return { ok: false, reason: 'not_found' };
    const current = this.data.articles[index];
    if (!allowed.includes(current.status)) return { ok: false, reason: 'invalid_status' };
    const next = change(current);
    this.data.articles[index] = next;
    return { ok: true, value: { ...next } };
  }
}

class DemoLogsRepository implements LogsRepository {
  constructor(private readonly data: DemoDataset) {}

  async list(filters: LogFilters): Promise<LogEntry[]> {
    return this.data.logs
      .filter((entry) => !filters.flow || entry.flow === filters.flow)
      .filter((entry) => !filters.status || entry.status === filters.status)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime() || b.id - a.id)
      .slice(0, filters.limit)
      .map((entry) => ({ ...entry }));
  }

  async listFlows(): Promise<string[]> {
    return distinctSorted(this.data.logs.map((entry) => entry.flow));
  }
}

/** Repositórios em memória com dados determinísticos; o estado dura enquanto o processo viver. */
export function createDemoRepositories(options: DemoOptions = {}): Repositories {
  const clock = options.clock ?? (() => new Date());
  const data = buildDemoDataset(options.now ?? clock());
  return {
    source: 'demo',
    articles: new DemoArticlesRepository(data, clock),
    logs: new DemoLogsRepository(data),
    checkConnection: () => Promise.resolve(),
  };
}
