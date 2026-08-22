import { ColumnProfile, Row } from '../types';
import { formatNumber } from './format';

function parseDateValue(raw: unknown): Date | null {
  if (raw instanceof Date && !Number.isNaN(raw.getTime())) {
    return raw;
  }
  const text = String(raw ?? '').trim();
  if (!text) return null;
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatMonth(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'long' });
}

function formatMonthYear(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function recordLabel(datasetName: string): string {
  const stem = datasetName.replace(/\.(csv|xlsx|xls)$/i, '').replace(/[_-]+/g, ' ');
  if (/order/i.test(stem)) return 'order records';
  if (/customer/i.test(stem)) return 'customer records';
  if (/sale/i.test(stem)) return 'sales records';
  return 'records';
}

function dateRangeClause(profiles: ColumnProfile[], rows: Row[]): string | null {
  const dateColumn = profiles.find((profile) => profile.type === 'date');
  if (!dateColumn) return null;

  const dates = rows
    .map((row) => parseDateValue(row[dateColumn.name]))
    .filter((value): value is Date => value !== null);
  if (!dates.length) return null;

  const min = new Date(Math.min(...dates.map((date) => date.getTime())));
  const max = new Date(Math.max(...dates.map((date) => date.getTime())));

  if (min.getFullYear() === max.getFullYear()) {
    if (min.getMonth() === max.getMonth()) {
      return ` in ${formatMonthYear(min)}`;
    }
    return ` spanning ${formatMonth(min)} to ${formatMonth(max)} ${min.getFullYear()}`;
  }

  const start = formatMonthYear(min);
  const end = formatMonthYear(max);
  return ` spanning ${start} to ${end}`;
}

export function buildDatasetLeadSentence(
  datasetName: string,
  rowCount: number,
  fieldCount: number,
  profiles: ColumnProfile[],
  rows: Row[],
): string {
  const range = dateRangeClause(profiles, rows);
  const label = recordLabel(datasetName);
  const base = `${formatNumber(rowCount)} ${label}${range ?? ''}, across ${fieldCount} fields.`;
  return base.charAt(0).toUpperCase() + base.slice(1);
}
