import { buildClearSessionCookie, isSecureRequest } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export async function POST(request: Request): Promise<Response> {
  const cookie = buildClearSessionCookie(isSecureRequest(request));
  const accept = request.headers.get('accept') ?? '';
  if (accept.includes('application/json')) {
    return Response.json({ data: { authenticated: false } }, { headers: { 'Set-Cookie': cookie } });
  }
  return new Response(null, {
    status: 303,
    headers: { Location: '/login', 'Set-Cookie': cookie },
  });
}
