import { ColumnProfile } from '../types';

function multiVariantGroups(profile: ColumnProfile | undefined) {
  return profile?.valueGroups?.filter((group) => group.variants.length > 1) ?? [];
}

export function duplicateValuesChartNote(profile: ColumnProfile | undefined): string {
  const groups = multiVariantGroups(profile);
  if (!groups.length) return '';

  if (groups.length === 1) {
    const variants = groups[0].variants.map((variant) => variant.value).join(' / ');
    return ` · ${variants} may be the same value`;
  }

  return ` · ${groups.length} groups of values may be duplicates`;
}

export function valueGroupVariantLabel(group: {
  variants: Array<{ value: string }>;
}): string {
  return group.variants.map((variant) => variant.value).join(' / ');
}
