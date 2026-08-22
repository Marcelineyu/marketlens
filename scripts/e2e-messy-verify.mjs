import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const csvPath = join(root, 'test-data', 'messy_cross_border_orders.csv');
const edgeDir = join(root, 'test-data', 'edge');
const baseUrl = 'http://localhost:5173/';

async function waitForSampleDashboard(page) {
  await page.goto(baseUrl);
  await page.getByRole('heading', { name: 'messy_cross_border_orders.csv' }).waitFor({ timeout: 30000 });
}

async function uploadCsv(page, filePath) {
  await page.getByLabel('Replace sample dataset').setInputFiles(filePath);
}

function parseSummaryText(text) {
  const rowMatch = text.match(/([\d,]+)\s+rows/i);
  const dupMatch = text.match(/([\d,]+)\s+duplicate rows/i);
  const scopeMatch = text.match(/(based on [^·]+)/i);
  return {
    rows: rowMatch ? rowMatch[1].replace(/,/g, '') : null,
    duplicates: dupMatch ? dupMatch[1].replace(/,/g, '') : null,
    scope: scopeMatch ? scopeMatch[1].trim() : null,
  };
}

async function readHeaderStats(page) {
  const summary = page.locator('section.summary');
  const lead = await summary.locator('.summary-lead').innerText();
  const subtitle = await summary.locator('.summary-meta').innerText();
  const tiles = await summary.locator('.stats > div').evaluateAll((nodes) =>
    nodes.map((node) => ({
      value: node.querySelector('b')?.textContent?.trim() || '',
      label: node.querySelector('span')?.textContent?.trim() || '',
    })),
  );
  return { lead, subtitle, tiles, parsed: parseSummaryText(subtitle) };
}

async function readCaveat(page) {
  return page.locator('.data-quality-caveat').innerText();
}

async function readChecklistItems(page) {
  return page.locator('.health-item .health-copy > p').evaluateAll((nodes) =>
    nodes.map((node) => node.textContent?.trim() || ''),
  );
}

async function readChangeLogBar(page) {
  const bar = page.locator('.cleaning-log-bar');
  if ((await bar.count()) === 0) return null;
  return bar.locator('> span').first().innerText();
}

async function readChartTitles(page) {
  return page.locator('.chart-card').evaluateAll((nodes) =>
    nodes.map((node) => ({
      title: node.querySelector('h3')?.textContent?.trim() || '',
      mode: node.getAttribute('data-title-mode') || 'descriptive',
      notes: Array.from(node.querySelectorAll('.chart-note')).map((note) => note.textContent?.trim() || ''),
    })),
  );
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

function extractWeightKgFigures(caveatText, checklistItems) {
  const weightChecklist = checklistItems.find((item) => item.includes('weight_kg')) || '';
  const weightCaveatMatch = caveatText.match(/weight_kg contains 1 outlier that pulls the average from [\d,]+(?:\.\d+)? to [\d,]+(?:\.\d+)? \([^)]+\)/i);
  const weightCaveat = weightCaveatMatch?.[0] || '';

  const checklistMean = weightChecklist.match(/mean\s+([\d,]+(?:\.\d+)?)/i)?.[1] ?? null;
  const checklistMedian = weightChecklist.match(/median\s+([\d,]+(?:\.\d+)?)/i)?.[1] ?? null;
  const checklistScope = weightChecklist.match(/(based on [^)]+)\)/i)?.[1] ?? null;

  const caveatFrom = weightCaveat.match(/from\s+([\d,]+(?:\.\d+)?)/i)?.[1] ?? null;
  const caveatTo = weightCaveat.match(/to\s+([\d,]+(?:\.\d+)?)/i)?.[1] ?? null;
  const caveatScope = weightCaveat.match(/(based on [^)]+)\)/i)?.[1] ?? null;

  return {
    checklist: {
      text: weightChecklist,
      mean: checklistMean,
      median: checklistMedian,
      scopeLabel: checklistScope,
    },
    caveat: {
      text: weightCaveat,
      averageFrom: caveatFrom,
      averageTo: caveatTo,
      scopeLabel: caveatScope,
    },
  };
}

async function goToUploadScreen(page) {
  await page.goto(baseUrl);
  const resetButton = page.getByRole('button', { name: 'Upload New Dataset' });
  if (await resetButton.count()) {
    await resetButton.click();
  }
}

