import { describe, expect, it } from 'vitest';
import {
  CHART_DAYS,
  computeMetrics,
  metricsWindowStart,
  startOfDay,
  toDateKey,
} from '@/lib/metrics';
import type { ArticleSummary } from '@/lib/types';

const NOW = new Date(2026, 9, 10, 15, 0, 0);

let nextId = 1;

function article(overrides: Partial<ArticleSummary> = {}): ArticleSummary {
  return {
    id: nextId++,
    title: 'Artigo de teste',
    originalUrl: 'https://exemplo.com.br/artigo',
    hash: 'a'.repeat(64),
    status: 'fila',
    wpPostId: null,
    source: 'Fonte A',
    sourceSummary: null,
    wpCategoryId: null,
    summary: null,
    tags: null,
    category: 'Tecnologia',
    collectedAt: NOW,
    publishedAt: null,
    attempts: 0,
    errorMessage: null,
    ...overrides,
  };
}

function published(publishedAt: Date, overrides: Partial<ArticleSummary> = {}): ArticleSummary {
  return article({ status: 'publicado', publishedAt, wpPostId: 100, ...overrides });
}

function minutesAgo(minutes: number): Date {
  return new Date(NOW.getTime() - minutes * 60_000);
}

function daysAgoAt(days: number, hour: number, minute = 0): Date {
  const date = new Date(NOW);
  date.setDate(date.getDate() - days);
  date.setHours(hour, minute, 0, 0);
  return date;
}

describe('computeMetrics', () => {
  it('conta itens na fila, em processamento e com erro', () => {
    const metrics = computeMetrics(
      [
        article({ status: 'fila' }),
        article({ status: 'fila' }),
        article({ status: 'processando' }),
        article({ status: 'erro' }),
        article({ status: 'descartado' }),
        published(minutesAgo(30)),
      ],
      NOW,
    );
    expect(metrics.queued).toBe(2);
    expect(metrics.processing).toBe(1);
    expect(metrics.errors).toBe(1);
  });

  it('considera travado quem está processando há 10 minutos ou mais', () => {
    const metrics = computeMetrics(
      [
        article({ status: 'processando', collectedAt: minutesAgo(10) }),
        article({ status: 'processando', collectedAt: minutesAgo(45) }),
        article({ status: 'processando', collectedAt: minutesAgo(3) }),
        article({ status: 'fila', collectedAt: minutesAgo(120) }),
      ],
      NOW,
    );
    expect(metrics.processing).toBe(3);
    expect(metrics.stuckProcessing).toBe(2);
  });

  it('publicados hoje usa o início do dia no fuso do servidor', () => {
    const metrics = computeMetrics(
      [published(daysAgoAt(0, 0)), published(daysAgoAt(0, 14)), published(daysAgoAt(1, 23, 59))],
      NOW,
    );
    expect(metrics.publishedToday).toBe(2);
  });

  it('publicados em 7 dias cobre hoje e os seis dias anteriores', () => {
    const metrics = computeMetrics(
      [published(daysAgoAt(6, 0)), published(daysAgoAt(7, 23, 59)), published(daysAgoAt(2, 9))],
      NOW,
    );
    expect(metrics.publishedLast7Days).toBe(2);
  });

  it('ignora data de publicação de itens que não estão publicados', () => {
    const metrics = computeMetrics(
      [article({ status: 'erro', publishedAt: minutesAgo(5) }), article({ status: 'publicado' })],
      NOW,
    );
    expect(metrics.publishedToday).toBe(0);
    expect(metrics.latestPublished).toHaveLength(0);
  });

  it('publicações por dia cobre 14 dias em ordem crescente e soma por dia', () => {
    const metrics = computeMetrics(
      [
        published(daysAgoAt(13, 8)),
        published(daysAgoAt(14, 8)),
        published(daysAgoAt(0, 9)),
        published(daysAgoAt(0, 11)),
      ],
      NOW,
    );
    expect(metrics.publicationsByDay).toHaveLength(CHART_DAYS);
    expect(metrics.publicationsByDay[0].date).toBe(toDateKey(daysAgoAt(13, 0)));
    expect(metrics.publicationsByDay[0].count).toBe(1);
    expect(metrics.publicationsByDay.at(-1)?.date).toBe(toDateKey(NOW));
    expect(metrics.publicationsByDay.at(-1)?.count).toBe(2);
    expect(metrics.publicationsByDay.reduce((sum, day) => sum + day.count, 0)).toBe(3);
    expect(metrics.publicationsByDay.at(-1)?.label).toBe('10/10');
  });

  it('agrupa por categoria em ordem decrescente com fallback para sem categoria', () => {
    const metrics = computeMetrics(
      [
        published(minutesAgo(1), { category: 'Saúde' }),
        published(minutesAgo(2), { category: 'Saúde' }),
        published(minutesAgo(3), { category: 'Direito' }),
        published(minutesAgo(4), { category: null }),
        article({ status: 'fila', category: 'Educação' }),
      ],
      NOW,
    );
    expect(metrics.publicationsByCategory).toEqual([
      { name: 'Saúde', count: 2 },
      { name: 'Direito', count: 1 },
      { name: 'Sem categoria', count: 1 },
    ]);
  });

  it('top fontes limita a cinco entradas ordenadas por quantidade', () => {
    const items = ['A', 'B', 'C', 'D', 'E', 'F', 'G'].flatMap((source, index) =>
      Array.from({ length: index + 1 }, () => published(minutesAgo(index), { source })),
    );
    const metrics = computeMetrics(items, NOW);
    expect(metrics.topSources).toHaveLength(5);
    expect(metrics.topSources[0]).toEqual({ name: 'G', count: 7 });
    expect(metrics.topSources.at(-1)).toEqual({ name: 'C', count: 3 });
  });

  it('últimos publicados traz no máximo dez, do mais recente ao mais antigo', () => {
    const items = Array.from({ length: 12 }, (_, index) => published(minutesAgo(index * 10)));
    const metrics = computeMetrics(items, NOW);
    expect(metrics.latestPublished).toHaveLength(10);
    expect(metrics.latestPublished[0].publishedAt?.getTime()).toBe(NOW.getTime());
    expect(metrics.latestPublished[9].publishedAt?.getTime()).toBe(minutesAgo(90).getTime());
  });

  it('janela de métricas começa 29 dias antes de hoje, à meia-noite', () => {
    const start = metricsWindowStart(NOW);
    expect(start.getTime()).toBe(startOfDay(daysAgoAt(29, 17)).getTime());
    expect(start.getHours()).toBe(0);
  });
});
