import { ChangeEvent, DragEvent, useState } from 'react';
import { bankSample, campaignSample, ecommerceSample } from '../../data/samples';
import { Dataset, Row } from '../../types';
import { parseFile } from '../../utils/fileParsing';
import { makeDataset } from '../../utils/dataset';
import AppHeader from '../layout/AppHeader';
import { ArrowIcon, UploadIcon } from '../icons/Icons';

interface UploadScreenProps {
  onLoad: (dataset: Dataset) => void;
}

const SAMPLE_DATASETS: ReadonlyArray<[string, Row[]]> = [
  ['Campaign Dataset', campaignSample],
  ['Ecommerce Dataset', ecommerceSample],
  ['Bank Marketing Dataset', bankSample],
];

export default function UploadScreen({ onLoad }: UploadScreenProps) {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const loadFile = async (file?: File) => {
    if (!file) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      onLoad(makeDataset(file.name, await parseFile(file)));
    } catch (caught) {
      setError((caught as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="start">
      <AppHeader />
      <section className="hero">
        <div className="eyebrow">Private, browser-based analysis</div>
        <h1>
          Turn your data into
          <br />
          <em>clear, beautiful insights</em>
        </h1>
        <p>
          Upload a CSV to automatically explore trends, relationships, distributions, and patterns
          directly in your browser.
        </p>
      </section>
      <label
        className={`drop ${loading ? 'loading' : ''}`}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event: DragEvent) => {
          event.preventDefault();
          loadFile(event.dataTransfer.files[0]);
        }}
      >
        <input
          aria-label="Upload CSV or Excel"
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={(event: ChangeEvent<HTMLInputElement>) => loadFile(event.target.files?.[0])}
        />
        <div className="upload-icon">
          <UploadIcon />
        </div>
        <strong aria-live="polite">
          {loading ? 'Reading your data…' : 'Drop a CSV or Excel file here'}
        </strong>
        <span>or click to browse · up to 10 MB</span>
      </label>
      {error && (
        <div role="alert" className="error">
          {error}
        </div>
      )}
      <div className="samples">
        <span>Or start with a sample</span>
        <div>
          {SAMPLE_DATASETS.map(([name, rows]) => (
            <button key={name} onClick={() => onLoad(makeDataset(name, rows))}>
              {name}
              <ArrowIcon />
            </button>
          ))}
        </div>
      </div>
      <p className="privacy">
        <span aria-hidden="true">●</span> Your data stays in this browser and is never uploaded.
      </p>
      <div className="analysis-preview" aria-hidden="true">
        <div>
          <span>Dataset overview</span>
          <b>Profile every field</b>
        </div>
        <div>
          <span>Automatic exploration</span>
          <b>Reveal useful patterns</b>
        </div>
        <div>
          <span>Evidence</span>
          <b>Stay statistically honest</b>
        </div>
      </div>
    </main>
  );
}
