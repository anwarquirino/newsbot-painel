import type { Metadata } from 'next';
import Link from 'next/link';
import { ArticleTitleCell } from '@/components/articles/ArticleTitleCell';
import { ActionButton } from '@/components/ui/ActionButton';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHeader } from '@/components/ui/PageHeader';
import { Pagination } from '@/components/ui/Pagination';
import { formatDateTime, formatRelative } from '@/lib/format';
import { DEFAULT_PAGE_SIZE, readPage, type SearchParams } from '@/lib/page-params';
import { getRepositories } from '@/lib/repositories';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Erros' };

interface ErrorsPageProps {
  searchParams: Promise<SearchParams>;
}

export default async function ErrorsPage({ searchParams }: ErrorsPageProps) {
  const page = readPage(await searchParams);
  const result = await getRepositories().articles.list(
    { status: ['erro'], sort: 'collectedAt', order: 'desc' },
    { page, limit: DEFAULT_PAGE_SIZE },
  );
  const now = new Date();
  const total = result.pagination.total;

  return (
    <>
      <PageHeader
        title="Erros"
        description="Itens que falharam na reescrita ou na publicação. Reprocessar devolve o item à fila com as tentativas zeradas."
        actions={
          <ActionButton
            endpoint="/api/articles/retry-all"
            label={`Reprocessar todos (${total})`}
            pendingLabel="Reprocessando…"
            variant="primary"
            disabled={total === 0}
            confirmMessage={`Devolver ${total} item(ns) com erro para a fila?`}
            successMessage="{affected} item(ns) devolvido(s) à fila."
          />
        }
      />

      {result.items.length === 0 ? (
        <EmptyState
          title="Nenhum erro pendente"
          description="Quando o n8n marcar um item com erro, ele aparece aqui com a mensagem e o número de tentativas."
        />
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Artigo</th>
                <th scope="col" className="text-right">
                  Tentativas
                </th>
                <th scope="col">Erro</th>
                <th scope="col">Coletado</th>
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
                  <td className="text-right tabular-nums">{article.attempts}</td>
                  <td>
                    <p className="max-w-md text-xs break-words text-ink-2">
                      {article.errorMessage ?? 'Sem mensagem registrada.'}
                    </p>
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
                      <ActionButton
                        endpoint={`/api/articles/${article.id}/retry`}
                        label="Reprocessar"
                        pendingLabel="Enviando…"
                        variant="primary"
                        successMessage="Item devolvido à fila."
                      />
                      <ActionButton
                        endpoint={`/api/articles/${article.id}/discard`}
                        label="Descartar"
                        pendingLabel="Descartando…"
                        variant="danger"
                        confirmMessage={`Descartar "${article.title}"? O item não será mais processado.`}
                        successMessage="Item descartado."
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination pagination={result.pagination} basePath="/erros" params={{}} />
    </>
  );
}
