import sanitizeHtml from 'sanitize-html';

const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    'h2',
    'h3',
    'h4',
    'p',
    'br',
    'strong',
    'em',
    'b',
    'i',
    'u',
    'ul',
    'ol',
    'li',
    'a',
    'blockquote',
    'figure',
    'figcaption',
    'img',
    'table',
    'thead',
    'tbody',
    'tr',
    'th',
    'td',
    'code',
    'pre',
  ],
  allowedAttributes: {
    a: ['href', 'title', 'rel', 'target'],
    img: ['src', 'alt', 'title'],
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  transformTags: {
    a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer', target: '_blank' }),
  },
  disallowedTagsMode: 'discard',
};

/**
 * Limpa o HTML gerado pela IA (`conteudo_reescrito`) antes de renderizar:
 * remove scripts, handlers inline, estilos e qualquer tag fora da lista permitida.
 */
export function sanitizeArticleHtml(html: string | null | undefined): string {
  if (!html) return '';
  return sanitizeHtml(html, OPTIONS).trim();
}
