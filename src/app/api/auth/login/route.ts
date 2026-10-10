import { createHash, timingSafeEqual } from 'node:crypto';
import { fail } from '@/lib/api/http';
import {
  buildSessionCookie,
  createSessionToken,
  isSecureRequest,
  sanitizeNextPath,
} from '@/lib/auth/session';
import { getPanelPassword, getSessionSecret } from '@/lib/env';

export const dynamic = 'force-dynamic';

interface Credentials {
  password: string;
  next: string;
  wantsJson: boolean;
}

function passwordsMatch(candidate: string, expected: string): boolean {
  const left = createHash('sha256').update(candidate).digest();
  const right = createHash('sha256').update(expected).digest();
  return timingSafeEqual(left, right);
}

async function readCredentials(request: Request): Promise<Credentials> {
  const contentType = request.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    const body = (await request.json().catch(() => null)) as { password?: unknown } | null;
    return {
      password: typeof body?.password === 'string' ? body.password : '',
      next: '/',
      wantsJson: true,
    };
  }
  const form = await request.formData();
  const password = form.get('password');
  const next = form.get('next');
  return {
    password: typeof password === 'string' ? password : '',
    next: sanitizeNextPath(typeof next === 'string' ? next : undefined),
    wantsJson: false,
  };
}

function redirectTo(location: string, cookie?: string): Response {
  const headers = new Headers({ Location: location });
  if (cookie) headers.set('Set-Cookie', cookie);
  return new Response(null, { status: 303, headers });
}

export async function POST(request: Request): Promise<Response> {
  const expected = getPanelPassword();
  const secret = getSessionSecret();
  if (!expected || !secret) {
    return fail(409, 'AUTH_DISABLED', 'A autenticação está desligada (PAINEL_SENHA não definida).');
  }

  const credentials = await readCredentials(request);
  if (!credentials.password || !passwordsMatch(credentials.password, expected)) {
    if (credentials.wantsJson) return fail(401, 'UNAUTHORIZED', 'Senha incorreta.');
    const retry = new URLSearchParams({ erro: '1', next: credentials.next });
    return redirectTo(`/login?${retry.toString()}`);
  }

  const cookie = buildSessionCookie(await createSessionToken(secret), isSecureRequest(request));
  if (credentials.wantsJson) {
    return Response.json({ data: { authenticated: true } }, { headers: { 'Set-Cookie': cookie } });
  }
  return redirectTo(credentials.next, cookie);
}
