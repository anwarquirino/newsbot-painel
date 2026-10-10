import { isStuckProcessing } from './queue';
import type { ArticleSummary } from './types';

export const METRICS_WINDOW_DAYS = 30;
export const CHART_DAYS = 14;
export const TOP_SOURCES_LIMIT = 5;
export const LATEST_PUBLISHED_LIMIT = 10;

export interface DailyCount {
  /** Dia no fuso do servidor, formato AAAA-MM-DD. */
  date: string;
  /** Rótulo curto para eixos (DD/MM). */
  label: string;
  count: number;
}

export interface NamedCount {
  name: string;
  count: number;
}

export interface Metrics {
  generatedAt: string;
  windowDays: number;
  queued: number;
  processing: number;
  stuckProcessing: number;
  publishedToday: number;
  publishedLast7Days: number;
  errors: number;
  publicationsByDay: DailyCount[];
  publicationsByCategory: NamedCount[];
  topSources: NamedCount[];
  latestPublished: ArticleSummary[];
}

export function startOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function toShortLabel(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${day}/${month}`;
}

/** Início da janela considerada pelas métricas (hoje e os 29 dias anteriores). */
export function metricsWindowStart(now: Date): Date {
  return addDays(startOfDay(now), -(METRICS_WINDOW_DAYS - 1));
}

function countBy(items: ArticleSummary[], key: (item: ArticleSummary) => string): NamedCount[] {
  const counts = new Map<string, number>();
  for (const item of items) {
    const name = key(item);
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'pt-BR'));
}

/** Calcula todas as métricas da visão geral a partir de uma lista de artigos. Função pura. */
export function computeMetrics(articles: ArticleSummary[], now: Date = new Date()): Metrics {
  const today = startOfDay(now);
  const last7Start = addDays(today, -6);
  const chartStart = addDays(today, -(CHART_DAYS - 1));

  const published = articles
    .filter(
      (article): article is ArticleSummary & { publishedAt: Date } =>
        article.status === 'publicado' && article.publishedAt !== null,
    )
    .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());

  const byDay = new Map<string, DailyCount>();
  for (let offset = 0; offset < CHART_DAYS; offset += 1) {
    const day = addDays(chartStart, offset);
    byDay.set(toDateKey(day), { date: toDateKey(day), label: toShortLabel(day), count: 0 });
  }
  for (const article of published) {
    const bucket = byDay.get(toDateKey(article.publishedAt));
    if (bucket) bucket.count += 1;
  }

  const processing = articles.filter((article) => article.status === 'processando');

  return {
    generatedAt: now.toISOString(),
    windowDays: METRICS_WINDOW_DAYS,
    queued: articles.filter((article) => article.status === 'fila').length,
    processing: processing.length,
    stuckProcessing: processing.filter((article) => isStuckProcessing(article, now)).length,
    publishedToday: published.filter((article) => article.publishedAt >= today).length,
    publishedLast7Days: published.filter((article) => article.publishedAt >= last7Start).length,
    errors: articles.filter((article) => article.status === 'erro').length,
    publicationsByDay: [...byDay.values()],
    publicationsByCategory: countBy(published, (article) => article.category ?? 'Sem categoria'),
    topSources: countBy(published, (article) => article.source ?? 'Sem fonte').slice(
      0,
      TOP_SOURCES_LIMIT,
    ),
    latestPublished: published.slice(0, LATEST_PUBLISHED_LIMIT),
  };
}
