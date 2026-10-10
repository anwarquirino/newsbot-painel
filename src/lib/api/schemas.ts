import { z } from 'zod';
import { AppError } from '@/lib/errors';
import {
  ARTICLE_STATUSES,
  LOG_STATUSES,
  type ArticleFilters,
  type ArticleStatus,
  type LogFilters,
} from '@/lib/types';

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

const idSchema = z.coerce.number().int().positive();

/** Lê o `:id` da rota e falha com 400 quando não for um inteiro positivo. */
export function parseId(raw: string): number {
  const parsed = idSchema.safeParse(raw);
  if (!parsed.success) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Identificador inválido.');
  }
  return parsed.data;
}

const statusListSchema = z.string().transform((value, ctx) => {
  const parts = value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
  const invalid = parts.filter((part) => !ARTICLE_STATUSES.includes(part as ArticleStatus));
  if (invalid.length > 0) {
    ctx.addIssue({
      code: 'custom',
      message: `Status inválido: ${invalid.join(', ')}. Use ${ARTICLE_STATUSES.join(', ')}.`,
    });
    return z.NEVER;
  }
  return parts as ArticleStatus[];
});

const dateOnlySchema = z.string().regex(DATE_ONLY, 'Use o formato AAAA-MM-DD.');

export const listArticlesQuerySchema = z.object({
  status: statusListSchema.optional(),
  source: z.string().max(100).optional(),
  category: z.string().max(100).optional(),
  q: z.string().max(200).optional(),
  from: dateOnlySchema.optional(),
  to: dateOnlySchema.optional(),
  sort: z.enum(['collectedAt', 'publishedAt']).optional(),
  order: z.enum(['asc', 'desc']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type ListArticlesQuery = z.infer<typeof listArticlesQuerySchema>;

const emptyToNull = (value: string | null | undefined): string | null | undefined =>
  value === '' ? null : value;

export const updateArticleSchema = z
  .strictObject({
    title: z
      .string()
      .trim()
      .min(5, 'O título precisa ter ao menos 5 caracteres.')
      .max(500)
      .optional(),
    sourceSummary: z.string().trim().max(5000).nullable().optional().transform(emptyToNull),
    tags: z.string().trim().max(500).nullable().optional().transform(emptyToNull),
  })
  .refine(
    (value) =>
      value.title !== undefined || value.sourceSummary !== undefined || value.tags !== undefined,
    { message: 'Informe ao menos um campo: title, sourceSummary ou tags.' },
  );

export const logsQuerySchema = z.object({
  flow: z.string().max(100).optional(),
  status: z.enum(LOG_STATUSES).optional(),
  limit: z.coerce.number().int().min(1).max(500).default(200),
});

export type LogsQuery = z.infer<typeof logsQuerySchema>;

/** Converte "AAAA-MM-DD" no início ou no fim do dia, no fuso do servidor. */
export function parseDateBoundary(value: string, boundary: 'start' | 'end'): Date {
  const [year, month, day] = value.split('-').map(Number);
  return boundary === 'start'
    ? new Date(year, month - 1, day, 0, 0, 0, 0)
    : new Date(year, month - 1, day, 23, 59, 59, 999);
}

export function toArticleFilters(query: ListArticlesQuery): ArticleFilters {
  return {
    status: query.status,
    source: query.source,
    category: query.category,
    q: query.q,
    publishedFrom: query.from ? parseDateBoundary(query.from, 'start') : undefined,
    publishedTo: query.to ? parseDateBoundary(query.to, 'end') : undefined,
    sort: query.sort,
    order: query.order,
  };
}

export function toLogFilters(query: LogsQuery): LogFilters {
  return { flow: query.flow, status: query.status, limit: query.limit };
}
