'use client';

import { useId, useState } from 'react';
import { formatNumber, pluralize } from '@/lib/format';
import type { DailyCount } from '@/lib/metrics';

interface ColumnChartProps {
  points: DailyCount[];
  unitSingular: string;
  unitPlural: string;
  caption: string;
}

const PLOT_HEIGHT = 160;

/** Teto "redondo" do eixo Y para o maior valor da série. */
function niceMax(max: number): number {
  if (max <= 5) return Math.max(max, 1);
  if (max <= 10) return Math.ceil(max / 2) * 2;
  if (max <= 50) return Math.ceil(max / 10) * 10;
  return Math.ceil(max / 50) * 50;
}

function tickValues(top: number): number[] {
  if (top <= 5) return Array.from({ length: top + 1 }, (_, index) => index);
  return [0, top / 2, top];
}

/**
 * Gráfico de colunas de uma série (HTML/CSS): colunas finas com topo arredondado,
 * grade hairline, rótulo direto só no maior valor, tooltip por coluna (mouse e teclado)
 * e versão em tabela para leitura sem o gráfico.
 */
export function ColumnChart({ points, unitSingular, unitPlural, caption }: ColumnChartProps) {
  const [active, setActive] = useState<number | null>(null);
  const tableId = useId();
  const max = Math.max(0, ...points.map((point) => point.count));
  const top = niceMax(max);
  const ticks = tickValues(top);
  const lastMaxIndex = max > 0 ? points.map((point) => point.count).lastIndexOf(max) : -1;
  const heightOf = (count: number) => `${(count / top) * 100}%`;
  const activePoint = active !== null ? points[active] : null;
  const tooltipShift =
    active === 0
      ? 'translate-x-0'
      : active === points.length - 1
        ? '-translate-x-full'
        : '-translate-x-1/2';

  return (
    <figure className="mt-3">
      <div className="flex">
        <div
          aria-hidden="true"
          className="relative w-8 shrink-0 text-[11px] text-muted tabular-nums"
          style={{ height: PLOT_HEIGHT }}
        >
          {ticks.map((tick) => (
            <span
              key={tick}
              className="absolute right-1 -translate-y-1/2"
              style={{ bottom: heightOf(tick) }}
            >
              {formatNumber(tick)}
            </span>
          ))}
        </div>
        <div className="relative min-w-0 flex-1" style={{ height: PLOT_HEIGHT }}>
          {ticks.map((tick) => (
            <div
              key={tick}
              aria-hidden="true"
              className={`absolute right-0 left-0 border-t ${
                tick === 0 ? 'border-line-strong' : 'border-grid'
              }`}
              style={{ bottom: heightOf(tick) }}
            />
          ))}
          <div className="absolute inset-0 flex items-end">
            {points.map((point, index) => (
              <div
                key={point.date}
                className="relative flex h-full flex-1 items-end justify-center px-0.5"
              >
                <button
                  type="button"
                  aria-label={`${point.label}: ${pluralize(point.count, unitSingular, unitPlural)}`}
                  className="group absolute inset-0 flex items-end justify-center rounded-sm"
                  onPointerEnter={() => setActive(index)}
                  onPointerLeave={() => setActive(null)}
                  onFocus={() => setActive(index)}
                  onBlur={() => setActive(null)}
                >
                  <span
                    aria-hidden="true"
                    className={`block w-full max-w-6 rounded-t transition-colors ${
                      active === index ? 'bg-series-1-hover' : 'bg-series-1'
                    }`}
                    style={{ height: heightOf(point.count), minHeight: point.count > 0 ? 2 : 0 }}
                  />
                </button>
                {index === lastMaxIndex ? (
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute text-[11px] font-medium text-ink-2"
                    style={{ bottom: `calc(${heightOf(point.count)} + 4px)` }}
                  >
                    {formatNumber(point.count)}
                  </span>
                ) : null}
              </div>
            ))}
          </div>
          {activePoint && active !== null ? (
            <div
              role="tooltip"
              className={`pointer-events-none absolute z-10 rounded-md border border-line bg-surface px-2.5 py-1.5 text-xs whitespace-nowrap shadow-sm ${tooltipShift}`}
              style={{
                left: `${((active + 0.5) / points.length) * 100}%`,
                ...(activePoint.count / top > 0.7
                  ? { top: 4 }
                  : { bottom: `calc(${heightOf(activePoint.count)} + 24px)` }),
              }}
            >
              <span className="font-semibold text-ink">{formatNumber(activePoint.count)}</span>{' '}
              <span className="text-ink-2">
                {activePoint.count === 1 ? unitSingular : unitPlural}
              </span>
              <span className="block text-muted">{activePoint.label}</span>
            </div>
          ) : null}
        </div>
      </div>
      <div aria-hidden="true" className="ml-8 flex pt-1 text-[11px] text-muted">
        {points.map((point, index) => (
          <span key={point.date} className="flex-1 text-center">
            {(points.length - 1 - index) % 2 === 0 ? point.label : ''}
          </span>
        ))}
      </div>
      <details className="mt-3">
        <summary className="cursor-pointer text-xs text-ink-2 hover:text-ink">
          Ver dados em tabela
        </summary>
        <table id={tableId} className="table mt-2 max-w-sm">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr>
              <th scope="col">Dia</th>
              <th scope="col" className="text-right">
                {unitPlural}
              </th>
            </tr>
          </thead>
          <tbody>
            {points.map((point) => (
              <tr key={point.date}>
                <td>{point.label}</td>
                <td className="text-right tabular-nums">{formatNumber(point.count)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
