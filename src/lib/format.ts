const dateTimeFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const numberFormatter = new Intl.NumberFormat('pt-BR');

export const EMPTY_VALUE = '—';

export function formatDateTime(date: Date | null | undefined): string {
  return date ? dateTimeFormatter.format(date) : EMPTY_VALUE;
}

export function formatDate(date: Date | null | undefined): string {
  return date ? dateFormatter.format(date) : EMPTY_VALUE;
}

export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

/** Tempo decorrido em linguagem curta: "agora", "há 12 min", "há 3 h", "há 2 d". */
export function formatRelative(date: Date, now: Date = new Date()): string {
  const minutes = Math.round((now.getTime() - date.getTime()) / 60_000);
  if (minutes < 1) return 'agora';
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `há ${hours} h`;
  const days = Math.round(hours / 24);
  return `há ${days} d`;
}

export function splitTags(tags: string | null | undefined): string[] {
  if (!tags) return [];
  return tags
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function pluralize(count: number, singular: string, plural: string): string {
  return `${formatNumber(count)} ${count === 1 ? singular : plural}`;
}

export function truncateMiddle(text: string, visible: number = 8): string {
  if (text.length <= visible * 2 + 1) return text;
  return `${text.slice(0, visible)}…${text.slice(-visible)}`;
}
