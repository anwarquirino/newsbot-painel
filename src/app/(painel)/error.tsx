'use client';

import { useEffect } from 'react';

interface PanelErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function PanelError({ error, reset }: PanelErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="card mx-auto mt-8 max-w-lg text-center">
      <h1 className="text-lg font-semibold text-ink">Não foi possível carregar esta página</h1>
      <p className="mt-2 text-sm text-ink-2">
        Houve uma falha ao consultar a fonte de dados. Verifique a conexão com o banco do NewsBot e
        tente novamente.
      </p>
      {error.digest ? <p className="mt-2 text-xs text-muted">Referência: {error.digest}</p> : null}
      <button type="button" onClick={reset} className="btn-primary mt-4">
        Tentar novamente
      </button>
    </div>
  );
}
