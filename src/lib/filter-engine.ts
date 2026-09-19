import {
  PlacementRecord,
  EducationLevel,
  PlacementPeriod,
  HizmetSinifi,
  FilterCriteria,
} from '@/types/kpss';
import { normalizeTr, normalizeTrSearch } from '@/lib/turkish';
import { searchIndex, INSTITUTION_ALIASES, TITLE_ALIASES } from '@/lib/search-index';

// ============================================================================
// Types & Contracts for Multi-Criteria Filtering
// ============================================================================

export type FilterSortOption =
  | 'tabanPuanAsc'
  | 'tabanPuanDesc'
  | 'kontenjanDesc'
  | 'kurumAdiAsc'
  | 'unvanAsc';

export interface FilterOptions {
  sortBy?: FilterSortOption;
  page?: number;
  pageSize?: number;
}

export interface ExtendedFilterCriteria extends FilterCriteria {
  sortBy?: FilterSortOption;
  page?: number;
  pageSize?: number;
}

export interface FilterFacets {
  cities: string[];
  institutions: string[];
  titles: string[];
  serviceClasses: string[];
  periods: PlacementPeriod[];
  educationLevels: EducationLevel[];
  minScore: number | null;
  maxScore: number | null;
  totalCount: number;
  totalQuota: number;
  totalVacant: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ============================================================================
// Multi-Criteria Placement Filtering Function
// ============================================================================

/**
 * Filters and sorts KPSS placement records according to provided multi-variable criteria.
 * Supports educational level, periods, cities, institutions, titles, service classes,
 * score ranges (float precision), unfilled quotas, general codes, qualification codes,
 * free text search, sorting, and pagination.
 */
export function filterPlacements(
  records: PlacementRecord[],
  criteria: ExtendedFilterCriteria,
  options?: FilterOptions
): PlacementRecord[] {
  if (!records || records.length === 0) {
    return [];
  }

  // Merge options with criteria (options take precedence if explicitly provided)
  const sortBy: FilterSortOption | undefined = options?.sortBy ?? criteria.sortBy;
  const page: number | undefined = options?.page ?? criteria.page;
  const pageSize: number | undefined = options?.pageSize ?? criteria.pageSize;

  // Pre-process criteria for high-performance set-based evaluation
  const targetLevel = criteria.ogrenimDuzeyi ? normalizeTr(criteria.ogrenimDuzeyi) : undefined;
  const periodSet = criteria.donemler && criteria.donemler.length > 0 ? new Set(criteria.donemler) : undefined;

  const cityNormSet =
    criteria.sehirler && criteria.sehirler.length > 0
      ? new Set(criteria.sehirler.map((c) => normalizeTrSearch(c)).filter(Boolean))
      : undefined;

  const kurumNormList =
    criteria.kurumlar && criteria.kurumlar.length > 0
      ? criteria.kurumlar.map((k) => normalizeTrSearch(k)).filter(Boolean)
      : undefined;

  const unvanNormList =
    criteria.unvanlar && criteria.unvanlar.length > 0
      ? criteria.unvanlar.map((u) => normalizeTrSearch(u)).filter(Boolean)
      : undefined;

  const sinifSet =
    criteria.hizmetSiniflari && criteria.hizmetSiniflari.length > 0
      ? new Set(criteria.hizmetSiniflari.map((s) => s.toUpperCase().trim()))
      : undefined;

  // Qualification code matching:
  // Matches if post requires ANY of the given degree codes OR matches special conditions.
  // If includeGeneralCodes is enabled, general codes (4001, 3001, 2001) are also accepted.
  let qualificationTargetCodes: Set<string> | undefined;
  if (criteria.nitelikKodlari && criteria.nitelikKodlari.length > 0) {
    qualificationTargetCodes = new Set(criteria.nitelikKodlari.map((c) => c.trim()));
    if (criteria.includeGeneralCodes) {
      qualificationTargetCodes.add('4001');
      qualificationTargetCodes.add('3001');
      qualificationTargetCodes.add('2001');
    }
  }

  // Free text search pre-processing
  let searchTokens: string[] | undefined;
  let isPurePunctuationQuery = false;
  if (criteria.searchQuery !== undefined && criteria.searchQuery !== null) {
    const trimmed = criteria.searchQuery.trim();
    if (trimmed.length > 0) {
      const normQuery = normalizeTrSearch(trimmed);
      if (normQuery.length === 0) {
        // Pure punctuation query -> yields empty match
        isPurePunctuationQuery = true;
      } else {
        searchTokens = normQuery.split(/\s+/).filter(Boolean);
      }
    }
  }

  if (isPurePunctuationQuery) {
    return [];
  }

  // Filter pass
  let filtered = records.filter((record) => {
    // 1. Educational Level
    if (targetLevel && normalizeTr(record.ogrenimDuzeyi) !== targetLevel) {
      return false;
    }

    // 2. Placement Period (Multi-select)
    if (periodSet && !periodSet.has(record.donem)) {
      return false;
    }

    // 3. City (Multi-select)
    if (cityNormSet) {
      const recCityNorm = normalizeTrSearch(record.sehir);
      if (!cityNormSet.has(recCityNorm)) {
        return false;
      }
    }

    // 4. Institution (Multi-select)
    if (kurumNormList) {
      const recKurumNorm = normalizeTrSearch(record.kurumAdi);
      const matchesKurum = kurumNormList.some(
        (k) => recKurumNorm.includes(k) || k.includes(recKurumNorm)
      );
      if (!matchesKurum) {
        return false;
      }
    }

    // 5. Title (Multi-select)
    if (unvanNormList) {
      const recUnvanNorm = normalizeTrSearch(record.kadroUnvani);
      const matchesUnvan = unvanNormList.some(
        (u) => recUnvanNorm.includes(u) || u.includes(recUnvanNorm)
      );
      if (!matchesUnvan) {
        return false;
      }
    }

    // 6. Service Class (Multi-select)
    if (sinifSet) {
      if (!record.hizmetSinifi || !sinifSet.has(record.hizmetSinifi.toUpperCase().trim())) {
        return false;
      }
    }

    // 7. Score Range (minPuan & maxPuan with float precision)
    if (criteria.minPuan !== undefined && criteria.minPuan !== null) {
      if (record.tabanPuan === null || record.tabanPuan < criteria.minPuan) {
        return false;
      }
    }
    if (criteria.maxPuan !== undefined && criteria.maxPuan !== null) {
      if (record.tabanPuan === null || record.tabanPuan > criteria.maxPuan) {
        return false;
      }
    }

    // 8. Unfilled Only (sadeceBosKalanlar)
    if (criteria.sadeceBosKalanlar && record.bosKalan <= 0) {
      return false;
    }

    // 9. Qualification Codes Filter
    if (qualificationTargetCodes) {
      const hasMatchingCode = record.nitelikKodlari.some((code) =>
        qualificationTargetCodes!.has(code)
      );
      if (!hasMatchingCode) {
        return false;
      }
    }

    // 10. Free Text Search Query
    if (searchTokens && searchTokens.length > 0) {
      let corpus = searchIndex.recordSearchCorpus.get(record.id);
      if (!corpus) {
        const parts = [
          record.kadroKodu,
          record.kurumAdi,
          record.kadroUnvani,
          record.sehir,
          record.ilce || '',
          record.teskilat || '',
          record.hizmetSinifi || '',
          record.donem,
          record.ogrenimDuzeyi,
          ...record.nitelikKodlari,
        ];
        const instAliases = INSTITUTION_ALIASES[record.kurumAdi];
        if (instAliases) parts.push(...instAliases);
        for (const [instKey, aliases] of Object.entries(INSTITUTION_ALIASES)) {
          if (record.kurumAdi.includes(instKey)) parts.push(...aliases);
        }
        for (const [titleKey, aliases] of Object.entries(TITLE_ALIASES)) {
          if (record.kadroUnvani.includes(titleKey)) parts.push(...aliases);
        }
        corpus = normalizeTrSearch(parts.join(' '));
      }

      for (const token of searchTokens) {
        if (!corpus.includes(token)) {
          return false;
        }
      }
    }

    return true;
  });

  // Sorting Pass
  if (sortBy) {
    filtered = [...filtered];
    switch (sortBy) {
      case 'tabanPuanAsc':
        filtered.sort((a, b) => {
          if (a.tabanPuan === null && b.tabanPuan === null) return 0;
          if (a.tabanPuan === null) return 1;
          if (b.tabanPuan === null) return -1;
          if (a.tabanPuan !== b.tabanPuan) {
            return a.tabanPuan - b.tabanPuan;
          }
          return a.kurumAdi.localeCompare(b.kurumAdi, 'tr');
        });
        break;

      case 'tabanPuanDesc':
        filtered.sort((a, b) => {
          if (a.tabanPuan === null && b.tabanPuan === null) return 0;
          if (a.tabanPuan === null) return 1;
          if (b.tabanPuan === null) return -1;
          if (b.tabanPuan !== a.tabanPuan) {
            return b.tabanPuan - a.tabanPuan;
          }
          return a.kurumAdi.localeCompare(b.kurumAdi, 'tr');
        });
        break;

      case 'kontenjanDesc':
        filtered.sort((a, b) => {
          if (b.kontenjan !== a.kontenjan) {
            return b.kontenjan - a.kontenjan;
          }
          const scoreA = a.tabanPuan ?? 0;
          const scoreB = b.tabanPuan ?? 0;
          return scoreB - scoreA;
        });
        break;

      case 'kurumAdiAsc':
        filtered.sort((a, b) => {
          const cmp = a.kurumAdi.localeCompare(b.kurumAdi, 'tr');
          if (cmp !== 0) return cmp;
          return a.kadroUnvani.localeCompare(b.kadroUnvani, 'tr');
        });
        break;

      case 'unvanAsc':
        filtered.sort((a, b) => {
          const cmp = a.kadroUnvani.localeCompare(b.kadroUnvani, 'tr');
          if (cmp !== 0) return cmp;
          return a.kurumAdi.localeCompare(b.kurumAdi, 'tr');
        });
        break;
    }
  }

  // Pagination Pass
  if (pageSize !== undefined && pageSize > 0) {
    const p = Math.max(1, page ?? 1);
    const start = (p - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }

  return filtered;
}

// ============================================================================
// Facet Extraction
// ============================================================================

/**
 * Computes unique cities, institutions, titles, service classes, and min/max scores
 * available in the provided placement dataset.
 */
export function getFilterFacets(records: PlacementRecord[]): FilterFacets {
  const citySet = new Set<string>();
  const instSet = new Set<string>();
  const titleSet = new Set<string>();
  const sinifSet = new Set<string>();
  const periodSet = new Set<PlacementPeriod>();
  const levelSet = new Set<EducationLevel>();

  let minScore: number | null = null;
  let maxScore: number | null = null;
  let totalQuota = 0;
  let totalVacant = 0;

  for (const record of records) {
    if (record.sehir) {
      citySet.add(record.sehir);
    }
    if (record.kurumAdi) {
      instSet.add(record.kurumAdi);
    }
    if (record.kadroUnvani) {
      titleSet.add(record.kadroUnvani);
    }
    if (record.hizmetSinifi) {
      sinifSet.add(record.hizmetSinifi);
    }
    if (record.donem) {
      periodSet.add(record.donem);
    }
    if (record.ogrenimDuzeyi) {
      levelSet.add(record.ogrenimDuzeyi);
    }

    totalQuota += record.kontenjan || 0;
    totalVacant += record.bosKalan || 0;

    if (record.tabanPuan !== null && !isNaN(record.tabanPuan)) {
      if (minScore === null || record.tabanPuan < minScore) {
        minScore = record.tabanPuan;
      }
      if (maxScore === null || record.tabanPuan > maxScore) {
        maxScore = record.tabanPuan;
      }
    }
  }

  // Chronological sort for periods e.g. 2024/1, 2024/2, 2025/1
  const sortedPeriods = Array.from(periodSet).sort((a, b) => {
    const [yA, nA] = a.split('/').map(Number);
    const [yB, nB] = b.split('/').map(Number);
    return (yA || 0) * 10 + (nA || 0) - ((yB || 0) * 10 + (nB || 0));
  });

  const levelOrder: EducationLevel[] = ['lisans', 'onlisans', 'ortaogretim'];
  const sortedLevels = levelOrder.filter((lvl) => levelSet.has(lvl));

  return {
    cities: Array.from(citySet).sort((a, b) => a.localeCompare(b, 'tr')),
    institutions: Array.from(instSet).sort((a, b) => a.localeCompare(b, 'tr')),
    titles: Array.from(titleSet).sort((a, b) => a.localeCompare(b, 'tr')),
    serviceClasses: Array.from(sinifSet).sort(),
    periods: sortedPeriods,
    educationLevels: sortedLevels,
    minScore,
    maxScore,
    totalCount: records.length,
    totalQuota,
    totalVacant,
  };
}

// ============================================================================
// Pagination Helper
// ============================================================================

export function paginatePlacements(
  records: PlacementRecord[],
  page: number = 1,
  pageSize: number = 20
): PaginatedResult<PlacementRecord> {
  const total = records.length;
  const validPageSize = Math.max(1, pageSize);
  const totalPages = Math.max(1, Math.ceil(total / validPageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const start = (currentPage - 1) * validPageSize;
  const data = records.slice(start, start + validPageSize);

  return {
    data,
    total,
    page: currentPage,
    pageSize: validPageSize,
    totalPages,
  };
}

// ============================================================================
// URL Search Params Bidirectional Synchronization
// ============================================================================

/**
 * Serializes FilterCriteria and optional sorting/pagination options into URLSearchParams.
 */
export function filterCriteriaToSearchParams(
  criteria: ExtendedFilterCriteria
): URLSearchParams {
  const params = new URLSearchParams();

  if (criteria.ogrenimDuzeyi) {
    params.set('ogrenimDuzeyi', criteria.ogrenimDuzeyi);
  }

  if (criteria.donemler && criteria.donemler.length > 0) {
    params.set('donemler', criteria.donemler.join(','));
  }

  if (criteria.sehirler && criteria.sehirler.length > 0) {
    params.set('sehirler', criteria.sehirler.join(','));
  }

  if (criteria.kurumlar && criteria.kurumlar.length > 0) {
    params.set('kurumlar', criteria.kurumlar.join(','));
  }

  if (criteria.unvanlar && criteria.unvanlar.length > 0) {
    params.set('unvanlar', criteria.unvanlar.join(','));
  }

  if (criteria.hizmetSiniflari && criteria.hizmetSiniflari.length > 0) {
    params.set('hizmetSiniflari', criteria.hizmetSiniflari.join(','));
  }

  if (criteria.nitelikKodlari && criteria.nitelikKodlari.length > 0) {
    params.set('nitelikKodlari', criteria.nitelikKodlari.join(','));
  }

  if (criteria.minPuan !== undefined && criteria.minPuan !== null && !isNaN(criteria.minPuan)) {
    params.set('minPuan', String(criteria.minPuan));
  }

  if (criteria.maxPuan !== undefined && criteria.maxPuan !== null && !isNaN(criteria.maxPuan)) {
    params.set('maxPuan', String(criteria.maxPuan));
  }

  if (criteria.sadeceBosKalanlar) {
    params.set('sadeceBosKalanlar', 'true');
  }

  if (criteria.includeGeneralCodes) {
    params.set('includeGeneralCodes', 'true');
  }

  if (criteria.searchQuery && criteria.searchQuery.trim()) {
    params.set('q', criteria.searchQuery.trim());
  }

  if (criteria.sortBy) {
    params.set('sortBy', criteria.sortBy);
  }

  if (criteria.page !== undefined && criteria.page > 1) {
    params.set('page', String(criteria.page));
  }

  if (criteria.pageSize !== undefined && criteria.pageSize > 0 && criteria.pageSize !== 20) {
    params.set('pageSize', String(criteria.pageSize));
  }

  return params;
}

/**
 * Deserializes URLSearchParams, string query string, or plain parameter record
 * into ExtendedFilterCriteria.
 */
export function searchParamsToFilterCriteria(
  params: URLSearchParams | string | Record<string, string | string[] | undefined>
): ExtendedFilterCriteria {
  let searchParams: URLSearchParams;

  if (params instanceof URLSearchParams) {
    searchParams = params;
  } else if (typeof params === 'string') {
    const cleanQuery = params.startsWith('?') ? params.slice(1) : params;
    searchParams = new URLSearchParams(cleanQuery);
  } else {
    searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (Array.isArray(value)) {
        searchParams.set(key, value.join(','));
      } else if (typeof value === 'string') {
        searchParams.set(key, value);
      }
    }
  }

  const criteria: ExtendedFilterCriteria = {};

  // Education level
  const ogrenimDuzeyiRaw = searchParams.get('ogrenimDuzeyi');
  if (ogrenimDuzeyiRaw) {
    const normalizedLevel = normalizeTr(ogrenimDuzeyiRaw);
    if (
      normalizedLevel === 'lisans' ||
      normalizedLevel === 'onlisans' ||
      normalizedLevel === 'ortaogretim'
    ) {
      criteria.ogrenimDuzeyi = normalizedLevel as EducationLevel;
    }
  }

  // Periods
  const donemlerRaw = searchParams.get('donemler');
  if (donemlerRaw) {
    const list = donemlerRaw
      .split(',')
      .map((d) => d.trim())
      .filter(Boolean) as PlacementPeriod[];
    if (list.length > 0) {
      criteria.donemler = list;
    }
  }

  // Cities
  const sehirlerRaw = searchParams.get('sehirler');
  if (sehirlerRaw) {
    const list = sehirlerRaw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (list.length > 0) {
      criteria.sehirler = list;
    }
  }

  // Institutions
  const kurumlarRaw = searchParams.get('kurumlar');
  if (kurumlarRaw) {
    const list = kurumlarRaw
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean);
    if (list.length > 0) {
      criteria.kurumlar = list;
    }
  }

  // Titles
  const unvanlarRaw = searchParams.get('unvanlar');
  if (unvanlarRaw) {
    const list = unvanlarRaw
      .split(',')
      .map((u) => u.trim())
      .filter(Boolean);
    if (list.length > 0) {
      criteria.unvanlar = list;
    }
  }

  // Service Classes
  const hizmetSiniflariRaw = searchParams.get('hizmetSiniflari');
  if (hizmetSiniflariRaw) {
    const list = hizmetSiniflariRaw
      .split(',')
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean) as HizmetSinifi[];
    if (list.length > 0) {
      criteria.hizmetSiniflari = list;
    }
  }

  // Qualification Codes
  const nitelikKodlariRaw = searchParams.get('nitelikKodlari');
  if (nitelikKodlariRaw) {
    const list = nitelikKodlariRaw
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);
    if (list.length > 0) {
      criteria.nitelikKodlari = list;
    }
  }

