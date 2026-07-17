import { Dataset, Row } from '../../types';
import { summarize } from '../../analytics/dataSummary';
import { formatNumber } from '../../utils/format';

interface DatasetSummaryProps {
  dataset: Dataset;
  rows: Row[];
}

export default function DatasetSummary({ dataset, rows }: DatasetSummaryProps) {
  const summary = summarize(rows, dataset.profiles);

  return (
    <section className="summary">
      <div>
        <div className="eyebrow">Current dataset</div>
        <h1>{dataset.name}</h1>
        <p>
          {formatNumber(summary.rows)} rows · {summary.columns} columns · {summary.missing}{' '}
          missing values · {summary.duplicates} duplicate rows
        </p>
      </div>
      <div className="stats">
        <div>
          <b>{summary.numeric}</b>
          <span>Numeric</span>
        </div>
        <div>
          <b>{summary.categorical}</b>
          <span>Categorical</span>
        </div>
        <div>
          <b>{summary.date}</b>
          <span>Date</span>
        </div>
        <div>
          <b>{summary.binary}</b>
          <span>Binary</span>
        </div>
      </div>
    </section>
  );
}
