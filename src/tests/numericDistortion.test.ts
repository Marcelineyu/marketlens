import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, it } from 'vitest';
import Papa from 'papaparse';
import {
  numericCaveatIssue,
  numericChecklistHeadline,
  numericDistortionStats,
} from '../utils/numericDistortion';
import { buildDatasetProfile } from '../utils/datasetProfile';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const messyCsv = readFileSync(join(root, 'test-data/messy_cross_border_orders.csv'), 'utf8');
const rows = Papa.parse(messyCsv, {
  header: true,
  dynamicTyping: true,
  skipEmptyLines: 'greedy',
}).data as Record<string, unknown>[];
const { profiles } = buildDatasetProfile(rows);
const weightProfile = profiles.find((profile) => profile.name === 'weight_kg')!;

it('uses the same row set for weight_kg checklist mean and caveat average', () => {
  const stats = numericDistortionStats(weightProfile)!;
  const checklist = numericChecklistHeadline(weightProfile)!;
  const caveat = numericCaveatIssue(weightProfile)!;

  expect(stats.withMean).not.toBeNull();
  expect(stats.withoutMean).not.toBeNull();
  expect(checklist).not.toContain('based on');
  expect(caveat).not.toContain('based on');
  expect(checklist).toContain(String(stats.withMean!.toFixed(1)));
  expect(caveat).toContain(String(stats.withMean!.toFixed(1)));
  expect(caveat).toContain(String(stats.withoutMean!.toFixed(1)));
});
