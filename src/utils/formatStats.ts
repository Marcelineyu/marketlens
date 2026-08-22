export function formatStat(value: number): string {
  return value.toLocaleString(undefined, { maximumFractionDigits: 1 });
}
