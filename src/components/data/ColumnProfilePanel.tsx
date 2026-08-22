import { ColumnProfile, ColumnType, Dataset } from '../../types';
import { typeUiLabel } from '../../utils/typeLabels';

interface ColumnProfilePanelProps {
  dataset: Dataset;
  onDatasetChange: (dataset: Dataset) => void;
}

const TYPE_OPTIONS: ColumnType[] = [
  'numeric',
  'categorical',
  'date',
  'binary',
  'identifier',
  'text',
  'empty',
];

export default function ColumnProfilePanel({ dataset, onDatasetChange }: ColumnProfilePanelProps) {
  const updateColumnType = (name: string, type: ColumnType) => {
    onDatasetChange({
      ...dataset,
      profiles: dataset.profiles.map((profile) =>
        profile.name === name ? { ...profile, type } : profile,
      ),
    });
  };

  const formatValueGroups = (profile: ColumnProfile) => {
    if (!profile.valueGroups?.length) return null;
    return profile.valueGroups.slice(0, 2).map((group) => {
      const variants = group.variants.map((variant) => variant.value).join(' / ');
      return `${variants} (${group.total})`;
    });
  };

  const formatNumericFlags = (profile: ColumnProfile) => {
    if (!profile.numericFlags) return null;
    const parts: string[] = [];
    if (profile.numericFlags.negatives.length) {
      parts.push(`${profile.numericFlags.negatives.length} negative value(s)`);
    }
    if (profile.numericFlags.outliers.length) {
      parts.push(`${profile.numericFlags.outliers.length} outlier(s)`);
    }
    return parts.length ? parts.join(' · ') : null;
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
              <th>Distinct</th>
              <th>Examples</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {dataset.profiles.map((profile) => {
              const valueGroups = formatValueGroups(profile);
              const numericFlags = formatNumericFlags(profile);

              return (
                <tr key={profile.name} id={`column-profile-${encodeURIComponent(profile.name)}`}>
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
                      {TYPE_OPTIONS.map((type) => (
                        <option key={type} value={type}>
                          {typeUiLabel(type)}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>{profile.missing}</td>
                  <td>{profile.unique}</td>
                  <td>{profile.examples.join(', ')}</td>
                  <td>
                    {valueGroups && (
                      <span className="profile-note">
                        Possible duplicate categories: {valueGroups.join('; ')}
                      </span>
                    )}
                    {numericFlags && <span className="profile-note">{numericFlags}</span>}
                    {!valueGroups && !numericFlags && profile.unparsed?.length ? (
                      <span className="profile-note">
                        Unparsed sample: {profile.unparsed.slice(0, 2).join(', ')}
                      </span>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </details>
  );
}
