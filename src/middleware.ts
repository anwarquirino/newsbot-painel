import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE, verifySessionToken } from '@/lib/auth/session';
import { getSessionSecret, isAuthEnabled } from '@/lib/env';

/**
 * Protege todas as rotas quando PAINEL_SENHA está definida. Sem senha
 * (modo demo), a proteção fica desligada e o layout exibe um aviso.
 */
export async function middleware(request: NextRequest) {
  if (!isAuthEnabled()) return NextResponse.next();

  const secret = getSessionSecret();
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (secret && (await verifySessionToken(token, secret))) {
    return NextResponse.next();
  }

  const { pathname, search } = request.nextUrl;
  if (pathname.startsWith('/api/')) {
    return NextResponse.json(
      {
        error: {
          code: 'UNAUTHORIZED',
          message: 'Sessão ausente ou expirada. Autentique-se em /login.',
        },
      },
      { status: 401 },
    );
  }

  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('next', `${pathname}${search}`);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|login|api/health|api/auth/).*)'],
};
