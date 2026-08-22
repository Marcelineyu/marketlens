import { ColumnProfile, DatasetProfileSummary } from '../types';
import { numericCaveatIssue } from './numericDistortion';

export interface DataQualityIssue {
  text: string;
  columnName?: string;
}

function columnProfileAnchor(columnName: string): string {
  return `#column-profile-${encodeURIComponent(columnName)}`;
}

function numericIssueNotes(profile: ColumnProfile): string | null {
  return numericCaveatIssue(profile);
}

function joinIssueTexts(issues: DataQualityIssue[]): string {
  return issues
    .map((issue, index) => {
      if (index === 0) return issue.text;
      if (index === issues.length - 1) return `, and ${issue.text}`;
      return `, ${issue.text}`;
    })
    .join('');
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
    issues.push({ text: label });
  }

  for (const column of profiles) {
    const numericNote = numericIssueNotes(column);
    if (numericNote) {
      issues.push({ text: numericNote, columnName: column.name });
    }
  }

  for (const column of profiles.filter((item) => item.type === 'empty')) {
    issues.push({
      text: `${column.name} is completely empty`,
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
  return `Before you trust these numbers (${scopeLabel}): ${joinIssueTexts(issues)}.`;
}

export function columnProfileHref(columnName: string): string {
  return columnProfileAnchor(columnName);
}
