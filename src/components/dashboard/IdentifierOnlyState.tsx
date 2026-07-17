import { Dataset } from '../../types';
import AppHeader from '../layout/AppHeader';
import ScrollNavigation from '../layout/ScrollNavigation';
import DatasetSummary from './DatasetSummary';
import ColumnProfilePanel from '../data/ColumnProfilePanel';
import PreviewTable from '../data/PreviewTable';

interface IdentifierOnlyStateProps {
  dataset: Dataset;
  onDatasetChange: (dataset: Dataset) => void;
  onReset: () => void;
}

export default function IdentifierOnlyState({
  dataset,
  onDatasetChange,
  onReset,
}: IdentifierOnlyStateProps) {
  return (
    <>
      <AppHeader onReset={onReset} dataset={dataset.name} />
      <ScrollNavigation />
      <main className="dashboard">
        <DatasetSummary dataset={dataset} rows={dataset.rows} />
        <section className="unsupported-state" aria-labelledby="identifier-only-title">
          <div className="empty-symbol">
            <span />
            <span />
            <span />
          </div>
          <div className="eyebrow">Analysis unavailable</div>
          <h2 id="identifier-only-title">No chartable business fields were found</h2>
          <p>
            The file appears to contain identifiers only. Add a measurable field such as revenue,
            cost, quantity, score, date, region, category, or status to generate an analysis.
          </p>
          <button className="primary" onClick={onReset}>
            Upload Another File
          </button>
        </section>
        <ColumnProfilePanel dataset={dataset} onDatasetChange={onDatasetChange} />
        <details className="details-card" open>
          <summary>
            <span>
              <b>Data preview</b>
              <small>First 20 records</small>
            </span>
            <b>⌄</b>
          </summary>
          <PreviewTable rows={dataset.rows} columns={dataset.profiles.map((profile) => profile.name)} />
        </details>
      </main>
    </>
  );
}
