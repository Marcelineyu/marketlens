import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const csvPath = join(root, 'test-data', 'messy_cross_border_orders.csv');
const baseUrl = 'http://localhost:5173/';

async function uploadCsv(page) {
  await page.goto(baseUrl);
  await page.getByLabel('Upload CSV or Excel').setInputFiles(csvPath);
  await page.getByRole('heading', { name: 'messy_cross_border_orders.csv' }).waitFor({ timeout: 30000 });
}

function parseSummaryText(text) {
  const rowMatch = text.match(/([\d,]+)\s+rows/i);
  const dupMatch = text.match(/([\d,]+)\s+duplicate rows/i);
  return {
    rows: rowMatch ? rowMatch[1].replace(/,/g, '') : null,
    duplicates: dupMatch ? dupMatch[1].replace(/,/g, '') : null,
  };
}

async function readHeaderStats(page) {
  const summary = page.locator('section.summary');
  const subtitle = await summary.locator('p').first().innerText();
  const tiles = await summary.locator('.stats > div').evaluateAll((nodes) =>
    nodes.map((node) => ({
      value: node.querySelector('b')?.textContent?.trim() || '',
      label: node.querySelector('span')?.textContent?.trim() || '',
    })),
  );
  return { subtitle, tiles, parsed: parseSummaryText(subtitle) };
}

async function readColumnProfile(page) {
  const panel = page.locator('details.details-card').filter({ hasText: 'Column profile' });
  await panel.locator('summary').click();
  const rows = panel.locator('tbody tr');
  const count = await rows.count();
  const columns = [];
  for (let i = 0; i < count; i += 1) {
    const row = rows.nth(i);
    const name = (await row.locator('td').first().innerText()).trim();
    const type = await row.locator('select').inputValue();
    const notes = (await row.locator('td').last().innerText()).trim();
    columns.push({ name, type, notes });
  }
  return columns;
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const results = {};

  try {
    await uploadCsv(page);

    const header = await readHeaderStats(page);
    results.header = header;

    const columns = await readColumnProfile(page);
    results.columns = columns;

    const weightRow = columns.find((c) => c.name === 'weight_kg');
    results.weightFlags = weightRow?.notes || '';

    const categoryRows = ['收货国家', 'status', 'carrier'].map((name) => {
      const row = columns.find((c) => c.name === name);
      return { name, notes: row?.notes || '' };
    });
    results.categorySuggestions = categoryRows;

    const statusNotes = columns.find((c) => c.name === 'status')?.notes || '';
    const countryNotes = columns.find((c) => c.name === '收货国家')?.notes || '';
    results.usaMerged =
      statusNotes.toLowerCase().includes('usa') &&
      statusNotes.toLowerCase().includes('united states') &&
      !statusNotes.includes(' / ');

    const beforeRows = header.parsed.rows;
    await page.getByRole('button', { name: 'Remove duplicates' }).click();
    await page.waitForTimeout(500);
    const afterHeader = await readHeaderStats(page);
    const cleaningMessage = await page.locator('.cleaning-note').innerText().catch(() => '');
    results.duplicates = {
      beforeRows,
      afterRows: afterHeader.parsed.rows,
      cleaningMessage,
      afterSubtitle: afterHeader.subtitle,
    };

    await page.reload();
    await uploadCsv(page);
    const reloadHeader = await readHeaderStats(page);
    results.reloadRows = reloadHeader.parsed.rows;
  } finally {
    await browser.close();
  }

  console.log(JSON.stringify(results, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
