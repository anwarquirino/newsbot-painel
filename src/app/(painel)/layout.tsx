import type { ReactNode } from 'react';
import { DemoBanner } from '@/components/layout/DemoBanner';
import { Sidebar } from '@/components/layout/Sidebar';
import { isAuthEnabled } from '@/lib/env';
import { getRepositories } from '@/lib/repositories';

export default function PanelLayout({ children }: { children: ReactNode }) {
  const dataSource = getRepositories().source;
  const authEnabled = isAuthEnabled();

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar dataSource={dataSource} authEnabled={authEnabled} />
      <div className="flex min-w-0 flex-1 flex-col">
        <DemoBanner dataSource={dataSource} authEnabled={authEnabled} />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:px-8 md:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
