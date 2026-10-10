import Link from 'next/link';
import { formatNumber } from '@/lib/format';

interface StatTileProps {
  label: string;
  value: number;
  hint?: string;
  href?: string;
}

/** Tile de indicador: rótulo, valor em destaque (algarismos proporcionais) e nota opcional. */
export function StatTile({ label, value, hint, href }: StatTileProps) {
  const content = (
    <>
      <p className="text-xs font-medium text-ink-2">{label}</p>
      <p className="mt-1 text-3xl font-semibold tracking-tight text-ink">{formatNumber(value)}</p>
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </>
  );

  if (href) {
    return (
      <Link href={href} className="card block transition-colors hover:bg-surface-2">
        {content}
      </Link>
    );
  }
  return <div className="card">{content}</div>;
}
