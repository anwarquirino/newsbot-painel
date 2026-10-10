import { describe, expect, it } from 'vitest';
import {
  createSessionToken,
  sanitizeNextPath,
  SESSION_TTL_SECONDS,
  verifySessionToken,
} from '@/lib/auth/session';

describe('sessão assinada', () => {
  it('aceita um token válido e rejeita segredo errado ou token adulterado', async () => {
    const token = await createSessionToken('segredo-forte');
    expect(await verifySessionToken(token, 'segredo-forte')).toBe(true);
    expect(await verifySessionToken(token, 'outro-segredo')).toBe(false);
    expect(await verifySessionToken(`${token}x`, 'segredo-forte')).toBe(false);
    expect(await verifySessionToken('abc', 'segredo-forte')).toBe(false);
    expect(await verifySessionToken(undefined, 'segredo-forte')).toBe(false);
  });

  it('expira após o prazo da sessão', async () => {
    const issued = new Date('2026-10-10T12:00:00Z');
    const token = await createSessionToken('segredo', issued);
    const beforeExpiry = new Date(issued.getTime() + (SESSION_TTL_SECONDS - 1) * 1000);
    const afterExpiry = new Date(issued.getTime() + (SESSION_TTL_SECONDS + 1) * 1000);
    expect(await verifySessionToken(token, 'segredo', beforeExpiry)).toBe(true);
    expect(await verifySessionToken(token, 'segredo', afterExpiry)).toBe(false);
  });

  it('só redireciona para caminhos internos após o login', () => {
    expect(sanitizeNextPath('/fila?page=2')).toBe('/fila?page=2');
    expect(sanitizeNextPath('https://malicioso.com')).toBe('/');
    expect(sanitizeNextPath('//malicioso.com')).toBe('/');
    expect(sanitizeNextPath('/login')).toBe('/');
    expect(sanitizeNextPath(undefined)).toBe('/');
  });
});
