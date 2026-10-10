import { ZodError } from 'zod';
import { AppError, type AppErrorCode } from '@/lib/errors';
import type { ActionOutcome, Pagination } from '@/lib/types';

interface OkOptions {
  status?: number;
  pagination?: Pagination;
}

/** Resposta de sucesso: `{ data }` ou `{ data, pagination }` para listas. */
export function ok<T>(data: T, options: OkOptions = {}): Response {
  const body = options.pagination ? { data, pagination: options.pagination } : { data };
  return Response.json(body, { status: options.status ?? 200 });
}

/** Resposta de erro: `{ error: { code, message, details? } }`. */
export function fail(
  status: number,
  code: AppErrorCode,
  message: string,
  details?: unknown,
): Response {
  const error = details === undefined ? { code, message } : { code, message, details };
  return Response.json({ error }, { status });
}

function formatZodIssues(error: ZodError): Array<{ path: string; message: string }> {
  return error.issues.map((issue) => ({
    path: issue.path.map(String).join('.'),
    message: issue.message,
  }));
}

/** Executa o handler e converte exceções em respostas JSON consistentes. */
export async function handle(run: () => Promise<Response>): Promise<Response> {
  try {
    return await run();
  } catch (error) {
    if (error instanceof AppError) {
      return fail(error.status, error.code, error.message, error.details);
    }
    if (error instanceof ZodError) {
      return fail(400, 'VALIDATION_ERROR', 'Parâmetros inválidos.', formatZodIssues(error));
    }
    console.error('[api] erro não tratado', error);
    return fail(500, 'INTERNAL_ERROR', 'Erro interno ao processar a requisição.');
  }
}

export async function readJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new AppError(400, 'INVALID_JSON', 'O corpo da requisição não é um JSON válido.');
  }
}

/** Converte os search params em objeto, descartando valores em branco enviados por formulários GET. */
export function searchParamsToObject(url: URL): Record<string, string> {
  const result: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    const trimmed = value.trim();
    if (trimmed) result[key] = trimmed;
  });
  return result;
}

/** Transforma o resultado de uma ação do repositório em valor ou erro HTTP (404/409). */
export function unwrapOutcome<T>(
  outcome: ActionOutcome<T>,
  id: number,
  invalidStatusMessage: string,
): T {
  if (outcome.ok) return outcome.value;
  if (outcome.reason === 'not_found') {
    throw new AppError(404, 'NOT_FOUND', `Artigo ${id} não encontrado.`);
  }
  throw new AppError(409, 'INVALID_STATUS', invalidStatusMessage);
}
