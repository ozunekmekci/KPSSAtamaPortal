import { describe, it, expect } from 'vitest';
import {
  filterPlacements,
  getFilterFacets,
  paginatePlacements,
  filterCriteriaToSearchParams,
  searchParamsToFilterCriteria,
  ExtendedFilterCriteria,
} from '@/lib/filter-engine';
import { PLACEMENT_RECORDS } from '@/data/records';
import { PlacementRecord } from '@/types/kpss';

describe('Filter Engine — Multi-Criteria Filtering', () => {
  const sampleRecords: PlacementRecord[] = [
    {
      id: '2024/1-lisans-1001',
      kadroKodu: '1001',
      donem: '2024/1',
      ogrenimDuzeyi: 'lisans',
      puanTuru: 'P3',
      kurumAdi: 'DEVLET HAVA MEYDANLARI İŞLETMESİ GENEL MÜDÜRLÜĞÜ',
      kadroUnvani: 'BİLGİSAYAR MÜHENDİSİ',
      hizmetSinifi: 'TH',
      sehir: 'ANKARA',
      kontenjan: 10,
      yerlesen: 10,
      bosKalan: 0,
      tabanPuan: 88.5,
      tavanPuan: 94.2,
      nitelikKodlari: ['4531', '7113'],
      mezuniyetKodlari: ['4531'],
      ozelSartlar: ['7113'],
    },
    {
      id: '2024/1-lisans-1002',
      kadroKodu: '1002',
      donem: '2024/1',
      ogrenimDuzeyi: 'lisans',
      puanTuru: 'P3',
      kurumAdi: 'SOSYAL GÜVENLİK KURUMU BAŞKANLIĞI',
      kadroUnvani: 'V.H.K.İ.',
      hizmetSinifi: 'GİH',
      sehir: 'İZMİR',
      kontenjan: 5,
      yerlesen: 5,
      bosKalan: 0,
      tabanPuan: 75.5,
      tavanPuan: 81.0,
      nitelikKodlari: ['4001', '6225'],
      mezuniyetKodlari: ['4001'],
      ozelSartlar: ['6225'],
    },
    {
      id: '2024/2-onlisans-2001',
      kadroKodu: '2001',
      donem: '2024/2',
      ogrenimDuzeyi: 'onlisans',
      puanTuru: 'P93',
      kurumAdi: 'DEVLET SU İŞLERİ GENEL MÜDÜRLÜĞÜ',
      kadroUnvani: 'TEKNİKER',
      hizmetSinifi: 'TH',
      sehir: 'İSTANBUL',
      kontenjan: 8,
      yerlesen: 6,
      bosKalan: 2,
      tabanPuan: 81.25,
      tavanPuan: 85.0,
      nitelikKodlari: ['3249'],
      mezuniyetKodlari: ['3249'],
      ozelSartlar: [],
    },
    {
      id: '2025/1-ortaogretim-3001',
      kadroKodu: '3001',
      donem: '2025/1',
      ogrenimDuzeyi: 'ortaogretim',
      puanTuru: 'P94',
      kurumAdi: 'KARAYOLLARI GENEL MÜDÜRLÜĞÜ',
      kadroUnvani: 'TEKNİSYEN',
      hizmetSinifi: 'TH',
      sehir: 'ANKARA',
      kontenjan: 4,
      yerlesen: 0,
      bosKalan: 4,
      tabanPuan: null,
      tavanPuan: null,
      nitelikKodlari: ['2001'],
      mezuniyetKodlari: ['2001'],
      ozelSartlar: [],
    },
  ];

  describe('1. Dimension Filtering in Isolation', () => {
    it('filters by educational level correctly (case-insensitive)', () => {
      const lisans = filterPlacements(sampleRecords, { ogrenimDuzeyi: 'lisans' });
      expect(lisans).toHaveLength(2);
      expect(lisans.every((r) => r.ogrenimDuzeyi === 'lisans')).toBe(true);

      const onlisans = filterPlacements(sampleRecords, { ogrenimDuzeyi: 'onlisans' });
      expect(onlisans).toHaveLength(1);
      expect(onlisans[0].kadroKodu).toBe('2001');

      const ortaogretim = filterPlacements(sampleRecords, { ogrenimDuzeyi: 'ortaogretim' });
      expect(ortaogretim).toHaveLength(1);
      expect(ortaogretim[0].kadroKodu).toBe('3001');
    });

    it('filters by placement period (single and multi-select)', () => {
      const p1 = filterPlacements(sampleRecords, { donemler: ['2024/1'] });
      expect(p1).toHaveLength(2);

      const multiP = filterPlacements(sampleRecords, { donemler: ['2024/1', '2024/2'] });
      expect(multiP).toHaveLength(3);

      const nonexistent = filterPlacements(sampleRecords, { donemler: ['2026/1'] });
      expect(nonexistent).toHaveLength(0);
    });

    it('filters by city with Turkish character normalization', () => {
      const ankara = filterPlacements(sampleRecords, { sehirler: ['ANKARA'] });
      expect(ankara).toHaveLength(2);

      // Lowercase ASCII input should match Turkish uppercase İZMİR
      const izmir = filterPlacements(sampleRecords, { sehirler: ['izmir'] });
      expect(izmir).toHaveLength(1);
      expect(izmir[0].sehir).toBe('İZMİR');

      // Multi-city
      const multi = filterPlacements(sampleRecords, { sehirler: ['ANKARA', 'İSTANBUL'] });
      expect(multi).toHaveLength(3);
    });

    it('filters by institution name with substring matching', () => {
      const dhmi = filterPlacements(sampleRecords, { kurumlar: ['HAVA MEYDANLARI'] });
      expect(dhmi).toHaveLength(1);
      expect(dhmi[0].kadroKodu).toBe('1001');

      const sgkAndDsi = filterPlacements(sampleRecords, {
        kurumlar: ['SOSYAL GÜVENLİK', 'DEVLET SU İŞLERİ'],
      });
      expect(sgkAndDsi).toHaveLength(2);
    });

    it('filters by cadre title', () => {
      const muhendis = filterPlacements(sampleRecords, { unvanlar: ['MÜHENDİSİ'] });
      expect(muhendis).toHaveLength(1);
      expect(muhendis[0].kadroUnvani).toBe('BİLGİSAYAR MÜHENDİSİ');

      const vhki = filterPlacements(sampleRecords, { unvanlar: ['V.H.K.İ.'] });
      expect(vhki).toHaveLength(1);
      expect(vhki[0].kadroUnvani).toBe('V.H.K.İ.');
    });

    it('filters by public service class', () => {
      const th = filterPlacements(sampleRecords, { hizmetSiniflari: ['TH'] });
      expect(th).toHaveLength(3);

      const gih = filterPlacements(sampleRecords, { hizmetSiniflari: ['GİH'] });
      expect(gih).toHaveLength(1);
      expect(gih[0].kadroKodu).toBe('1002');
    });

    it('filters by unfilled quota toggle (sadeceBosKalanlar)', () => {
      const unfilled = filterPlacements(sampleRecords, { sadeceBosKalanlar: true });
      expect(unfilled).toHaveLength(2);
      expect(unfilled.every((r) => r.bosKalan > 0)).toBe(true);

      const filled = filterPlacements(sampleRecords, { sadeceBosKalanlar: false });
      expect(filled).toHaveLength(4);
    });
  });

  describe('2. Score Range Float Precision & Boundary Conditions', () => {
    it('filters by minPuan with float precision', () => {
      // 81.25 should include 81.25 and 88.5, exclude 75.5 and null
      const minFiltered = filterPlacements(sampleRecords, { minPuan: 81.25 });
      expect(minFiltered).toHaveLength(2);
      expect(minFiltered.map((r) => r.tabanPuan)).toEqual([88.5, 81.25]);
    });

    it('filters by maxPuan with float precision', () => {
      // max 81.25 should include 75.5 and 81.25, exclude 88.5 and null
      const maxFiltered = filterPlacements(sampleRecords, { maxPuan: 81.25 });
      expect(maxFiltered).toHaveLength(2);
      expect(maxFiltered.map((r) => r.tabanPuan)).toEqual([75.5, 81.25]);
    });

    it('filters by closed score range [75.5, 85.25]', () => {
      const rangeFiltered = filterPlacements(sampleRecords, {
        minPuan: 75.5,
        maxPuan: 85.25,
      });
      expect(rangeFiltered).toHaveLength(2);
      expect(rangeFiltered.map((r) => r.tabanPuan)).toEqual([75.5, 81.25]);
    });

    it('excludes null scores when minPuan or maxPuan is specified', () => {
      const withScoreFilter = filterPlacements(sampleRecords, { minPuan: 50.0 });
      expect(withScoreFilter.every((r) => r.tabanPuan !== null)).toBe(true);
      expect(withScoreFilter.find((r) => r.kadroKodu === '3001')).toBeUndefined();
    });

    it('returns empty array when score range has no matches', () => {
      const empty = filterPlacements(sampleRecords, { minPuan: 99.0, maxPuan: 100.0 });
      expect(empty).toHaveLength(0);
    });
  });

  describe('3. Qualification Codes & General Codes Logic', () => {
    it('matches when post requires ANY of given qualification codes', () => {
      const match1 = filterPlacements(sampleRecords, { nitelikKodlari: ['4531'] });
      expect(match1).toHaveLength(1);
      expect(match1[0].kadroKodu).toBe('1001');

      const matchMulti = filterPlacements(sampleRecords, {
        nitelikKodlari: ['4531', '3249'],
      });
      expect(matchMulti).toHaveLength(2);
    });

    it('includes general codes (4001, 3001, 2001) when includeGeneralCodes is true', () => {
      // If user queries 4531 without general codes, only post 1001 matches
      const specificOnly = filterPlacements(sampleRecords, {
        nitelikKodlari: ['4531'],
        includeGeneralCodes: false,
      });
      expect(specificOnly).toHaveLength(1);
      expect(specificOnly[0].kadroKodu).toBe('1001');

      // With general codes included, post 1002 (requires 4001) and post 3001 (requires 2001) also match
      const withGeneral = filterPlacements(sampleRecords, {
        nitelikKodlari: ['4531'],
        includeGeneralCodes: true,
      });
      expect(withGeneral).toHaveLength(3);
      expect(withGeneral.map((r) => r.kadroKodu)).toContain('1001');
      expect(withGeneral.map((r) => r.kadroKodu)).toContain('1002');
      expect(withGeneral.map((r) => r.kadroKodu)).toContain('3001');
    });
  });

  describe('4. Free Text Search & Punctuation Resilience', () => {
    it('searches across institution, title, city, and codes', () => {
      const searchInst = filterPlacements(sampleRecords, { searchQuery: 'DHMİ' });
      expect(searchInst).toHaveLength(1);
      expect(searchInst[0].kadroKodu).toBe('1001');

      const searchTitle = filterPlacements(sampleRecords, { searchQuery: 'tekniker' });
      expect(searchTitle).toHaveLength(1);
      expect(searchTitle[0].kadroKodu).toBe('2001');
    });

    it('pure punctuation queries gracefully return empty array', () => {
      expect(filterPlacements(sampleRecords, { searchQuery: '...' })).toEqual([]);
      expect(filterPlacements(sampleRecords, { searchQuery: '???' })).toEqual([]);
      expect(filterPlacements(sampleRecords, { searchQuery: '---' })).toEqual([]);
    });

    it('whitespace-only queries do not restrict results', () => {
      const wsResult = filterPlacements(sampleRecords, { searchQuery: '   ' });
      expect(wsResult).toHaveLength(4);
    });
  });

  describe('5. Multi-Variable Combinations', () => {
    it('correctly filters combination of Level + City + Period + Score', () => {
      const combined = filterPlacements(sampleRecords, {
        ogrenimDuzeyi: 'lisans',
        sehirler: ['ANKARA'],
        donemler: ['2024/1'],
        minPuan: 80.0,
      });
      expect(combined).toHaveLength(1);
      expect(combined[0].kadroKodu).toBe('1001');
    });

    it('returns empty when one criterion in combination fails', () => {
      const combined = filterPlacements(sampleRecords, {
        ogrenimDuzeyi: 'lisans',
        sehirler: ['ANKARA'],
        minPuan: 95.0, // DHMİ is 88.5
      });
      expect(combined).toHaveLength(0);
    });
  });

  describe('6. Sorting Support', () => {
    it('sorts by tabanPuanAsc (lowest first, nulls at the end)', () => {
      const sorted = filterPlacements(sampleRecords, { sortBy: 'tabanPuanAsc' });
      expect(sorted.map((r) => r.tabanPuan)).toEqual([75.5, 81.25, 88.5, null]);
    });

    it('sorts by tabanPuanDesc (highest first, nulls at the end)', () => {
      const sorted = filterPlacements(sampleRecords, { sortBy: 'tabanPuanDesc' });
      expect(sorted.map((r) => r.tabanPuan)).toEqual([88.5, 81.25, 75.5, null]);
    });

    it('sorts by kontenjanDesc (largest quota first)', () => {
      const sorted = filterPlacements(sampleRecords, { sortBy: 'kontenjanDesc' });
      expect(sorted.map((r) => r.kontenjan)).toEqual([10, 8, 5, 4]);
    });

    it('sorts by kurumAdiAsc alphabetically', () => {
      const sorted = filterPlacements(sampleRecords, { sortBy: 'kurumAdiAsc' });
      expect(sorted[0].kurumAdi).toContain('DEVLET HAVA MEYDANLARI');
      expect(sorted[sorted.length - 1].kurumAdi).toContain('SOSYAL GÜVENLİK');
    });

    it('sorts by unvanAsc alphabetically', () => {
      const sorted = filterPlacements(sampleRecords, { sortBy: 'unvanAsc' });
      expect(sorted[0].kadroUnvani).toBe('BİLGİSAYAR MÜHENDİSİ');
      expect(sorted[sorted.length - 1].kadroUnvani).toBe('V.H.K.İ.');
    });
  });

  describe('7. Pagination Support', () => {
    it('slices records using page and pageSize in criteria', () => {
      const p1 = filterPlacements(sampleRecords, { page: 1, pageSize: 2 });
      expect(p1).toHaveLength(2);
      expect(p1.map((r) => r.kadroKodu)).toEqual(['1001', '1002']);

      const p2 = filterPlacements(sampleRecords, { page: 2, pageSize: 2 });
      expect(p2).toHaveLength(2);
      expect(p2.map((r) => r.kadroKodu)).toEqual(['2001', '3001']);

      const p3 = filterPlacements(sampleRecords, { page: 3, pageSize: 2 });
      expect(p3).toHaveLength(0);
    });

    it('paginatePlacements calculates totalPages and current page metadata', () => {
      const paginated = paginatePlacements(sampleRecords, 1, 2);
      expect(paginated.total).toBe(4);
      expect(paginated.pageSize).toBe(2);
      expect(paginated.totalPages).toBe(2);
      expect(paginated.page).toBe(1);
      expect(paginated.data).toHaveLength(2);

      const overflow = paginatePlacements(sampleRecords, 99, 2);
      expect(overflow.page).toBe(2); // clamped to totalPages
      expect(overflow.data).toHaveLength(2);
    });
  });

  describe('8. Facet Extraction (getFilterFacets)', () => {
    it('computes distinct cities, institutions, titles, and score ranges', () => {
      const facets = getFilterFacets(sampleRecords);
      expect(facets.cities).toEqual(['ANKARA', 'İSTANBUL', 'İZMİR']);
      expect(facets.institutions).toHaveLength(4);
      expect(facets.titles).toHaveLength(4);
      expect(facets.serviceClasses).toEqual(['GİH', 'TH']);
      expect(facets.periods).toEqual(['2024/1', '2024/2', '2025/1']);
      expect(facets.educationLevels).toEqual(['lisans', 'onlisans', 'ortaogretim']);
      expect(facets.minScore).toBe(75.5);
      expect(facets.maxScore).toBe(88.5);
      expect(facets.totalCount).toBe(4);
      expect(facets.totalQuota).toBe(27); // 10 + 5 + 8 + 4
      expect(facets.totalVacant).toBe(6); // 0 + 0 + 2 + 4
    });

    it('handles empty records set without errors', () => {
      const facets = getFilterFacets([]);
      expect(facets.cities).toEqual([]);
      expect(facets.minScore).toBeNull();
      expect(facets.maxScore).toBeNull();
      expect(facets.totalCount).toBe(0);
      expect(facets.totalQuota).toBe(0);
      expect(facets.totalVacant).toBe(0);
    });
  });

  describe('9. URL Search Params Bidirectional Synchronization', () => {
    it('serializes ExtendedFilterCriteria into URLSearchParams', () => {
      const criteria: ExtendedFilterCriteria = {
        ogrenimDuzeyi: 'lisans',
        donemler: ['2024/1', '2024/2'],
        sehirler: ['ANKARA', 'İZMİR'],
        kurumlar: ['SGK'],
        unvanlar: ['MÜHENDİS'],
        hizmetSiniflari: ['TH'],
        nitelikKodlari: ['4531', '7113'],
        minPuan: 75.5,
        maxPuan: 92.25,
        sadeceBosKalanlar: true,
        includeGeneralCodes: true,
        searchQuery: 'bilgisayar',
        sortBy: 'tabanPuanAsc',
        page: 2,
        pageSize: 50,
      };

      const params = filterCriteriaToSearchParams(criteria);
      expect(params.get('ogrenimDuzeyi')).toBe('lisans');
      expect(params.get('donemler')).toBe('2024/1,2024/2');
      expect(params.get('sehirler')).toBe('ANKARA,İZMİR');
      expect(params.get('minPuan')).toBe('75.5');
      expect(params.get('maxPuan')).toBe('92.25');
      expect(params.get('sadeceBosKalanlar')).toBe('true');
      expect(params.get('includeGeneralCodes')).toBe('true');
      expect(params.get('q')).toBe('bilgisayar');
      expect(params.get('sortBy')).toBe('tabanPuanAsc');
      expect(params.get('page')).toBe('2');
      expect(params.get('pageSize')).toBe('50');
    });

    it('round-trips criteria -> URLSearchParams -> criteria identically', () => {
      const original: ExtendedFilterCriteria = {
        ogrenimDuzeyi: 'lisans',
        donemler: ['2024/1'],
        sehirler: ['ANKARA'],
        kurumlar: ['DHMİ'],
        unvanlar: ['MÜHENDİS'],
        hizmetSiniflari: ['TH'],
        nitelikKodlari: ['4531'],
        minPuan: 80.5,
        maxPuan: 95.0,
        sadeceBosKalanlar: true,
        includeGeneralCodes: true,
        searchQuery: 'yazılım',
        sortBy: 'kontenjanDesc',
        page: 3,
        pageSize: 10,
      };

      const params = filterCriteriaToSearchParams(original);
      const parsed = searchParamsToFilterCriteria(params);

      expect(parsed).toEqual(original);
    });

    it('serializes and round-trips institution names containing commas using pipe delimiter', () => {
      const instWithComma = 'ÇEVRE, ŞEHİRCİLİK VE İKLİM DEĞİŞİKLİĞİ BAKANLIĞI';
      const original: ExtendedFilterCriteria = {
        kurumlar: ['DEVLET HAVA MEYDANLARI', instWithComma],
      };

      const params = filterCriteriaToSearchParams(original);
      expect(params.get('kurumlar')).toBe(`DEVLET HAVA MEYDANLARI|${instWithComma}`);

      const parsed = searchParamsToFilterCriteria(params);
      expect(parsed.kurumlar).toEqual(['DEVLET HAVA MEYDANLARI', instWithComma]);
    });

    it('parses raw query string and handles invalid parameter values gracefully', () => {
      const queryString =
        '?ogrenimDuzeyi=onlisans&minPuan=abc&maxPuan=85.5&sadeceBosKalanlar=1&q=tekniker&page=invalid';
      const parsed = searchParamsToFilterCriteria(queryString);

      expect(parsed.ogrenimDuzeyi).toBe('onlisans');
      expect(parsed.minPuan).toBeUndefined(); // 'abc' is ignored
      expect(parsed.maxPuan).toBe(85.5);
      expect(parsed.sadeceBosKalanlar).toBe(true);
      expect(parsed.searchQuery).toBe('tekniker');
      expect(parsed.page).toBeUndefined(); // 'invalid' ignored
    });
  });

  describe('10. Live Dataset Verification', () => {
    it('runs multi-criteria filter against real PLACEMENT_RECORDS dataset', () => {
      const results = filterPlacements(PLACEMENT_RECORDS, {
        ogrenimDuzeyi: 'lisans',
        donemler: ['2024/1'],
        minPuan: 85.0,
      });

      expect(results.length).toBeGreaterThan(0);
      expect(results.every((r) => r.ogrenimDuzeyi === 'lisans')).toBe(true);
      expect(results.every((r) => r.donem === '2024/1')).toBe(true);
      expect(results.every((r) => (r.tabanPuan ?? 0) >= 85.0)).toBe(true);
    });
  });
});
