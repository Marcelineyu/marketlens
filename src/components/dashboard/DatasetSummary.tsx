import { Dataset } from '../../types';
import { formatAnalysisScope } from '../../utils/analysisScope';
import { buildDatasetLeadSentence } from '../../utils/datasetLeadSentence';
import { formatNumber } from '../../utils/format';
import { TYPE_TOOLTIPS, TYPE_UI_LABELS } from '../../utils/typeLabels';

interface DatasetSummaryProps {
  dataset: Dataset;
}

const TILE_TYPES = ['numeric', 'categorical', 'date', 'binary'] as const;

export default function DatasetSummary({ dataset }: DatasetSummaryProps) {
  const { profile } = dataset;
  const { typeCounts } = profile;
  const scopeLabel = formatAnalysisScope(dataset.rows.length, dataset, false);
  const leadSentence = buildDatasetLeadSentence(
    dataset.name,
    profile.rowCount,
    dataset.profiles.length,
    dataset.profiles,
    dataset.rows,
  );

  return (
    <section className="summary">
      <div>
        <div className="eyebrow">Current dataset</div>
        <h1>{dataset.name}</h1>
        <p className="summary-lead">{leadSentence}</p>
        <p className="summary-meta">
          {formatNumber(profile.rowCount)} rows · {dataset.profiles.length} columns ·{' '}
          {profile.missingValues} missing values · {profile.duplicateRows} duplicate rows ·{' '}
          {scopeLabel}
        </p>
        {dataset.cleaningMessage && (
          <p className="cleaning-note" role="status">
            {dataset.cleaningMessage}
          </p>
        )}
      </div>
      <div className="stats">
        {TILE_TYPES.map((type) => (
          <div key={type} title={TYPE_TOOLTIPS[type]}>
            <b>{typeCounts[type]}</b>
            <span>{TYPE_UI_LABELS[type]}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
