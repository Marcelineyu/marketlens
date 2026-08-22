import { Dataset } from '../../types';
import { formatNumber } from '../../utils/format';

interface DatasetSummaryProps {
  dataset: Dataset;
}

export default function DatasetSummary({ dataset }: DatasetSummaryProps) {
  const { profile } = dataset;
  const { typeCounts } = profile;

  return (
    <section className="summary">
      <div>
        <div className="eyebrow">Current dataset</div>
        <h1>{dataset.name}</h1>
        <p>
          {formatNumber(profile.rowCount)} rows · {dataset.profiles.length} columns ·{' '}
          {profile.missingValues} missing values · {profile.duplicateRows} duplicate rows
        </p>
      </div>
      <div className="stats">
        <div>
          <b>{typeCounts.numeric}</b>
          <span>Numeric</span>
        </div>
        <div>
          <b>{typeCounts.categorical}</b>
          <span>Categorical</span>
        </div>
        <div>
          <b>{typeCounts.date}</b>
          <span>Date</span>
        </div>
        <div>
          <b>{typeCounts.binary}</b>
          <span>Binary</span>
        </div>
      </div>
    </section>
  );
}
