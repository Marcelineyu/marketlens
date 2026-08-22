export type Row = Record<string, unknown>;
export type ColumnType =
  | 'numeric'
  | 'categorical'
  | 'date'
  | 'binary'
  | 'identifier'
  | 'text'
  | 'empty';

export interface ValueGroupVariant {
  value: string;
  count: number;
}

export interface ValueGroup {
  normalized: string;
  variants: ValueGroupVariant[];
  total: number;
}

export interface NumericColumnFlags {
  negatives: Array<{ index: number; value: number }>;
  outliers: Array<{ index: number; value: number }>;
  stats: {
    min: number;
    q1: number;
    median: number;
    q3: number;
    max: number;
  } | null;
}

export interface ColumnProfile {
  name: string;
  type: ColumnType;
  missing: number;
  unique: number;
  examples: string[];
  values: unknown[];
  valueGroups?: ValueGroup[];
  numericFlags?: NumericColumnFlags;
  unparsed?: string[];
}

export interface DatasetProfileSummary {
  rowCount: number;
  duplicateRows: number;
  missingValues: number;
  typeCounts: {
    numeric: number;
    categorical: number;
    date: number;
    binary: number;
  };
}

export interface Dataset {
  name: string;
  rows: Row[];
  originalRows: Row[];
  profiles: ColumnProfile[];
  profile: DatasetProfileSummary;
  cleaningMessage?: string;
}

export interface FilterState {
  [column: string]:
    | { kind: 'category'; values: string[] }
    | { kind: 'numeric'; min: number; max: number };
}

export interface ChartSpec {
  id: string;
  title: string;
  subtitle: string;
  kind: 'bar' | 'horizontal' | 'line' | 'donut' | 'scatter' | 'histogram';
  x: string;
  y?: string;
  aggregation?: Aggregation;
  outcome?: string;
  featured?: boolean;
}

export type Aggregation =
  | 'count'
  | 'sum'
  | 'average'
  | 'median'
  | 'minimum'
  | 'maximum'
  | 'percentage'
  | 'outcomeRate';
