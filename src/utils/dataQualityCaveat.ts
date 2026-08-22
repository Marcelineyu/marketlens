import { ColumnProfile, DatasetProfileSummary } from '../types';
import { numericCaveatIssue } from './numericDistortion';

export interface DataQualityIssue {
  text: string;
  columnName?: string;
}

function columnProfileAnchor(columnName: string): string {
  return `#column-profile-${encodeURIComponent(columnName)}`;
}

function numericIssueNotes(profile: ColumnProfile, scopeLabel: string): string | null {
  return numericCaveatIssue(profile, scopeLabel);
}

export function buildDataQualityIssues(
  profile: DatasetProfileSummary,
  profiles: ColumnProfile[],
  scopeLabel: string,
): DataQualityIssue[] {
  const issues: DataQualityIssue[] = [];

  if (profile.duplicateRows > 0) {
    const label =
      profile.duplicateRows === 1
        ? '1 row is an exact duplicate'
        : `${profile.duplicateRows} rows are exact duplicates`;
    issues.push({ text: `${label} (${scopeLabel})` });
  }

  for (const column of profiles) {
    const numericNote = numericIssueNotes(column, scopeLabel);
    if (numericNote) {
      issues.push({ text: numericNote, columnName: column.name });
    }
  }

  for (const column of profiles.filter((item) => item.type === 'empty')) {
    issues.push({
      text: `${column.name} is completely empty (${scopeLabel})`,
      columnName: column.name,
    });
  }

  return issues;
}

export function buildDataQualityCaveatText(
  profile: DatasetProfileSummary,
  profiles: ColumnProfile[],
  scopeLabel: string,
): string {
  const issues = buildDataQualityIssues(profile, profiles, scopeLabel);
  if (!issues.length) {
    return `No data quality issues detected (${scopeLabel}).`;
  }
  return `Before you trust these numbers (${scopeLabel}): ${issues.map((issue) => issue.text).join(', and ')}.`;
}

export function columnProfileHref(columnName: string): string {
  return columnProfileAnchor(columnName);
}
