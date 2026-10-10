import type { Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { AppError } from '@/lib/errors';
import type {
  ActionOutcome,
  Article,
  ArticleFilters,
  ArticleStatus,
  ArticleSummary,
  ArticleUpdate,
  Facets,
  Page,
  PageRequest,
  SortField,
} from '@/lib/types';
import type { ArticlesRepository } from '../types';

interface ArticleRow extends RowDataPacket {
  id: number;
  titulo: string;
  url_original: string;
  hash: string;
  status: ArticleStatus;
  post_id_wp: number | null;
  fonte: string | null;
  resumo_fonte: string | null;
  categoria_wp: number | null;
  conteudo_reescrito?: string | null;
  resumo: string | null;
  tags: string | null;
  categoria: string | null;
  data_coleta: Date;
  data_publicacao: Date | null;
  tentativas: number;
  erro_msg: string | null;
}

interface CountRow extends RowDataPacket {
  total: number;
}

interface FacetRow extends RowDataPacket {
  value: string;
}

const TABLE = 'noticias_publicadas';

const SUMMARY_COLUMNS = [
  'id',
  'titulo',
  'url_original',
  'hash',
  'status',
  'post_id_wp',
  'fonte',
  'resumo_fonte',
  'categoria_wp',
  'resumo',
  'tags',
  'categoria',
  'data_coleta',
  'data_publicacao',
  'tentativas',
  'erro_msg',
].join(', ');

const FULL_COLUMNS = `${SUMMARY_COLUMNS}, conteudo_reescrito`;

const SORT_COLUMNS: Record<SortField, string> = {
  collectedAt: 'data_coleta',
  publishedAt: 'data_publicacao',
};

const PENDING_STATUSES: ArticleStatus[] = ['fila', 'processando', 'erro'];

/** Código do MySQL para valor fora do ENUM (status 'descartado' sem a migration aplicada). */
const MYSQL_WARN_DATA_TRUNCATED = 1265;

function mapSummary(row: ArticleRow): ArticleSummary {
  return {
    id: row.id,
    title: row.titulo,
    originalUrl: row.url_original,
    hash: row.hash,
    status: row.status,
    wpPostId: row.post_id_wp,
    source: row.fonte,
    sourceSummary: row.resumo_fonte,
    wpCategoryId: row.categoria_wp,
    summary: row.resumo,
    tags: row.tags,
    category: row.categoria,
    collectedAt: row.data_coleta,
    publishedAt: row.data_publicacao,
    attempts: row.tentativas,
    errorMessage: row.erro_msg,
  };
}

function mapArticle(row: ArticleRow): Article {
  return { ...mapSummary(row), rewrittenContent: row.conteudo_reescrito ?? null };
}

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, '\\$&');
}

function buildWhere(filters: ArticleFilters): { sql: string; params: unknown[] } {
  const clauses: string[] = [];
  const params: unknown[] = [];
  if (filters.status && filters.status.length > 0) {
    clauses.push('status IN (?)');
    params.push(filters.status);
  }
  if (filters.source) {
    clauses.push('fonte = ?');
    params.push(filters.source);
  }
  if (filters.category) {
    clauses.push('categoria = ?');
    params.push(filters.category);
  }
  if (filters.q) {
    clauses.push('titulo LIKE ?');
    params.push(`%${escapeLike(filters.q)}%`);
  }
  if (filters.publishedFrom) {
    clauses.push('data_publicacao >= ?');
    params.push(filters.publishedFrom);
  }
  if (filters.publishedTo) {
    clauses.push('data_publicacao <= ?');
    params.push(filters.publishedTo);
  }
  return { sql: clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '', params };
}

function isDataTruncatedError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'errno' in error &&
    (error as { errno?: number }).errno === MYSQL_WARN_DATA_TRUNCATED
  );
}

/** Implementação sobre mysql2 com queries parametrizadas; nenhum valor é interpolado em SQL. */
export class MysqlArticlesRepository implements ArticlesRepository {
  constructor(private readonly pool: Pool) {}

  async list(filters: ArticleFilters, page: PageRequest): Promise<Page<ArticleSummary>> {
    const where = buildWhere(filters);
    const [countRows] = await this.pool.query<CountRow[]>(
      `SELECT COUNT(*) AS total FROM ${TABLE} ${where.sql}`,
      where.params,
    );
    const total = Number(countRows[0]?.total ?? 0);
    const totalPages = Math.max(1, Math.ceil(total / page.limit));
    const offset = (page.page - 1) * page.limit;
    const sortColumn = SORT_COLUMNS[filters.sort ?? 'collectedAt'];
    const direction = filters.order === 'asc' ? 'ASC' : 'DESC';
    const [rows] = await this.pool.query<ArticleRow[]>(
      `SELECT ${SUMMARY_COLUMNS} FROM ${TABLE} ${where.sql} ORDER BY ${sortColumn} ${direction}, id ${direction} LIMIT ? OFFSET ?`,
      [...where.params, page.limit, offset],
    );
    return {
      items: rows.map(mapSummary),
      pagination: { page: page.page, limit: page.limit, total, totalPages },
    };
  }

