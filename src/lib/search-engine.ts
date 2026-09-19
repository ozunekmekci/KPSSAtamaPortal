import {
  PlacementRecord,
  Department,
  QualificationCategory,
  EducationLevel,
  PlacementPeriod,
  HizmetSinifi,
  SpecialCondition,
} from '@/types/kpss';
import { searchIndex } from '@/lib/search-index';
import { DEPARTMENTS } from '@/data/departments';
import { QUALIFICATIONS_BY_CODE, isSpecialConditionCode } from '@/data/qualifications';
import { SPECIAL_CONDITIONS_BY_CODE } from '@/data/special-conditions';
import { normalizeTr, normalizeTrSearch } from '@/lib/turkish';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface DepartmentSearchResult extends Department {
  primaryCode: string;
  generalCode: string;
  equivalentCodes: string[];
  score?: number;
}

export interface QualificationLookupResult {
  code: string;
  kod: string;
  title: string;
  kisaTanim: string;
  category: QualificationCategory | string;
  kategori: QualificationCategory | string;
  description: string;
  aciklama: string;
  isSpecialCondition: boolean;
  ogrenimDuzeyi: EducationLevel | 'hepsi';
  eligibleDepartments: Array<{
    id: string;
    ad: string;
    level: EducationLevel;
  }>;
  bolumler: string[];
  specialConditionDetails?: SpecialCondition;
}

export interface SearchOptions {
  ogrenimDuzeyi?: EducationLevel;
  donem?: PlacementPeriod | PlacementPeriod[];
  donemler?: PlacementPeriod[];
  sehir?: string | string[];
  sehirler?: string[];
  kurum?: string | string[];
  kurumlar?: string[];
  unvan?: string | string[];
  unvanlar?: string[];
  hizmetSinifi?: HizmetSinifi | HizmetSinifi[];
  hizmetSiniflari?: HizmetSinifi[];
  nitelikKodlari?: string[];
  minPuan?: number;
  maxPuan?: number;
  sadeceBosKalanlar?: boolean;
  includeGeneral?: boolean;
  includeGeneralCodes?: boolean;
  sortBy?: 'tabanPuanAsc' | 'tabanPuanDesc' | 'kontenjanDesc' | 'kurumAdi' | 'sehir';
  limit?: number;
  offset?: number;
}

// ============================================================================
// Levenshtein Distance for Typo-Tolerant Search
// ============================================================================

function levenshteinDistance(s1: string, s2: string): number {
  if (s1 === s2) return 0;
  if (!s1.length) return s2.length;
  if (!s2.length) return s1.length;

  const prevRow: number[] = Array.from({ length: s2.length + 1 }, (_, i) => i);
  const currRow: number[] = new Array(s2.length + 1).fill(0);

  for (let i = 1; i <= s1.length; i++) {
    currRow[0] = i;
    for (let j = 1; j <= s2.length; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      currRow[j] = Math.min(
        currRow[j - 1] + 1,      // insertion
        prevRow[j] + 1,          // deletion
        prevRow[j - 1] + cost    // substitution
      );
    }
    for (let j = 0; j <= s2.length; j++) {
      prevRow[j] = currRow[j];
    }
  }

  return prevRow[s2.length];
}

// ============================================================================
// 1. Department Search with Turkish-Aware Fuzzy & Prefix Matching
// ============================================================================

