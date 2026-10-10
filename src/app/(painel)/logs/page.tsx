import type { Metadata } from 'next';
import { EmptyState } from '@/components/ui/EmptyState';
import { FilterForm, SelectField, toOptions } from '@/components/ui/FilterForm';
import { PageHeader } from '@/components/ui/PageHeader';
import { LogStatusBadge } from '@/components/ui/StatusBadge';
import { formatDateTime, formatNumber } from '@/lib/format';
import { readOneOf, readString, type SearchParams } from '@/lib/page-params';
import { getRepositories } from '@/lib/repositories';
import { LOG_STATUSES } from '@/lib/types';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Logs' };

const LOG_LIMIT = 200;

const STATUS_OPTIONS = [
  { value: 'ok', label: 'OK' },
  { value: 'erro', label: 'Erro' },
];

interface LogsPageProps {
  searchParams: Promise<SearchParams>;
}

export default async function LogsPage({ searchParams }: LogsPageProps) {
  const params = await searchParams;
  const flow = readString(params, 'flow');
  const status = readOneOf(params, 'status', LOG_STATUSES);

  const logs = getRepositories().logs;
  const [entries, flows] = await Promise.all([
    logs.list({ flow, status, limit: LOG_LIMIT }),
    logs.listFlows(),
  ]);
  const hasFilters = Boolean(flow || status);

  return (
    <>
      <PageHeader
        title="Logs de execução"
        description={`Últimas ${LOG_LIMIT} linhas da tabela execucoes_log, gravadas pelos fluxos do n8n.`}
      />

      <FilterForm action="/logs">
        <SelectField
          name="flow"
          label="Fluxo"
          value={flow}
          options={toOptions(flows)}
          placeholder="Todos"
        />
        <SelectField
          name="status"
          label="Status"
          value={status}
          options={STATUS_OPTIONS}
          placeholder="Todos"
          className="w-full md:w-36"
        />
      </FilterForm>

      {entries.length === 0 ? (
        <EmptyState
          title={hasFilters ? 'Nenhuma linha corresponde aos filtros' : 'Nenhum log registrado'}
          description={
            hasFilters
              ? 'Limpe os filtros para ver todas as execuções.'
              : 'Os fluxos do n8n gravam uma linha a cada execução concluída ou com falha.'
          }
        />
      ) : (
        <>
          <p className="mb-2 text-xs text-muted">{formatNumber(entries.length)} linhas exibidas</p>
          <div className="card overflow-x-auto p-0">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Quando</th>
                  <th scope="col">Fluxo</th>
                  <th scope="col">Status</th>
                  <th scope="col">Mensagem</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id}>
                    <td className="whitespace-nowrap text-ink-2 tabular-nums">
                      {formatDateTime(entry.createdAt)}
                    </td>
                    <td className="whitespace-nowrap">
                      <code className="rounded bg-surface-2 px-1.5 py-0.5 text-xs text-ink">
                        {entry.flow}
                      </code>
                    </td>
                    <td className="whitespace-nowrap">
                      <LogStatusBadge status={entry.status} />
                    </td>
                    <td className="min-w-[20rem] text-ink-2">
                      {entry.message ?? <span className="text-muted">Sem mensagem</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}
