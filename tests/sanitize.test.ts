import { describe, expect, it } from 'vitest';
import { sanitizeArticleHtml } from '@/lib/sanitize';

describe('sanitizeArticleHtml', () => {
  it('remove scripts, handlers inline e tags fora da lista permitida', () => {
    const dirty =
      '<p onclick="alert(1)">Texto</p><script>alert("xss")</script><style>p{}</style><iframe src="x"></iframe>';
    const clean = sanitizeArticleHtml(dirty);
    expect(clean).toBe('<p>Texto</p>');
  });

  it('mantém a estrutura editorial e endurece os links', () => {
    const html =
      '<h2>Título</h2><ul><li><strong>Item</strong></li></ul><a href="https://exemplo.com.br/x">fonte</a><a href="javascript:alert(1)">x</a>';
    const clean = sanitizeArticleHtml(html);
    expect(clean).toContain('<h2>Título</h2>');
    expect(clean).toContain('<li><strong>Item</strong></li>');
    expect(clean).toContain('href="https://exemplo.com.br/x"');
    expect(clean).toContain('rel="noopener noreferrer"');
    expect(clean).toContain('target="_blank"');
    expect(clean).not.toContain('javascript:');
  });

  it('devolve string vazia para conteúdo ausente', () => {
    expect(sanitizeArticleHtml(null)).toBe('');
    expect(sanitizeArticleHtml('')).toBe('');
  });
});
