import { ColumnProfile, ColumnType, Dataset } from '../../types';

interface ColumnProfilePanelProps {
  dataset: Dataset;
  onDatasetChange: (dataset: Dataset) => void;
}

export default function ColumnProfilePanel({ dataset, onDatasetChange }: ColumnProfilePanelProps) {
  const updateColumnType = (name: string, type: ColumnType) => {
    onDatasetChange({
      ...dataset,
      profiles: dataset.profiles.map((profile) =>
        profile.name === name ? { ...profile, type } : profile,
      ),
    });
  };

  return (
    <details className="details-card">
      <summary>
        <span>
          <b>Column profile</b>
          <small>Types, completeness, and examples</small>
        </span>
        <b>⌄</b>
      </summary>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Column</th>
              <th>Detected type</th>
              <th>Missing</th>
              <th>Unique</th>
              <th>Examples</th>
            </tr>
          </thead>
          <tbody>
            {dataset.profiles.map((profile) => (
              <tr key={profile.name}>
                <td>
                  <b>{profile.name}</b>
                </td>
                <td>
                  <select
                    aria-label={`Type for ${profile.name}`}
                    value={profile.type}
                    onChange={(event) =>
                      updateColumnType(profile.name, event.target.value as ColumnType)
                    }
                  >
                    {(['numeric', 'categorical', 'date', 'binary', 'identifier', 'text'] as const).map(
                      (type) => (
                        <option key={type}>{type}</option>
                      ),
                    )}
                  </select>
                </td>
                <td>{profile.missing}</td>
                <td>{profile.unique}</td>
                <td>{profile.examples.join(', ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