export function searchDepartments(query: string, limit: number = 20): DepartmentSearchResult[] {
  const trimmed = (query || '').trim();
  if (!trimmed) {
    const list = DEPARTMENTS.slice(0, limit > 0 ? limit : DEPARTMENTS.length);
    return list.map((d) => ({
      ...d,
      primaryCode: d.nitelikKodu,
      generalCode: d.genelNitelikKodu,
      equivalentCodes: d.esdegerKodlar,
    }));
  }

  const queryNorm = normalizeTrSearch(trimmed);
  const queryTr = normalizeTr(trimmed);
  const queryTokens = queryNorm.split(/\s+/).filter(Boolean);

  const scored: Array<{ dept: Department; score: number }> = [];

  for (const dept of DEPARTMENTS) {
    let score = 0;
    const adNorm = normalizeTrSearch(dept.ad);
    const adTr = normalizeTr(dept.ad);
    const adTokens = adNorm.split(/\s+/).filter(Boolean);

    // Direct code lookup in department search
    if (dept.nitelikKodu === trimmed) {
      score += 2000;
    } else if (dept.esdegerKodlar.includes(trimmed)) {
      score += 1500;
    } else if (dept.genelNitelikKodu === trimmed) {
      score += 1000;
    }

    // Exact title match (both Turkish canonical and ASCII normalized)
    if (adTr === queryTr || adNorm === queryNorm) {
      score += 1800;
    } else if (adNorm.startsWith(queryNorm)) {
      score += 1200;
    } else if (adTokens.some((token) => token === queryNorm)) {
      score += 1000;
    } else if (adTokens.some((token) => token.startsWith(queryNorm))) {
      score += 800;
    } else if (adNorm.includes(queryNorm)) {
      score += 600;
    }

    // Multi-token AND coverage on department title
    if (queryTokens.length > 1) {
      const allTokensInTitle = queryTokens.every((qt) => adNorm.includes(qt));
      if (allTokensInTitle) {
        score += 700;
      }
    }

    // Keyword matching
    for (const keyword of dept.anahtarKelimeler) {
      const keyNorm = normalizeTrSearch(keyword);
      if (keyNorm === queryNorm) {
        score += 900;
        break;
      } else if (keyNorm.startsWith(queryNorm)) {
        score += Math.max(score, 500);
      } else if (keyNorm.includes(queryNorm)) {
        score += Math.max(score, 300);
      }
    }

    // Domain & faculty matching
    if (dept.alanGrubu) {
      const alanNorm = normalizeTrSearch(dept.alanGrubu);
      if (alanNorm === queryNorm) {
        score += 250;
      } else if (alanNorm.includes(queryNorm)) {
        score += 120;
      }
    }
    if (dept.fakulte) {
      const fakNorm = normalizeTrSearch(dept.fakulte);
      if (fakNorm.includes(queryNorm)) {
        score += 80;
      }
    }

    // Typo-tolerant fuzzy matching (if query length >= 4)
    if (score === 0 && queryNorm.length >= 4) {
      // Check title tokens
      let bestDist = 999;
      for (const token of adTokens) {
        if (Math.abs(token.length - queryNorm.length) <= 2) {
          const dist = levenshteinDistance(token, queryNorm);
          if (dist < bestDist) bestDist = dist;
        }
      }

      const threshold = queryNorm.length >= 7 ? 2 : 1;
      if (bestDist <= threshold) {
        score += 400 - bestDist * 100;
      }
    }

    if (score > 0) {
      scored.push({ dept, score });
    }
  }

  // Sort by score descending, then alphabetical
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.dept.ad.localeCompare(b.dept.ad, 'tr');
  });

  const finalResults = limit > 0 ? scored.slice(0, limit) : scored;
  return finalResults.map(({ dept, score }) => ({
    ...dept,
    primaryCode: dept.nitelikKodu,
    generalCode: dept.genelNitelikKodu,
    equivalentCodes: dept.esdegerKodlar,
    score,
  }));
}

// ============================================================================
// 2. Direct Qualification Code Lookup (/^\d{4}$/)
// ============================================================================

export function searchByQualificationCode(code: string): QualificationLookupResult | undefined {
  const trimmed = (code || '').trim();
  if (!/^\d{4}$/.test(trimmed)) {
    return undefined;
  }

  const qual = searchIndex.qualificationByCode.get(trimmed) || QUALIFICATIONS_BY_CODE[trimmed];
  const special = SPECIAL_CONDITIONS_BY_CODE[trimmed];

  // Resolve matching academic departments
  const matchingDepts = DEPARTMENTS.filter(
    (d) => d.nitelikKodu === trimmed || d.esdegerKodlar.includes(trimmed) || d.genelNitelikKodu === trimmed
  );

  if (!qual && !special && matchingDepts.length === 0) {
    return undefined;
  }

  const isSpecial = qual?.isSpecialCondition ?? (special ? true : isSpecialConditionCode(trimmed));
  const category: QualificationCategory | string =
    qual?.kategori ??
    (special
      ? special.kategori
      : trimmed.startsWith('4')
      ? 'lisans_mezuniyet'
      : trimmed.startsWith('3')
      ? 'onlisans_mezuniyet'
      : trimmed.startsWith('2')
      ? 'ortaogretim_mezuniyet'
      : 'diger_ozel_sart');

  const title =
    qual?.kisaTanim ??
    special?.baslik ??
    matchingDepts[0]?.ad ??
    `Nitelik Kodu: ${trimmed}`;

  const description =
    qual?.aciklama ??
    special?.detay ??
    `ÖSYM Nitelik Kodu: ${trimmed}`;

  const ogrenimDuzeyi: EducationLevel | 'hepsi' =
    qual?.ogrenimDuzeyi ??
    (trimmed.startsWith('4')
      ? 'lisans'
      : trimmed.startsWith('3')
      ? 'onlisans'
      : trimmed.startsWith('2')
      ? 'ortaogretim'
      : 'hepsi');

  const eligibleDepartments = matchingDepts.map((d) => ({
    id: d.id,
    ad: d.ad,
    level: d.ogrenimDuzeyi,
  }));

  const bolumler =
    qual?.bolumler && qual.bolumler.length > 0
      ? qual.bolumler
      : matchingDepts.map((d) => d.ad);

  return {
    code: trimmed,
    kod: trimmed,
    title,
    kisaTanim: title,
    category,
    kategori: category,
    description,
    aciklama: description,
    isSpecialCondition: isSpecial,
    ogrenimDuzeyi,
    eligibleDepartments,
    bolumler,
    specialConditionDetails: special,
  };
}

