import { EMPTY_VALUE } from '@/lib/format';
import { buildWordpressPostUrl } from '@/lib/wordpress';

interface WordpressLinkProps {
  wpPostId: number | null;
  label?: string;
}

/** Link para o post publicado; sem WORDPRESS_URL mostra só o ID. */
export function WordpressLink({ wpPostId, label = 'Ver no WordPress' }: WordpressLinkProps) {
  if (wpPostId === null) return <span className="text-muted">{EMPTY_VALUE}</span>;
  const url = buildWordpressPostUrl(wpPostId);
  if (!url) return <span className="text-ink-2">ID {wpPostId}</span>;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="text-accent-text underline underline-offset-2 hover:text-ink"
    >
      {label}
    </a>
  );
}
