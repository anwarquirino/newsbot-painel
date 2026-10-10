export type AppErrorCode =
  | 'VALIDATION_ERROR'
  | 'INVALID_JSON'
  | 'NOT_FOUND'
  | 'INVALID_STATUS'
  | 'UNAUTHORIZED'
  | 'MIGRATION_REQUIRED'
  | 'INTERNAL_ERROR';

/** Erro de aplicação com status HTTP e código estável, serializado pela API como JSON. */
export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: AppErrorCode,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }
}
