import type { Metadata } from 'next';
import Link from 'next/link';
import { ArticleTitleCell } from '@/components/articles/ArticleTitleCell';
import { WordpressLink } from '@/components/articles/WordpressLink';
import { EmptyState } from '@/components/ui/EmptyState';
import { FilterForm, SelectField, TextField, toOptions } from '@/components/ui/FilterForm';
import { PageHeader } from '@/components/ui/PageHeader';
import { Pagination } from '@/components/ui/Pagination';
import { parseDateBoundary } from '@/lib/api/schemas';
import { getWordpressUrl } from '@/lib/env';
import { formatDateTime } from '@/lib/format';
import {
  DEFAULT_PAGE_SIZE,
  readDate,
  readPage,
  readString,
  type SearchParams,
} from '@/lib/page-params';
import { getRepositories } from '@/lib/repositories';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Publicados' };

interface PublishedPageProps {
  searchParams: Promise<SearchParams>;
}

export default async function PublishedPage({ searchParams }: PublishedPageProps) {
  const params = await searchParams;
  const source = readString(params, 'source');
  const category = readString(params, 'category');
  const from = readDate(params, 'from');
  const to = readDate(params, 'to');
  const page = readPage(params);

  const repository = getRepositories().articles;
  const [result, facets] = await Promise.all([
    repository.list(
      {
        status: ['publicado'],
        source,
        category,
        publishedFrom: from ? parseDateBoundary(from, 'start') : undefined,
        publishedTo: to ? parseDateBoundary(to, 'end') : undefined,
        sort: 'publishedAt',
        order: 'desc',
      },
      { page, limit: DEFAULT_PAGE_SIZE },
    ),
    repository.getFacets(),
  ]);
  const hasFilters = Boolean(source || category || from || to);
  const wordpressConfigured = Boolean(getWordpressUrl());

  return (
    <>
      <PageHeader
        title="Publicados"
        description={
          wordpressConfigured
            ? 'Artigos reescritos pela IA e publicados no WordPress, do mais recente ao mais antigo.'
            : 'Artigos publicados no WordPress. Defina WORDPRESS_URL para habilitar os links diretos aos posts.'
        }
      />

      <FilterForm action="/publicados">
        <SelectField
          name="category"
          label="Categoria"
          value={category}
          options={toOptions(facets.categories)}
        />
        <SelectField
          name="source"
          label="Fonte"
          value={source}
          options={toOptions(facets.sources)}
        />
        <TextField name="from" label="Publicado de" value={from} type="date" className="w-40" />
        <TextField name="to" label="até" value={to} type="date" className="w-40" />
      </FilterForm>

      {result.items.length === 0 ? (
        <EmptyState
          title={hasFilters ? 'Nenhum artigo corresponde aos filtros' : 'Nada publicado ainda'}
          description={
            hasFilters
              ? 'Amplie o período ou limpe os filtros.'
              : 'Os artigos aparecem aqui depois que o fluxo de publicação do n8n os envia ao WordPress.'
          }
        />
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Artigo</th>
                <th scope="col">Publicado em</th>
                <th scope="col">WordPress</th>
                <th scope="col" className="text-right">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {result.items.map((article) => (
                <tr key={article.id}>
                  <td>
                    <ArticleTitleCell article={article} />
                  </td>
                  <td className="whitespace-nowrap text-ink-2 tabular-nums">
                    {formatDateTime(article.publishedAt)}
                  </td>
                  <td className="whitespace-nowrap">
                    <WordpressLink wpPostId={article.wpPostId} />
                  </td>
                  <td className="text-right">
                    <Link href={`/artigo/${article.id}`} className="btn-secondary">
                      Ver
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination
        pagination={result.pagination}
        basePath="/publicados"
        params={{ source, category, from, to }}
      />
    </>
  );
}
