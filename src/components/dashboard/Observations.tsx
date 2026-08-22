import { ColumnProfile, Row } from '../../types';
import { insights } from '../../analytics/insights';

interface ObservationsProps {
  rows: Row[];
  profiles: ColumnProfile[];
  scopeLabel: string;
}

function withScope(text: string, scopeLabel: string): string {
  if (text.startsWith('No observations are available')) {
    return `${text.slice(0, -1)} (${scopeLabel}).`;
  }
  if (text.endsWith('.')) {
    return `${text.slice(0, -1)} (${scopeLabel}).`;
  }
  return `${text} (${scopeLabel})`;
}

export default function Observations({ rows, profiles, scopeLabel }: ObservationsProps) {
  const observations = insights(rows, profiles);

  return (
    <section className="observations">
      <div className="eyebrow">Evidence, carefully stated</div>
      <h2>Key observations</h2>
      <div>
        {observations.map((text, index) => (
          <article key={text}>
            <span>0{index + 1}</span>
            <p>{withScope(text, scopeLabel)}</p>
          </article>
        ))}
      </div>
      <small>
        These are descriptive associations from the current row set. They do not establish
        causation.
      </small>
    </section>
  );
}
