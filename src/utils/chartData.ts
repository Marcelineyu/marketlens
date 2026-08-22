import { aggregate, topN } from '../analytics/aggregations';
import { finiteNumber, numericValues } from '../analytics/numeric';
import { ChartSpec, ColumnProfile, Row } from '../types';
import { formatChartDateLabel } from './chartDates';
import { outlierCaption, rowsForChartView } from './chartOutliers';

const binNumber = (value: number, precision: number) => {
  const rounded = Math.abs(value) < 10 ** (-precision) / 2 ? 0 : value;
  return Number(rounded.toFixed(precision)).toString();
};

function scatterPoints(rows: Row[], spec: ChartSpec) {
  return rows.flatMap((row) => {
    const x = finiteNumber(row[spec.x]);
    const y = finiteNumber(row[spec.y!]);
    return x === undefined || y === undefined ? [] : [{ name: String(row[spec.x]), x, y }];
  });
}

function histogram(rows: Row[], field: string) {
  const vals = numericValues(rows.map((row) => row[field]));
  if (!vals.length) return [];
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  if (max - min <= Math.max(1, Math.abs(min), Math.abs(max)) * 1e-12) {
    return [
      {
        name: binNumber(
          min,
          Math.min(8, Math.max(0, Math.ceil(-Math.log10(Math.abs(min) || 1)) + 2)),
        ),
        value: vals.length,
      },
    ];
  }
  const bins = Math.min(10, Math.max(2, Math.ceil(Math.sqrt(vals.length))));
  const step = (max - min) / bins;
  const precision = Math.min(8, Math.max(0, Math.ceil(-Math.log10(step)) + 1));
  return Array.from({ length: bins }, (_, index) => {
    const lower = min + index * step;
    const upper = index === bins - 1 ? max : min + (index + 1) * step;
    return {
      name: `${binNumber(lower, precision)}–${binNumber(upper, precision)}`,
      value: vals.filter(
        (value) => value >= lower && (index === bins - 1 ? value <= max : value < upper),
      ).length,
    };
  });
}

function numericFieldsForSpec(spec: ChartSpec, profiles: ColumnProfile[]): string[] {
  const fields = [spec.x, spec.y].filter(Boolean) as string[];
  return fields.filter((field) => profiles.find((profile) => profile.name === field)?.type === 'numeric');
}

export function buildChartData(
  rows: Row[],
  spec: ChartSpec,
  profiles: ColumnProfile[] = [],
): {
  data: Array<Record<string, unknown>>;
  outlierNote: string | null;
} {
  const numericFields = numericFieldsForSpec(spec, profiles);
  const { rows: viewRows, excluded } = rowsForChartView(rows, profiles, numericFields);
  const outlierNote = outlierCaption(excluded);

  if (spec.kind === 'scatter') {
    return { data: scatterPoints(viewRows, spec).slice(0, 800), outlierNote };
  }

  if (spec.kind === 'histogram') {
    return { data: histogram(viewRows, spec.x), outlierNote };
  }

  if (spec.kind === 'line') {
    const data = aggregate(viewRows, spec.x, spec.y, spec.aggregation)
      .map((point) => ({
        ...point,
        name: formatChartDateLabel(point.name),
      }))
      .sort((a, b) => new Date(String(a.name)).getTime() - new Date(String(b.name)).getTime());
    return { data, outlierNote };
  }

  return {
    data: topN(aggregate(viewRows, spec.x, spec.y, spec.aggregation, spec.outcome), 10),
    outlierNote,
  };
}

export function chartData(
  rows: Row[],
  spec: ChartSpec,
  profiles: ColumnProfile[] = [],
): Array<Record<string, unknown>> {
  return buildChartData(rows, spec, profiles).data;
}

export { scatterPoints };
