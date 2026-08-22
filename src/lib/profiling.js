/**
 * MarketLens — column profiling utilities
 *
 * Replaces unique-count-based type guessing with content-based parsing.
 * Dependency-free. Every function takes raw string cells as they come out
 * of the CSV/XLSX parser and never mutates the source data.
 */

// ---------------------------------------------------------------------------
// Missing values
// ---------------------------------------------------------------------------

const MISSING_TOKENS = new Set([
  '', '-', '--', 'n/a', 'na', 'null', 'none', 'nan', 'nil', '#n/a', 'undefined',
]);

export function isMissing(raw) {
  if (raw === null || raw === undefined) return true;
  return MISSING_TOKENS.has(String(raw).trim().toLowerCase());
}

// ---------------------------------------------------------------------------
// Numeric
// ---------------------------------------------------------------------------

// Strips currency symbols, thousands separators, trailing unit suffixes,
// percent signs, and parenthesised negatives: "(1,234.50)" -> -1234.5
const CURRENCY = /[$€£¥₩₹]/g;
const UNIT_SUFFIX = /\s*(kg|g|lb|lbs|oz|km|m|cm|mm|usd|eur|gbp|cny|rmb|jpy|pcs|units?|%)\s*$/i;

export function parseNumeric(raw) {
  if (isMissing(raw)) return null;
  let s = String(raw).trim();

  let negative = false;
  if (/^\(.*\)$/.test(s)) {
    negative = true;
    s = s.slice(1, -1);
  }

  const isPercent = /%\s*$/.test(s);

  s = s.replace(CURRENCY, '');
  s = s.replace(UNIT_SUFFIX, '');
  s = s.replace(/,/g, '');
  s = s.replace(/\s/g, '');

  if (s === '' || !/^[+-]?\d*\.?\d+(e[+-]?\d+)?$/i.test(s)) return null;

  let n = Number(s);
  if (!Number.isFinite(n)) return null;
  if (negative) n = -n;
  if (isPercent) n = n / 100;
  return n;
}

// ---------------------------------------------------------------------------
// Dates
// ---------------------------------------------------------------------------

const MONTHS = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

function makeDate(y, m, d) {
  if (m < 0 || m > 11 || d < 1 || d > 31) return null;
  const dt = new Date(Date.UTC(y, m, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m || dt.getUTCDate() !== d) return null;
  return dt;
}

export function parseDate(raw) {
  if (isMissing(raw)) return null;
  const s = String(raw).trim();
  let m;

  if ((m = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/)))
    return makeDate(+m[1], +m[2] - 1, +m[3]);

  if ((m = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/))) {
    const a = +m[1], b = +m[2];
    if (a <= 12) return makeDate(+m[3], a - 1, b);
    if (b <= 12) return makeDate(+m[3], b - 1, a);
    return null;
  }

  if ((m = s.match(/^(\d{1,2})[-\s]([A-Za-z]{3,})[-\s](\d{4})$/))) {
    const mo = MONTHS[m[2].slice(0, 3).toLowerCase()];
    return mo === undefined ? null : makeDate(+m[3], mo, +m[1]);
  }

  if ((m = s.match(/^([A-Za-z]{3,})\s+(\d{1,2}),?\s+(\d{4})$/))) {
    const mo = MONTHS[m[1].slice(0, 3).toLowerCase()];
    return mo === undefined ? null : makeDate(+m[3], mo, +m[2]);
  }

  return null;
}

// ---------------------------------------------------------------------------
// Boolean
// ---------------------------------------------------------------------------

const TRUE_TOKENS = new Set(['true', 'yes', 'y', '1', 't']);
const FALSE_TOKENS = new Set(['false', 'no', 'n', '0', 'f']);

export function parseBoolean(raw) {
  if (isMissing(raw)) return null;
  const s = String(raw).trim().toLowerCase();
  if (TRUE_TOKENS.has(s)) return true;
  if (FALSE_TOKENS.has(s)) return false;
  return null;
}

// ---------------------------------------------------------------------------
// Column type inference
// ---------------------------------------------------------------------------

export function inferColumnType(values, { threshold = 0.8, sampleLimit = 2000 } = {}) {
  const sample = values.length > sampleLimit ? values.slice(0, sampleLimit) : values;
  const present = sample.filter((v) => !isMissing(v));
  const missing = sample.length - present.length;

  if (present.length === 0) {
    return { type: 'empty', confidence: 1, missing, parsed: values.map(() => null), unparsed: [] };
  }

  const score = (fn) => present.reduce((acc, v) => acc + (fn(v) !== null ? 1 : 0), 0) / present.length;

  const candidates = [
    { type: 'boolean', fn: parseBoolean, rate: score(parseBoolean) },
    { type: 'date', fn: parseDate, rate: score(parseDate) },
    { type: 'numeric', fn: parseNumeric, rate: score(parseNumeric) },
  ];

  const winner = candidates.find((c) => c.rate >= threshold);

  if (winner) {
    const parsed = values.map((v) => (isMissing(v) ? null : winner.fn(v)));
    const unparsed = values.filter((v) => !isMissing(v) && winner.fn(v) === null).slice(0, 10);
    return { type: winner.type, confidence: winner.rate, missing, parsed, unparsed };
  }

  const distinct = new Set(present.map((v) => String(v).trim())).size;
  const ratio = distinct / present.length;
  const avgLen = present.reduce((a, v) => a + String(v).length, 0) / present.length;

  let type;
  if (ratio > 0.95 && avgLen <= 40) type = 'identifier';
  else if (distinct <= Math.max(30, present.length * 0.2)) type = 'categorical';
  else type = 'text';

  return { type, confidence: 1 - ratio, missing, parsed: values.map((v) => (isMissing(v) ? null : String(v))), unparsed: [] };
}

