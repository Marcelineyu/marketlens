import { Aggregation, ChartSpec, ColumnProfile } from '../types';

export type BuilderSelection = {
  kind: ChartSpec['kind'];
  x: string;
  y: string;
  agg: Aggregation;
};

const numericAggregation = (name: string): Aggregation =>
  /(age|rate|ratio|percent|score|average|avg|price|balance)/i.test(name)
    ? 'average'
    : 'sum';

export function builderDefaults(profiles: ColumnProfile[]): BuilderSelection {
  const date = profiles.find((p) => p.type === 'date');
  const nums = profiles.filter((p) => p.type === 'numeric');

  if (date && nums[0]) {
    return {
      kind: 'line',
      x: date.name,
      y: nums[0].name,
      agg: numericAggregation(nums[0].name),
    };
  }

  if (nums.length > 1) {
    return {
      kind: 'scatter',
      x: nums[0].name,
      y: nums[1].name,
      agg: 'average',
    };
  }

  if (nums[0]) {
    return { kind: 'histogram', x: nums[0].name, y: '', agg: 'count' };
  }

  const donut = profiles.find(
    (p) => ['categorical', 'binary'].includes(p.type) && p.unique <= 15,
  );

  if (donut) {
    return { kind: 'donut', x: donut.name, y: '', agg: 'count' };
  }

  const x = profiles.find((p) => p.type !== 'text')?.name || profiles[0]?.name || '';
  return { kind: 'bar', x, y: '', agg: 'count' };
}
