import { buildDatasetProfile } from './datasetProfile';
import { Dataset, Row } from '../types';

export function makeDataset(name: string, rows: Row[]): Dataset {
  const { profiles, profile } = buildDatasetProfile(rows);
  return {
    name,
    rows,
    originalRows: rows,
    profiles,
    profile,
  };
}
