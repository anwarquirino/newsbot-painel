import Link from 'next/link';

export default function PanelNotFound() {
  return (
    <div className="card mx-auto mt-8 max-w-lg text-center">
      <h1 className="text-lg font-semibold text-ink">Artigo não encontrado</h1>
      <p className="mt-2 text-sm text-ink-2">
        O item pode ter sido removido do banco ou o endereço está incorreto.
      </p>
      <Link href="/" className="btn-primary mt-4">
        Ir para a visão geral
      </Link>
    </div>
  );
}
