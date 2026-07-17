import { ColumnProfile, Row } from '../../types';
import { insights } from '../../analytics/insights';

interface ObservationsProps {
  rows: Row[];
  profiles: ColumnProfile[];
}

export default function Observations({ rows, profiles }: ObservationsProps) {
  const observations = insights(rows, profiles);

  return (
    <section className="observations">
      <div className="eyebrow">Evidence, carefully stated</div>
      <h2>Key observations</h2>
      <div>
        {observations.map((text, index) => (
          <article key={text}>
            <span>0{index + 1}</span>
            <p>{text}</p>
          </article>
        ))}
      </div>
      <small>
        These are descriptive associations from the filtered dataset. They do not establish
        causation.
      </small>
    </section>
  );
}
