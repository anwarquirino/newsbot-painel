import type { Metadata } from 'next';
import Link from 'next/link';
import { ArticleTitleCell } from '@/components/articles/ArticleTitleCell';
import { ActionButton } from '@/components/ui/ActionButton';
import { EmptyState } from '@/components/ui/EmptyState';
import { FilterForm, SelectField, TextField, toOptions } from '@/components/ui/FilterForm';
import { PageHeader } from '@/components/ui/PageHeader';
import { Pagination } from '@/components/ui/Pagination';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatDateTime, formatRelative } from '@/lib/format';
import { DEFAULT_PAGE_SIZE, readPage, readString, type SearchParams } from '@/lib/page-params';
import { isStuckProcessing } from '@/lib/queue';
import { getRepositories } from '@/lib/repositories';
import { STUCK_PROCESSING_MINUTES } from '@/lib/types';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Fila' };

interface QueuePageProps {
  searchParams: Promise<SearchParams>;
}

export default async function QueuePage({ searchParams }: QueuePageProps) {
  const params = await searchParams;
  const q = readString(params, 'q');
  const source = readString(params, 'source');
  const category = readString(params, 'category');
  const page = readPage(params);

  const repository = getRepositories().articles;
  const [result, facets, processing] = await Promise.all([
    repository.list(
      { status: ['fila', 'processando'], q, source, category, sort: 'collectedAt', order: 'asc' },
      { page, limit: DEFAULT_PAGE_SIZE },
    ),
    repository.getFacets(),
    repository.list({ status: ['processando'] }, { page: 1, limit: 100 }),
  ]);
  const now = new Date();
  const stuckCount = processing.items.filter((article) => isStuckProcessing(article, now)).length;
  const hasFilters = Boolean(q || source || category);
  const offset = (result.pagination.page - 1) * result.pagination.limit;

  return (
    <>
      <PageHeader
        title="Fila"
        description={`Itens aguardando ou em processamento pelo n8n, na ordem em que serão consumidos (data de coleta). Itens em processamento há mais de ${STUCK_PROCESSING_MINUTES} minutos são considerados travados.`}
        actions={
          <ActionButton
            endpoint="/api/articles/unstick"
            label={`Destravar processando (${stuckCount})`}
            pendingLabel="Destravando…"
            disabled={stuckCount === 0}
            confirmMessage={`Devolver ${stuckCount} item(ns) travado(s) para a fila?`}
            successMessage="{affected} item(ns) devolvido(s) à fila."
          />
        }
      />

      <FilterForm action="/fila">
        <TextField
          name="q"
          label="Buscar por título"
          value={q}
          placeholder="Ex.: vacina"
          type="search"
        />
        <SelectField
          name="source"
          label="Fonte"
          value={source}
          options={toOptions(facets.sources)}
        />
        <SelectField
          name="category"
          label="Categoria"
          value={category}
          options={toOptions(facets.categories)}
        />
      </FilterForm>

      {result.items.length === 0 ? (
        <EmptyState
          title={hasFilters ? 'Nenhum item corresponde aos filtros' : 'Fila vazia'}
          description={
            hasFilters
              ? 'Ajuste a busca ou limpe os filtros para ver todos os itens.'
              : 'Novos itens aparecem aqui assim que os fluxos de coleta do n8n rodarem.'
          }
        />
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="table">
            <thead>
              <tr>
                <th scope="col" className="w-12 text-right">
                  #
                </th>
                <th scope="col">Artigo</th>
                <th scope="col">Status</th>
                <th scope="col">Coletado</th>
                <th scope="col" className="text-right">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {result.items.map((article, index) => {
                const stuck = isStuckProcessing(article, now);
                return (
                  <tr key={article.id}>
                    <td className="text-right text-muted tabular-nums">{offset + index + 1}</td>
                    <td>
                      <ArticleTitleCell article={article} />
                    </td>
                    <td className="whitespace-nowrap">
                      <StatusBadge status={article.status} />
                      {stuck ? (
                        <p className="mt-0.5 text-xs text-warning-text">
                          travado {formatRelative(article.collectedAt, now)}
                        </p>
                      ) : null}
                    </td>
                    <td className="whitespace-nowrap text-ink-2">
                      <time
                        dateTime={article.collectedAt.toISOString()}
                        title={formatDateTime(article.collectedAt)}
                      >
                        {formatRelative(article.collectedAt, now)}
                      </time>
                    </td>
                    <td>
                      <div className="flex items-start justify-end gap-2">
                        <Link href={`/artigo/${article.id}`} className="btn-secondary">
                          Ver
                        </Link>
                        {article.status === 'fila' ? (
                          <ActionButton
                            endpoint={`/api/articles/${article.id}/discard`}
                            label="Descartar"
                            pendingLabel="Descartando…"
                            variant="danger"
                            confirmMessage={`Descartar "${article.title}"? O item sai da fila e não será publicado.`}
                            successMessage="Item descartado."
                          />
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Pagination
        pagination={result.pagination}
        basePath="/fila"
        params={{ q, source, category }}
      />
    </>
  );
}
