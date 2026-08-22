import { ColumnType } from '../types';

export const TYPE_UI_LABELS: Record<ColumnType, string> = {
  numeric: 'Numbers',
  categorical: 'Categories',
  date: 'Dates',
  binary: 'Yes / No',
  identifier: 'IDs',
  empty: 'Empty',
  text: 'Text',
};

export const TYPE_TOOLTIPS: Record<ColumnType, string> = {
  numeric: 'Fields you can add up or average, like amounts and weights.',
  categorical: 'Labels that group records, like country, carrier, or status.',
  date: 'Calendar dates you can sort or plot over time.',
  binary: 'Fields with only two values, like yes/no or true/false.',
  identifier: 'Unique codes or IDs that label individual records.',
  empty: 'Columns with no usable values in this dataset.',
  text: 'Free-form text that does not fit the other field types.',
};

export function typeUiLabel(type: ColumnType): string {
  return TYPE_UI_LABELS[type];
}
