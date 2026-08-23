import Papa from 'papaparse';
import { Row } from '../types';
import { finiteNumber } from '../analytics/numeric';

export const NUMERIC_INFERENCE_THRESHOLD = 0.9;
export const MAX_FILE_BYTES = 10 * 1024 * 1024;
export const ROW_WARNING_THRESHOLD = 20_000;
export const ROW_SAMPLE_LIMIT = 20_000;

export const UPLOAD_SIZE_HINT = 'or click to browse · up to 10 MB · prompts above ~20,000 rows';

export interface ParseFileOptions {
  maxRows?: number;
}
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

function assertCsvText(text: string): void {
  if (text.includes('\0')) {
    throw new Error('This file contains binary data and cannot be read as CSV.');
  }
  if (text.trimStart().startsWith('%PDF')) {
    throw new Error('This file looks like a PDF, not a CSV. Save or export it as CSV and try again.');
  }
}

function parseCsvText(text: string, maxRows?: number): Row[] {
  if (!text.trim()) {
    throw new Error('This file is empty.');
  }

  assertReadableEncoding(text);
  assertCsvText(text);

  const result = Papa.parse<Row>(text, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: 'greedy',
    ...(maxRows ? { preview: maxRows } : {}),
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

  return maxRows ? rows.slice(0, maxRows) : rows;
}

export function assertUploadableFile(file: File): void {
  if (file.size > MAX_FILE_BYTES) {
    throw new Error('File is larger than 10 MB.');
  }

  const ext = file.name.split('.').pop()?.toLowerCase();
  if (!['csv', 'xlsx', 'xls'].includes(ext || '')) {
    throw new Error('Choose a CSV, XLSX, or XLS file.');
  }
}

function countCsvDataRows(text: string): number {
  if (!text.trim()) {
    return 0;
  }

  let lines = 0;
  for (let index = 0; index < text.length; index += 1) {
    if (text[index] === '\n') {
      lines += 1;
    }
  }
  if (!text.endsWith('\n')) {
    lines += 1;
  }

  return Math.max(0, lines - 1);
}

export async function estimateRowCount(file: File): Promise<number> {
  assertUploadableFile(file);

  const ext = file.name.split('.').pop()?.toLowerCase();
  if (ext === 'csv') {
    const text = await file.text();
    assertReadableEncoding(text);
    assertCsvText(text);
    return countCsvDataRows(text);
  }

  const XLSX = await import('xlsx');
  const workbook = XLSX.read(await file.arrayBuffer(), { dense: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet?.['!ref']) {
    return 0;
  }

  const range = XLSX.utils.decode_range(sheet['!ref']);
  return Math.max(0, range.e.r);
}

export async function parseFile(file: File, options: ParseFileOptions = {}): Promise<Row[]> {
  assertUploadableFile(file);

  const ext = file.name.split('.').pop()?.toLowerCase();
  const { maxRows } = options;

  if (ext === 'csv') {
    return parseCsvText(await file.text(), maxRows);
  }

  try {
    const XLSX = await import('xlsx');
    const workbook = XLSX.read(await file.arrayBuffer(), {
      sheetRows: maxRows ? maxRows + 1 : undefined,
    }); 
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = normalizeNumbers(XLSX.utils.sheet_to_json<Row>(sheet, { defval: null }));
    if (!rows.length) {
      throw new Error('This file has a header row but no data rows.');
    }
    return maxRows ? rows.slice(0, maxRows) : rows;
  } catch (error) {
    if (error instanceof Error && error.message.includes('header row')) {
      throw error;
    }
    throw new Error('We could not read this spreadsheet. Try saving it as UTF-8 CSV and upload again.');
  }
}
