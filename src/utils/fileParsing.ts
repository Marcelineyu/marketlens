import Papa from 'papaparse';
import { Row } from '../types';
import { finiteNumber } from '../analytics/numeric';

export const NUMERIC_INFERENCE_THRESHOLD = 0.9;

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
    if (numeric.length / present.length >= NUMERIC_INFERENCE_THRESHOLD) {
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

function assertReadableEncoding(text: string): void {
  if (text.includes('\uFFFD')) {
    throw new Error(
      'This file appears to use a non-UTF-8 encoding. Save it as UTF-8 and try again.',
    );
  }
}

function parseCsvText(text: string): Row[] {
  if (!text.trim()) {
    throw new Error('This file is empty.');
  }

  assertReadableEncoding(text);

  const result = Papa.parse<Row>(text, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: 'greedy',
  });
  const structural = result.errors.filter((error) =>
    ['TooManyFields', 'TooFewFields', 'MissingQuotes', 'InvalidQuotes'].includes(error.code),
  );
  if (structural.length) {
    throw new Error('We could not parse this CSV because some rows have an inconsistent structure.');
  }

  const rows = normalizeNumbers(result.data);
  if (!rows.length) {
    throw new Error('This file has a header row but no data rows.');
  }

  return rows;
}

export async function parseFile(file: File): Promise<Row[]> {
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('File is larger than 10 MB.');
  }

  const ext = file.name.split('.').pop()?.toLowerCase();
  if (!['csv', 'xlsx', 'xls'].includes(ext || '')) {
    throw new Error('Choose a CSV, XLSX, or XLS file.');
  }

  if (ext === 'csv') {
    return parseCsvText(await file.text());
  }

  try {
    const XLSX = await import('xlsx');
    const workbook = XLSX.read(await file.arrayBuffer());
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = normalizeNumbers(XLSX.utils.sheet_to_json<Row>(sheet, { defval: null }));
    if (!rows.length) {
      throw new Error('This file has a header row but no data rows.');
    }
    return rows;
  } catch (error) {
    if (error instanceof Error && error.message.includes('header row')) {
      throw error;
    }
    throw new Error('We could not read this spreadsheet. Try saving it as UTF-8 CSV and upload again.');
  }
}
