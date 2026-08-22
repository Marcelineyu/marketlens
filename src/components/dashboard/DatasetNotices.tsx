import { Dataset } from '../../types';
import { buildDatasetNotices } from '../../utils/datasetNotices';

interface DatasetNoticesProps {
  dataset: Dataset;
}

export default function DatasetNotices({ dataset }: DatasetNoticesProps) {
  const notices = buildDatasetNotices(dataset.profile, dataset.profiles);
  if (!notices.length) return null;

  return (
    <section className="dataset-notices" aria-label="Dataset notices">
      {notices.map((notice) => (
        <p key={notice.id} role="note">
          {notice.message}
        </p>
      ))}
    </section>
  );
}
