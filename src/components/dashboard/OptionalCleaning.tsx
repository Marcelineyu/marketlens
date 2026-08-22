import { buildDatasetProfile } from '../../utils/datasetProfile';
import { Dataset } from '../../types';
import { makeDataset } from '../../utils/dataset';

interface OptionalCleaningProps {
  dataset: Dataset;
  onDatasetChange: (dataset: Dataset) => void;
}

export default function OptionalCleaning({ dataset, onDatasetChange }: OptionalCleaningProps) {
  const applyRows = (rows: Dataset['rows']) => {
    const { profiles, profile } = buildDatasetProfile(rows);
    onDatasetChange({ ...dataset, rows, profiles, profile });
  };

  const clean = (action: 'duplicates' | 'trim') => {
    let rows = dataset.rows;

    if (action === 'duplicates') {
      rows = Array.from(new Map(rows.map((row) => [JSON.stringify(row), row])).values());
    } else {
      rows = rows.map((row) =>
        Object.fromEntries(
          Object.entries(row).map(([key, value]) => [
            key,
            typeof value === 'string' ? value.trim() : value,
          ]),
        ),
      );
    }

    applyRows(rows);
  };

  return (
    <section className="clean">
      <span>
        <b>Optional cleaning</b> Changes are never applied silently.
      </span>
      <button onClick={() => clean('duplicates')}>Remove duplicates</button>
      <button onClick={() => clean('trim')}>Trim whitespace</button>
      <button onClick={() => onDatasetChange(makeDataset(dataset.name, dataset.originalRows))}>
        Reset data
      </button>
    </section>
  );
}
