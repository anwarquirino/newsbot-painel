import { EmptyState } from '@/components/ui/EmptyState';
import { formatNumber } from '@/lib/format';
import type { NamedCount } from '@/lib/metrics';

interface BarListProps {
  items: NamedCount[];
  emptyTitle: string;
  emptyDescription?: string;
}

/**
 * Ranking em barras horizontais de uma série nominal: todas na mesma cor,
 * ponta arredondada, valor alinhado em coluna própria.
 */
export function BarList({ items, emptyTitle, emptyDescription }: BarListProps) {
  if (items.length === 0) {
    return (
      <div className="mt-3">
        <EmptyState compact title={emptyTitle} description={emptyDescription} />
      </div>
    );
  }
  const max = Math.max(1, ...items.map((item) => item.count));

  return (
    <ul className="mt-3 space-y-2.5">
      {items.map((item) => (
        <li
          key={item.name}
          className="group grid grid-cols-[minmax(0,8.5rem)_1fr_2.5rem] items-center gap-3 text-sm"
        >
          <span className="truncate text-ink-2" title={item.name}>
            {item.name}
          </span>
          <span className="block h-2.5 w-full">
            <span
              aria-hidden="true"
              className="block h-full rounded-r bg-series-1 transition-colors group-hover:bg-series-1-hover"
              style={{ width: `${(item.count / max) * 100}%`, minWidth: 2 }}
            />
          </span>
          <span className="text-right text-ink tabular-nums">{formatNumber(item.count)}</span>
        </li>
      ))}
    </ul>
  );
}
