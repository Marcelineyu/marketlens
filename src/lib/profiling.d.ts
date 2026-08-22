export function isMissing(raw: unknown): boolean;
export function parseNumeric(raw: unknown): number | null;
export function parseDate(raw: unknown): Date | null;
export function parseBoolean(raw: unknown): boolean | null;
export function inferColumnType(
  values: unknown[],
  options?: { threshold?: number; sampleLimit?: number },
): {
  type: string;
  confidence: number;
  missing: number;
  parsed: unknown[];
  unparsed: unknown[];
};
export function findDuplicateRows(
  rows: Record<string, unknown>[],
  columns?: string[],
): { count: number; groups: number[][] };
export function findConflictingKeys(
  rows: Record<string, unknown>[],
  keyColumn: string,
): Array<{ key: string; rows: number[] }>;
export function numericFlags(parsed: unknown[]): {
  negatives: Array<{ index: number; value: number }>;
  outliers: Array<{ index: number; value: number }>;
  stats: {
    min: number;
    q1: number;
    median: number;
    q3: number;
    max: number;
  } | null;
};
export function suggestValueGroups(values: unknown[]): Array<{
  normalized: string;
  variants: Array<{ value: string; count: number }>;
  total: number;
}>;
export function profileDataset(
  rows: Record<string, unknown>[],
  columns?: string[],
): {
  rowCount: number;
  columnCount: number;
  duplicateRows: number;
  duplicateGroups: number[][];
  missingValues: number;
  typeCounts: Record<string, number>;
  columns: Array<{
    name: string;
    type: string;
    confidence: number;
    missing: number;
    distinct: number;
    examples: unknown[];
    unparsed?: unknown[];
    valueGroups?: Array<{
      normalized: string;
      variants: Array<{ value: string; count: number }>;
      total: number;
    }>;
    negatives?: Array<{ index: number; value: number }>;
    outliers?: Array<{ index: number; value: number }>;
    stats?: {
      min: number;
      q1: number;
      median: number;
      q3: number;
      max: number;
    } | null;
  }>;
};
