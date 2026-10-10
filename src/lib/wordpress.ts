import { getWordpressUrl } from './env';

/** Monta o link público do post no WordPress a partir de `post_id_wp`. */
export function buildWordpressPostUrl(wpPostId: number | null): string | null {
  const base = getWordpressUrl();
  if (!base || wpPostId === null) return null;
  return `${base}/?p=${wpPostId}`;
}
