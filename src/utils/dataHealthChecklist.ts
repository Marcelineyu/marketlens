import { ColumnProfile, DatasetProfileSummary, ValueGroup } from '../types';
import { numericChecklistHeadline } from './numericDistortion';
import { valueGroupVariantLabel } from './valueGroupNotes';

export type ChecklistActionKind = 'remove-and-log' | 'merge' | 'view' | 'ignore';

export interface ChecklistItem {
  id: string;
  severity: number;
  headline: string;
  moreGroupsText?: string;
  scopeLabel?: string;
  why: string;
  actions: ChecklistActionKind[];
  columnName?: string;
  valueGroups?: ValueGroup[];
  viewTarget?: string;
}

function valueGroupHeadline(columnName: string, groups: ValueGroup[]): Pick<ChecklistItem, 'headline' | 'moreGroupsText'> {
  if (groups.length === 1) {
    return {
      headline: `${columnName} has ${valueGroupVariantLabel(groups[0])} that may be the same value — splits counts across spellings`,
    };
  }

  const first = valueGroupVariantLabel(groups[0]);
  const rest = groups.slice(1).map((group) => valueGroupVariantLabel(group)).join('; ');
  return {
    headline: `${columnName} has ${groups.length} groups of near-identical values (${first}) — splits one category across several rows`,
    moreGroupsText: rest,
  };
}

export function buildDataHealthChecklist(
  profile: DatasetProfileSummary,
  profiles: ColumnProfile[],
): ChecklistItem[] {
  const items: ChecklistItem[] = [];

  if (profile.duplicateRows > 0) {
    const label =
      profile.duplicateRows === 1
        ? '1 row is an exact duplicate'
        : `${profile.duplicateRows} rows are exact duplicates`;
    items.push({
      id: 'duplicates',
      severity: 1,
      headline: `${label} — inflates counts and totals`,
      why: 'Duplicate rows double-count the same information, so totals, averages, and category shares all look larger than they really are.',
      actions: ['remove-and-log', 'view', 'ignore'],
      viewTarget: 'duplicate-rows',
    });
  }

  for (const column of profiles) {
    if (column.numericFlags?.negatives.length || column.numericFlags?.outliers.length) {
      const headline = numericChecklistHeadline(column);
      if (!headline) continue;
      items.push({
        id: `numeric-${column.name}`,
        severity: 2,
        headline,
        why: 'Extreme or invalid numbers pull averages away from typical values, so headline totals can look much higher or lower than most records.',
        actions: ['view', 'ignore'],
        columnName: column.name,
        viewTarget: `column-profile-${encodeURIComponent(column.name)}`,
      });
    }
  }

  for (const column of profiles) {
    const groups = column.valueGroups?.filter((group) => group.variants.length > 1) ?? [];
    if (!groups.length) continue;

    const groupCopy = valueGroupHeadline(column.name, groups);
    items.push({
      id: `value-groups-${column.name}`,
      severity: 3,
      headline: groupCopy.headline,
      moreGroupsText: groupCopy.moreGroupsText,
      why: 'When the same category is spelled differently, charts treat it as separate categories and understate how common it really is.',
      actions: ['merge', 'view', 'ignore'],
      columnName: column.name,
      valueGroups: groups,
      viewTarget: `column-profile-${encodeURIComponent(column.name)}`,
    });
  }

  for (const column of profiles.filter((item) => item.type === 'empty')) {
    items.push({
      id: `empty-${column.name}`,
      severity: 4,
      headline: `${column.name} is entirely empty — excluded from charts`,
      why: 'Columns with no values cannot be summarized or charted, and they add noise to the field list without helping analysis.',
      actions: ['view', 'ignore'],
      columnName: column.name,
      viewTarget: `column-profile-${encodeURIComponent(column.name)}`,
    });
  }

  return items.sort((a, b) => a.severity - b.severity);
}

export function formatChecklistExportLine(item: ChecklistItem): string {
  let text = item.headline;
  if (item.moreGroupsText) {
    text = `${text}; ${item.moreGroupsText}`;
  }
  if (item.scopeLabel) {
    text = `${text} (${item.scopeLabel})`;
  }
  return text;
}
