import { useState } from 'react';
import { Dataset } from '../types';
import { makeDataset } from '../utils/dataset';
import {
  ROW_SAMPLE_LIMIT,
  ROW_WARNING_THRESHOLD,
  assertUploadableFile,
  estimateRowCount,
  parseFile,
} from '../utils/fileParsing';

interface PendingLargeFile {
  file: File;
  estimatedRows: number;
}

export function useDatasetFileLoader(onLoad: (dataset: Dataset) => void) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pendingLargeFile, setPendingLargeFile] = useState<PendingLargeFile | null>(null);

  const finishLoad = async (file: File, maxRows?: number) => {
    setLoading(true);
    setError('');
    setPendingLargeFile(null);

    try {
      onLoad(makeDataset(file.name, await parseFile(file, { maxRows })));
    } catch (caught) {
      setError((caught as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const loadFile = async (file?: File) => {
    if (!file) {
      return;
    }

    setError('');
    setPendingLargeFile(null);

    try {
      assertUploadableFile(file);
    } catch (caught) {
      setError((caught as Error).message);
      return;
    }

    setLoading(true);

    try {
      const estimatedRows = await estimateRowCount(file);
      if (estimatedRows > ROW_WARNING_THRESHOLD) {
        setPendingLargeFile({ file, estimatedRows });
        setLoading(false);
        return;
      }

      await finishLoad(file);
    } catch (caught) {
      setError((caught as Error).message);
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    pendingLargeFile,
    loadFile,
    analyzeAll: () => pendingLargeFile && finishLoad(pendingLargeFile.file),
    analyzeSample: () =>
      pendingLargeFile && finishLoad(pendingLargeFile.file, ROW_SAMPLE_LIMIT),
  };
}
