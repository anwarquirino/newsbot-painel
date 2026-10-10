import Link from 'next/link';
import type { ArticleSummary } from '@/lib/types';

interface ArticleTitleCellProps {
  article: Pick<ArticleSummary, 'id' | 'title' | 'source' | 'category'>;
}

export function ArticleTitleCell({ article }: ArticleTitleCellProps) {
  return (
    <div className="min-w-[16rem]">
      <Link
        href={`/artigo/${article.id}`}
        className="font-medium text-ink underline-offset-2 hover:underline"
      >
        {article.title}
      </Link>
      <p className="mt-0.5 text-xs text-muted">
        {[article.source, article.category].filter(Boolean).join(' · ') || 'Sem fonte'}
      </p>
    </div>
  );
}
