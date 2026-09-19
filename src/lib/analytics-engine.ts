import {
  PlacementRecord,
  EducationLevel,
  PlacementPeriod,
  PeriodSummary,
} from '@/types/kpss';

// ============================================================================
// Types & Interfaces for Analytics & Statistical Insights
// ============================================================================

export interface PeriodTrendStats extends PeriodSummary {
  placedRatio: number;
  recordCount: number;
}

export interface ExtremesSummary {
  lowestClosingPositions: PlacementRecord[];
  highestClosingPositions: PlacementRecord[];
}

export interface LevelQuotaStats {
  level: EducationLevel;
  label: string;
  totalQuota: number;
  totalPlaced: number;
  totalVacant: number;
  percentage: number;
  placedRatio: number;
}

export interface InstitutionQuotaStats {
  kurumAdi: string;
  kontenjan: number;
  yerlesen: number;
  bosKalan: number;
  avgTabanPuan: number | null;
  cadreCount: number;
}

export interface CityQuotaStats {
  sehir: string;
  kontenjan: number;
  yerlesen: number;
  bosKalan: number;
  cadreCount: number;
}

export interface QuotaAnalysis {
  totalQuota: number;
  totalPlaced: number;
  totalVacant: number;
  byEducationLevel: Record<EducationLevel, LevelQuotaStats>;
  topInstitutions: InstitutionQuotaStats[];
  topProvinces: CityQuotaStats[];
}

export interface ScoreHistogramBin {
  bin: string;
  min: number;
  max: number;
  count: number;
  quota: number;
  percentage: number;
}

export interface ScoreDistributionAnalysis {
  bins: ScoreHistogramBin[];
  totalScored: number;
  nullCount: number;
  minScore: number | null;
  maxScore: number | null;
  averageScore: number | null;
}

export interface ComprehensiveAnalytics {
  totalRecords: number;
  periodTrends: PeriodTrendStats[];
  extremes: ExtremesSummary;
  quotaAnalysis: QuotaAnalysis;
  scoreDistribution: ScoreDistributionAnalysis;
}

// ============================================================================
// Helper: Natural chronological sort key for KPSS periods (e.g. '2024/1' -> 20241)
// ============================================================================

function periodSortKey(period: string): number {
  const parts = period.split('/');
  const year = parseInt(parts[0], 10) || 0;
  const num = parseInt(parts[1], 10) || 0;
  return year * 10 + num;
}

// ============================================================================
// 1. Period Trends Aggregation
// ============================================================================

/**
 * Computes min taban puan, average taban puan, max taban puan, median,
 * total quota (kontenjan), total placed (yerlesen), total vacant (bosKalan),
 * and placed ratio across placement periods.
 * Excludes null scores from average/min/max while keeping quota accurate.
 */
export function computePeriodTrends(
  records: PlacementRecord[],
  targetPeriods?: PlacementPeriod[]
): PeriodTrendStats[] {
  if (!records || records.length === 0) {
    if (targetPeriods && targetPeriods.length > 0) {
      return targetPeriods.map((period) => ({
        period,
        minScore: null,
        maxScore: null,
        avgScore: null,
        medianScore: null,
        totalQuota: 0,
        totalPlaced: 0,
        totalVacant: 0,
        placedRatio: 0,
        recordCount: 0,
      }));
    }
    return [];
  }

  // Determine periods to calculate
  let periods: PlacementPeriod[];
  if (targetPeriods && targetPeriods.length > 0) {
    periods = targetPeriods;
  } else {
    const periodSet = new Set<PlacementPeriod>();
    for (const r of records) {
      if (r.donem) {
        periodSet.add(r.donem);
      }
    }
    periods = Array.from(periodSet).sort((a, b) => periodSortKey(a) - periodSortKey(b));
  }

  return periods.map((period) => {
    const periodRecords = records.filter((r) => r.donem === period);
    const recordCount = periodRecords.length;

    let totalQuota = 0;
    let totalPlaced = 0;
    let totalVacant = 0;
    const scores: number[] = [];

    for (const r of periodRecords) {
      totalQuota += r.kontenjan || 0;
      totalPlaced += r.yerlesen || 0;
      totalVacant += r.bosKalan || 0;

      if (r.tabanPuan !== null && !isNaN(r.tabanPuan)) {
        scores.push(r.tabanPuan);
      }
    }

    const placedRatio = totalQuota > 0 ? Number((totalPlaced / totalQuota).toFixed(4)) : 0;

    let minScore: number | null = null;
    let maxScore: number | null = null;
    let avgScore: number | null = null;
    let medianScore: number | null = null;

    if (scores.length > 0) {
      scores.sort((a, b) => a - b);
      minScore = scores[0];
      maxScore = scores[scores.length - 1];
      const sum = scores.reduce((acc, curr) => acc + curr, 0);
      avgScore = Number((sum / scores.length).toFixed(2));

      const mid = Math.floor(scores.length / 2);
      medianScore =
        scores.length % 2 !== 0
          ? scores[mid]
          : Number(((scores[mid - 1] + scores[mid]) / 2).toFixed(2));
    }

    return {
      period,
      minScore,
      maxScore,
      avgScore,
      medianScore,
      totalQuota,
      totalPlaced,
      totalVacant,
      placedRatio,
      recordCount,
    };
  });
}

