import { ColumnProfile } from '../types';
import { numericValues } from '../analytics/numeric';
import { formatStat } from './formatStats';

export interface NumericDistortionStats {
  withMean: number | null;
  withoutMean: number | null;
  median: number | null;
  negativeCount: number;
  outlierCount: number;
  outlierValue: number | null;
}

export function numericDistortionStats(profile: ColumnProfile): NumericDistortionStats | null {
  if (!profile.numericFlags) return null;

  const values = numericValues(profile.values);
  if (!values.length) return null;

  const outlierIndices = new Set(profile.numericFlags.outliers.map((item) => item.index));
  const withoutOutliers = profile.values
    .map((value, index) => (outlierIndices.has(index) ? null : value))
    .filter((value) => numericValues([value]).length);

  const withMean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const withoutMean =
    withoutOutliers.length > 0
      ? withoutOutliers.reduce<number>((sum, value) => sum + Number(value), 0) /
        withoutOutliers.length
      : null;

  return {
    withMean,
    withoutMean,
    median: profile.numericFlags.stats?.median ?? null,
    negativeCount: profile.numericFlags.negatives.length,
    outlierCount: profile.numericFlags.outliers.length,
    outlierValue: profile.numericFlags.outliers[0]?.value ?? null,
  };
}

export function numericChecklistHeadline(profile: ColumnProfile, scopeLabel: string): string | null {
  const stats = numericDistortionStats(profile);
  if (!stats) return null;

  const parts: string[] = [];
  if (stats.negativeCount) {
    parts.push(
      `${stats.negativeCount} negative value${stats.negativeCount === 1 ? '' : 's'}`,
    );
  }
  if (stats.outlierCount) {
    parts.push(
      `${stats.outlierCount} outlier${stats.outlierCount === 1 ? '' : 's'}${
        stats.outlierValue !== null ? ` (${stats.outlierValue})` : ''
      }`,
    );
  }
  if (!parts.length) return null;

  const distortion =
    stats.withMean !== null && stats.median !== null
      ? ` (mean ${formatStat(stats.withMean)} vs median ${formatStat(stats.median)}, ${scopeLabel})`
      : ` (${scopeLabel})`;

  return `${profile.name} has ${parts.join(' and ')} — distorts averages${distortion}`;
}

export function numericCaveatIssue(profile: ColumnProfile, scopeLabel: string): string | null {
  const stats = numericDistortionStats(profile);
  if (!stats) return null;

  if (stats.outlierCount && stats.withMean !== null && stats.withoutMean !== null) {
    if (Math.abs(stats.withMean - stats.withoutMean) < 1) return null;
    const outlierLabel = stats.outlierCount === 1 ? '1 outlier' : `${stats.outlierCount} outliers`;
    return `${profile.name} contains ${outlierLabel} that pull${stats.outlierCount === 1 ? 's' : ''} the average from ${formatStat(stats.withoutMean)} to ${formatStat(stats.withMean)} (${scopeLabel})`;
  }

  if (stats.negativeCount) {
    const label =
      stats.negativeCount === 1 ? '1 negative value' : `${stats.negativeCount} negative values`;
    return `${profile.name} contains ${label} (${scopeLabel})`;
  }

  return null;
}
