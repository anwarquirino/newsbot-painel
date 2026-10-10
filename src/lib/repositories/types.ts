import type { DataSource } from '@/lib/env';
import type {
  ActionOutcome,
  Article,
  ArticleFilters,
  ArticleSummary,
  ArticleUpdate,
  Facets,
  LogEntry,
  LogFilters,
  Page,
  PageRequest,
} from '@/lib/types';

export interface ArticlesRepository {
  list(filters: ArticleFilters, page: PageRequest): Promise<Page<ArticleSummary>>;
  findById(id: number): Promise<Article | null>;
  /** Artigos relevantes para as métricas: coletados/publicados desde `since` ou ainda pendentes. */
  listForMetrics(since: Date): Promise<ArticleSummary[]>;
  getFacets(): Promise<Facets>;
  /** Edita título, resumo da fonte e tags. Permitido apenas com status `fila`. */
  update(id: number, patch: ArticleUpdate): Promise<ActionOutcome<Article>>;
  /** `fila` ou `erro` -> `descartado`. Nunca toca em itens em processamento ou publicados. */
  discard(id: number): Promise<ActionOutcome<Article>>;
  /** `erro` -> `fila`, zerando tentativas e mensagem de erro. */
  retry(id: number): Promise<ActionOutcome<Article>>;
  /** Reprocessa todos os itens em `erro`. Retorna a quantidade afetada. */
  retryAll(): Promise<number>;
  /** `processando` há mais de `olderThanMinutes` -> `fila`. Retorna a quantidade afetada. */
  unstick(olderThanMinutes: number): Promise<number>;
}

export interface LogsRepository {
  list(filters: LogFilters): Promise<LogEntry[]>;
  listFlows(): Promise<string[]>;
}

export interface Repositories {
  source: DataSource;
  articles: ArticlesRepository;
  logs: LogsRepository;
  checkConnection(): Promise<void>;
}