// ============================================================================
// 2. Extremes Summary (Lowest & Highest Closing Positions)
// ============================================================================

/**
 * Computes top N positions closing with lowest base score (En düşük puanla kapatan kadrolar)
 * and top N closing with highest base score (En yüksek puanla kapatan kadrolar).
 * Excludes records with null base scores.
 */
export function computeExtremesSummary(
  records: PlacementRecord[],
  topN: number = 10
): ExtremesSummary {
  if (!records || records.length === 0 || topN <= 0) {
    return {
      lowestClosingPositions: [],
      highestClosingPositions: [],
    };
  }

  // Filter only records that formed a base score (tabanPuan !== null)
  const validRecords = records.filter(
    (r) => r.tabanPuan !== null && !isNaN(r.tabanPuan)
  );

  if (validRecords.length === 0) {
    return {
      lowestClosingPositions: [],
      highestClosingPositions: [],
    };
  }

  // Lowest closing positions (ascending order)
  const lowestSorted = [...validRecords].sort((a, b) => {
    if (a.tabanPuan !== b.tabanPuan) {
      return (a.tabanPuan as number) - (b.tabanPuan as number);
    }
    return a.kurumAdi.localeCompare(b.kurumAdi, 'tr');
  });
  const lowestClosingPositions = lowestSorted.slice(0, topN);

  // Highest closing positions (descending order)
  const highestSorted = [...validRecords].sort((a, b) => {
    if (b.tabanPuan !== a.tabanPuan) {
      return (b.tabanPuan as number) - (a.tabanPuan as number);
    }
    return a.kurumAdi.localeCompare(b.kurumAdi, 'tr');
  });
  const highestClosingPositions = highestSorted.slice(0, topN);

  return {
    lowestClosingPositions,
    highestClosingPositions,
  };
}

// ============================================================================
// 3. Quota Analysis Across Levels, Institutions, and Provinces
// ============================================================================

/**
 * Computes quota distribution across educational levels (Lisans vs Önlisans vs Ortaöğretim),
 * top 10 institutions by announced quota, and top 10 provinces by announced quota.
 */
