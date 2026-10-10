import type { DataSource } from '@/lib/env';

interface DemoBannerProps {
  dataSource: DataSource;
  authEnabled: boolean;
}

/** Aviso fixo no topo quando o painel roda com dados fictícios ou sem autenticação. */
export function DemoBanner({ dataSource, authEnabled }: DemoBannerProps) {
  if (dataSource !== 'demo' && authEnabled) return null;

  const parts: string[] = [];
  if (dataSource === 'demo') {
    parts.push(
      'Modo demonstração: os dados são fictícios e ficam em memória; alterações são perdidas ao reiniciar.',
    );
  }
  if (!authEnabled) {
    parts.push('Autenticação desativada: defina PAINEL_SENHA para proteger o acesso.');
  }

  return (
    <div
      role="status"
      className="flex items-start gap-2 border-b border-line bg-surface px-4 py-2 text-xs text-ink-2 md:px-8"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 16 16"
        className="mt-0.5 h-3.5 w-3.5 shrink-0 fill-warning"
      >
        <path d="M8 1.5 15 14H1L8 1.5Zm0 4a.75.75 0 0 0-.75.75v3a.75.75 0 0 0 1.5 0v-3A.75.75 0 0 0 8 5.5Zm0 6.75a.9.9 0 1 0 0-1.8.9.9 0 0 0 0 1.8Z" />
      </svg>
      <p>{parts.join(' ')}</p>
    </div>
  );
}
