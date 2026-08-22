import { ColumnProfile, Row } from '../types';

export function outlierIndicesForField(
  profiles: ColumnProfile[],
  field: string,
): Set<number> {
  const profile = profiles.find((item) => item.name === field);
  if (!profile?.numericFlags?.outliers.length) return new Set();
  return new Set(profile.numericFlags.outliers.map((item) => item.index));
}

export function rowsForChartView(
  rows: Row[],
  profiles: ColumnProfile[],
  fields: string[],
): { rows: Row[]; excluded: Array<{ field: string; value: number; count: number }> } {
  const excludedByField = new Map<string, { value: number; count: number }>();

  for (const field of fields) {
    const profile = profiles.find((item) => item.name === field);
    if (!profile?.numericFlags?.outliers.length) continue;
    const outlierValue = profile.numericFlags.outliers[0]?.value;
    if (outlierValue === undefined) continue;
    excludedByField.set(field, {
      value: outlierValue,
      count: profile.numericFlags.outliers.length,
    });
  }

  if (!excludedByField.size) {
    return { rows, excluded: [] };
  }

  const indicesToDrop = new Set<number>();
  for (const field of fields) {
    for (const index of outlierIndicesForField(profiles, field)) {
      indicesToDrop.add(index);
    }
  }

  if (!indicesToDrop.size) {
    return { rows, excluded: [] };
  }

  return {
    rows: rows.filter((_, index) => !indicesToDrop.has(index)),
    excluded: [...excludedByField.entries()].map(([field, info]) => ({ field, ...info })),
  };
}

export function outlierCaption(
  excluded: Array<{ field: string; value: number; count: number }>,
): string | null {
  if (!excluded.length) return null;
  const primary = excluded[0];
  const label = primary.count === 1 ? '1 outlier' : `${primary.count} outliers`;
  return `${label} excluded from this view (${primary.value})`;
}
