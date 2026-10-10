import Link from 'next/link';
import type { DataSource } from '@/lib/env';
import { NavLinks } from './NavLinks';

interface SidebarProps {
  dataSource: DataSource;
  authEnabled: boolean;
}

export function Sidebar({ dataSource, authEnabled }: SidebarProps) {
  return (
    <aside className="flex flex-col border-b border-line bg-surface md:sticky md:top-0 md:h-screen md:w-60 md:shrink-0 md:border-r md:border-b-0">
      <div className="flex items-center justify-between px-4 py-4">
        <Link href="/" className="text-base font-semibold tracking-tight text-ink">
          NewsBot <span className="font-normal text-ink-2">Painel</span>
        </Link>
        {authEnabled ? (
          <form method="post" action="/api/auth/logout" className="md:hidden">
            <button type="submit" className="btn-secondary">
              Sair
            </button>
          </form>
        ) : null}
      </div>
      <NavLinks />
      <div className="mt-auto hidden px-4 py-4 text-xs text-muted md:block">
        <p>
          Fonte de dados:{' '}
          <span className="font-medium text-ink-2">
            {dataSource === 'demo' ? 'demo (memória)' : 'MySQL'}
          </span>
        </p>
        {authEnabled ? (
          <form method="post" action="/api/auth/logout" className="mt-3">
            <button type="submit" className="btn-secondary w-full">
              Sair
            </button>
          </form>
        ) : null}
      </div>
    </aside>
  );
}
