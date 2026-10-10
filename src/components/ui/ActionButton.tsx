'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { parseJsonSafely, readAffectedCount, readApiErrorMessage } from '@/lib/api/client';

type Feedback = { type: 'idle' } | { type: 'error' | 'success'; message: string };

interface ActionButtonProps {
  endpoint: string;
  label: string;
  pendingLabel?: string;
  confirmMessage?: string;
  /** Mensagem de sucesso; `{affected}` é substituído pela quantidade devolvida pela API. */
  successMessage?: string;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
}

const VARIANT_CLASS: Record<NonNullable<ActionButtonProps['variant']>, string> = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  danger: 'btn-danger',
};

/** Botão que dispara um POST na API e atualiza os Server Components da página ao concluir. */
export function ActionButton({
  endpoint,
  label,
  pendingLabel = 'Aguarde…',
  confirmMessage,
  successMessage = 'Concluído.',
  variant = 'secondary',
  disabled = false,
}: ActionButtonProps) {
  const router = useRouter();
  const [isRefreshing, startTransition] = useTransition();
  const [isSubmitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>({ type: 'idle' });

  async function run() {
    if (confirmMessage && !window.confirm(confirmMessage)) return;
    setSubmitting(true);
    setFeedback({ type: 'idle' });
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { Accept: 'application/json' },
      });
      const body = await parseJsonSafely(response);
      if (!response.ok) {
        setFeedback({
          type: 'error',
          message: readApiErrorMessage(body, `Falha na requisição (${response.status}).`),
        });
        return;
      }
      const affected = readAffectedCount(body);
      setFeedback({
        type: 'success',
        message: successMessage.replace('{affected}', String(affected ?? '')),
      });
      startTransition(() => router.refresh());
    } catch {
      setFeedback({ type: 'error', message: 'Não foi possível falar com o servidor.' });
    } finally {
      setSubmitting(false);
    }
  }

  const busy = isSubmitting || isRefreshing;

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={run}
        disabled={disabled || busy}
        className={VARIANT_CLASS[variant]}
      >
        {isSubmitting ? pendingLabel : label}
      </button>
      {feedback.type !== 'idle' ? (
        <span
          role="status"
          className={`text-xs ${feedback.type === 'error' ? 'text-critical-text' : 'text-good-text'}`}
        >
          {feedback.message}
        </span>
      ) : null}
    </span>
  );
}
