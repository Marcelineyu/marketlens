import { useEffect, useState } from 'react';
import { UploadIcon } from '../icons/Icons';

interface AppHeaderProps {
  onReset?: () => void;
  dataset?: string;
}

export default function AppHeader({ onReset, dataset }: AppHeaderProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 16);
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);

  return (
    <header className={`app-header ${scrolled ? 'scrolled' : ''}`}>
      <div className="header-inner">
        <div className="brand-block">
          <button className="brand" onClick={onReset} aria-label="MarketLens home">
            <span>ML</span>
            <b>MarketLens</b>
          </button>
          <p className="brand-tagline">Turn a messy spreadsheet into conclusions you can trust.</p>
          <p className="brand-privacy">Your file never leaves your browser.</p>
        </div>
        {dataset && (
          <div className="dataset-status">
            <span>Current dataset</span>
            <strong title={dataset}>{dataset}</strong>
          </div>
        )}
        {onReset && (
          <button className="new-dataset" onClick={onReset}>
            <UploadIcon />
            <span>Upload New Dataset</span>
          </button>
        )}
      </div>
    </header>
  );
}
