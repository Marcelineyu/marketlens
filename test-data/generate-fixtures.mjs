import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as XLSX from 'xlsx';

const root = join(dirname(fileURLToPath(import.meta.url)), 'fixtures');
mkdirSync(root, { recursive: true });

function escapeCsv(value) {
  if (value === null || value === undefined) {
    return '';
  }

  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function toCsv(rows) {
  const headers = [...new Set(rows.flatMap(Object.keys))];
  const lines = [
    headers.join(','),
    ...rows.map((row) => headers.map((header) => escapeCsv(row[header])).join(',')),
  ];
  return lines.join('\n');
}

function save(name, rows) {
  writeFileSync(join(root, name), toCsv(rows));
}

save(
  '01-retail-sales.csv',
  Array.from({ length: 96 }, (_, index) => {
    const month = index % 12;
    const region = ['North', 'South', 'East', 'West'][index % 4];
    const category = ['Home', 'Beauty', 'Tech'][index % 3];
    const quantity = 1 + (index % 5);
    const revenue =
      Math.round(
        (180 +
          month * 22 +
          (category === 'Tech' ? month * 18 : category === 'Beauty' ? -month * 7 : month * 5) +
          (index % 7) * 11) *
          100,
      ) / 100;
    const cost = Math.round(revenue * (0.52 + (index % 4) * 0.04) * 100) / 100;

    return {
      Date: `2025-${String(month + 1).padStart(2, '0')}-${String((index % 27) + 1).padStart(2, '0')}`,
      'Order ID': `ORD-${1000 + index}`,
      'Customer ID': `CUS-${200 + (index % 45)}`,
      Region: region,
      'Product Category': category,
      Product: `${category} Product ${(index % 8) + 1}`,
      Revenue: revenue,
      Cost: cost,
      Profit: Math.round((revenue - cost) * 100) / 100,
      Quantity: quantity,
      'Marketing Spend': 80 + (index % 10) * 17,
    };
  }),
);

writeFileSync(
  join(root, '02-missing-values.csv'),
  'group,value,category,notes\nA,,,complete category missing\nA,,Retail,\nB,4,Wholesale,partial\nB,8, ,whitespace category\nC,,Online,',
);

writeFileSync(
  join(root, '03-mixed-numeric-formats.csv'),
  'label,currency,rate,thousands,numeric_string,negative,zero,blank,invalid\nA,"$1,250.50",18%,"1,400","42.5",-12,0,,not-a-number\nB,"$980.00",7.5%,"2,050","18",-4,0,,n/a',
);

save(
  '04-identifier-only-strings.csv',
  Array.from({ length: 30 }, (_, index) => ({
    'Customer ID': `CUS-${1000 + index}`,
    'Order ID': `ORD-${9000 + index}`,
    'Account ID': `ACC-${5000 + index}`,
    'Transaction UUID': `00000000-0000-4000-8000-${String(index).padStart(12, '0')}`,
  })),
);

save(
  '05-identifier-only-numeric.csv',
  Array.from({ length: 30 }, (_, index) => ({
    'Customer ID': 100001 + index,
    'Order ID': 90000021 + index,
    'Account Number': 45001234 + index,
  })),
);

save(
  '06-identifier-plus-metric.csv',
  Array.from({ length: 40 }, (_, index) => ({
    'Customer ID': 100001 + index,
    Revenue: 100 + index * 12,
  })),
);

save(
  '07-valid-id-substrings.csv',
  Array.from({ length: 40 }, (_, index) => ({
    'Paid Revenue': 200 + index * 9,
    'Paid Orders': 2 + (index % 7),
    'Bid Amount': 1.5 + index * 0.2,
    Dividend: index * 0.5,
    'Midmarket Sales': 80 + index * 4,
  })),
);

save(
  '08-no-date.csv',
  Array.from({ length: 48 }, (_, index) => ({
    Region: ['North', 'South', 'East', 'West'][index % 4],
    'Product Category': ['Home', 'Beauty', 'Tech'][index % 3],
    Revenue: 120 + index * 8,
    Profit: 30 + (index % 9) * 5,
  })),
);

save(
  '09-date-and-identifiers.csv',
  Array.from({ length: 30 }, (_, index) => ({
    Date: `2025-01-${String((index % 28) + 1).padStart(2, '0')}`,
    'Order ID': `ORD-${index}`,
    'Customer ID': `CUS-${100 + index}`,
  })),
);

save(
  '10-single-metric.csv',
  Array.from({ length: 40 }, (_, index) => ({
    'Transaction ID': `TX-${index}`,
    Revenue: 50 + index * 7,
  })),
);

save(
  '11-empty-filter.csv',
  Array.from({ length: 40 }, (_, index) => ({
    channel: ['Search', 'Email'][index % 2],
    campaign: index % 2 ? 'Retention' : 'Acquisition',
    revenue: 100 + index * 5,
  })),
);

save(
  '12-pagination.csv',
  Array.from({ length: 125 }, (_, index) => ({
    record_id: `REC-${index}`,
    segment: ['A', 'B', 'C'][index % 3],
    value: index * 2,
  })),
);

save(
  '13-advertising.csv',
  Array.from({ length: 200 }, (_, index) => {
    const tv = (index * 17) % 300;
    const search = (index * 11) % 180;
    const social = (index * 7) % 120;
    const radio = (index * 5) % 80;

    return {
      'TV Spend': tv,
      'Search Spend': search,
      'Social Spend': social,
      'Radio Spend': radio,
      Sales: Number((5 + tv * 0.04 + search * 0.06 + social * 0.02 + radio * 0.03).toFixed(2)),
    };
  }),
);

writeFileSync(
  join(root, '14-malformed.csv'),
  'name,value,region\n"Alpha, North",10,North\nBeta,20,South,EXTRA\nGamma\nDelta,40,West\n\n',
);

const workbook = XLSX.utils.book_new();
const sheet = XLSX.utils.aoa_to_sheet([
  ['Date', 'Region', 'Revenue', 'Later Metric'],
  [new Date('2025-01-01'), 'North', 120, null],
  [new Date('2025-01-02'), 'South', 180, 7],
  [new Date('2025-01-03'), 'East', 210, 9],
]);
XLSX.utils.book_append_sheet(workbook, sheet, 'Data');
XLSX.writeFile(workbook, join(root, '15-native-types.xlsx'));

save(
  '16-large-reasonable.csv',
  Array.from({ length: 1500 }, (_, index) => ({
    date: `2025-${String((index % 12) + 1).padStart(2, '0')}-${String((index % 28) + 1).padStart(2, '0')}`,
    channel: ['Search', 'Social', 'Email', 'Display'][index % 4],
    campaign: `Campaign ${index % 10}`,
    spend: 100 + (index % 500),
    conversions: 3 + (index % 45),
    revenue: 200 + ((index * 13) % 1800),
  })),
);

save('17-category-ties.csv', [
  ...Array.from({ length: 8 }, (_, index) => ({
    Region: index < 4 ? 'North' : 'South',
    Revenue: 100 + index,
  })),
  ...Array.from({ length: 4 }, (_, index) => ({
    Region: 'East',
    Revenue: 120 + index,
  })),
]);

writeFileSync(
  join(root, '18-accounting-mostly-numeric.csv'),
  [
    'Revenue,Profit',
    ...Array.from({ length: 19 }, (_, index) => `${100 + index},${index % 3 === 0 ? `(${300 + index})` : 300 + index}`),
    'invalid,invalid',
  ].join('\n'),
);

save(
  '19-constant-and-near-constant.csv',
  Array.from({ length: 30 }, (_, index) => ({
    Price: 100,
    NearConstant: 1 + (index % 3) * 1e-14,
    Revenue: 200 + index * 11,
  })),
);

save(
  '20-weak-valid-correlation.csv',
  Array.from({ length: 30 }, (_, index) => ({
    Spend: index + 1,
    Revenue: ((index * 7) % 23) + index * 0.05,
  })),
);

console.log(`Generated fixtures in ${root}`);