async function verifyEdgeCase(page, name, filePath, expect) {
  const result = {
    name,
    pass: false,
    message: '',
  };

  try {
    await goToUploadScreen(page);
    await page.getByLabel('Upload CSV or Excel').setInputFiles(filePath);
    await page.waitForTimeout(700);

    const errorText = await page.locator('[role="alert"]').innerText().catch(() => '');
    const rootText = await page.locator('#root').innerText();
    const hasWhiteScreen = rootText.trim().length === 0;

    if (hasWhiteScreen) {
      result.message = 'White screen (empty root)';
      return result;
    }

    if (expect.error) {
      result.pass = errorText.includes(expect.error);
      result.message = errorText || '(no error shown)';
      return result;
    }

    if (expect.notice) {
      const notice = await page.locator('.dataset-notices').innerText().catch(() => '');
      result.pass = notice.includes(expect.notice);
      result.message = notice || rootText.slice(0, 160);
      return result;
    }

    if (expect.heading) {
      await page.getByRole('heading', { name: expect.heading }).waitFor({ timeout: 10000 });
      result.pass = true;
      result.message = `Loaded ${expect.heading}`;
      return result;
    }

    result.message = 'No expectation matched';
  } catch (error) {
    result.message = error instanceof Error ? error.message : String(error);
  }

  return result;
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const results = {};

  try {
    await waitForSampleDashboard(page);

    const header = await readHeaderStats(page);
    results.header = header;
    results.summaryLeadSentence = header.lead;
    results.caveatLine = await readCaveat(page);
    results.checklistItems = await readChecklistItems(page);
    results.weightKgFigures = extractWeightKgFigures(results.caveatLine, results.checklistItems);

    const chartTitles = await readChartTitles(page);
    results.chartTitles = chartTitles;
    results.dateChartNotes = chartTitles
      .filter((chart) => /date|time|month|year|day/i.test(chart.title + chart.notes.join(' ')))
      .map((chart) => ({ title: chart.title, notes: chart.notes }));
    results.outlierChartNotes = chartTitles
      .flatMap((chart) => chart.notes.filter((note) => /outlier excluded/i.test(note)));

    const columns = await readColumnProfile(page);
    results.columns = columns;

    const weightRow = columns.find((c) => c.name === 'weight_kg');
    results.weightFlags = weightRow?.notes || '';

    const categoryRows = ['收货国家', 'status', 'carrier'].map((name) => {
      const row = columns.find((c) => c.name === name);
      return { name, notes: row?.notes || '' };
    });
    results.categorySuggestions = categoryRows;

    const beforeRows = header.parsed.rows;
    await page.getByRole('button', { name: 'Remove and log' }).click();
    await page.waitForTimeout(500);
    const afterHeader = await readHeaderStats(page);
    const cleaningMessage = await page.locator('.cleaning-note').innerText().catch(() => '');
    results.duplicates = {
      beforeRows,
      afterRows: afterHeader.parsed.rows,
      afterScope: afterHeader.parsed.scope,
      cleaningMessage,
      afterSubtitle: afterHeader.subtitle,
    };
    results.changeLogBar = await readChangeLogBar(page);

    await page.reload();
    await waitForSampleDashboard(page);
    await uploadCsv(page, csvPath);
    const reloadHeader = await readHeaderStats(page);
    results.reloadRows = reloadHeader.parsed.rows;

    results.exportButtons = {
      exportCsv: (await page.getByRole('button', { name: 'Export CSV' }).count()) > 0,
      exportSummary: (await page.getByRole('button', { name: 'Export summary' }).count()) > 0,
    };

    results.headerTagline = await page.locator('.brand-tagline').first().innerText().catch(() => '');
    results.headerPrivacy = await page.locator('.brand-privacy').first().innerText().catch(() => '');

    results.edgeCases = {
      empty: await verifyEdgeCase(page, 'empty', join(edgeDir, 'empty.csv'), {
        error: 'This file is empty.',
      }),
      headerOnly: await verifyEdgeCase(page, 'header_only', join(edgeDir, 'header_only.csv'), {
        error: 'This file has a header row but no data rows.',
      }),
      singleColumn: await verifyEdgeCase(page, 'single_column', join(edgeDir, 'single_column.csv'), {
        notice: 'only one column',
      }),
      constantValue: await verifyEdgeCase(page, 'constant_value', join(edgeDir, 'constant_value.csv'), {
        notice: 'only one repeated value',
      }),
      categoriesOnly: await verifyEdgeCase(page, 'categories_only', join(edgeDir, 'categories_only.csv'), {
        notice: 'no numeric or date columns',
      }),
      manyColumns: await verifyEdgeCase(page, 'many_columns', join(edgeDir, 'many_columns.csv'), {
        notice: '101 columns',
      }),
      nonUtf8: await verifyEdgeCase(page, 'non_utf8', join(edgeDir, 'non_utf8.csv'), {
        error: 'non-UTF-8 encoding',
      }),
    };
  } finally {
    await browser.close();
  }

  console.log(JSON.stringify(results, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
