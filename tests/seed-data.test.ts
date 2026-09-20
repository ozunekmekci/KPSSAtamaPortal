import { describe, it, expect } from 'vitest';
import { PLACEMENT_RECORDS } from '@/data/records';

describe('Seed Placement Records Dataset Integrity', () => {
  it('contains comprehensive records across all periods and levels', () => {
    expect(PLACEMENT_RECORDS.length).toBe(1783);

    const periods = new Set(PLACEMENT_RECORDS.map((r) => r.donem));
    expect(periods.has('2024/1')).toBe(true);
    expect(periods.has('2024/2')).toBe(true);

    const levels = new Set(PLACEMENT_RECORDS.map((r) => r.ogrenimDuzeyi));
    expect(levels.has('lisans')).toBe(true);
    expect(levels.has('onlisans')).toBe(true);
    expect(levels.has('ortaogretim')).toBe(true);
  });

  it('guarantees unique deterministic IDs for every record', () => {
    const idSet = new Set<string>();
    for (const r of PLACEMENT_RECORDS) {
      expect(idSet.has(r.id)).toBe(false);
      idSet.add(r.id);
      expect(r.id).toBe(`${r.donem}-${r.ogrenimDuzeyi}-${r.kadroKodu}`);
    }
  });

  it('satisfies mathematical constraints on quota and scores', () => {
    for (const r of PLACEMENT_RECORDS) {
      expect(r.kontenjan).toBeGreaterThanOrEqual(1);
      expect(r.yerlesen).toBeGreaterThanOrEqual(0);
      expect(r.yerlesen).toBeLessThanOrEqual(r.kontenjan);
      expect(r.bosKalan).toBe(r.kontenjan - r.yerlesen);

      if (r.yerlesen === 0) {
        expect(r.tabanPuan).toBeNull();
        expect(r.tavanPuan).toBeNull();
      } else {
        expect(typeof r.tabanPuan).toBe('number');
        expect(r.tabanPuan).toBeGreaterThanOrEqual(50.0);
        expect(r.tabanPuan).toBeLessThanOrEqual(100.0);

        expect(typeof r.tavanPuan).toBe('number');
        expect(r.tavanPuan!).toBeGreaterThanOrEqual(r.tabanPuan!);
      }
    }
  });

  it('validates 4-digit format and correct partitioning of qualification codes', () => {
    for (const r of PLACEMENT_RECORDS) {
      expect(r.nitelikKodlari.length).toBeGreaterThan(0);
      for (const code of r.nitelikKodlari) {
        expect(code).toMatch(/^\d{4}$/);
      }
      expect(r.mezuniyetKodlari.length + r.ozelSartlar.length).toBe(r.nitelikKodlari.length);
    }
  });
});
