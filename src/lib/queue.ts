import { STUCK_PROCESSING_MINUTES, type ArticleSummary } from './types';

const MINUTE_MS = 60_000;

/**
 * Um item "processando" é considerado travado quando foi coletado há mais de
 * `minutes` minutos. O schema do NewsBot não guarda a hora da mudança de status,
 * então `data_coleta` é o melhor indicador disponível.
 */
export function isStuckProcessing(
  article: Pick<ArticleSummary, 'status' | 'collectedAt'>,
  now: Date,
  minutes: number = STUCK_PROCESSING_MINUTES,
): boolean {
  if (article.status !== 'processando') return false;
  return now.getTime() - article.collectedAt.getTime() >= minutes * MINUTE_MS;
}
