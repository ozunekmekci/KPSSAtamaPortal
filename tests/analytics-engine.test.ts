import { describe, it, expect } from 'vitest';
import {
  computePeriodTrends,
  computeExtremesSummary,
  computeQuotaAnalysis,
  computeScoreDistribution,
  computeAnalytics,
} from '@/lib/analytics-engine';
import { PLACEMENT_RECORDS } from '@/data/records';
import { PlacementRecord } from '@/types/kpss';

describe('Analytics & Statistics Engine', () => {
  const sampleRecords: PlacementRecord[] = [
    {
      id: '2024/1-lisans-101',
      kadroKodu: '101',
      donem: '2024/1',
      ogrenimDuzeyi: 'lisans',
      puanTuru: 'P3',
      kurumAdi: 'DEVLET HAVA MEYDANLARI İŞLETMESİ GENEL MÜDÜRLÜĞÜ',
      kadroUnvani: 'BİLGİSAYAR MÜHENDİSİ',
      sehir: 'ANKARA',
      kontenjan: 10,
      yerlesen: 10,
      bosKalan: 0,
      tabanPuan: 90.0,
      tavanPuan: 95.0,
      nitelikKodlari: ['4531'],
      mezuniyetKodlari: ['4531'],
      ozelSartlar: [],
    },
    {
      id: '2024/1-lisans-102',
      kadroKodu: '102',
      donem: '2024/1',
      ogrenimDuzeyi: 'lisans',
      puanTuru: 'P3',
      kurumAdi: 'SOSYAL GÜVENLİK KURUMU BAŞKANLIĞI',
      kadroUnvani: 'MEMUR',
      sehir: 'İSTANBUL',
      kontenjan: 20,
      yerlesen: 15,
      bosKalan: 5,
      tabanPuan: 80.0,
      tavanPuan: 86.0,
      nitelikKodlari: ['4001'],
      mezuniyetKodlari: ['4001'],
      ozelSartlar: [],
    },
    {
      id: '2024/1-lisans-103',
      kadroKodu: '103',
      donem: '2024/1',
      ogrenimDuzeyi: 'lisans',
      puanTuru: 'P3',
      kurumAdi: 'DEVLET SU İŞLERİ GENEL MÜDÜRLÜĞÜ',
      kadroUnvani: 'MÜHENDİS',
      sehir: 'ANKARA',
      kontenjan: 5,
      yerlesen: 0,
      bosKalan: 5,
      tabanPuan: null, // Null score (no one placed)
      tavanPuan: null,
      nitelikKodlari: ['4611'],
      mezuniyetKodlari: ['4611'],
      ozelSartlar: [],
    },
    {
      id: '2024/2-onlisans-201',
      kadroKodu: '201',
      donem: '2024/2',
      ogrenimDuzeyi: 'onlisans',
      puanTuru: 'P93',
      kurumAdi: 'DEVLET SU İŞLERİ GENEL MÜDÜRLÜĞÜ',
      kadroUnvani: 'TEKNİKER',
      sehir: 'İZMİR',
      kontenjan: 15,
      yerlesen: 15,
      bosKalan: 0,
      tabanPuan: 72.5,
      tavanPuan: 78.0,
      nitelikKodlari: ['3249'],
      mezuniyetKodlari: ['3249'],
      ozelSartlar: [],
    },
    {
      id: '2025/1-ortaogretim-301',
      kadroKodu: '301',
      donem: '2025/1',
      ogrenimDuzeyi: 'ortaogretim',
      puanTuru: 'P94',
      kurumAdi: 'KARAYOLLARI GENEL MÜDÜRLÜĞÜ',
      kadroUnvani: 'TEKNİSYEN',
      sehir: 'KONYA',
      kontenjan: 10,
      yerlesen: 8,
      bosKalan: 2,
      tabanPuan: 68.0,
      tavanPuan: 74.0,
      nitelikKodlari: ['2001'],
      mezuniyetKodlari: ['2001'],
      ozelSartlar: [],
    },
  ];

  describe('1. Period Trends Aggregation (computePeriodTrends)', () => {
    it('computes min, max, avg, and median scores, excluding null scores', () => {
      const trends = computePeriodTrends(sampleRecords);
      expect(trends).toHaveLength(3);

      // Period 2024/1 has scores: 90.0, 80.0, and null
      const p1 = trends.find((t) => t.period === '2024/1')!;
      expect(p1).toBeDefined();
      expect(p1.minScore).toBe(80.0);
      expect(p1.maxScore).toBe(90.0);
      expect(p1.avgScore).toBe(85.0); // (90 + 80) / 2
      expect(p1.medianScore).toBe(85.0);
      expect(p1.recordCount).toBe(3);
    });

    it('accurately computes totalQuota, totalPlaced, totalVacant, and placedRatio', () => {
      const trends = computePeriodTrends(sampleRecords);
      const p1 = trends.find((t) => t.period === '2024/1')!;

      // 2024/1: 10 + 20 + 5 = 35 quota, 10 + 15 + 0 = 25 placed, 0 + 5 + 5 = 10 vacant
      expect(p1.totalQuota).toBe(35);
      expect(p1.totalPlaced).toBe(25);
      expect(p1.totalVacant).toBe(10);
      expect(p1.placedRatio).toBe(Number((25 / 35).toFixed(4)));

      const p2 = trends.find((t) => t.period === '2024/2')!;
      expect(p2.totalQuota).toBe(15);
      expect(p2.totalPlaced).toBe(15);
      expect(p2.totalVacant).toBe(0);
      expect(p2.placedRatio).toBe(1.0);
    });

    it('handles target periods with no matching records without NaN or errors', () => {
      const emptyPeriodTrends = computePeriodTrends([], ['2024/1', '2024/2']);
      expect(emptyPeriodTrends).toHaveLength(2);
      expect(emptyPeriodTrends[0].totalQuota).toBe(0);
      expect(emptyPeriodTrends[0].placedRatio).toBe(0);
      expect(emptyPeriodTrends[0].minScore).toBeNull();
      expect(emptyPeriodTrends[0].maxScore).toBeNull();
      expect(emptyPeriodTrends[0].avgScore).toBeNull();
      expect(Number.isNaN(emptyPeriodTrends[0].placedRatio)).toBe(false);
    });

    it('returns empty array when passed empty record list without targetPeriods', () => {
      expect(computePeriodTrends([])).toEqual([]);
    });
  });

  describe('2. Extremes Summary (computeExtremesSummary)', () => {
    it('computes lowest closing positions correctly, excluding null scores', () => {
      const extremes = computeExtremesSummary(sampleRecords, 2);
      expect(extremes.lowestClosingPositions).toHaveLength(2);

      // Expected lowest scores: 68.0 (301), then 72.5 (201)
      expect(extremes.lowestClosingPositions[0].kadroKodu).toBe('301');
      expect(extremes.lowestClosingPositions[0].tabanPuan).toBe(68.0);
      expect(extremes.lowestClosingPositions[1].kadroKodu).toBe('201');
      expect(extremes.lowestClosingPositions[1].tabanPuan).toBe(72.5);
    });

    it('computes highest closing positions correctly', () => {
      const extremes = computeExtremesSummary(sampleRecords, 2);
      expect(extremes.highestClosingPositions).toHaveLength(2);

      // Expected highest scores: 90.0 (101), then 80.0 (102)
      expect(extremes.highestClosingPositions[0].kadroKodu).toBe('101');
      expect(extremes.highestClosingPositions[0].tabanPuan).toBe(90.0);
      expect(extremes.highestClosingPositions[1].kadroKodu).toBe('102');
      expect(extremes.highestClosingPositions[1].tabanPuan).toBe(80.0);
    });

    it('excludes null score records from both extremes', () => {
      const extremes = computeExtremesSummary(sampleRecords, 10);
      const allExtremes = [
        ...extremes.lowestClosingPositions,
        ...extremes.highestClosingPositions,
      ];
      expect(allExtremes.every((r) => r.tabanPuan !== null)).toBe(true);
      expect(allExtremes.some((r) => r.kadroKodu === '103')).toBe(false);
    });

    it('handles empty input and all-null records gracefully', () => {
      expect(computeExtremesSummary([])).toEqual({
        lowestClosingPositions: [],
        highestClosingPositions: [],
      });

      const nullOnlyRecords: PlacementRecord[] = [
        { ...sampleRecords[2], id: 'null-1' },
        { ...sampleRecords[2], id: 'null-2' },
      ];
      expect(computeExtremesSummary(nullOnlyRecords)).toEqual({
        lowestClosingPositions: [],
        highestClosingPositions: [],
      });
    });
  });

  describe('3. Quota Analysis (computeQuotaAnalysis)', () => {
    it('aggregates total quota, placed, and vacant sums across dataset', () => {
      const analysis = computeQuotaAnalysis(sampleRecords);
      // Total quotas: 10 + 20 + 5 + 15 + 10 = 60
      expect(analysis.totalQuota).toBe(60);
      // Total placed: 10 + 15 + 0 + 15 + 8 = 48
      expect(analysis.totalPlaced).toBe(48);
      // Total vacant: 0 + 5 + 5 + 0 + 2 = 12
      expect(analysis.totalVacant).toBe(12);
    });

    it('breaks down quota by educational level with accurate percentages', () => {
      const analysis = computeQuotaAnalysis(sampleRecords);

      const lisans = analysis.byEducationLevel.lisans;
      expect(lisans.totalQuota).toBe(35); // 10 + 20 + 5
      expect(lisans.totalPlaced).toBe(25);
      expect(lisans.totalVacant).toBe(10);
      expect(lisans.percentage).toBe(Number(((35 / 60) * 100).toFixed(2))); // 58.33%

      const onlisans = analysis.byEducationLevel.onlisans;
      expect(onlisans.totalQuota).toBe(15);
      expect(onlisans.percentage).toBe(Number(((15 / 60) * 100).toFixed(2))); // 25.00%

      const ortaogretim = analysis.byEducationLevel.ortaogretim;
      expect(ortaogretim.totalQuota).toBe(10);
      expect(ortaogretim.percentage).toBe(Number(((10 / 60) * 100).toFixed(2))); // 16.67%
    });

    it('ranks top institutions by quota with average scores', () => {
      const analysis = computeQuotaAnalysis(sampleRecords);
      expect(analysis.topInstitutions.length).toBeGreaterThan(0);

      // DSİ has 5 (lisans) + 15 (onlisans) = 20 quota
      // SGK has 20 quota
      // DHMİ has 10 quota
      // Karayolları has 10 quota
      const dsi = analysis.topInstitutions.find(
        (i) => i.kurumAdi === 'DEVLET SU İŞLERİ GENEL MÜDÜRLÜĞÜ'
      )!;
      expect(dsi).toBeDefined();
      expect(dsi.kontenjan).toBe(20);
      // DSİ scores: 72.5 (103 is null), so avg is 72.5
      expect(dsi.avgTabanPuan).toBe(72.5);
    });

    it('ranks top provinces by announced quota', () => {
      const analysis = computeQuotaAnalysis(sampleRecords);
      // Ankara: 10 (DHMİ) + 5 (DSİ) = 15
      // İstanbul: 20 (SGK)
      // İzmir: 15 (DSİ)
      // Konya: 10 (Karayolları)
      expect(analysis.topProvinces[0].sehir).toBe('İSTANBUL');
      expect(analysis.topProvinces[0].kontenjan).toBe(20);
    });

    it('returns zeroed structure with no NaN when records array is empty', () => {
      const analysis = computeQuotaAnalysis([]);
      expect(analysis.totalQuota).toBe(0);
      expect(analysis.totalPlaced).toBe(0);
      expect(analysis.totalVacant).toBe(0);
      expect(analysis.byEducationLevel.lisans.percentage).toBe(0);
      expect(Number.isNaN(analysis.byEducationLevel.lisans.percentage)).toBe(false);
      expect(analysis.topInstitutions).toEqual([]);
      expect(analysis.topProvinces).toEqual([]);
    });
  });

  describe('4. Score Distribution Histogram (computeScoreDistribution)', () => {
    it('generates standard histogram bins and counts scored records correctly', () => {
      const dist = computeScoreDistribution(sampleRecords);
      expect(dist.totalScored).toBe(4);
      expect(dist.nullCount).toBe(1);
      expect(dist.minScore).toBe(68.0);
      expect(dist.maxScore).toBe(90.0);
      // Average of 90, 80, 72.5, 68.0 = 310.5 / 4 = 77.63
      expect(dist.averageScore).toBe(77.63);

      // Verify bins
      const bin60_70 = dist.bins.find((b) => b.bin === '60-70')!;
      expect(bin60_70.count).toBe(1); // 68.0
      expect(bin60_70.quota).toBe(10);
      expect(bin60_70.percentage).toBe(25.0); // 1 / 4 * 100

      const bin70_75 = dist.bins.find((b) => b.bin === '70-75')!;
      expect(bin70_75.count).toBe(1); // 72.5

      const bin80_85 = dist.bins.find((b) => b.bin === '80-85')!;
      expect(bin80_85.count).toBe(1); // 80.0

      const bin90_95 = dist.bins.find((b) => b.bin === '90-95')!;
      expect(bin90_95.count).toBe(1); // 90.0
    });

    it('handles upper boundary inclusivity (100.0 in 95-100 bin)', () => {
      const perfectRecord: PlacementRecord = {
        ...sampleRecords[0],
        id: 'perfect-100',
        tabanPuan: 100.0,
      };
      const dist = computeScoreDistribution([perfectRecord]);
      const bin95_100 = dist.bins.find((b) => b.bin === '95-100')!;
      expect(bin95_100.count).toBe(1);
    });

    it('returns empty distribution metrics when records array is empty', () => {
      const dist = computeScoreDistribution([]);
      expect(dist.totalScored).toBe(0);
      expect(dist.nullCount).toBe(0);
      expect(dist.minScore).toBeNull();
      expect(dist.maxScore).toBeNull();
      expect(dist.averageScore).toBeNull();
      expect(dist.bins.every((b) => b.count === 0 && b.percentage === 0)).toBe(true);
    });
  });

  describe('5. Real Dataset Comprehensive Analytics', () => {
    it('computes valid full analytics across official PLACEMENT_RECORDS', () => {
      const analytics = computeAnalytics(PLACEMENT_RECORDS);

      expect(analytics.totalRecords).toBe(PLACEMENT_RECORDS.length);
      expect(analytics.periodTrends.length).toBeGreaterThanOrEqual(3);
      expect(analytics.extremes.lowestClosingPositions.length).toBe(10);
      expect(analytics.extremes.highestClosingPositions.length).toBe(10);

      // Verify highest score is greater than lowest score
      const highestScore = analytics.extremes.highestClosingPositions[0].tabanPuan!;
      const lowestScore = analytics.extremes.lowestClosingPositions[0].tabanPuan!;
      expect(highestScore).toBeGreaterThan(lowestScore);

      // Verify quota sums
      expect(analytics.quotaAnalysis.totalQuota).toBeGreaterThan(0);
      expect(analytics.quotaAnalysis.topInstitutions.length).toBe(10);
      expect(analytics.quotaAnalysis.topProvinces.length).toBe(10);

      // Verify score distribution covers scored records
      expect(analytics.scoreDistribution.totalScored).toBeGreaterThan(0);
    });
  });
});
