import type { Pool, RowDataPacket } from 'mysql2/promise';
import type { LogEntry, LogFilters, LogStatus } from '@/lib/types';
import type { LogsRepository } from '../types';

interface LogRow extends RowDataPacket {
  id: number;
  fluxo: string;
  status: LogStatus;
  mensagem: string | null;
  criado_em: Date;
}

interface FlowRow extends RowDataPacket {
  fluxo: string;
}

const TABLE = 'execucoes_log';

function mapLog(row: LogRow): LogEntry {
  return {
    id: row.id,
    flow: row.fluxo,
    status: row.status,
    message: row.mensagem,
    createdAt: row.criado_em,
  };
}

export class MysqlLogsRepository implements LogsRepository {
  constructor(private readonly pool: Pool) {}

  async list(filters: LogFilters): Promise<LogEntry[]> {
    const clauses: string[] = [];
    const params: unknown[] = [];
    if (filters.flow) {
      clauses.push('fluxo = ?');
      params.push(filters.flow);
    }
    if (filters.status) {
      clauses.push('status = ?');
      params.push(filters.status);
    }
    const where = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';
    const [rows] = await this.pool.query<LogRow[]>(
      `SELECT id, fluxo, status, mensagem, criado_em FROM ${TABLE} ${where} ORDER BY criado_em DESC, id DESC LIMIT ?`,
      [...params, filters.limit],
    );
    return rows.map(mapLog);
  }

  async listFlows(): Promise<string[]> {
    const [rows] = await this.pool.query<FlowRow[]>(
      `SELECT DISTINCT fluxo FROM ${TABLE} ORDER BY fluxo`,
    );
    return rows.map((row) => row.fluxo);
  }
}
