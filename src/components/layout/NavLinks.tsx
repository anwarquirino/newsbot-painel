'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/', label: 'Visão geral' },
  { href: '/fila', label: 'Fila' },
  { href: '/publicados', label: 'Publicados' },
  { href: '/erros', label: 'Erros' },
  { href: '/logs', label: 'Logs' },
];

export function NavLinks() {
  const pathname = usePathname();

  return (
    <nav aria-label="Principal">
      <ul className="flex gap-1 overflow-x-auto px-2 pb-2 md:flex-col md:px-3 md:pb-0">
        {NAV_ITEMS.map((item) => {
          const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
          return (
            <li key={item.href} className="shrink-0">
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`block rounded-md px-3 py-2 text-sm transition-colors ${
                  active
                    ? 'bg-accent-soft/60 font-medium text-ink'
                    : 'text-ink-2 hover:bg-surface-2 hover:text-ink'
                }`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
