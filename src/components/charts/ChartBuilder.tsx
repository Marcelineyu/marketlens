import { useMemo, useState } from 'react';
import ChartCard from '../ChartCard';
import {
  builderUsesAggregation,
  builderUsesY,
  chartBuilderError,
  validBuilderX,
} from '../../analytics/chartValidation';
import { Aggregation, ChartSpec, Dataset, Row } from '../../types';
import { builderDefaults } from '../../utils/chartBuilderDefaults';

interface ChartBuilderProps {
  dataset: Dataset;
  rows: Row[];
  onAdd: (spec: ChartSpec) => void;
}

export default function ChartBuilder({ dataset, rows, onAdd }: ChartBuilderProps) {
  const defaults = useMemo(() => builderDefaults(dataset.profiles), []);

  const [kind, setKind] = useState<ChartSpec['kind']>(defaults.kind);
  const [x, setX] = useState(defaults.x);
  const [y, setY] = useState(defaults.y);
  const [agg, setAgg] = useState<Aggregation>(defaults.agg);
  const [interacted, setInteracted] = useState(false);
  const [preview, setPreview] = useState<ChartSpec | null>(null);

  const xProfile = dataset.profiles.find((profile) => profile.name === x);
  const yProfile = dataset.profiles.find((profile) => profile.name === y);
  const usesY = builderUsesY(kind);
  const usesAggregation = builderUsesAggregation(kind);
  const invalid = chartBuilderError(kind, xProfile, usesY ? yProfile : undefined);

  const changeKind = (next: ChartSpec['kind']) => {
    const currentX = dataset.profiles.find((profile) => profile.name === x);
    const suggestedX =
      currentX && validBuilderX(next, currentX)
        ? currentX
        : dataset.profiles.find((profile) => validBuilderX(next, profile));
    const nextX = suggestedX?.name || x;

    setKind(next);
    setInteracted(true);

    if (suggestedX && suggestedX.name !== x) {
      setX(suggestedX.name);
    }

    if (next === 'line' || next === 'scatter') {
      const currentY = dataset.profiles.find((profile) => profile.name === y);
      if (currentY?.type !== 'numeric' || currentY.name === nextX) {
        setY(
          dataset.profiles.find((profile) => profile.type === 'numeric' && profile.name !== nextX)
            ?.name || '',
        );
      }
    }

    if (next === 'line' && (agg === 'count' || agg === 'percentage')) {
      const numeric = dataset.profiles.find(
        (profile) => profile.type === 'numeric' && profile.name !== nextX,
      );
      const name = numeric?.name || '';
      setAgg(/(age|rate|ratio|percent|score|average|avg|price|balance)/i.test(name) ? 'average' : 'sum');
    }
  };

  const aggregationOptions: Aggregation[] =
    kind === 'line'
      ? ['sum', 'average', 'median', 'minimum', 'maximum']
      : ['count', 'sum', 'average', 'median', 'minimum', 'maximum'];

  const buildSpec = (): ChartSpec => ({
    id: `custom-${Date.now()}`,
    title:
      kind === 'scatter'
        ? `${x} vs ${y}`
        : `${agg === 'count' ? 'Records' : y} by ${x}`,
    subtitle: `Custom ${kind} chart`,
    kind,
    x,
    y: usesY && y ? y : undefined,
    aggregation: usesAggregation ? agg : undefined,
  });

  const apply = () => {
    setInteracted(true);
    if (!invalid) {
      setPreview(buildSpec());
    }
  };

  return (
    <section className="builder">
      <div className="section-title">
        <div>
          <div className="eyebrow">Shape the story</div>
          <h2>Build your own chart</h2>
        </div>
        <p>
          Choose fields and an aggregation. MarketLens will validate the combination before it
          renders.
        </p>
      </div>
      <div className="builder-grid">
        <label>
          Chart type
          <select value={kind} onChange={(event) => changeKind(event.target.value as ChartSpec['kind'])}>
            {(['bar', 'horizontal', 'line', 'donut', 'scatter', 'histogram'] as const).map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </label>
        <label>
          X-axis
          <select
            value={x}
            onChange={(event) => {
              setX(event.target.value);
              setInteracted(true);
            }}
          >
            {dataset.profiles
              .filter((profile) => profile.type !== 'text')
              .map((profile) => (
                <option
                  key={profile.name}
                  disabled={!validBuilderX(kind, profile) || (usesY && profile.name === y)}
                >
                  {profile.name}
                </option>
              ))}
          </select>
        </label>
        {usesY && (
          <label>
            Y-axis
            <select
              value={y}
              onChange={(event) => {
                setY(event.target.value);
                if (!event.target.value) {
                  setAgg('count');
                }
                setInteracted(true);
              }}
            >
              <option value="" disabled={kind === 'line' || kind === 'scatter'}>
                None
              </option>
              {dataset.profiles
                .filter((profile) => profile.type === 'numeric')
                .map((profile) => (
                  <option key={profile.name} disabled={profile.name === x}>
                    {profile.name}
                  </option>
                ))}
            </select>
          </label>
        )}
        {usesAggregation && (
          <label>
            Aggregation
            <select
              value={agg}
              onChange={(event) => {
                setAgg(event.target.value as Aggregation);
                setInteracted(true);
              }}
            >
              {aggregationOptions.map((option) => (
                <option key={option} disabled={!y && option !== 'count'}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        )}
        <button
          className="primary"
          disabled={!!invalid}
          aria-describedby={invalid && interacted ? 'builder-validation' : undefined}
          onClick={apply}
        >
          Apply
        </button>
      </div>
      {invalid && interacted && (
        <p id="builder-validation" role="alert" className="validation">
          {invalid}
        </p>
      )}
      {preview && (
        <div className="builder-preview">
          <ChartCard rows={rows} spec={preview} />
          <button className="secondary" onClick={() => onAdd(preview)}>
            + Add to dashboard
          </button>
        </div>
      )}
    </section>
  );
}
