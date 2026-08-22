import { ColumnProfile, DatasetProfileSummary } from '../types';

export interface DatasetNotice {
  id: string;
  message: string;
}

export function buildDatasetNotices(
  profile: DatasetProfileSummary,
  profiles: ColumnProfile[],
): DatasetNotice[] {
  const notices: DatasetNotice[] = [];

  if (profiles.length === 1) {
    notices.push({
      id: 'single-column',
      message: 'This file has only one column, so comparisons and charts will be limited.',
    });
  }

  if (profiles.length >= 100) {
    notices.push({
      id: 'many-columns',
      message: `This file has ${profiles.length} columns. Scroll the column profile and data table to review them all.`,
    });
  }

  const constantColumns = profiles.filter((column) => {
    const present = column.values.filter(
      (value) => value !== null && value !== undefined && String(value).trim() !== '',
    );
    if (present.length < 2) return false;
    const first = String(present[0]).trim();
    return present.every((value) => String(value).trim() === first);
  });

  if (constantColumns.length) {
    notices.push({
      id: 'constant-columns',
      message: `${constantColumns.length} column${constantColumns.length === 1 ? '' : 's'} contain only one repeated value, so they will not vary in charts.`,
    });
  }

  const hasNumeric = profiles.some((column) => column.type === 'numeric');
  const hasDate = profiles.some((column) => column.type === 'date');
  const hasNonNumericDateFields = profiles.some(
    (column) => column.type !== 'numeric' && column.type !== 'date' && column.type !== 'empty',
  );

  if (!hasNumeric && !hasDate && hasNonNumericDateFields) {
    notices.push({
      id: 'no-numeric-date',
      message:
        'This file has no numeric or date columns, so trend and distribution charts will be limited to category counts.',
    });
  }

  return notices;
}
