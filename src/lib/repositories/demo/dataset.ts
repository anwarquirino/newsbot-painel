import { createHash } from 'node:crypto';
import type { Article, ArticleStatus, LogEntry, LogStatus } from '@/lib/types';
import {
  CLOSING_SENTENCES,
  CONTEXT_SENTENCES,
  DETAIL_SENTENCES,
  ERROR_MESSAGES,
  IMPACT_BULLETS,
  LOG_ERROR_INDEXES,
  LOG_FLOW_PATTERN,
  LOG_MESSAGES,
  SEED_ARTICLES,
  SOURCE_DOMAINS,
  STATUS_PLAN,
  SUMMARY_CLOSERS,
  TAG_POOLS,
  WP_CATEGORY_IDS,
  type SeedArticle,
} from './seed';

export interface DemoDataset {
  articles: Article[];
  logs: LogEntry[];
}

type Rng = () => number;
type ArticleDraft = Omit<Article, 'id' | 'wpPostId'>;

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;
const SEED = 20_260_101;
const LOG_COUNT = 40;

/** Dias atrás de cada artigo publicado: 3 hoje, 14 nos últimos 7 dias, 25 nos últimos 14 dias. */
const PUBLISHED_DAY_OFFSETS = [
  0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 5, 5, 6, 6, 7, 8, 8, 9, 10, 10, 11, 12, 12, 13, 14, 15, 16, 18, 19,
  21, 22, 24, 25, 27, 28, 29,
];
/** Dois itens travados (acima de 10 min) e um em andamento. */
const PROCESSING_MINUTES_AGO = [42, 25, 3];
const ERROR_HOURS_AGO = [2, 7, 19, 31, 52, 90];
const DISCARDED_DAYS_AGO = [3, 6];

/** Marcação propositalmente insegura em um artigo publicado, para demonstrar a sanitização. */
const UNSAFE_MARKUP =
  '<script>alert("xss")</script><p onclick="alert(1)">Este parágrafo veio com um atributo onclick e um script, removidos pelo painel ao renderizar.</p>';

