import { profileDataset } from '../lib/profiling.js';
import {
  ColumnProfile,
  ColumnType,
  DatasetProfileSummary,
  NumericColumnFlags,
  Row,
  ValueGroup,
} from '../types';

function mapColumnType(type: string): ColumnType {
  if (type === 'boolean') return 'binary';
  if (type === 'empty') return 'empty';
  if (
    type === 'numeric' ||
    type === 'date' ||
    type === 'categorical' ||
    type === 'identifier' ||
    type === 'text'
  ) {
    return type;
  }
  return 'text';
}

function tileTypeCounts(typeCounts: Record<string, number>): DatasetProfileSummary['typeCounts'] {
  return {
    numeric: typeCounts.numeric || 0,
    categorical: typeCounts.categorical || 0,
    date: typeCounts.date || 0,
    binary: typeCounts.boolean || 0,
  };
}

function numericColumnFlags(
  column: ReturnType<typeof profileDataset>['columns'][number],
): NumericColumnFlags | undefined {
  if (column.type !== 'numeric') return undefined;
  if (!column.negatives?.length && !column.outliers?.length && !column.stats) return undefined;
  return {
    negatives: column.negatives || [],
    outliers: column.outliers || [],
    stats: column.stats || null,
  };
}

function toColumnProfile(
  column: ReturnType<typeof profileDataset>['columns'][number],
  rows: Row[],
): ColumnProfile {
  return {
    name: column.name,
    type: mapColumnType(column.type),
    missing: column.missing,
    unique: column.distinct,
    examples: column.examples.map(String),
    values: rows.map((row) => row[column.name]),
    valueGroups: column.valueGroups as ValueGroup[] | undefined,
    numericFlags: numericColumnFlags(column),
    unparsed: column.unparsed?.map(String),
  };
}

export function buildDatasetProfile(rows: Row[]): {
  profiles: ColumnProfile[];
  profile: DatasetProfileSummary;
} {
  const result = profileDataset(rows);
  return {
    profiles: result.columns.map((column) => toColumnProfile(column, rows)),
    profile: {
      rowCount: result.rowCount,
      duplicateRows: result.duplicateRows,
      missingValues: result.missingValues,
      typeCounts: tileTypeCounts(result.typeCounts),
    },
  };
}
