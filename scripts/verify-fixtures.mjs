import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const fixturesDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'test-data', 'fixtures');

const REQUIRED_FILES = [
  '01-retail-sales.csv',
  '02-missing-values.csv',
  '03-mixed-numeric-formats.csv',
  '04-identifier-only-strings.csv',
  '05-identifier-only-numeric.csv',
  '06-identifier-plus-metric.csv',
  '07-valid-id-substrings.csv',
  '08-no-date.csv',
  '09-date-and-identifiers.csv',
  '10-single-metric.csv',
  '11-empty-filter.csv',
  '12-pagination.csv',
  '13-advertising.csv',
  '14-malformed.csv',
  '16-large-reasonable.csv',
  '17-category-ties.csv',
  '18-accounting-mostly-numeric.csv',
  '19-constant-and-near-constant.csv',
  '20-weak-valid-correlation.csv',
];

function parseCsv(text) {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const rows = [];
  let headers = null;

  for (const line of lines) {
    if (!line.trim()) {
      continue;
    }

    const cells = [];
    let current = '';
    let inQuotes = false;

    for (let index = 0; index < line.length; index += 1) {
      const char = line[index];

      if (char === '"') {
        if (inQuotes && line[index + 1] === '"') {
          current += '"';
          index += 1;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        cells.push(current);
        current = '';
      } else {
        current += char;
      }
    }

    cells.push(current);

    if (!headers) {
      headers = cells;
      continue;
    }

    rows.push(cells);
  }

  return { headers, rows };
}

const INTENTIONALLY_MALFORMED = new Set(['14-malformed.csv']);

function validateFixture(fileName) {
  const filePath = join(fixturesDir, fileName);

  if (!existsSync(filePath)) {
    return { fileName, ok: false, message: 'missing file' };
  }

  const text = readFileSync(filePath, 'utf8');

  if (!text.trim()) {
    return { fileName, ok: false, message: 'empty file' };
  }

  if (INTENTIONALLY_MALFORMED.has(fileName)) {
    return { fileName, ok: true, message: 'present (intentionally malformed for parser tests)' };
  }

  const { headers, rows } = parseCsv(text);

  if (!headers?.length) {
    return { fileName, ok: false, message: 'no header row' };
  }

  if (headers.some((header) => !String(header).trim())) {
    return { fileName, ok: false, message: 'blank header name' };
  }

  if (!rows.length) {
    return { fileName, ok: false, message: 'no data rows' };
  }

  const width = headers.length;
  const malformed = rows.some((row) => row.length !== width);

  if (malformed) {
    return { fileName, ok: false, message: 'inconsistent column count' };
  }

  return {
    fileName,
    ok: true,
    message: `${rows.length} rows, ${width} columns`,
  };
}

const results = REQUIRED_FILES.map(validateFixture);
const extras = readdirSync(fixturesDir).filter(
  (name) => name.endsWith('.csv') && !REQUIRED_FILES.includes(name),
);

let failed = results.filter((result) => !result.ok).length;

console.log('MarketLens fixture validation');
console.log(`Directory: ${fixturesDir}`);
console.log('');

for (const result of results) {
  const status = result.ok ? 'ok' : 'FAIL';
  console.log(`[${status}] ${result.fileName} — ${result.message}`);
}

if (extras.length) {
  console.log('');
  console.log(`Additional CSV files (${extras.length}): ${extras.join(', ')}`);
}

console.log('');
console.log(`Checked ${results.length} required fixtures. ${failed} failed.`);

if (failed > 0) {
  process.exitCode = 1;
}
