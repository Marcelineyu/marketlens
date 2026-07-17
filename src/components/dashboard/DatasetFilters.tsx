import { Dataset, FilterState } from '../../types';
import { categoryFilterValue, MISSING_FILTER_VALUE } from '../../analytics/filters';

interface DatasetFiltersProps {
  dataset: Dataset;
  value: FilterState;
  onChange: (value: FilterState) => void;
}

export default function DatasetFilters({ dataset, value, onChange }: DatasetFiltersProps) {
  const suitable = dataset.profiles
    .filter((profile) => (profile.type === 'categorical' || profile.type === 'binary') && profile.unique <= 15)
    .slice(0, 3);

  const activeCount = Object.keys(value).length;

  const updateCategoryFilter = (column: string, selected: string) => {
    const next = { ...value };
    if (selected) {
      next[column] = { kind: 'category', values: [selected] };
    } else {
      delete next[column];
    }
    onChange(next);
  };

  return (
    <section className="filterbar">
      <div>
        <strong>Filter this view</strong>
        <span>{activeCount ? `${activeCount} active` : 'All records'}</span>
      </div>
      {suitable.map((profile) => {
        const filter = value[profile.name];
        const selected =
          filter?.kind === 'category' ? filter.values[0] || '' : '';

        return (
          <label key={profile.name}>
            {profile.name}
            <select
              value={selected}
              onChange={(event) => updateCategoryFilter(profile.name, event.target.value)}
            >
              <option value="">All</option>
              {Array.from(new Set(profile.values.map(categoryFilterValue)))
                .sort()
                .map((option) => (
                  <option key={option} value={option}>
                    {option === MISSING_FILTER_VALUE ? 'Missing' : option}
                  </option>
                ))}
            </select>
          </label>
        );
      })}
      <button className="ghost" onClick={() => onChange({})} disabled={!activeCount}>
        Reset filters
      </button>
    </section>
  );
}
