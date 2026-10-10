/**
 * Helpers usados pelos componentes de cliente para ler respostas da API
 * sem depender de `any`.
 */

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function readApiErrorMessage(body: unknown, fallback: string): string {
  if (isRecord(body) && isRecord(body.error) && typeof body.error.message === 'string') {
    return body.error.message;
  }
  return fallback;
}

export function readAffectedCount(body: unknown): number | null {
  if (isRecord(body) && isRecord(body.data) && typeof body.data.affected === 'number') {
    return body.data.affected;
  }
  return null;
}

export async function parseJsonSafely(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}