function mulberry32(seed: number): Rng {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(items: readonly T[], rng: Rng): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function pick<T>(items: readonly T[], rng: Rng): T {
  return items[Math.floor(rng() * items.length)];
}

function pickMany<T>(items: readonly T[], count: number, rng: Rng): T[] {
  return shuffle(items, rng).slice(0, count);
}

function expandPlan(plan: Record<ArticleStatus, number>): ArticleStatus[] {
  return (Object.keys(plan) as ArticleStatus[]).flatMap((status) =>
    Array.from({ length: plan[status] }, () => status),
  );
}

function startOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function minutesAgo(from: Date, minutes: number): Date {
  return new Date(from.getTime() - minutes * MINUTE_MS);
}

function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function sha256(text: string): string {
  return createHash('sha256').update(text).digest('hex');
}

function buildUrl(seed: SeedArticle): string {
  const domain = SOURCE_DOMAINS[seed.source] ?? 'exemplo.com.br';
  return `https://${domain}/${slugify(seed.title)}`;
}

function buildRewrittenContent(
  seed: SeedArticle,
  url: string,
  rng: Rng,
  includeUnsafeMarkup: boolean,
): string {
  const bullets = pickMany(IMPACT_BULLETS[seed.category], 3, rng)
    .map((bullet) => `<li>${bullet}</li>`)
    .join('');
  const parts = [
    `<p><strong>${escapeHtml(seed.title)}.</strong> ${escapeHtml(seed.sourceSummary)}</p>`,
    '<h2>O que aconteceu</h2>',
    `<p>${pick(CONTEXT_SENTENCES[seed.category], rng)} ${pick(DETAIL_SENTENCES, rng)}</p>`,
    '<h2>Por que isso importa</h2>',
    `<ul>${bullets}</ul>`,
    `<p>${pick(CLOSING_SENTENCES, rng)} <a href="${url}" rel="noopener noreferrer">Leia a matéria original em ${escapeHtml(seed.source)}</a>.</p>`,
  ];
  if (includeUnsafeMarkup) parts.push(UNSAFE_MARKUP);
  return parts.join('\n');
}

function publishedAtFor(ordinal: number, now: Date, rng: Rng): Date {
  const dayOffset = PUBLISHED_DAY_OFFSETS[ordinal];
  if (dayOffset === 0) return minutesAgo(now, 25 * (ordinal + 1));
  const day = new Date(startOfDay(now).getTime() - dayOffset * DAY_MS);
  day.setHours(7 + Math.floor(rng() * 14), Math.floor(rng() * 60), Math.floor(rng() * 60), 0);
  return day;
}

function buildArticle(
  seed: SeedArticle,
  status: ArticleStatus,
  ordinal: number,
  now: Date,
  rng: Rng,
): ArticleDraft {
  const url = buildUrl(seed);
  const base: ArticleDraft = {
    title: seed.title,
    originalUrl: url,
    hash: sha256(url),
    status,
    source: seed.source,
    sourceSummary: seed.sourceSummary,
    wpCategoryId: null,
    rewrittenContent: null,
    summary: null,
    tags: pickMany(TAG_POOLS[seed.category], 3, rng).join(', '),
    category: seed.category,
    collectedAt: now,
    publishedAt: null,
    attempts: 0,
    errorMessage: null,
  };

  switch (status) {
    case 'publicado': {
      const publishedAt = publishedAtFor(ordinal, now, rng);
      return {
        ...base,
        collectedAt: minutesAgo(publishedAt, 5 + Math.floor(rng() * 85)),
        publishedAt,
        attempts: rng() < 0.15 ? 2 : 1,
        wpCategoryId: WP_CATEGORY_IDS[seed.category],
        summary: `${seed.sourceSummary} ${SUMMARY_CLOSERS[seed.category]}`,
        rewrittenContent: buildRewrittenContent(seed, url, rng, ordinal === 0),
      };
    }
    case 'fila':
      return { ...base, collectedAt: minutesAgo(now, 5 + ordinal * 9 + Math.floor(rng() * 4)) };
    case 'processando':
      return {
        ...base,
        collectedAt: minutesAgo(now, PROCESSING_MINUTES_AGO[ordinal]),
        attempts: 1,
      };
    case 'erro':
      return {
        ...base,
        collectedAt: new Date(now.getTime() - ERROR_HOURS_AGO[ordinal] * HOUR_MS),
        attempts: 1 + (ordinal % 3),
        errorMessage: ERROR_MESSAGES[ordinal % ERROR_MESSAGES.length],
        wpCategoryId: ordinal % 2 === 0 ? WP_CATEGORY_IDS[seed.category] : null,
      };
    case 'descartado':
      return {
        ...base,
        collectedAt: new Date(now.getTime() - DISCARDED_DAYS_AGO[ordinal] * DAY_MS),
      };
  }
}

function buildLogs(now: Date, rng: Rng, articles: Article[]): LogEntry[] {
  const published = articles.filter((article) => article.status === 'publicado');
  const drafts = Array.from({ length: LOG_COUNT }, (_, index) => {
    const flow = LOG_FLOW_PATTERN[index % LOG_FLOW_PATTERN.length];
    const status: LogStatus = LOG_ERROR_INDEXES.has(index) ? 'erro' : 'ok';
    const reference = pick(published, rng);
    const message = pick(LOG_MESSAGES[flow][status], rng)
      .replace('%ID%', String(reference.id))
      .replace('%WP%', String(reference.wpPostId ?? 0));
    return {
      flow,
      status,
      message,
      createdAt: minutesAgo(now, 15 + index * 250 + Math.floor(rng() * 40)),
    };
  });
  drafts.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  return drafts.map((draft, index) => ({ ...draft, id: index + 1 }));
}

/**
 * Gera o conjunto de dados do modo demo: 60 artigos distribuídos por status,
 * categoria, fonte e datas dos últimos 30 dias, mais 40 linhas de log.
 * Determinístico para um mesmo `now` (PRNG com semente fixa).
 */
export function buildDemoDataset(now: Date = new Date()): DemoDataset {
  const rng = mulberry32(SEED);
  const statuses = shuffle(expandPlan(STATUS_PLAN), rng);
  const counters: Record<ArticleStatus, number> = {
    fila: 0,
    processando: 0,
    publicado: 0,
    erro: 0,
    descartado: 0,
  };

  const drafts = SEED_ARTICLES.map((seed, index) => {
    const status = statuses[index];
    const ordinal = counters[status];
    counters[status] += 1;
    return buildArticle(seed, status, ordinal, now, rng);
  });
  drafts.sort((a, b) => a.collectedAt.getTime() - b.collectedAt.getTime());

  let nextWpPostId = 1180;
  const articles: Article[] = drafts.map((draft, index) => {
    const wpPostId = draft.status === 'publicado' ? (nextWpPostId += 2) : null;
    return { ...draft, id: index + 1, wpPostId };
  });

  return { articles, logs: buildLogs(now, rng, articles) };
}
