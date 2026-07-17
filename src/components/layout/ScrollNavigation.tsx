import { useEffect, useState } from 'react';
import { ChevronIcon } from '../icons/Icons';

export default function ScrollNavigation() {
  const [position, setPosition] = useState({ top: true, bottom: false });

  useEffect(() => {
    const update = () =>
      setPosition({
        top: window.scrollY < 24,
        bottom: window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 24,
      });

    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  return (
    <nav className="scroll-nav" aria-label="Page navigation">
      <button
        aria-label="Back to top"
        title="Back to top"
        disabled={position.top}
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      >
        <ChevronIcon />
      </button>
      <button
        aria-label="Jump to bottom"
        title="Jump to bottom"
        disabled={position.bottom}
        onClick={() =>
          window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' })
        }
      >
        <ChevronIcon down />
      </button>
    </nav>
  );
}
