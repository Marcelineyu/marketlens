import { Dataset } from '../types';
import { formatAnalysisScope } from './analysisScope';
import { buildDataHealthChecklist } from './dataHealthChecklist';
import { buildDataQualityCaveatText } from './dataQualityCaveat';
import { buildDatasetLeadSentence } from './datasetLeadSentence';
import { insights } from '../analytics/insights';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function buildSummaryHtml(
  dataset: Dataset,
  ignoredChecklistIds: ReadonlySet<string> = new Set(),
): string {
  const scopeLabel = formatAnalysisScope(dataset.rows.length, dataset, false);
  const lead = buildDatasetLeadSentence(
    dataset.name,
    dataset.profile.rowCount,
    dataset.profiles.length,
    dataset.profiles,
    dataset.rows,
  );
  const observations = insights(dataset.rows, dataset.profiles).map(
    (text) => `${text} (${scopeLabel}).`,
  );
  const caveat = buildDataQualityCaveatText(dataset.profile, dataset.profiles, scopeLabel);
  const checklist = buildDataHealthChecklist(dataset.profile, dataset.profiles, scopeLabel)
    .filter((item) => !ignoredChecklistIds.has(item.id))
    .map((item) => item.headline);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>MarketLens summary — ${escapeHtml(dataset.name)}</title>
  <style>
    body { font-family: Georgia, serif; max-width: 760px; margin: 40px auto; color: #1f2937; line-height: 1.6; }
    h1 { font-family: Arial, sans-serif; font-size: 28px; }
    h2 { font-family: Arial, sans-serif; font-size: 18px; margin-top: 28px; }
    .lead { font-size: 18px; }
    ul { padding-left: 20px; }
    .meta { color: #64748b; font-size: 14px; }
  </style>
</head>
<body>
  <h1>${escapeHtml(dataset.name)}</h1>
  <p class="meta">${escapeHtml(scopeLabel)}</p>
  <p class="lead">${escapeHtml(lead)}</p>
  <h2>Key observations</h2>
  <ul>${observations.map((item) => `<li>${escapeHtml(item)}</li>`).join('') || '<li>No observations available.</li>'}</ul>
  <h2>Data quality caveat</h2>
  <p>${escapeHtml(caveat)}</p>
  <h2>Checklist</h2>
  <ul>${checklist.map((item) => `<li>${escapeHtml(item)}</li>`).join('') || '<li>No open checklist items.</li>'}</ul>
</body>
</html>`;
}

export function downloadSummaryHtml(html: string, filename: string): void {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
