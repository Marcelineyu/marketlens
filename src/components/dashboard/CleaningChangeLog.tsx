import { useState } from 'react';
import { Dataset } from '../../types';
import { undoAllCleaningSteps, undoCleaningStep } from '../../utils/cleaningActions';

interface CleaningChangeLogProps {
  dataset: Dataset;
  onDatasetChange: (dataset: Dataset) => void;
}

export default function CleaningChangeLog({ dataset, onDatasetChange }: CleaningChangeLogProps) {
  const [open, setOpen] = useState(false);
  const steps = dataset.cleaningSteps ?? [];

  if (!steps.length) {
    return null;
  }

  const stepLabel = `${steps.length} cleaning step${steps.length === 1 ? '' : 's'} applied`;

  return (
    <div className="cleaning-log-bar" role="status">
      <span>
        {stepLabel} ·{' '}
        <button type="button" className="link-button" onClick={() => setOpen((value) => !value)}>
          View
        </button>{' '}
        ·{' '}
        <button
          type="button"
          className="link-button"
          onClick={() => onDatasetChange(undoAllCleaningSteps(dataset))}
        >
          Undo all
        </button>
      </span>
      {open && (
        <div className="cleaning-log-panel">
          <b>Change log</b>
          <ul>
            {steps.map((step) => (
              <li key={step.id}>
                <div>
                  <strong>{step.summary}</strong>
                  <span>{step.detail}</span>
                </div>
                <button type="button" onClick={() => onDatasetChange(undoCleaningStep(dataset, step.id))}>
                  Undo
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function cleaningLogBarText(dataset: Dataset): string | null {
  const steps = dataset.cleaningSteps ?? [];
  if (!steps.length) return null;
  return `${steps.length} cleaning step${steps.length === 1 ? '' : 's'} applied · View · Undo all`;
}
