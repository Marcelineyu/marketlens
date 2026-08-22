import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const baseUrl = process.env.LIVE_URL || 'https://marketlens-by-marceline.vercel.app/';

async function waitForDashboard(page) {
  await page.goto(baseUrl, { waitUntil: 'networkidle', timeout: 60000 });
  await page
    .getByRole('heading', { name: 'messy_cross_border_orders.csv' })
    .waitFor({ timeout: 60000 });
}

async function readFirstScreen(page) {
  const lead = await page.locator('section.summary .summary-lead').innerText();
  const caveat = await page.locator('.data-quality-caveat').innerText();
  const tiles = await page.locator('section.summary .stats > div').evaluateAll((nodes) =>
    nodes.map((node) => ({
      value: node.querySelector('b')?.textContent?.trim() || '',
      label: node.querySelector('span')?.textContent?.trim() || '',
    })),
  );
  const scopeRepeats = (caveat.match(/\(based on [^)]+\)/g) || []).length;
  return {
    lead,
    caveat,
    tiles,
    scopeRepeats,
    passScopeOnce: scopeRepeats === 1,
  };
}

async function readChecklist(page) {
  const header = await page.locator('.health-header b').innerText();
  const items = await page.locator('.health-item').evaluateAll((nodes) =>
    nodes.map((node) => {
      const headline = node.querySelector('.health-copy > p')?.textContent?.trim() || '';
      const moreSummary =
        node.querySelector('.health-more summary')?.textContent?.trim() || '';
      const moreBody = node.querySelector('.health-more p')?.textContent?.trim() || '';
      return moreSummary
        ? `${headline} ${moreSummary}${moreBody ? ` [hidden: ${moreBody}]` : ''}`
        : headline;
    }),
  );
  const itemScopeRepeats = items.filter((item) => /\(based on [^)]+\)/.test(item)).length;
  const statusItem = items.find((item) => item.includes('status has')) || null;
  return {
    header,
    items,
    itemScopeRepeats,
    statusItem,
    pass:
      header.startsWith('Data health — based on') &&
      itemScopeRepeats === 0 &&
      Boolean(statusItem?.includes('and 2 more')),
  };
}

async function verifyExportSummary(page) {
  const leadOnPage = await page.locator('section.summary .summary-lead').innerText();
  const caveatOnPage = await page.locator('.data-quality-caveat').innerText();
  const checklistHeader = await page.locator('.health-header b').innerText();

  const downloadPromise = page.waitForEvent('download', { timeout: 15000 });
  await page.getByRole('button', { name: 'Export summary' }).scrollIntoViewIfNeeded();
  await page.getByRole('button', { name: 'Export summary' }).click();
  const download = await downloadPromise;
  const html = readFileSync(await download.path(), 'utf8');

  const caveatScopeRepeats = (caveatOnPage.match(/\(based on [^)]+\)/g) || []).length;
  const exportCaveatScopeRepeats = (
    html.match(/Before you trust these numbers \(based on [^)]+\)/g) || []
  ).length;
  const hasExpandedCarrier = html.includes('FedEx / fedex') && html.includes('dhl  / DHL');
  const hasExpandedStatus =
    html.includes('Delivered / delivered / DELIVERED') &&
    html.includes('In transit / In Transit');

  return {
    pass:
      html.includes(leadOnPage.trim()) &&
      html.includes(caveatOnPage.trim()) &&
      html.includes(`Data health — based on`) &&
      hasExpandedCarrier &&
      hasExpandedStatus &&
      caveatScopeRepeats === 1,
    leadOnPage,
    caveatOnPage,
    caveatScopeRepeats,
    exportCaveatScopeRepeats,
    checklistHeader,
    hasExpandedCarrier,
    hasExpandedStatus,
    htmlExcerpt: html.slice(html.indexOf('<h2>Data quality'), html.indexOf('</body>')),
  };
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ acceptDownloads: true });
  const page = await context.newPage();
  const report = { url: baseUrl };

  try {
    await waitForDashboard(page);
    report.check1 = { ...(await readFirstScreen(page)), pass: undefined };
    report.check1.pass = report.check1.passScopeOnce;

    report.check4 = await readChecklist(page);

    report.check5 = await verifyExportSummary(page);
  } finally {
    await browser.close();
  }

  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
