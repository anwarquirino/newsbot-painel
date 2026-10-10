export const ARTICLE_STATUSES = ['fila', 'processando', 'publicado', 'erro', 'descartado'] as const;
export type ArticleStatus = (typeof ARTICLE_STATUSES)[number];

export const ARTICLE_STATUS_LABELS: Record<ArticleStatus, string> = {
  fila: 'Na fila',
  processando: 'Processando',
  publicado: 'Publicado',
  erro: 'Erro',
  descartado: 'Descartado',
};

export const LOG_STATUSES = ['ok', 'erro'] as const;
export type LogStatus = (typeof LOG_STATUSES)[number];

/** Minutos em "processando" a partir dos quais um item é considerado travado. */
export const STUCK_PROCESSING_MINUTES = 10;

/** Linha de `noticias_publicadas` sem o campo pesado `conteudo_reescrito`. */
export interface ArticleSummary {
  id: number;
  title: string;
  originalUrl: string;
  hash: string;
  status: ArticleStatus;
  wpPostId: number | null;
  source: string | null;
  sourceSummary: string | null;
  wpCategoryId: number | null;
  summary: string | null;
  tags: string | null;
  category: string | null;
  collectedAt: Date;
  publishedAt: Date | null;
  attempts: number;
  errorMessage: string | null;
}

export interface Article extends ArticleSummary {
  rewrittenContent: string | null;
}

/** Linha de `execucoes_log`. */
export interface LogEntry {
  id: number;
  flow: string;
  status: LogStatus;
  message: string | null;
  createdAt: Date;
}

export type SortField = 'collectedAt' | 'publishedAt';
export type SortDirection = 'asc' | 'desc';

export interface ArticleFilters {
  status?: ArticleStatus[];
  source?: string;
  category?: string;
  q?: string;
  publishedFrom?: Date;
  publishedTo?: Date;
  sort?: SortField;
  order?: SortDirection;
}

export interface PageRequest {
  page: number;
  limit: number;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface Page<T> {
  items: T[];
  pagination: Pagination;
}

export interface ArticleUpdate {
  title?: string;
  sourceSummary?: string | null;
  tags?: string | null;
}

export type ActionFailureReason = 'not_found' | 'invalid_status';

export type ActionOutcome<T> = { ok: true; value: T } | { ok: false; reason: ActionFailureReason };

export interface LogFilters {
  flow?: string;
  status?: LogStatus;
  limit: number;
}

export interface Facets {
  sources: string[];
  categories: string[];
}
