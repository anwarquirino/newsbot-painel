import { ARTICLE_STATUS_LABELS, type ArticleStatus, type LogStatus } from '@/lib/types';

const ARTICLE_STYLES: Record<ArticleStatus, { dot: string; text: string }> = {
  fila: { dot: 'bg-accent', text: 'text-ink-2' },
  processando: { dot: 'bg-warning', text: 'text-warning-text' },
  publicado: { dot: 'bg-good', text: 'text-good-text' },
  erro: { dot: 'bg-critical', text: 'text-critical-text' },
  descartado: { dot: 'border border-muted', text: 'text-muted' },
};

export function StatusBadge({ status }: { status: ArticleStatus }) {
  const style = ARTICLE_STYLES[status];
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${style.text}`}>
      <span aria-hidden="true" className={`h-2 w-2 shrink-0 rounded-full ${style.dot}`} />
      {ARTICLE_STATUS_LABELS[status]}
    </span>
  );
}

const LOG_STYLES: Record<LogStatus, { dot: string; text: string; label: string }> = {
  ok: { dot: 'bg-good', text: 'text-good-text', label: 'OK' },
  erro: { dot: 'bg-critical', text: 'text-critical-text', label: 'Erro' },
};

export function LogStatusBadge({ status }: { status: LogStatus }) {
  const style = LOG_STYLES[status];
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${style.text}`}>
      <span aria-hidden="true" className={`h-2 w-2 shrink-0 rounded-full ${style.dot}`} />
      {style.label}
    </span>
  );
}