// ============================================================================
// 3. Direct Kadro Code Lookup
// ============================================================================

export function searchKadroByCode(kadroKodu: string): PlacementRecord | undefined {
  const trimmed = (kadroKodu || '').trim();
  if (!trimmed) return undefined;

  // Exact 9-digit kadroKodu lookup in O(1)
  const byKadro = searchIndex.recordsByKadroKodu.get(trimmed);
  if (byKadro) return byKadro;

  // Fallback by deterministic ID
  return searchIndex.recordsById.get(trimmed);
}

// ============================================================================
// 4. Multi-Token Search with Turkish Character Folding (AND Semantics)
// ============================================================================

export function searchPlacements(query: string, options?: SearchOptions): PlacementRecord[] {
  const trimmed = (query || '').trim();
  const queryTokens = trimmed ? normalizeTrSearch(trimmed).split(/\s+/).filter(Boolean) : [];

  let candidateRecords: PlacementRecord[];

  if (queryTokens.length === 0) {
    // No text query: start from all records (or level-indexed records if specified)
    if (options?.ogrenimDuzeyi) {
      candidateRecords = searchIndex.recordsByEducationLevel.get(options.ogrenimDuzeyi) || [];
    } else {
      candidateRecords = Array.from(searchIndex.recordsById.values());
    }
  } else {
    // Token-based matching: find records matching ALL tokens (AND logic)
    // To achieve sub-millisecond search, we candidate-filter with token sets where possible,
    // and verify with full multi-token text corpus check.
    const allRecords = Array.from(searchIndex.recordsById.values());

    candidateRecords = allRecords.filter((record) => {
      const searchDoc = searchIndex.recordSearchCorpus.get(record.id);
      if (!searchDoc) return false;

      // Every query token must be present in the searchable document
      for (const token of queryTokens) {
        if (!searchDoc.includes(token)) {
          return false;
        }
      }
      return true;
    });
  }

  // Apply Structured Filter Options
  if (options) {
    // Education level
    if (options.ogrenimDuzeyi) {
      candidateRecords = candidateRecords.filter(
        (r) => r.ogrenimDuzeyi === options.ogrenimDuzeyi
      );
    }

    // Placement period(s)
    const periods = options.donemler || (options.donem ? (Array.isArray(options.donem) ? options.donem : [options.donem]) : undefined);
    if (periods && periods.length > 0) {
      const periodSet = new Set(periods);
      candidateRecords = candidateRecords.filter((r) => periodSet.has(r.donem));
    }

    // City / Cities (Turkish-aware normalized match)
    const rawCities = options.sehirler || (options.sehir ? (Array.isArray(options.sehir) ? options.sehir : [options.sehir]) : undefined);
    if (rawCities && rawCities.length > 0) {
      const cityNorms = new Set(rawCities.map((c) => normalizeTrSearch(c)));
      candidateRecords = candidateRecords.filter((r) => cityNorms.has(normalizeTrSearch(r.sehir)));
    }

    // Institution(s)
    const rawKurum = options.kurumlar || (options.kurum ? (Array.isArray(options.kurum) ? options.kurum : [options.kurum]) : undefined);
    if (rawKurum && rawKurum.length > 0) {
      const kurumNorms = rawKurum.map((k) => normalizeTrSearch(k));
      candidateRecords = candidateRecords.filter((r) => {
        const recordKurumNorm = normalizeTrSearch(r.kurumAdi);
        return kurumNorms.some((k) => recordKurumNorm.includes(k));
      });
    }

    // Title(s)
    const rawUnvan = options.unvanlar || (options.unvan ? (Array.isArray(options.unvan) ? options.unvan : [options.unvan]) : undefined);
    if (rawUnvan && rawUnvan.length > 0) {
      const unvanNorms = rawUnvan.map((u) => normalizeTrSearch(u));
      candidateRecords = candidateRecords.filter((r) => {
        const recordUnvanNorm = normalizeTrSearch(r.kadroUnvani);
        return unvanNorms.some((u) => recordUnvanNorm.includes(u));
      });
    }

    // Service class(es)
    const rawSinif = options.hizmetSiniflari || (options.hizmetSinifi ? (Array.isArray(options.hizmetSinifi) ? options.hizmetSinifi : [options.hizmetSinifi]) : undefined);
    if (rawSinif && rawSinif.length > 0) {
      const sinifSet = new Set(rawSinif);
      candidateRecords = candidateRecords.filter((r) => r.hizmetSinifi && sinifSet.has(r.hizmetSinifi));
    }

    // Qualification codes (AND logic: record must contain required qualification codes)
    if (options.nitelikKodlari && options.nitelikKodlari.length > 0) {
      const requiredCodes = options.nitelikKodlari;
      candidateRecords = candidateRecords.filter((r) => {
        const recordCodeSet = new Set(r.nitelikKodlari);
        return requiredCodes.every((code) => recordCodeSet.has(code));
      });
    }

    // Minimum score
    if (options.minPuan !== undefined) {
      const min = options.minPuan;
      candidateRecords = candidateRecords.filter((r) => r.tabanPuan !== null && r.tabanPuan >= min);
    }

    // Maximum score
    if (options.maxPuan !== undefined) {
      const max = options.maxPuan;
      candidateRecords = candidateRecords.filter((r) => r.tabanPuan !== null && r.tabanPuan <= max);
    }

    // Only positions with vacant quotas
    if (options.sadeceBosKalanlar) {
      candidateRecords = candidateRecords.filter((r) => r.bosKalan > 0);
    }

    // Sorting
    if (options.sortBy) {
      switch (options.sortBy) {
        case 'tabanPuanAsc':
          candidateRecords.sort((a, b) => {
            if (a.tabanPuan === null) return 1;
            if (b.tabanPuan === null) return -1;
            return a.tabanPuan - b.tabanPuan;
          });
          break;
        case 'tabanPuanDesc':
          candidateRecords.sort((a, b) => {
            if (a.tabanPuan === null) return 1;
            if (b.tabanPuan === null) return -1;
            return b.tabanPuan - a.tabanPuan;
          });
          break;
        case 'kontenjanDesc':
          candidateRecords.sort((a, b) => b.kontenjan - a.kontenjan);
          break;
        case 'kurumAdi':
          candidateRecords.sort((a, b) => a.kurumAdi.localeCompare(b.kurumAdi, 'tr'));
          break;
        case 'sehir':
          candidateRecords.sort((a, b) => a.sehir.localeCompare(b.sehir, 'tr'));
          break;
      }
    }

    // Pagination
    const offset = options.offset && options.offset > 0 ? options.offset : 0;
    if (options.limit && options.limit > 0) {
      return candidateRecords.slice(offset, offset + options.limit);
    } else if (offset > 0) {
      return candidateRecords.slice(offset);
    }
  }

  return candidateRecords;
}

