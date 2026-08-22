import { Dataset } from '../../types';
import { makeDataset, refreshDatasetRows } from '../../utils/dataset';

interface OptionalCleaningProps {
  dataset: Dataset;
  onDatasetChange: (dataset: Dataset) => void;
}

export default function OptionalCleaning({ dataset, onDatasetChange }: OptionalCleaningProps) {
  const clean = (action: 'duplicates' | 'trim') => {
    let rows = dataset.rows;

    if (action === 'duplicates') {
      const beforeCount = rows.length;
      rows = Array.from(new Map(rows.map((row) => [JSON.stringify(row), row])).values());
      const removed = beforeCount - rows.length;
      onDatasetChange(
        refreshDatasetRows(
          dataset,
          rows,
          removed > 0 ? `Removed ${removed} duplicate row(s).` : 'No duplicate rows were removed.',
        ),
      );
      return;
    }

    rows = rows.map((row) =>
      Object.fromEntries(
        Object.entries(row).map(([key, value]) => [
          key,
          typeof value === 'string' ? value.trim() : value,
        ]),
      ),
    );
    onDatasetChange(refreshDatasetRows(dataset, rows));
  };

  return (
    <section className="clean">
      <span>
        <b>Optional cleaning</b> Changes are never applied silently.
      </span>
      <button onClick={() => clean('duplicates')}>Remove duplicates</button>
      <button onClick={() => clean('trim')}>Trim whitespace</button>
      <button
        onClick={() =>
          onDatasetChange({ ...makeDataset(dataset.name, dataset.originalRows), cleaningMessage: undefined })
        }
      >
        Reset data
      </button>
    </section>
  );
}