// ---------------------------------------------------------------------------
// Duplicate rows — detect, never remove silently
// ---------------------------------------------------------------------------

export function findDuplicateRows(rows, columns) {
  const cols = columns || (rows[0] ? Object.keys(rows[0]) : []);
  const seen = new Map();

  rows.forEach((row, i) => {
    const key = cols.map((c) => String(row[c] ?? '').trim()).join('\u0001');
    if (!seen.has(key)) seen.set(key, []);
    seen.get(key).push(i);
  });

  const groups = [...seen.values()].filter((idx) => idx.length > 1);
  const count = groups.reduce((acc, idx) => acc + idx.length - 1, 0);
  return { count, groups };
}

export function findConflictingKeys(rows, keyColumn) {
  const byKey = new Map();
  rows.forEach((row, i) => {
    const k = String(row[keyColumn] ?? '').trim();
    if (!k) return;
    if (!byKey.has(k)) byKey.set(k, []);
    byKey.get(k).push(i);
  });

  const conflicts = [];
  for (const [key, idx] of byKey) {
    if (idx.length < 2) continue;
    const first = JSON.stringify(rows[idx[0]]);
    if (idx.some((i) => JSON.stringify(rows[i]) !== first)) conflicts.push({ key, rows: idx });
  }
  return conflicts;
}

// ---------------------------------------------------------------------------
// Anomaly flags for numeric columns — informational only
// ---------------------------------------------------------------------------

export function numericFlags(parsed) {
  const nums = parsed.filter((n) => typeof n === 'number');
  if (nums.length < 4) return { negatives: [], outliers: [], stats: null };

  const sorted = [...nums].sort((a, b) => a - b);
  const q = (p) => {
    const pos = (sorted.length - 1) * p;
    const lo = Math.floor(pos);
    return sorted[lo] + (sorted[Math.min(lo + 1, sorted.length - 1)] - sorted[lo]) * (pos - lo);
  };

  const q1 = q(0.25), q3 = q(0.75), iqr = q3 - q1;
  const lower = q1 - 3 * iqr, upper = q3 + 3 * iqr;

  const negatives = [];
  const outliers = [];
  const allNonNegative = nums.every((n) => n >= 0) === false && nums.some((n) => n >= 0);

  parsed.forEach((n, i) => {
    if (typeof n !== 'number') return;
    if (n < 0 && allNonNegative) negatives.push({ index: i, value: n });
    if (iqr > 0 && (n < lower || n > upper)) outliers.push({ index: i, value: n });
  });

  return {
    negatives,
    outliers,
    stats: { min: sorted[0], q1, median: q(0.5), q3, max: sorted[sorted.length - 1] },
  };
}

// ---------------------------------------------------------------------------
// Categorical value normalisation — suggest, never auto-merge
// ---------------------------------------------------------------------------

export function suggestValueGroups(values) {
  const groups = new Map();

  for (const v of values) {
    if (isMissing(v)) continue;
    const raw = String(v);
    const key = raw.trim().toLowerCase().replace(/\s+/g, ' ');
    if (!groups.has(key)) groups.set(key, new Map());
    const variants = groups.get(key);
    variants.set(raw, (variants.get(raw) || 0) + 1);
  }

  return [...groups.entries()]
    .filter(([, variants]) => variants.size > 1)
    .map(([key, variants]) => ({
      normalized: key,
      variants: [...variants.entries()]
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) => b.count - a.count),
      total: [...variants.values()].reduce((a, b) => a + b, 0),
    }))
    .sort((a, b) => b.total - a.total);
}

// ---------------------------------------------------------------------------
// Whole-dataset profile
// ---------------------------------------------------------------------------

export function profileDataset(rows, columns) {
  const cols = columns || (rows[0] ? Object.keys(rows[0]) : []);
  const duplicates = findDuplicateRows(rows, cols);

  const profile = cols.map((name) => {
    const values = rows.map((r) => r[name]);
    const info = inferColumnType(values);
    const entry = {
      name,
      type: info.type,
      confidence: info.confidence,
      missing: values.filter(isMissing).length,
      distinct: new Set(values.filter((v) => !isMissing(v)).map((v) => String(v).trim())).size,
      examples: values.filter((v) => !isMissing(v)).slice(0, 3),
      unparsed: info.unparsed,
    };

    if (info.type === 'numeric') Object.assign(entry, numericFlags(info.parsed));
    if (info.type === 'categorical') entry.valueGroups = suggestValueGroups(values);

    return entry;
  });

  const counts = profile.reduce((acc, c) => {
    acc[c.type] = (acc[c.type] || 0) + 1;
    return acc;
  }, {});

  return {
    rowCount: rows.length,
    columnCount: cols.length,
    duplicateRows: duplicates.count,
    duplicateGroups: duplicates.groups,
    missingValues: profile.reduce((a, c) => a + c.missing, 0),
    typeCounts: counts,
    columns: profile,
  };
}
