import type { Metadata } from 'next';
import { ArticleTitleCell } from '@/components/articles/ArticleTitleCell';
import { WordpressLink } from '@/components/articles/WordpressLink';
import { BarList } from '@/components/charts/BarList';
import { ColumnChart } from '@/components/charts/ColumnChart';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatTile } from '@/components/ui/StatTile';
import { formatDateTime, pluralize } from '@/lib/format';
import { CHART_DAYS, computeMetrics, metricsWindowStart } from '@/lib/metrics';
import { getRepositories } from '@/lib/repositories';
import { STUCK_PROCESSING_MINUTES } from '@/lib/types';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Visão geral' };

export default async function OverviewPage() {
  const now = new Date();
  const articles = await getRepositories().articles.listForMetrics(metricsWindowStart(now));
  const metrics = computeMetrics(articles, now);

  const processingHint =
    metrics.stuckProcessing > 0
      ? `${pluralize(metrics.stuckProcessing, 'travado', 'travados')} há mais de ${STUCK_PROCESSING_MINUTES} min`
      : 'nenhum travado';

  return (
    <>
      <PageHeader
        title="Visão geral"
        description={`Estado do pipeline em ${formatDateTime(now)}. Gráficos e rankings consideram os últimos ${metrics.windowDays} dias.`}
      />

      <section
        aria-label="Indicadores"
        className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5"
      >
        <StatTile label="Na fila" value={metrics.queued} hint="aguardando o n8n" href="/fila" />
        <StatTile
          label="Processando"
          value={metrics.processing}
          hint={processingHint}
          href="/fila"
        />
        <StatTile label="Publicados hoje" value={metrics.publishedToday} href="/publicados" />
        <StatTile
          label="Publicados em 7 dias"
          value={metrics.publishedLast7Days}
          hint="hoje e os 6 dias anteriores"
          href="/publicados"
        />
        <StatTile
          label="Erros"
          value={metrics.errors}
          hint="aguardando reprocessamento"
          href="/erros"
        />
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="card lg:col-span-2">
          <h2 className="text-sm font-semibold text-ink">Publicações por dia</h2>
          <p className="text-xs text-muted">Últimos {CHART_DAYS} dias</p>
          <ColumnChart
            points={metrics.publicationsByDay}
            unitSingular="publicação"
            unitPlural="publicações"
            caption={`Publicações por dia nos últimos ${CHART_DAYS} dias`}
          />
        </div>
        <div className="card">
          <h2 className="text-sm font-semibold text-ink">Publicações por categoria</h2>
          <p className="text-xs text-muted">Últimos {metrics.windowDays} dias</p>
          <BarList
            items={metrics.publicationsByCategory}
            emptyTitle="Nada publicado no período"
            emptyDescription="As categorias aparecem aqui assim que houver publicações."
          />
        </div>
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="card">
          <h2 className="text-sm font-semibold text-ink">Top fontes</h2>
          <p className="text-xs text-muted">Feeds com mais publicações no período</p>
          <BarList
            items={metrics.topSources}
            emptyTitle="Nenhuma fonte publicada"
            emptyDescription="O ranking considera apenas artigos publicados."
          />
        </div>
        <div className="card overflow-hidden p-0 lg:col-span-2">
          <div className="px-5 pt-5 pb-3">
            <h2 className="text-sm font-semibold text-ink">Últimos publicados</h2>
          </div>
          {metrics.latestPublished.length === 0 ? (
            <div className="px-5 pb-5">
              <EmptyState
                compact
                title="Nenhuma publicação ainda"
                description="Os 10 artigos mais recentes aparecem aqui."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th scope="col">Artigo</th>
                    <th scope="col">Publicado em</th>
                    <th scope="col">WordPress</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.latestPublished.map((article) => (
                    <tr key={article.id}>
                      <td>
                        <ArticleTitleCell article={article} />
                      </td>
                      <td className="whitespace-nowrap text-ink-2 tabular-nums">
                        {formatDateTime(article.publishedAt)}
                      </td>
                      <td className="whitespace-nowrap">
                        <WordpressLink wpPostId={article.wpPostId} label="Ver post" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
