import { findDuplicateRows } from '../lib/profiling.js';
import { CleaningStep, Dataset, Row, ValueGroup } from '../types';
import { refreshDatasetRows } from './dataset';

function stepId(): string {
  return `step-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function removeDuplicateRows(rows: Row[]): { rows: Row[]; removed: number } {
  const beforeCount = rows.length;
  const deduped = Array.from(new Map(rows.map((row) => [JSON.stringify(row), row])).values());
  return { rows: deduped, removed: beforeCount - deduped.length };
}

export function mergeValueGroup(
  rows: Row[],
  columnName: string,
  group: ValueGroup,
): { rows: Row[]; merged: number } {
  const canonical = group.variants[0]?.value;
  if (!canonical) return { rows, merged: 0 };

  const variants = new Set(group.variants.map((variant) => variant.value));
  let merged = 0;
  const nextRows = rows.map((row) => {
    const value = row[columnName];
    if (typeof value !== 'string' || !variants.has(value) || value === canonical) {
      return row;
    }
    merged += 1;
    return { ...row, [columnName]: canonical };
  });

  return { rows: nextRows, merged };
}

export function mergeAllValueGroups(
  rows: Row[],
  columnName: string,
  groups: ValueGroup[],
): { rows: Row[]; merged: number } {
  let nextRows = rows;
  let merged = 0;
  for (const group of groups) {
    const result = mergeValueGroup(nextRows, columnName, group);
    nextRows = result.rows;
    merged += result.merged;
  }
  return { rows: nextRows, merged };
}

export function appendCleaningStep(
  dataset: Dataset,
  rowsAfter: Row[],
  step: Omit<CleaningStep, 'id' | 'rowsBefore' | 'rowsAfter'>,
  cleaningMessage?: string,
): Dataset {
  const nextStep: CleaningStep = {
    ...step,
    id: stepId(),
    rowsBefore: dataset.rows,
    rowsAfter,
  };

  return refreshDatasetRows(
    {
      ...dataset,
      cleaningSteps: [...(dataset.cleaningSteps ?? []), nextStep],
    },
    rowsAfter,
    cleaningMessage,
  );
}

export function undoCleaningStep(dataset: Dataset, stepIdToUndo: string): Dataset {
  const steps = dataset.cleaningSteps ?? [];
  const index = steps.findIndex((step) => step.id === stepIdToUndo);
  if (index < 0) return dataset;

  const target = steps[index];
  const remainingSteps = steps.slice(0, index);
  const restored = refreshDatasetRows(
    {
      ...dataset,
      cleaningSteps: remainingSteps,
      cleaningMessage:
        remainingSteps.length > 0
          ? `${remainingSteps.length} cleaning step${remainingSteps.length === 1 ? '' : 's'} remain after undo.`
          : undefined,
    },
    target.rowsBefore,
  );

  return restored;
}

export function undoAllCleaningSteps(dataset: Dataset): Dataset {
  return refreshDatasetRows(
    {
      ...dataset,
      cleaningSteps: [],
      cleaningMessage: undefined,
    },
    dataset.originalRows,
  );
}

export function duplicateRowPreview(rows: Row[], columns: string[]) {
  return findDuplicateRows(rows, columns);
}