export function computeQuotaAnalysis(records: PlacementRecord[]): QuotaAnalysis {
  if (!records || records.length === 0) {
    return {
      totalQuota: 0,
      totalPlaced: 0,
      totalVacant: 0,
      byEducationLevel: {
        lisans: {
          level: 'lisans',
          label: 'Lisans',
          totalQuota: 0,
          totalPlaced: 0,
          totalVacant: 0,
          percentage: 0,
          placedRatio: 0,
        },
        onlisans: {
          level: 'onlisans',
          label: 'Önlisans',
          totalQuota: 0,
          totalPlaced: 0,
          totalVacant: 0,
          percentage: 0,
          placedRatio: 0,
        },
        ortaogretim: {
          level: 'ortaogretim',
          label: 'Ortaöğretim',
          totalQuota: 0,
          totalPlaced: 0,
          totalVacant: 0,
          percentage: 0,
          placedRatio: 0,
        },
      },
      topInstitutions: [],
      topProvinces: [],
    };
  }

  let totalQuota = 0;
  let totalPlaced = 0;
  let totalVacant = 0;

  const levelAccumulator: Record<
    EducationLevel,
    { quota: number; placed: number; vacant: number }
  > = {
    lisans: { quota: 0, placed: 0, vacant: 0 },
    onlisans: { quota: 0, placed: 0, vacant: 0 },
    ortaogretim: { quota: 0, placed: 0, vacant: 0 },
  };

  const institutionMap = new Map<
    string,
    { kontenjan: number; yerlesen: number; bosKalan: number; scores: number[]; count: number }
  >();

  const cityMap = new Map<
    string,
    { kontenjan: number; yerlesen: number; bosKalan: number; count: number }
  >();

  for (const r of records) {
    const q = r.kontenjan || 0;
    const p = r.yerlesen || 0;
    const v = r.bosKalan || 0;

    totalQuota += q;
    totalPlaced += p;
    totalVacant += v;

    // Accumulate by level
    if (levelAccumulator[r.ogrenimDuzeyi]) {
      levelAccumulator[r.ogrenimDuzeyi].quota += q;
      levelAccumulator[r.ogrenimDuzeyi].placed += p;
      levelAccumulator[r.ogrenimDuzeyi].vacant += v;
    }

    // Accumulate by institution
    if (r.kurumAdi) {
      let inst = institutionMap.get(r.kurumAdi);
      if (!inst) {
        inst = { kontenjan: 0, yerlesen: 0, bosKalan: 0, scores: [], count: 0 };
        institutionMap.set(r.kurumAdi, inst);
      }
      inst.kontenjan += q;
      inst.yerlesen += p;
      inst.bosKalan += v;
      inst.count += 1;
      if (r.tabanPuan !== null && !isNaN(r.tabanPuan)) {
        inst.scores.push(r.tabanPuan);
      }
    }

    // Accumulate by city
    if (r.sehir) {
      let city = cityMap.get(r.sehir);
      if (!city) {
        city = { kontenjan: 0, yerlesen: 0, bosKalan: 0, count: 0 };
        cityMap.set(r.sehir, city);
      }
      city.kontenjan += q;
      city.yerlesen += p;
      city.bosKalan += v;
      city.count += 1;
    }
  }

  // Level statistics mapping
  const levelLabels: Record<EducationLevel, string> = {
    lisans: 'Lisans',
    onlisans: 'Önlisans',
    ortaogretim: 'Ortaöğretim',
  };

  const byEducationLevel = {} as Record<EducationLevel, LevelQuotaStats>;
  for (const level of ['lisans', 'onlisans', 'ortaogretim'] as EducationLevel[]) {
    const acc = levelAccumulator[level];
    const percentage =
      totalQuota > 0 ? Number(((acc.quota / totalQuota) * 100).toFixed(2)) : 0;
    const placedRatio =
      acc.quota > 0 ? Number((acc.placed / acc.quota).toFixed(4)) : 0;

    byEducationLevel[level] = {
      level,
      label: levelLabels[level],
      totalQuota: acc.quota,
      totalPlaced: acc.placed,
      totalVacant: acc.vacant,
      percentage,
      placedRatio,
    };
  }

  // Top 10 institutions by announced quota
  const topInstitutions: InstitutionQuotaStats[] = Array.from(institutionMap.entries())
    .map(([kurumAdi, stats]) => {
      const avgTabanPuan =
        stats.scores.length > 0
          ? Number(
              (
                stats.scores.reduce((sum, val) => sum + val, 0) / stats.scores.length
              ).toFixed(2)
            )
          : null;

      return {
        kurumAdi,
        kontenjan: stats.kontenjan,
        yerlesen: stats.yerlesen,
        bosKalan: stats.bosKalan,
        avgTabanPuan,
        cadreCount: stats.count,
      };
    })
    .sort((a, b) => {
      if (b.kontenjan !== a.kontenjan) {
        return b.kontenjan - a.kontenjan;
      }
      return a.kurumAdi.localeCompare(b.kurumAdi, 'tr');
    })
    .slice(0, 10);

  // Top 10 provinces by announced quota
  const topProvinces: CityQuotaStats[] = Array.from(cityMap.entries())
    .map(([sehir, stats]) => ({
      sehir,
      kontenjan: stats.kontenjan,
      yerlesen: stats.yerlesen,
      bosKalan: stats.bosKalan,
      cadreCount: stats.count,
    }))
    .sort((a, b) => {
      if (b.kontenjan !== a.kontenjan) {
        return b.kontenjan - a.kontenjan;
      }
      return a.sehir.localeCompare(b.sehir, 'tr');
    })
    .slice(0, 10);

  return {
    totalQuota,
    totalPlaced,
    totalVacant,
    byEducationLevel,
    topInstitutions,
    topProvinces,
  };
}

