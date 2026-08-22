import { aggregate, isPositive } from '../analytics/aggregations';
import { ChartSpec, ColumnProfile, Row } from '../types';
import { fieldLabel } from './fieldLabel';

const SOLID_MIN_COUNT = 30;
const SOLID_MIN_SHARE = 0.1;
const MAX_MISSING_SHARE = 0.1;

function isSolidSample(count: number, total: number): boolean {
  return count >= SOLID_MIN_COUNT && count / total >= SOLID_MIN_SHARE;
}

function sampleSuffix(count: number, total: number): string {
  return ` (${count.toLocaleString()} of ${total.toLocaleString()} records)`;
}

function leadingGroup(rows: Row[], field: string) {
  return aggregate(rows, field, undefined, 'count').sort((a, b) => b.value - a.value)[0];
}

function withSampleSize(title: string, count: number, total: number): string {
  return `${title}${sampleSuffix(count, total)}`;
}

function columnProfile(profiles: ColumnProfile[], name: string): ColumnProfile | undefined {
  return profiles.find((profile) => profile.name === name);
}

function hasUnmergedDuplicates(profile: ColumnProfile | undefined): boolean {
  return Boolean(profile?.valueGroups?.length);
}

import { duplicateValuesChartNote } from './valueGroupNotes';

function booleanMajorityTitle(fieldName: string, topName: string): string {
  const label = fieldName.toLowerCase();
  if (isPositive(topName)) {
    return `Most orders were marked as ${label}`;
  }
  return `Most orders were not marked as ${label}`;
}

function categoricalDescriptiveTitle(
  spec: ChartSpec,
  rows: Row[],
  profile: ColumnProfile | undefined,
  total: number,
): { title: string; mode: 'descriptive' } {
  const top = leadingGroup(rows, spec.x);
  const base = top ? withSampleSize(spec.title, top.count, total) : spec.title;
  return {
    title: `${base}${duplicateValuesChartNote(profile)}`,
    mode: 'descriptive',
  };
}

function conclusionTitle(
  rows: Row[],
  spec: ChartSpec,
  profiles: ColumnProfile[],
): { title: string; mode: 'conclusion' | 'descriptive' } {
  const total = rows.length;
  if (!total) {
    return { title: spec.title, mode: 'descriptive' };
  }

  const xProfile = columnProfile(profiles, spec.x);

  if (spec.kind === 'horizontal' || (spec.kind === 'bar' && spec.aggregation === 'count')) {
    if (hasUnmergedDuplicates(xProfile)) {
      return categoricalDescriptiveTitle(spec, rows, xProfile, total);
    }
    const top = leadingGroup(rows, spec.x);
    if (!top) return { title: spec.title, mode: 'descriptive' };
    const fieldName = fieldLabel(spec.x);
    if (isSolidSample(top.count, total)) {
      return {
        title: `${top.name} is the most common ${fieldName.toLowerCase()}`,
        mode: 'conclusion',
      };
    }
    return {
      title: withSampleSize(spec.title, top.count, total),
      mode: 'descriptive',
    };
  }

  if (spec.kind === 'bar' && spec.aggregation === 'outcomeRate' && spec.outcome) {
    if (hasUnmergedDuplicates(xProfile)) {
      return categoricalDescriptiveTitle(spec, rows, xProfile, total);
    }
    const top = aggregate(rows, spec.x, undefined, 'outcomeRate', spec.outcome).sort(
      (a, b) => b.value - a.value,
    )[0];
    if (!top) return { title: spec.title, mode: 'descriptive' };
    if (isSolidSample(top.count, total)) {
      return {
        title: `${top.name} has the highest observed ${fieldLabel(spec.outcome).toLowerCase()} rate (${top.value.toFixed(1)}%)`,
        mode: 'conclusion',
      };
    }
    return {
      title: withSampleSize(spec.title, top.count, total),
      mode: 'descriptive',
    };
  }

  if (spec.kind === 'donut') {
    const profile = xProfile;
    if (!profile) return { title: spec.title, mode: 'descriptive' };

    if (profile.missing / total > MAX_MISSING_SHARE) {
      return {
        title: `${spec.title} · ${profile.missing} missing values`,
        mode: 'descriptive',
      };
    }

    const groups = aggregate(rows, spec.x, undefined, 'count').sort((a, b) => b.value - a.value);
    const top = groups[0];
    if (!top) return { title: spec.title, mode: 'descriptive' };

    if (isSolidSample(top.count, total)) {
      return {
        title: booleanMajorityTitle(fieldLabel(spec.x), top.name),
        mode: 'conclusion',
      };
    }
    return {
      title: withSampleSize(spec.title, top.count, total),
      mode: 'descriptive',
    };
  }

  if (spec.kind === 'histogram') {
    return { title: spec.title, mode: 'descriptive' };
  }

  return { title: spec.title, mode: 'descriptive' };
}

export function applyChartConclusions(
  rows: Row[],
  charts: ChartSpec[],
  profiles: ColumnProfile[],
): Array<ChartSpec & { titleMode: 'conclusion' | 'descriptive' }> {
  return charts.map((spec) => {
    const { title, mode } = conclusionTitle(rows, spec, profiles);
    return { ...spec, title, titleMode: mode };
  });
}
