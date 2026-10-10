import Link from 'next/link';
import { formatNumber } from '@/lib/format';
import type { Pagination as PaginationInfo } from '@/lib/types';

interface PaginationProps {
  pagination: PaginationInfo;
  basePath: string;
  params: Record<string, string | undefined>;
}

function buildHref(basePath: string, params: Record<string, string | undefined>, page: number) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }
  if (page > 1) search.set('page', String(page));
  const query = search.toString();
  return query ? `${basePath}?${query}` : basePath;
}

export function Pagination({ pagination, basePath, params }: PaginationProps) {
  const { page, limit, total, totalPages } = pagination;
  if (total === 0) return null;
  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  return (
    <nav
      aria-label="Paginação"
      className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-ink-2"
    >
      <p>
        Mostrando {formatNumber(start)}–{formatNumber(end)} de {formatNumber(total)}
      </p>
      <div className="flex items-center gap-2">
        {page > 1 ? (
          <Link href={buildHref(basePath, params, page - 1)} className="btn-secondary">
            Anterior
          </Link>
        ) : (
          <span aria-disabled="true" className="btn-secondary opacity-50">
            Anterior
          </span>
        )}
        <span className="px-1 tabular-nums">
          Página {page} de {totalPages}
        </span>
        {page < totalPages ? (
          <Link href={buildHref(basePath, params, page + 1)} className="btn-secondary">
            Próxima
          </Link>
        ) : (
          <span aria-disabled="true" className="btn-secondary opacity-50">
            Próxima
          </span>
        )}
      </div>
    </nav>
  );
}
