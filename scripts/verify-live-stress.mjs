import { chromium } from 'playwright';
import { readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const baseUrl = process.env.LIVE_URL || 'https://marketlens-by-marceline.vercel.app/';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const stressDir = join(root, 'test-data', 'stress');
const fixturesDir = join(root, 'test-data', 'fixtures');

const stressOnly = process.env.STRESS_ONLY
  ? new Set(process.env.STRESS_ONLY.split(',').map((item) => item.trim()))
  : null;

function shouldRun(checkId) {
  return !stressOnly || stressOnly.has(checkId);
}

const consoleLog = [];

function attachConsole(page) {
  page.on('console', (msg) => {
    consoleLog.push({ type: msg.type(), text: msg.text(), location: msg.location() });
  });
  page.on('pageerror', (error) => {
    consoleLog.push({ type: 'pageerror', text: error.message, location: {} });
  });
}

async function goToUpload(page) {
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page
    .waitForFunction(
      () =>
        Boolean(
          document.querySelector('label.drop input[type="file"]') ||
            document.querySelector('.new-dataset') ||
            document.querySelector('section.summary'),
        ),
      { timeout: 90000 },
    )
    .catch(() => {});

  const reset = page.getByRole('button', { name: 'Upload New Dataset' });
  if (await reset.count()) {
    await reset.click();
  }
  await page.getByLabel('Upload CSV or Excel').waitFor({ state: 'visible', timeout: 90000 });
}

async function waitForSampleDashboard(page) {
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page
    .getByRole('heading', { name: 'messy_cross_border_orders.csv' })
    .waitFor({ timeout: 90000 });
  await page.locator('section.summary .summary-lead').waitFor({ timeout: 90000 });
}

async function readScopeFromMeta(page) {
  const meta = await page.locator('.summary-meta').innerText();
  const match = meta.match(/(based on [^·]+)/i);
  return { meta, scope: match ? match[1].trim() : null };
}

async function readFilteredRowCount(page) {
  const label = page.locator('.table-tools span').first();
  if (!(await label.count())) return null;
  return label.innerText().catch(() => null);
}

async function captureDashboardState(page) {
  const heading = await page.getByRole('heading', { level: 1 }).first().innerText();
  const { meta, scope } = await readScopeFromMeta(page);
  return {
    heading,
    summaryMeta: meta,
    scope,
    lead: await page.locator('.summary-lead').innerText(),
    caveat: await page.locator('.data-quality-caveat').innerText().catch(() => ''),
    tiles: await page.locator('.stats > div').evaluateAll((nodes) =>
      nodes.map((node) => ({
        value: node.querySelector('b')?.textContent?.trim() || '',
        label: node.querySelector('span')?.textContent?.trim() || '',
      })),
    ),
    checklistHeader: await page.locator('.health-header b').innerText().catch(() => ''),
    checklistItems: await page.locator('.health-item .health-copy > p').allInnerTexts(),
    chartTitles: await page.locator('.chart-card h3').allInnerTexts(),
    cleaningLog: (await page.locator('.cleaning-log-bar').count())
      ? await page.locator('.cleaning-log-bar').innerText()
      : null,
    tableRowLabel: await readFilteredRowCount(page),
    observations: await page.locator('section.observations article p').allInnerTexts(),
  };
}

async function exportCsvContent(page) {
  const downloadPromise = page.waitForEvent('download', { timeout: 60000 });
  await page.getByRole('button', { name: 'Export CSV' }).scrollIntoViewIfNeeded();
  await page.getByRole('button', { name: 'Export CSV' }).click();
  const download = await downloadPromise;
  return readFileSync(await download.path(), 'utf8');
}

async function probeResponsiveness(page) {
  try {
    const delayMs = await page.evaluate(async () => {
      const start = performance.now();
      await new Promise((resolve) => requestAnimationFrame(resolve));
      return performance.now() - start;
    });
    return { responsive: delayMs < 500, delayMs };
  } catch (error) {
    return { responsive: false, error: String(error) };
  }
}

async function performanceUpload(page, label, filePath, timeoutMs) {
  const bytes = statSync(filePath).size;
  const result = {
    label,
    filePath,
    bytes,
    mb: Number((bytes / (1024 * 1024)).toFixed(2)),
    pass: false,
    timeToFirstRenderMs: null,
    unresponsive: false,
    message: '',
    heading: null,
    selector: '#root, [role="alert"], section.summary h1',
    component: 'UploadScreen / App / DatasetSummary',
  };

  await goToUpload(page);
  const start = Date.now();
  let lastPhase = 'upload-started';

  const uploadPromise = page.getByLabel('Upload CSV or Excel').setInputFiles(filePath);

  const poll = setInterval(() => {
    probeResponsiveness(page).then((probe) => {
      if (!probe.responsive) result.unresponsive = true;
    });
  }, 2000);

  try {
    await uploadPromise;
    lastPhase = 'file-selected';

    const timeoutPromise = new Promise((resolve) => {
      setTimeout(() => resolve('timeout'), timeoutMs);
    });

    const outcome = await Promise.race([
      page
        .locator('section.summary h1, section.summary .summary-lead')
        .first()
        .waitFor({ timeout: timeoutMs })
        .then(() => 'dashboard'),
      page
        .locator('[role="alert"]')
        .waitFor({ timeout: timeoutMs })
        .then(() => 'alert'),
      timeoutPromise,
    ]).catch((error) => {
      if (String(error).includes('Timeout')) return 'timeout';
      throw error;
    });

    result.timeToFirstRenderMs = Date.now() - start;
    lastPhase = outcome;

    if (outcome === 'dashboard') {
      result.pass = !result.unresponsive;
      result.heading = await page.getByRole('heading', { level: 1 }).first().innerText();
      result.message = `Dashboard rendered: ${result.heading}`;
      result.summaryMeta = await page.locator('.summary-meta').innerText().catch(() => '');
    } else if (outcome === 'alert') {
      result.message = await page.locator('[role="alert"]').innerText();
      result.pass = Boolean(result.message) && (await page.locator('#root').innerText()).trim().length > 0;
      result.component = 'UploadScreen';
      result.selector = '[role="alert"]';
    } else {
      result.message = `No dashboard or alert within ${timeoutMs}ms (phase: ${lastPhase})`;
      result.pass = false;
      result.unresponsive = true;
    }
  } catch (error) {
    result.timeToFirstRenderMs = Date.now() - start;
    result.message = error instanceof Error ? error.message : String(error);
    result.pass = false;
    result.lastPhase = lastPhase;
  } finally {
    clearInterval(poll);
  }

  result.lastPhase = lastPhase;
  return result;
}

async function checkFileTypes(page) {
  const cases = [
    {
      name: 'multi_sheet_xlsx',
      file: join(stressDir, 'multi_sheet.xlsx'),
      component: 'fileParsing / UploadScreen',
      selector: '[role="alert"], section.summary h1',
    },
    {
      name: 'utf8_bom_csv',
      file: join(stressDir, 'utf8_bom.csv'),
      component: 'fileParsing / UploadScreen',
      selector: '[role="alert"], section.summary h1',
    },
    {
      name: 'semicolon_csv',
      file: join(stressDir, 'semicolon.csv'),
      component: 'fileParsing / UploadScreen',
      selector: '[role="alert"], section.summary h1',
    },
    {
      name: 'pdf_renamed_csv',
      file: join(stressDir, 'fake_pdf.csv'),
      component: 'fileParsing / UploadScreen',
      selector: '[role="alert"]',
      expectAlert: true,
    },
    {
      name: 'over_15mb',
      file: join(stressDir, 'over_15mb.csv'),
      component: 'fileParsing / UploadScreen',
      selector: '[role="alert"]',
      expectAlert: true,
    },
  ];

  const results = {};
  for (const testCase of cases) {
    await goToUpload(page);
    await page.getByLabel('Upload CSV or Excel').setInputFiles(testCase.file);
    await page.waitForTimeout(1500);

    const alert = await page.locator('[role="alert"]').innerText().catch(() => '');
    const heading = await page
      .getByRole('heading', { level: 1 })
      .first()
      .innerText()
      .catch(() => '');
    const rootBlank = ((await page.locator('#root').innerText().catch(() => '')) || '').trim().length === 0;

    const message = alert || heading || (rootBlank ? '(blank page)' : '(silent no-op)');
    const pass = testCase.expectAlert
      ? Boolean(alert) && !rootBlank
      : Boolean(message) && !rootBlank && message !== '(silent no-op)' && !alert;
    results[testCase.name] = {
      pass,
      message: alert || heading,
      heading: heading || null,
      alert: alert || null,
      rootBlank,
      selector: testCase.selector,
      component: testCase.component,
    };
  }
  return results;
}

async function checkLargeFilePrompt(page) {
  const filePath = join(stressDir, 'perf_50k.csv');
  const result = {
    pass: false,
    filePath,
    promptVisible: false,
    promptText: null,
    timeToPromptMs: null,
    timeToDashboardMs: null,
    unresponsive: false,
    summaryMeta: null,
    scope: null,
    basedOn20k: false,
    notFull50k: false,
    selector: '.large-file-prompt, section.summary .summary-meta',
    component: 'LargeFilePrompt / useDatasetFileLoader / UploadScreen',
  };

  await goToUpload(page);
  const uploadStart = Date.now();

  await page.getByLabel('Upload CSV or Excel').setInputFiles(filePath);

  const prompt = page.getByRole('alertdialog');
  try {
    await prompt.waitFor({ state: 'visible', timeout: 120000 });
  } catch (error) {
    result.message = error instanceof Error ? error.message : String(error);
    return result;
  }

  result.timeToPromptMs = Date.now() - uploadStart;
  result.promptText = await prompt.innerText();
  result.promptVisible = /~50,000 rows|50,000 rows/i.test(result.promptText);

  const analyzeAllVisible = await page.getByRole('button', { name: 'Analyze anyway' }).isVisible();
  const analyzeSampleVisible = await page
    .getByRole('button', { name: 'Analyze the first 20,000 rows' })
    .isVisible();

  const dashboardStart = Date.now();
  await page.getByRole('button', { name: 'Analyze the first 20,000 rows' }).click();

  try {
    await page.locator('section.summary h1').waitFor({ timeout: 120000 });
    await page.locator('.summary-meta').waitFor({ timeout: 30000 });
  } catch (error) {
    result.timeToDashboardMs = Date.now() - dashboardStart;
    result.message = error instanceof Error ? error.message : String(error);
    result.unresponsive = true;
    return result;
  }

  result.timeToDashboardMs = Date.now() - dashboardStart;
  const probe = await probeResponsiveness(page);
  result.unresponsive = !probe.responsive;

  const { meta, scope } = await readScopeFromMeta(page);
  result.summaryMeta = meta;
  result.scope = scope;
  result.basedOn20k = meta.includes('20,000') && Boolean(scope?.includes('20,000'));
  result.notFull50k = !meta.includes('50,000');

  result.pass =
    result.promptVisible &&
    analyzeAllVisible &&
    analyzeSampleVisible &&
    result.basedOn20k &&
    result.notFull50k &&
    result.timeToDashboardMs < 120000 &&
    !result.unresponsive;

  if (!result.pass && !result.message) {
    result.message = !result.promptVisible
      ? 'Large-file prompt did not show expected ~50,000 row copy'
      : !result.basedOn20k
        ? 'Summary does not state based on 20,000 rows'
        : !result.notFull50k
          ? 'Summary still references the full 50,000-row file'
          : result.unresponsive
            ? 'Tab became unresponsive after sampling rows'
            : 'Large-file sample path failed';
  }

  return result;
}

async function checkUndoIntegrity(page) {
  await waitForSampleDashboard(page);
  const before = await captureDashboardState(page);
  const csvBefore = await exportCsvContent(page);

  await page.getByRole('button', { name: 'Remove and log' }).click();
  await page.waitForTimeout(800);

  const mergeButtons = page.getByRole('button', { name: 'Merge' });
  const mergeCount = await mergeButtons.count();
  const mergesApplied = [];
  for (let i = 0; i < mergeCount; i += 1) {
    await page.getByRole('button', { name: 'Merge' }).first().click();
    await page.waitForTimeout(800);
    mergesApplied.push(i + 1);
  }

  const afterCleaning = await captureDashboardState(page);
  const cleaningLogVisible = (await page.locator('.cleaning-log-bar').count()) > 0;
  if (!cleaningLogVisible) {
    return {
      pass: false,
      message: 'Cleaning log never appeared after actions',
      selector: '.cleaning-log-bar',
      component: 'CleaningChangeLog',
      before,
      afterCleaning,
    };
  }

  await page.getByRole('button', { name: 'Undo all' }).click();
  await page.waitForTimeout(1200);

  const afterUndo = await captureDashboardState(page);
  const csvAfter = await exportCsvContent(page);

  const drift = [];
  if (before.summaryMeta !== afterUndo.summaryMeta) drift.push('summaryMeta');
  if (before.lead !== afterUndo.lead) drift.push('lead');
  if (before.caveat !== afterUndo.caveat) drift.push('caveat');
  if (JSON.stringify(before.tiles) !== JSON.stringify(afterUndo.tiles)) drift.push('tiles');
  if (JSON.stringify(before.checklistItems) !== JSON.stringify(afterUndo.checklistItems)) {
    drift.push('checklistItems');
  }
  if (csvBefore !== csvAfter) drift.push('exportCsv');
  if (afterUndo.cleaningLog) drift.push('cleaningLogStillVisible');

  return {
    pass: drift.length === 0,
    drift,
    mergesApplied: mergesApplied.length,
    before,
    afterCleaning,
    afterUndo,
    csvBeforeLength: csvBefore.length,
    csvAfterLength: csvAfter.length,
    csvIdentical: csvBefore === csvAfter,
    selector: drift.length ? '.summary-meta, .cleaning-log-bar, Export CSV' : null,
    component: drift.length ? 'CleaningChangeLog / cleaningActions / DatasetSummary' : null,
  };
}

async function checkFilterCleaning(page) {
  await waitForSampleDashboard(page);
  const steps = [];

  const baseline = await captureDashboardState(page);
  steps.push({ step: 'baseline', rows: baseline.summaryMeta, scope: baseline.scope, table: baseline.tableRowLabel });

  const filterLabel = page.locator('.filterbar label').first();
  const filterSelect = filterLabel.locator('select');
  await filterSelect.waitFor({ state: 'visible', timeout: 30000 });
  const filterName = (await filterLabel.innerText()).replace(/\s*All\s*$/, '').trim();
  const options = await filterSelect.locator('option').evaluateAll((nodes) =>
    nodes.map((node) => node.getAttribute('value') || '').filter(Boolean),
  );
  const pick = options[0] || '';
  await filterSelect.selectOption(pick);
  await page.waitForTimeout(600);

  const filtered = await captureDashboardState(page);
  steps.push({
    step: 'filter-applied',
    filterColumn: filterName,
    filterValue: pick,
    rows: filtered.summaryMeta,
    scope: filtered.scope,
    table: filtered.tableRowLabel,
    observations: filtered.observations.slice(0, 1),
  });

  await page.getByRole('button', { name: 'Remove and log' }).click();
  await page.waitForTimeout(800);

  const afterRemove = await captureDashboardState(page);
  steps.push({
    step: 'duplicates-removed-under-filter',
    rows: afterRemove.summaryMeta,
    scope: afterRemove.scope,
    table: afterRemove.tableRowLabel,
    cleaningLog: afterRemove.cleaningLog,
  });

  await page.getByRole('button', { name: 'Reset filters' }).click();
  await page.waitForTimeout(600);

  const cleared = await captureDashboardState(page);
  steps.push({
    step: 'filters-cleared',
    rows: cleared.summaryMeta,
    scope: cleared.scope,
    table: cleared.tableRowLabel,
  });

  const consistent =
    cleared.summaryMeta.includes('481') || cleared.summaryMeta.includes('486')
      ? cleared.scope?.includes('after cleaning') || cleared.summaryMeta.includes('481')
      : true;

  return {
    pass: consistent && steps.every((item) => item.rows || item.table),
    steps,
    selector: consistent ? null : '.summary-meta, .table-tools span',
    component: 'DatasetFilters / DataHealthChecklist / analysisScope',
  };
}

async function checkRepeatedUploads(page) {
  const files = [
    { path: join(fixturesDir, '01-retail-sales.csv'), expectName: '01-retail-sales.csv' },
    { path: join(stressDir, 'semicolon.csv'), expectName: 'semicolon.csv' },
    { path: join(root, 'test-data', 'edge', 'categories_only.csv'), expectName: 'categories_only.csv' },
  ];

  const runs = [];
  for (const file of files) {
    await goToUpload(page);
    await page.getByLabel('Upload CSV or Excel').setInputFiles(file.path);
    await page.locator('section.summary h1').waitFor({ timeout: 30000 });
    await page.waitForTimeout(800);

    const state = await captureDashboardState(page);
    runs.push({
      file: file.expectName,
      heading: state.heading,
      chartTitles: state.chartTitles,
      checklistItems: state.checklistItems,
      cleaningLog: state.cleaningLog,
      staleSampleChart: state.chartTitles.some((title) => /weight kg|收货国家|customs cleared/i.test(title)),
      staleSampleChecklist: state.checklistItems.some((item) => /weight_kg|messy|duplicate rows are exact/i.test(item)),
    });
  }

  const pass = runs.every(
    (run) =>
      run.heading.includes(run.file.replace('.csv', '').replace('.xlsx', '')) &&
      !run.cleaningLog &&
      !run.staleSampleChart &&
      !run.staleSampleChecklist,
  );

  return {
    pass,
    runs,
    selector: '.cleaning-log-bar, .chart-card h3, .health-item',
    component: 'App state / CleaningChangeLog / ChartCard / DataHealthChecklist',
  };
}

async function checkMobileInteraction(page) {
  await page.setViewportSize({ width: 390, height: 844 });
  await waitForSampleDashboard(page);

  const results = {};

  const why = page.locator('.health-why summary').first();
  await why.scrollIntoViewIfNeeded();
  await why.click();
  results.whyExpanded = await page.locator('.health-why p').first().isVisible();
  results.whyPass = results.whyExpanded;

  const merge = page.getByRole('button', { name: 'Merge' }).first();
  await merge.scrollIntoViewIfNeeded();
  let mergeClicked = false;
  try {
    await merge.click({ timeout: 5000 });
    mergeClicked = true;
    await page.waitForTimeout(800);
  } catch (error) {
    results.mergeError = String(error);
  }
  results.mergeClicked = mergeClicked;
  results.mergePass = mergeClicked;

  const chartMenu = page.locator('.chart-card details.menu summary').first();
  await chartMenu.scrollIntoViewIfNeeded();
  let menuOpened = false;
  try {
    await chartMenu.click({ timeout: 5000 });
    menuOpened = await page.locator('.chart-card details.menu button').first().isVisible();
  } catch (error) {
    results.menuError = String(error);
  }
  results.menuOpened = menuOpened;
  results.menuPass = menuOpened;

  const tableWrap = page.locator('section:has(.table-tools) .table-wrap');
  await tableWrap.scrollIntoViewIfNeeded();
  const scrollInfo = await tableWrap.evaluate((el) => {
    el.scrollLeft = el.scrollWidth;
    return { scrollWidth: el.scrollWidth, clientWidth: el.clientWidth, scrollLeft: el.scrollLeft };
  });
  results.tableScroll = scrollInfo;
  results.tableScrollPass = scrollInfo.scrollWidth > scrollInfo.clientWidth ? scrollInfo.scrollLeft > 0 : true;

  const pass = results.whyPass && results.mergePass && results.menuPass && results.tableScrollPass;

  return {
    pass,
    ...results,
    selector: !results.whyPass
      ? '.health-why summary'
      : !results.mergePass
        ? 'button:has-text("Merge")'
        : !results.menuPass
          ? '.chart-card details.menu summary'
          : !results.tableScrollPass
            ? '.table-wrap'
            : null,
    component: !results.whyPass
      ? 'DataHealthChecklist'
      : !results.mergePass
        ? 'DataHealthChecklist'
        : !results.menuPass
          ? 'ChartCard'
          : !results.tableScrollPass
            ? 'DataGrid'
            : null,
  };
}

async function printCheck(name, pass, detail) {
  console.log(`\n=== ${name}: ${pass ? 'PASS' : 'FAIL'} ===`);
  console.log(typeof detail === 'string' ? detail : JSON.stringify(detail, null, 2));
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ acceptDownloads: true });
  const page = await context.newPage();
  attachConsole(page);

  const report = { url: baseUrl, generatedAt: new Date().toISOString() };

  try {
    if (shouldRun('1')) {
      report.check1_performance = {};
      for (const [key, file, timeout] of [
        ['10k', join(stressDir, 'perf_10k.csv'), 120000],
        ['50k', join(stressDir, 'perf_50k.csv'), 180000],
        ['200k', join(stressDir, 'perf_200k.csv'), 240000],
      ]) {
        const perfPage = await context.newPage();
        attachConsole(perfPage);
        try {
          report.check1_performance[key] = await performanceUpload(perfPage, key, file, timeout);
        } catch (error) {
          report.check1_performance[key] = {
            pass: false,
            message: error instanceof Error ? error.message : String(error),
            selector: "getByLabel('Upload CSV or Excel')",
            component: 'UploadScreen',
          };
        } finally {
          await perfPage.close();
        }
      }
      report.check1_performance.pass = ['10k', '50k', '200k'].every(
        (key) => report.check1_performance[key]?.pass,
      );
      await printCheck('1. PERFORMANCE', report.check1_performance.pass, report.check1_performance);
    }

    if (shouldRun('2')) {
      const fileTypeResults = await checkFileTypes(page);
      report.check2_fileTypes = fileTypeResults;
      report.check2_fileTypes.pass = Object.values(fileTypeResults).every((item) => item.pass);
      await printCheck('2. FILE TYPES', report.check2_fileTypes.pass, report.check2_fileTypes);
    }

    if (shouldRun('8')) {
      try {
        report.check8_largeFilePrompt = await (async () => {
          const p = await context.newPage();
          attachConsole(p);
          try {
            return await checkLargeFilePrompt(p);
          } finally {
            await p.close();
          }
        })();
      } catch (error) {
        report.check8_largeFilePrompt = {
          pass: false,
          message: error instanceof Error ? error.message : String(error),
          component: 'verify-live-stress',
        };
      }
      await printCheck(
        '8. LARGE FILE PROMPT',
        report.check8_largeFilePrompt?.pass ?? false,
        report.check8_largeFilePrompt,
      );
    }

    if (shouldRun('3')) {
      report.check3_undo = await (async () => {
        const p = await context.newPage();
        attachConsole(p);
        try {
          return await checkUndoIntegrity(p);
        } finally {
          await p.close();
        }
      })();
      await printCheck('3. UNDO INTEGRITY', report.check3_undo.pass, report.check3_undo);
    }

    if (shouldRun('4')) {
      try {
        report.check4_filterCleaning = await (async () => {
          const p = await context.newPage();
          attachConsole(p);
          try {
            return await checkFilterCleaning(p);
          } finally {
            await p.close();
          }
        })();
      } catch (error) {
        report.check4_filterCleaning = {
          pass: false,
          message: error instanceof Error ? error.message : String(error),
          selector: '.filterbar label select',
          component: 'DatasetFilters',
        };
      }
      await printCheck(
        '4. FILTER + CLEANING',
        report.check4_filterCleaning?.pass ?? false,
        report.check4_filterCleaning,
      );
    }

    if (shouldRun('5')) {
      try {
        report.check5_repeatedUploads = await (async () => {
          const p = await context.newPage();
          attachConsole(p);
          try {
            return await checkRepeatedUploads(p);
          } finally {
            await p.close();
          }
        })();
      } catch (error) {
        report.check5_repeatedUploads = {
          pass: false,
          message: error instanceof Error ? error.message : String(error),
          selector: "getByLabel('Upload CSV or Excel')",
          component: 'App state',
        };
      }
      await printCheck(
        '5. REPEATED UPLOADS',
        report.check5_repeatedUploads?.pass ?? false,
        report.check5_repeatedUploads,
      );
    }
  } catch (error) {
    report.fatalError = error instanceof Error ? error.message : String(error);
    await printCheck('FATAL', false, report.fatalError);
  } finally {
    if (shouldRun('6')) {
    report.check6_console = {
      errors: consoleLog.filter((entry) => entry.type === 'error' || entry.type === 'pageerror'),
      warnings: consoleLog.filter((entry) => entry.type === 'warning'),
      total: consoleLog.length,
    };
    report.check6_console.pass = report.check6_console.errors.length === 0;
    await printCheck('6. CONSOLE', report.check6_console.pass, report.check6_console);
    }

    if (shouldRun('7')) {
    try {
      report.check7_mobile = await (async () => {
        const p = await context.newPage();
        attachConsole(p);
        return checkMobileInteraction(p);
      })();
      await printCheck('7. MOBILE 390x844', report.check7_mobile.pass, report.check7_mobile);
    } catch (error) {
      report.check7_mobile = {
        pass: false,
        message: error instanceof Error ? error.message : String(error),
        component: 'verify-live-stress',
      };
      await printCheck('7. MOBILE 390x844', false, report.check7_mobile);
    }
    }

    await browser.close();
    console.log('\n=== FULL REPORT ===');
    console.log(JSON.stringify(report, null, 2));
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