// ============================================================================
// 5. "Atamaları Göster" Department Resolver
// ============================================================================

export function getPlacementsForDepartment(
  departmentIdOrCode: string,
  options?: { includeGeneral?: boolean }
): PlacementRecord[] {
  const trimmed = (departmentIdOrCode || '').trim();
  if (!trimmed) return [];

  // Step 1: Resolve the Department
  let dept: Department | undefined = searchIndex.departmentsById.get(trimmed);

  if (!dept) {
    // Check if passed a 4-digit code (e.g. "4531")
    const byCode = searchIndex.departmentsByCode.get(trimmed);
    if (byCode && byCode.length > 0) {
      dept = byCode[0];
    }
  }

  if (!dept) {
    // Check by normalized title
    const norm = normalizeTrSearch(trimmed);
    dept = DEPARTMENTS.find((d) => normalizeTrSearch(d.ad) === norm);
  }

  // If no structured Department object found, but a 4-digit code was provided:
  if (!dept && /^\d{4}$/.test(trimmed)) {
    return getPlacementsForQualificationCode(trimmed);
  }

  if (!dept) {
    return [];
  }

  // Step 2: Determine applicable qualification codes
  const targetCodes: string[] = [dept.nitelikKodu, ...dept.esdegerKodlar];

  if (options?.includeGeneral) {
    targetCodes.push(dept.genelNitelikKodu);
  }

  // Step 3: Fast retrieval and deduplication via inverted index
  const recordMap = new Map<string, PlacementRecord>();

  for (const code of targetCodes) {
    const list = searchIndex.recordsByQualificationCode.get(code);
    if (list) {
      for (const record of list) {
        if (!recordMap.has(record.id)) {
          recordMap.set(record.id, record);
        }
      }
    }
  }

  return Array.from(recordMap.values());
}

// ============================================================================
// 6. Direct Qualification Code Placement Resolver
// ============================================================================

export function getPlacementsForQualificationCode(code: string): PlacementRecord[] {
  const trimmed = (code || '').trim();
  if (!trimmed) return [];

  const records = searchIndex.recordsByQualificationCode.get(trimmed);
  return records ? [...records] : [];
}
