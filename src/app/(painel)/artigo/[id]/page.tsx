import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArticleEditForm } from '@/components/articles/ArticleEditForm';
import { WordpressLink } from '@/components/articles/WordpressLink';
import { ActionButton } from '@/components/ui/ActionButton';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EMPTY_VALUE, formatDateTime, splitTags, truncateMiddle } from '@/lib/format';
import { getRepositories } from '@/lib/repositories';
import { sanitizeArticleHtml } from '@/lib/sanitize';
import type { Article } from '@/lib/types';

export const dynamic = 'force-dynamic';

interface ArticlePageProps {
  params: Promise<{ id: string }>;
}

function parseArticleId(raw: string): number | null {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

async function loadArticle(raw: string): Promise<Article | null> {
  const id = parseArticleId(raw);
  if (id === null) return null;
  return getRepositories().articles.findById(id);
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const article = await loadArticle((await params).id);
  return { title: article ? article.title : 'Artigo não encontrado' };
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[7.5rem_1fr] gap-3 py-2 text-sm">
      <dt className="text-ink-2">{label}</dt>
      <dd className="min-w-0 break-words text-ink">{children}</dd>
    </div>
  );
}

function originHost(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const article = await loadArticle((await params).id);
  if (!article) notFound();

  const content = sanitizeArticleHtml(article.rewrittenContent);
  const tags = splitTags(article.tags);
  const canDiscard = article.status === 'fila' || article.status === 'erro';
  const canRetry = article.status === 'erro';
  const backHref =
    article.status === 'publicado' ? '/publicados' : article.status === 'erro' ? '/erros' : '/fila';

  return (
    <>
      <div className="mb-3">
        <Link href={backHref} className="text-sm text-accent-text hover:underline">
          Voltar à lista
        </Link>
      </div>
      <PageHeader
        eyebrow={`Artigo #${article.id}`}
        title={article.title}
        actions={
          canDiscard || canRetry ? (
            <>
              {canRetry ? (
                <ActionButton
                  endpoint={`/api/articles/${article.id}/retry`}
                  label="Reprocessar"
                  pendingLabel="Enviando…"
                  variant="primary"
                  successMessage="Item devolvido à fila."
                />
              ) : null}
              {canDiscard ? (
                <ActionButton
                  endpoint={`/api/articles/${article.id}/discard`}
                  label="Descartar"
                  pendingLabel="Descartando…"
                  variant="danger"
                  confirmMessage="Descartar este artigo? Ele deixa de ser processado, mas permanece no histórico."
                  successMessage="Item descartado."
                />
              ) : null}
            </>
          ) : undefined
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {article.status === 'fila' ? (
            <section className="card">
              <h2 className="text-sm font-semibold text-ink">Editar antes do processamento</h2>
              <p className="mt-1 mb-4 text-xs text-muted">
                Disponível enquanto o item está na fila. O n8n usa estes campos ao reescrever.
              </p>
              <ArticleEditForm
                id={article.id}
                initial={{
                  title: article.title,
                  sourceSummary: article.sourceSummary ?? '',
                  tags: article.tags ?? '',
                }}
              />
            </section>
          ) : null}

          <section className="card">
            <h2 className="text-sm font-semibold text-ink">Resumo da fonte</h2>
            <p className="mt-2 text-sm leading-6 text-ink-2">
              {article.sourceSummary ?? 'O feed não trouxe resumo para este item.'}
            </p>
          </section>

          <section className="card">
            <h2 className="text-sm font-semibold text-ink">Resumo gerado pela IA</h2>
            <p className="mt-2 text-sm leading-6 text-ink-2">
              {article.summary ?? 'Ainda não gerado; aparece depois da etapa de reescrita.'}
            </p>
          </section>

          <section className="card">
            <h2 className="text-sm font-semibold text-ink">Conteúdo reescrito</h2>
            <p className="mt-1 text-xs text-muted">
              HTML gerado pela IA, sanitizado antes de ser exibido.
            </p>
            {content ? (
              <div className="article-content mt-3" dangerouslySetInnerHTML={{ __html: content }} />
            ) : (
              <div className="mt-3">
                <EmptyState
                  compact
                  title="Sem conteúdo ainda"
                  description="O texto é gerado quando o item passa pela etapa de reescrita."
                />
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-4">
          <section className="card">
            <h2 className="text-sm font-semibold text-ink">Detalhes</h2>
            <dl className="mt-2 divide-y divide-line">
              <Detail label="Status">
                <StatusBadge status={article.status} />
              </Detail>
              <Detail label="Fonte">{article.source ?? EMPTY_VALUE}</Detail>
              <Detail label="Categoria">{article.category ?? EMPTY_VALUE}</Detail>
              <Detail label="Categoria WP">{article.wpCategoryId ?? EMPTY_VALUE}</Detail>
              <Detail label="Post WP">
                <WordpressLink wpPostId={article.wpPostId} label={`Ver post ${article.wpPostId}`} />
              </Detail>
              <Detail label="Tentativas">{article.attempts}</Detail>
              <Detail label="Coletado em">{formatDateTime(article.collectedAt)}</Detail>
              <Detail label="Publicado em">{formatDateTime(article.publishedAt)}</Detail>
              <Detail label="Hash">
                <code title={article.hash} className="text-xs">
                  {truncateMiddle(article.hash, 10)}
                </code>
              </Detail>
              <Detail label="Original">
                <a
                  href={article.originalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent-text underline underline-offset-2 hover:text-ink"
                >
                  {originHost(article.originalUrl)}
                </a>
              </Detail>
              {article.errorMessage ? (
                <Detail label="Erro">
                  <span className="text-critical-text">{article.errorMessage}</span>
                </Detail>
              ) : null}
            </dl>
          </section>

          <section className="card">
            <h2 className="text-sm font-semibold text-ink">Tags</h2>
            {tags.length === 0 ? (
              <p className="mt-2 text-sm text-muted">Nenhuma tag definida.</p>
            ) : (
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <li
                    key={tag}
                    className="rounded-full border border-line-strong px-2.5 py-0.5 text-xs text-ink-2"
                  >
                    {tag}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>
    </>
  );
}
