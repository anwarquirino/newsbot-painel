'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { parseJsonSafely, readApiErrorMessage } from '@/lib/api/client';

interface ArticleEditFormProps {
  id: number;
  initial: {
    title: string;
    sourceSummary: string;
    tags: string;
  };
}

type FormState = { type: 'idle' | 'saving' } | { type: 'saved' | 'error'; message: string };

/** Edição de título, resumo da fonte e tags via PATCH; disponível só para itens na fila. */
export function ArticleEditForm({ id, initial }: ArticleEditFormProps) {
  const router = useRouter();
  const [values, setValues] = useState(initial);
  const [state, setState] = useState<FormState>({ type: 'idle' });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState({ type: 'saving' });
    try {
      const response = await fetch(`/api/articles/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          title: values.title,
          sourceSummary: values.sourceSummary,
          tags: values.tags,
        }),
      });
      const body = await parseJsonSafely(response);
      if (!response.ok) {
        setState({
          type: 'error',
          message: readApiErrorMessage(body, `Não foi possível salvar (${response.status}).`),
        });
        return;
      }
      setState({ type: 'saved', message: 'Alterações salvas.' });
      router.refresh();
    } catch {
      setState({ type: 'error', message: 'Não foi possível falar com o servidor.' });
    }
  }

  const saving = state.type === 'saving';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="edit-title" className="label">
          Título
        </label>
        <input
          id="edit-title"
          name="title"
          required
          minLength={5}
          maxLength={500}
          value={values.title}
          onChange={(event) => setValues({ ...values, title: event.target.value })}
          className="input"
        />
      </div>
      <div>
        <label htmlFor="edit-source-summary" className="label">
          Resumo da fonte
        </label>
        <textarea
          id="edit-source-summary"
          name="sourceSummary"
          rows={4}
          maxLength={5000}
          value={values.sourceSummary}
          onChange={(event) => setValues({ ...values, sourceSummary: event.target.value })}
          className="input"
        />
        <p className="mt-1 text-xs text-muted">
          Este texto é o insumo da IA; ajuste-o antes de o item ser processado.
        </p>
      </div>
      <div>
        <label htmlFor="edit-tags" className="label">
          Tags
        </label>
        <input
          id="edit-tags"
          name="tags"
          maxLength={500}
          value={values.tags}
          onChange={(event) => setValues({ ...values, tags: event.target.value })}
          placeholder="separadas por vírgula"
          className="input"
        />
      </div>
      <div className="flex items-center gap-3">
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? 'Salvando…' : 'Salvar alterações'}
        </button>
        {state.type === 'saved' || state.type === 'error' ? (
          <span
            role="status"
            className={`text-xs ${state.type === 'error' ? 'text-critical-text' : 'text-good-text'}`}
          >
            {state.message}
          </span>
        ) : null}
      </div>
    </form>
  );
}