  async findById(id: number): Promise<Article | null> {
    const [rows] = await this.pool.query<ArticleRow[]>(
      `SELECT ${FULL_COLUMNS} FROM ${TABLE} WHERE id = ? LIMIT 1`,
      [id],
    );
    return rows[0] ? mapArticle(rows[0]) : null;
  }

  async listForMetrics(since: Date): Promise<ArticleSummary[]> {
    const [rows] = await this.pool.query<ArticleRow[]>(
      `SELECT ${SUMMARY_COLUMNS} FROM ${TABLE} WHERE data_coleta >= ? OR data_publicacao >= ? OR status IN (?)`,
      [since, since, PENDING_STATUSES],
    );
    return rows.map(mapSummary);
  }

  async getFacets(): Promise<Facets> {
    const [sourceRows] = await this.pool.query<FacetRow[]>(
      `SELECT DISTINCT fonte AS value FROM ${TABLE} WHERE fonte IS NOT NULL AND fonte <> '' ORDER BY fonte`,
    );
    const [categoryRows] = await this.pool.query<FacetRow[]>(
      `SELECT DISTINCT categoria AS value FROM ${TABLE} WHERE categoria IS NOT NULL AND categoria <> '' ORDER BY categoria`,
    );
    return {
      sources: sourceRows.map((row) => row.value),
      categories: categoryRows.map((row) => row.value),
    };
  }

  async update(id: number, patch: ArticleUpdate): Promise<ActionOutcome<Article>> {
    const assignments: string[] = [];
    const params: unknown[] = [];
    if (patch.title !== undefined) {
      assignments.push('titulo = ?');
      params.push(patch.title);
    }
    if (patch.sourceSummary !== undefined) {
      assignments.push('resumo_fonte = ?');
      params.push(patch.sourceSummary);
    }
    if (patch.tags !== undefined) {
      assignments.push('tags = ?');
      params.push(patch.tags);
    }
    if (assignments.length === 0) {
      return this.transition(id, ['fila'], 'status = status', []);
    }
    return this.transition(id, ['fila'], assignments.join(', '), params);
  }

  async discard(id: number): Promise<ActionOutcome<Article>> {
    try {
      return await this.transition(id, ['fila', 'erro'], "status = 'descartado'", []);
    } catch (error) {
      if (isDataTruncatedError(error)) {
        throw new AppError(
          409,
          'MIGRATION_REQUIRED',
          'O status "descartado" não existe neste banco. Aplique a migration sql/001_painel.sql.',
        );
      }
      throw error;
    }
  }

  async retry(id: number): Promise<ActionOutcome<Article>> {
    return this.transition(id, ['erro'], "status = 'fila', tentativas = 0, erro_msg = NULL", []);
  }

  async retryAll(): Promise<number> {
    const [result] = await this.pool.query<ResultSetHeader>(
      `UPDATE ${TABLE} SET status = 'fila', tentativas = 0, erro_msg = NULL WHERE status = 'erro'`,
    );
    return result.affectedRows;
  }

  async unstick(olderThanMinutes: number): Promise<number> {
    const [result] = await this.pool.query<ResultSetHeader>(
      `UPDATE ${TABLE} SET status = 'fila' WHERE status = 'processando' AND data_coleta < NOW() - INTERVAL ? MINUTE`,
      [olderThanMinutes],
    );
    return result.affectedRows;
  }

  /**
   * Executa um UPDATE condicionado ao status atual (a verificação acontece na
   * própria query, então não há corrida com o fluxo do n8n) e devolve o artigo atualizado.
   */
  private async transition(
    id: number,
    allowed: ArticleStatus[],
    setSql: string,
    setParams: unknown[],
  ): Promise<ActionOutcome<Article>> {
    const [result] = await this.pool.query<ResultSetHeader>(
      `UPDATE ${TABLE} SET ${setSql} WHERE id = ? AND status IN (?)`,
      [...setParams, id, allowed],
    );
    const current = await this.findById(id);
    if (!current) return { ok: false, reason: 'not_found' };
    if (result.affectedRows === 0 && !allowed.includes(current.status)) {
      return { ok: false, reason: 'invalid_status' };
    }
    return { ok: true, value: current };
  }
}
