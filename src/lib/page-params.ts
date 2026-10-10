export type SearchParams = Record<string, string | string[] | undefined>;

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/** Primeiro valor não vazio de um parâmetro de busca. */
export function readString(params: SearchParams, key: string): string | undefined {
  const raw = params[key];
  const value = Array.isArray(raw) ? raw[0] : raw;
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function readPage(params: SearchParams): number {
  const value = Number(readString(params, 'page'));
  return Number.isInteger(value) && value > 0 ? value : 1;
}

export function readDate(params: SearchParams, key: string): string | undefined {
  const value = readString(params, key);
  return value && DATE_ONLY.test(value) ? value : undefined;
}

export function readOneOf<T extends string>(
  params: SearchParams,
  key: string,
  allowed: readonly T[],
): T | undefined {
  const value = readString(params, key);
  return allowed.includes(value as T) ? (value as T) : undefined;
}

export const DEFAULT_PAGE_SIZE = 20;
