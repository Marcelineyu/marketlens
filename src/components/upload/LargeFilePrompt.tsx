import { ROW_SAMPLE_LIMIT } from '../../utils/fileParsing';
import { formatNumber } from '../../utils/format';

interface LargeFilePromptProps {
  estimatedRows: number;
  loading?: boolean;
  onAnalyzeAll: () => void;
  onAnalyzeSample: () => void;
}

export default function LargeFilePrompt({
  estimatedRows,
  loading = false,
  onAnalyzeAll,
  onAnalyzeSample,
}: LargeFilePromptProps) {
  return (
    <section className="large-file-prompt" role="alertdialog" aria-labelledby="large-file-title">
      <p id="large-file-title">
        This file has ~{formatNumber(estimatedRows)} rows. MarketLens profiles the full file in your
        browser, which may take a while.
      </p>
      <div className="large-file-actions">
        <button type="button" onClick={onAnalyzeAll} disabled={loading}>
          Analyze anyway
        </button>
        <button type="button" className="ghost" onClick={onAnalyzeSample} disabled={loading}>
          Analyze the first {formatNumber(ROW_SAMPLE_LIMIT)} rows
        </button>
      </div>
    </section>
  );
}
