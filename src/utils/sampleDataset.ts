import Papa from 'papaparse';
import sampleCsv from '../../test-data/messy_cross_border_orders.csv?raw';
import { finiteNumber } from '../analytics/numeric';
import { Dataset, Row } from '../types';
import { makeDataset } from './dataset';

export const SAMPLE_DATASET_NAME = 'messy_cross_border_orders.csv';

function normalizeNumbers(rows: Row[]): Row[] {
  const parsed = rows.map((row) =>
    Object.fromEntries(
      Object.entries(row).map(([key, value]) => [key, finiteNumber(value) ?? value]),
    ),
  );
  const columns = Array.from(new Set(parsed.flatMap(Object.keys)));

  for (const column of columns) {
    const present = parsed
      .map((row) => row[column])
      .filter((value) => value !== null && value !== undefined && String(value).trim() !== '');
    if (present.length < 3) continue;
    const numeric = present.filter((value) => finiteNumber(value) !== undefined);
    if (numeric.length / present.length >= 0.9) {
      for (const row of parsed) {
        if (
          row[column] !== null &&
          row[column] !== undefined &&
          String(row[column]).trim() !== '' &&
          finiteNumber(row[column]) === undefined
        ) {
          row[column] = null;
        }
      }
    }
  }

  return parsed;
}

function parseCsvText(text: string): Row[] {
  const result = Papa.parse<Row>(text, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: 'greedy',
  });
  const structural = result.errors.filter((error) =>
    ['TooManyFields', 'TooFewFields', 'MissingQuotes', 'InvalidQuotes'].includes(error.code),
  );
  if (structural.length) {
    throw new Error('We could not parse the bundled sample CSV.');
  }
  const rows = normalizeNumbers(result.data);
  if (!rows.length) {
    throw new Error('The bundled sample CSV has no data rows.');
  }
  return rows;
}

export function isSampleDatasetName(name: string): boolean {
  return name === SAMPLE_DATASET_NAME;
}

export async function loadDefaultSample(): Promise<Dataset | null> {
  if (import.meta.env.MODE === 'test') {
    return null;
  }
  return makeDataset(SAMPLE_DATASET_NAME, parseCsvText(sampleCsv));
}
