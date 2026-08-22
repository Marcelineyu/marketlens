import { ColumnProfile, DatasetProfileSummary } from '../../types';
import {
  buildDataQualityIssues,
  buildDataQualityCaveatText,
  columnProfileHref,
} from '../../utils/dataQualityCaveat';

interface DataQualityCaveatProps {
  profile: DatasetProfileSummary;
  profiles: ColumnProfile[];
  scopeLabel: string;
}

export default function DataQualityCaveat({
  profile,
  profiles,
  scopeLabel,
}: DataQualityCaveatProps) {
  const issues = buildDataQualityIssues(profile, profiles, scopeLabel);

  if (!issues.length) {
    return (
      <p className="data-quality-caveat" role="note">
        {buildDataQualityCaveatText(profile, profiles, scopeLabel)}
      </p>
    );
  }

  return (
    <p className="data-quality-caveat" role="note">
      Before you trust these numbers ({scopeLabel}):{' '}
      {issues.map((issue, index) => {
        const separator =
          index === 0 ? '' : index === issues.length - 1 ? ', and ' : ', ';
        const content = issue.columnName ? (
          <a href={columnProfileHref(issue.columnName)}>{issue.text}</a>
        ) : (
          issue.text
        );
        return (
          <span key={`${issue.columnName ?? 'duplicate'}-${index}`}>
            {separator}
            {content}
          </span>
        );
      })}
      .
    </p>
  );
}