// ============================================================================
// 4. Score Distribution Histogram Analysis
// ============================================================================

const HISTOGRAM_BINS: Array<{
  bin: string;
  min: number;
  max: number;
  inclusiveMax?: boolean;
}> = [
  { bin: '50-60', min: 50, max: 60 },
  { bin: '60-70', min: 60, max: 70 },
  { bin: '70-75', min: 70, max: 75 },
  { bin: '75-80', min: 75, max: 80 },
  { bin: '80-85', min: 80, max: 85 },
  { bin: '85-90', min: 85, max: 90 },
  { bin: '90-95', min: 90, max: 95 },
  { bin: '95-100', min: 95, max: 100, inclusiveMax: true },
];

/**
 * Generates score histogram bins (50-60, 60-70, 70-75, 75-80, 80-85, 85-90, 90-95, 95-100),
 * counting records and quotas per bin, and calculating percentages.
 */
export function computeScoreDistribution(
  records: PlacementRecord[]
): ScoreDistributionAnalysis {
  const binStats = HISTOGRAM_BINS.map((b) => ({
    bin: b.bin,
    min: b.min,
    max: b.max,
    count: 0,
    quota: 0,
    percentage: 0,
  }));

  if (!records || records.length === 0) {
    return {
      bins: binStats,
      totalScored: 0,
      nullCount: 0,
      minScore: null,
      maxScore: null,
      averageScore: null,
    };
  }

  let totalScored = 0;
  let nullCount = 0;
  let minScore: number | null = null;
  let maxScore: number | null = null;
  let scoreSum = 0;

  for (const r of records) {
    const score = r.tabanPuan;
    if (score === null || isNaN(score)) {
      nullCount += 1;
      continue;
    }

    totalScored += 1;
    scoreSum += score;

    if (minScore === null || score < minScore) minScore = score;
    if (maxScore === null || score > maxScore) maxScore = score;

    // Find the right histogram bin
    for (let i = 0; i < HISTOGRAM_BINS.length; i++) {
      const def = HISTOGRAM_BINS[i];
      const matches = def.inclusiveMax
        ? score >= def.min && score <= def.max
        : score >= def.min && score < def.max;

      if (matches) {
        binStats[i].count += 1;
        binStats[i].quota += r.kontenjan || 0;
        break;
      }
    }
  }

  // Calculate percentages based on scored records
  for (const b of binStats) {
    b.percentage =
      totalScored > 0 ? Number(((b.count / totalScored) * 100).toFixed(2)) : 0;
  }

  const averageScore =
    totalScored > 0 ? Number((scoreSum / totalScored).toFixed(2)) : null;

  return {
    bins: binStats,
    totalScored,
    nullCount,
    minScore,
    maxScore,
    averageScore,
  };
}

// ============================================================================
// 5. Unified Comprehensive Analytics
// ============================================================================

/**
 * Computes all analytical breakdowns in a single coordinated execution.
 */
export function computeAnalytics(records: PlacementRecord[]): ComprehensiveAnalytics {
  return {
    totalRecords: records.length,
    periodTrends: computePeriodTrends(records),
    extremes: computeExtremesSummary(records, 10),
    quotaAnalysis: computeQuotaAnalysis(records),
    scoreDistribution: computeScoreDistribution(records),
  };
}
