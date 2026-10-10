import Link from 'next/link';
import type { DataSource } from '@/lib/env';
import { NavLinks } from './NavLinks';

interface SidebarProps {
  dataSource: DataSource;
}

export function Sidebar({ dataSource }: SidebarProps) {
  return (
    <aside className="flex flex-col border-b border-line bg-surface md:sticky md:top-0 md:h-screen md:w-60 md:shrink-0 md:border-r md:border-b-0">
      <div className="px-4 py-4">
        <Link href="/" className="text-base font-semibold tracking-tight text-ink">
          NewsBot <span className="font-normal text-ink-2">Painel</span>
        </Link>
      </div>
      <NavLinks />
      <div className="mt-auto hidden px-4 py-4 text-xs text-muted md:block">
        <p>
          Fonte de dados:{' '}
          <span className="font-medium text-ink-2">
            {dataSource === 'demo' ? 'demo (memória)' : 'MySQL'}
          </span>
        </p>
      </div>
    </aside>
  );
}
