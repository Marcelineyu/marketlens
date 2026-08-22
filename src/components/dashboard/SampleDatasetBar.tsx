import { ChangeEvent, useRef } from 'react';
import { parseFile } from '../../utils/fileParsing';
import { makeDataset } from '../../utils/dataset';
import { Dataset } from '../../types';
import { SAMPLE_DATASET_NAME } from '../../utils/sampleDataset';

interface SampleDatasetBarProps {
  onUpload: (dataset: Dataset) => void;
  onDismiss: () => void;
}

export default function SampleDatasetBar({ onUpload, onDismiss }: SampleDatasetBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const loadFile = async (file?: File) => {
    if (!file) return;
    try {
      onUpload(makeDataset(file.name, await parseFile(file)));
    } catch (error) {
      window.alert((error as Error).message);
    }
  };

  return (
    <div className="sample-bar" role="status">
      <p>
        Viewing a sample dataset — 486 cross-border orders. Upload your own file to replace it.
      </p>
      <div className="sample-bar-actions">
        <button type="button" onClick={() => inputRef.current?.click()}>
          Upload your file
        </button>
        <button type="button" className="sample-bar-dismiss" onClick={onDismiss} aria-label="Dismiss sample notice">
          Dismiss
        </button>
      </div>
      <input
        ref={inputRef}
        aria-label="Replace sample dataset"
        type="file"
        accept=".csv,.xlsx,.xls"
        hidden
        onChange={(event: ChangeEvent<HTMLInputElement>) => {
          loadFile(event.target.files?.[0]);
          event.target.value = '';
        }}
      />
      <span className="visually-hidden">Currently showing {SAMPLE_DATASET_NAME}</span>
    </div>
  );
}
