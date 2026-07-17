import { profileRows } from '../analytics/typeDetection';
import { Dataset, Row } from '../types';

export function makeDataset(name: string, rows: Row[]): Dataset {
  return {
    name,
    rows,
    originalRows: rows,
    profiles: profileRows(rows),
  };
}
