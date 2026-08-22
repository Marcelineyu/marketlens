import { Dataset, FilterState, Row } from '../types';
import { buildDatasetProfile } from './datasetProfile';

export function profilesForRows(profiles: Dataset['profiles'], rows: Row[]): Dataset['profiles'] {
  return profiles.map((profile) => ({
    ...profile,
    values: rows.map((row) => row[profile.name]),
  }));
}

export function formatAnalysisScope(
  rowCount: number,
  dataset: Dataset,
  hasActiveFilters: boolean,
): string {
  if (hasActiveFilters) {
    return `based on ${rowCount.toLocaleString()} filtered rows`;
  }
  if (dataset.rows.length !== dataset.originalRows.length) {
    return `based on ${rowCount.toLocaleString()} rows after cleaning`;
  }
  return `based on all ${rowCount.toLocaleString()} rows`;
}

export function getAnalysisContext(
  dataset: Dataset,
  filteredRows: Row[],
  filters: FilterState,
) {
  const hasActiveFilters = Object.keys(filters).length > 0;
  const rows = filteredRows;

  if (hasActiveFilters) {
    const { profiles, profile } = buildDatasetProfile(rows);
    return {
      rows,
      profiles,
      profile,
      scopeLabel: formatAnalysisScope(rows.length, dataset, true),
    };
  }

  return {
    rows: dataset.rows,
    profiles: profilesForRows(dataset.profiles, dataset.rows),
    profile: dataset.profile,
    scopeLabel: formatAnalysisScope(dataset.rows.length, dataset, false),
  };
}