  // Min and Max Score (Floats)
  const minPuanRaw = searchParams.get('minPuan');
  if (minPuanRaw !== null) {
    const parsed = parseFloat(minPuanRaw);
    if (!isNaN(parsed)) {
      criteria.minPuan = parsed;
    }
  }

  const maxPuanRaw = searchParams.get('maxPuan');
  if (maxPuanRaw !== null) {
    const parsed = parseFloat(maxPuanRaw);
    if (!isNaN(parsed)) {
      criteria.maxPuan = parsed;
    }
  }

  // Booleans
  const sadeceBosKalanlarRaw = searchParams.get('sadeceBosKalanlar');
  if (sadeceBosKalanlarRaw === 'true' || sadeceBosKalanlarRaw === '1') {
    criteria.sadeceBosKalanlar = true;
  }

  const includeGeneralCodesRaw = searchParams.get('includeGeneralCodes');
  if (includeGeneralCodesRaw === 'true' || includeGeneralCodesRaw === '1') {
    criteria.includeGeneralCodes = true;
  }

  // Free text search (supports both 'q' and 'searchQuery')
  const searchQueryRaw = searchParams.get('q') || searchParams.get('searchQuery');
  if (searchQueryRaw && searchQueryRaw.trim()) {
    criteria.searchQuery = searchQueryRaw.trim();
  }

  // Sorting
  const sortByRaw = searchParams.get('sortBy');
  const validSortOptions: FilterSortOption[] = [
    'tabanPuanAsc',
    'tabanPuanDesc',
    'kontenjanDesc',
    'kurumAdiAsc',
    'unvanAsc',
  ];
  if (sortByRaw && validSortOptions.includes(sortByRaw as FilterSortOption)) {
    criteria.sortBy = sortByRaw as FilterSortOption;
  }

  // Pagination
  const pageRaw = searchParams.get('page');
  if (pageRaw !== null) {
    const parsed = parseInt(pageRaw, 10);
    if (!isNaN(parsed) && parsed > 0) {
      criteria.page = parsed;
    }
  }

  const pageSizeRaw = searchParams.get('pageSize');
  if (pageSizeRaw !== null) {
    const parsed = parseInt(pageSizeRaw, 10);
    if (!isNaN(parsed) && parsed > 0) {
      criteria.pageSize = parsed;
    }
  }

  return criteria;
}
