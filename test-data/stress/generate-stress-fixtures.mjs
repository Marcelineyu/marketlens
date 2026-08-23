import { createWriteStream, mkdirSync, writeFileSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as XLSX from 'xlsx';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const root = join(scriptDir, '../..');
const stressDir = scriptDir;
mkdirSync(stressDir, { recursive: true });

const HEADERS = [
  'order_id',
  'order_date',
  'country',
  'category',
  'carrier',
  'status',
  'weight_kg',
  'amount_usd',
  'customs_cleared',
  'warehouse_code',
  'internal_flag',
  'notes',
];

function rowLine(i) {
  const id = String(i).padStart(6, '0');
  return `${id},2023-01-${String((i % 28) + 1).padStart(2, '0')},US,C${i % 5},DHL,OK,${(i % 50) + 1},${(i % 1000) + 10},1,W${i % 9},,n${i}\n`;
}

function writePerformanceCsv(name, rows) {
  const path = join(stressDir, name);
  return new Promise((resolve, reject) => {
    const stream = createWriteStream(path, { encoding: 'utf8' });
    stream.on('error', reject);
    stream.on('finish', () => {
      resolve({ path, bytes: statSync(path).size, rows });
    });
    stream.write(`${HEADERS.join(',')}\n`);
    for (let i = 1; i <= rows; i += 1) {
      stream.write(rowLine(i));
    }
    stream.end();
  });
}

const bomCsv = `\uFEFFname,value\nalpha,1\nbeta,2\n`;
writeFileSync(join(stressDir, 'utf8_bom.csv'), bomCsv, 'utf8');

writeFileSync(
  join(stressDir, 'semicolon.csv'),
  'date;channel;spend\n2025-01-01;Search;100\n2025-01-02;Email;120\n',
  'utf8',
);

const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(
  wb,
  XLSX.utils.aoa_to_sheet([
    ['id', 'value'],
    [1, 10],
    [2, 20],
  ]),
  'SheetOne',
);
XLSX.utils.book_append_sheet(
  wb,
  XLSX.utils.aoa_to_sheet([
    ['id', 'value'],
    [3, 30],
  ]),
  'SheetTwo',
);
writeFileSync(join(stressDir, 'multi_sheet.xlsx'), XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));

writeFileSync(
  join(stressDir, 'fake_pdf.csv'),
  Buffer.from('%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n', 'utf8'),
);

const bigHeader = 'id,value\n';
const bigRow = '1,' + 'x'.repeat(200) + '\n';
const target = 15 * 1024 * 1024;
let bigContent = bigHeader;
while (Buffer.byteLength(bigContent, 'utf8') < target) {
  bigContent += bigRow;
}
writeFileSync(join(stressDir, 'over_15mb.csv'), bigContent, 'utf8');

const perf10k = await writePerformanceCsv('perf_10k.csv', 10_000);
const perf50k = await writePerformanceCsv('perf_50k.csv', 50_000);
const perf200k = await writePerformanceCsv('perf_200k.csv', 200_000);

console.log(
  JSON.stringify(
    {
      stressDir,
      performance: { perf10k, perf50k, perf200k },
      overLimitMb: (statSync(join(stressDir, 'over_15mb.csv')).size / (1024 * 1024)).toFixed(2),
    },
    null,
    2,
  ),
);
