import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SESSION_COOKIE, sanitizeNextPath, verifySessionToken } from '@/lib/auth/session';
import { getSessionSecret, isAuthEnabled } from '@/lib/env';
import { readString, type SearchParams } from '@/lib/page-params';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Entrar' };

interface LoginPageProps {
  searchParams: Promise<SearchParams>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  if (!isAuthEnabled()) redirect('/');

  const params = await searchParams;
  const next = sanitizeNextPath(readString(params, 'next'));
  const hasError = readString(params, 'erro') === '1';

  const secret = getSessionSecret();
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (secret && (await verifySessionToken(token, secret))) redirect(next);

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <form method="post" action="/api/auth/login" className="card w-full max-w-sm">
        <h1 className="text-lg font-semibold tracking-tight text-ink">
          NewsBot <span className="font-normal text-ink-2">Painel</span>
        </h1>
        <p className="mt-1 text-sm text-ink-2">Informe a senha de acesso para continuar.</p>
        <input type="hidden" name="next" value={next} />
        <div className="mt-5">
          <label htmlFor="password" className="label">
            Senha
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="input"
          />
        </div>
        {hasError ? (
          <p role="alert" className="mt-2 text-xs text-critical-text">
            Senha incorreta. Tente novamente.
          </p>
        ) : null}
        <button type="submit" className="btn-primary mt-5 w-full">
          Entrar
        </button>
      </form>
    </main>
  );
}
