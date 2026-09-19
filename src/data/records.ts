import { PlacementRecord } from '@/types/kpss';
import rawRecords from './kpss_records.json';

export const PLACEMENT_RECORDS: PlacementRecord[] = rawRecords as PlacementRecord[];

export function getRecordById(id: string): PlacementRecord | undefined {
  return PLACEMENT_RECORDS.find((r) => r.id === id);
}

export function getRecordsByPeriod(period: string): PlacementRecord[] {
  return PLACEMENT_RECORDS.filter((r) => r.donem === period);
}

export function getRecordsByLevel(level: string): PlacementRecord[] {
  return PLACEMENT_RECORDS.filter((r) => r.ogrenimDuzeyi === level);
}
