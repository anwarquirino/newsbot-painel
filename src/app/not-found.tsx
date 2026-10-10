import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="card max-w-md text-center">
        <h1 className="text-lg font-semibold text-ink">Página não encontrada</h1>
        <p className="mt-2 text-sm text-ink-2">O endereço não existe neste painel.</p>
        <Link href="/" className="btn-primary mt-4">
          Ir para a visão geral
        </Link>
      </div>
    </main>
  );
}
