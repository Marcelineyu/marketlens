import { useMemo, useState } from 'react';
import { Dataset } from '../../types';
import { formatAnalysisScope } from '../../utils/analysisScope';
import {
  appendCleaningStep,
  duplicateRowPreview,
  mergeAllValueGroups,
  removeDuplicateRows,
} from '../../utils/cleaningActions';
import { buildDataHealthChecklist, ChecklistItem } from '../../utils/dataHealthChecklist';

interface DataHealthChecklistProps {
  dataset: Dataset;
  ignoredItemIds: ReadonlySet<string>;
  onDatasetChange: (dataset: Dataset) => void;
  onIgnoreItem: (itemId: string) => void;
}

function ChecklistRow({
  item,
  onAction,
}: {
  item: ChecklistItem;
  onAction: (item: ChecklistItem, action: ChecklistItem['actions'][number]) => void;
}) {
  const moreCount = item.moreGroupsText
    ? item.moreGroupsText.split('; ').filter(Boolean).length
    : 0;

  return (
    <article className="health-item">
      <div className="health-copy">
        <p>{item.headline}</p>
        {item.moreGroupsText && moreCount > 0 && (
          <details className="health-more">
            <summary>and {moreCount} more</summary>
            <p>{item.moreGroupsText}</p>
          </details>
        )}
      </div>
      <details className="health-why">
        <summary>Why does this matter?</summary>
        <p>{item.why}</p>
      </details>
      <div className="health-actions">
        {item.actions.includes('remove-and-log') && (
          <button type="button" onClick={() => onAction(item, 'remove-and-log')}>
            Remove and log
          </button>
        )}
        {item.actions.includes('merge') && (
          <button type="button" onClick={() => onAction(item, 'merge')}>
            Merge
          </button>
        )}
        {item.actions.includes('view') && (
          <button type="button" onClick={() => onAction(item, 'view')}>
            {item.id === 'duplicates' ? 'View rows' : 'View'}
          </button>
        )}
        {item.actions.includes('ignore') && (
          <button type="button" className="health-ignore" onClick={() => onAction(item, 'ignore')}>
            Ignore
          </button>
        )}
      </div>
    </article>
  );
}

export default function DataHealthChecklist({
  dataset,
  ignoredItemIds,
  onDatasetChange,
  onIgnoreItem,
}: DataHealthChecklistProps) {
  const [duplicatePreview, setDuplicatePreview] = useState<number[][] | null>(null);
  const scopeLabel = formatAnalysisScope(dataset.rows.length, dataset, false);
  const items = useMemo(
    () =>
      buildDataHealthChecklist(dataset.profile, dataset.profiles, scopeLabel).filter(
        (item) => !ignoredItemIds.has(item.id),
      ),
    [dataset.profile, dataset.profiles, ignoredItemIds, scopeLabel],
  );

  const columns = dataset.profiles.map((profile) => profile.name);

  const handleAction = (item: ChecklistItem, action: ChecklistItem['actions'][number]) => {
    if (action === 'ignore') {
      onIgnoreItem(item.id);
      return;
    }

    if (action === 'view') {
      if (item.id === 'duplicates') {
        setDuplicatePreview(duplicateRowPreview(dataset.rows, columns).groups);
        return;
      }
      if (item.viewTarget) {
        window.location.hash = item.viewTarget;
        document.getElementById(item.viewTarget.replace(/^#/, ''))?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }
      return;
    }

    if (action === 'remove-and-log') {
      const { rows, removed } = removeDuplicateRows(dataset.rows);
      const nextScope = formatAnalysisScope(rows.length, dataset, false);
      onDatasetChange(
        appendCleaningStep(
          dataset,
          rows,
          {
            type: 'remove-duplicates',
            summary: removed > 0 ? `Removed ${removed} duplicate row(s).` : 'No duplicate rows removed.',
            detail:
              removed > 0
                ? `Removed ${removed} duplicate row(s) from ${dataset.rows.length} loaded rows (${nextScope}).`
                : 'No duplicate rows were found to remove.',
            affectedCount: removed,
          },
          removed > 0 ? `Removed ${removed} duplicate row(s).` : 'No duplicate rows were removed.',
        ),
      );
      setDuplicatePreview(null);
      return;
    }

    if (action === 'merge' && item.columnName && item.valueGroups?.length) {
      const { rows, merged } = mergeAllValueGroups(dataset.rows, item.columnName, item.valueGroups);
      onDatasetChange(
        appendCleaningStep(
          dataset,
          rows,
          {
            type: 'merge-values',
            summary: `Merged ${merged} value${merged === 1 ? '' : 's'} in ${item.columnName}.`,
            detail: `Standardized ${merged} spelling variant${merged === 1 ? '' : 's'} in ${item.columnName} using case and whitespace grouping only.`,
            affectedCount: merged,
            columnName: item.columnName,
          },
          merged > 0
            ? `Merged ${merged} spelling variant${merged === 1 ? '' : 's'} in ${item.columnName}.`
            : undefined,
        ),
      );
    }
  };

  if (!items.length) {
    return (
      <section className="health-checklist">
        <div className="health-header">
          <b>Data health checklist</b>
          <span>All current issues are ignored or resolved ({scopeLabel}).</span>
        </div>
      </section>
    );
  }

  return (
    <section className="health-checklist">
      <div className="health-header">
        <b>Data health checklist</b>
        <span>Review issues before trusting charts and summaries ({scopeLabel}).</span>
      </div>
      <div className="health-items">
        {items.map((item) => (
          <ChecklistRow key={item.id} item={item} onAction={handleAction} />
        ))}
      </div>
      {duplicatePreview && (
        <div className="health-preview" role="region" aria-label="Duplicate rows preview">
          <div className="health-preview-head">
            <b>Duplicate row groups</b>
            <button type="button" onClick={() => setDuplicatePreview(null)}>
              Close
            </button>
          </div>
          <ul>
            {duplicatePreview.slice(0, 8).map((group, index) => (
              <li key={group.join('-')}>
                Group {index + 1}: rows {group.map((rowIndex) => rowIndex + 1).join(', ')} (
                {group.length} records)
              </li>
            ))}
          </ul>
          {duplicatePreview.length > 8 && (
            <p>{duplicatePreview.length - 8} more duplicate groups not shown.</p>
          )}
        </div>
      )}
    </section>
  );
}
