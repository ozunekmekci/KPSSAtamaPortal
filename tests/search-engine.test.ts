import { describe, it, expect } from 'vitest';
import {
  searchDepartments,
  searchByQualificationCode,
  searchKadroByCode,
  searchPlacements,
  getPlacementsForDepartment,
  getPlacementsForQualificationCode,
} from '@/lib/search-engine';
import { searchIndex, TITLE_ALIASES } from '@/lib/search-index';

describe('Milestone 2: Smart Department & Qualification Search Engine (R2)', () => {
  // ==========================================================================
  // 1. Department Auto-Discovery & Resilient Search
  // ==========================================================================
  describe('Department Auto-Discovery (searchDepartments)', () => {
    it('discovers Bilgisayar Mühendisliği -> 4531 with exact Turkish input', () => {
      const results = searchDepartments('Bilgisayar Mühendisliği');
      expect(results.length).toBeGreaterThan(0);
      const top = results[0];
      expect(top.ad).toBe('Bilgisayar Mühendisliği');
      expect(top.nitelikKodu).toBe('4531');
      expect(top.primaryCode).toBe('4531');
      expect(top.genelNitelikKodu).toBe('4001');
      expect(top.generalCode).toBe('4001');
      expect(top.esdegerKodlar).toContain('4539');
      expect(top.equivalentCodes).toContain('4539');
      expect(top.ogrenimDuzeyi).toBe('lisans');
    });

    it('discovers Bilgisayar Mühendisliği via ASCII transliteration "bilgisayar muhendisligi"', () => {
      const results = searchDepartments('bilgisayar muhendisligi');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].ad).toBe('Bilgisayar Mühendisliği');
      expect(results[0].primaryCode).toBe('4531');
    });

    it('discovers Bilgisayar Mühendisliği via Turkish uppercase "BİLGİSAYAR MÜHENDİSLİĞİ"', () => {
      const results = searchDepartments('BİLGİSAYAR MÜHENDİSLİĞİ');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].ad).toBe('Bilgisayar Mühendisliği');
      expect(results[0].primaryCode).toBe('4531');
    });

    it('discovers Adalet -> 3003 (Önlisans)', () => {
      const results = searchDepartments('Adalet');
      expect(results.length).toBeGreaterThan(0);
      const adalet = results.find((d) => d.ad === 'Adalet' && d.ogrenimDuzeyi === 'onlisans');
      expect(adalet).toBeDefined();
      expect(adalet?.nitelikKodu).toBe('3003');
      expect(adalet?.primaryCode).toBe('3003');
      expect(adalet?.generalCode).toBe('3001');
    });

    it('discovers Hemşirelik -> 4703 with Turkish and ASCII transliterations', () => {
      const resultsTr = searchDepartments('Hemşirelik');
      expect(resultsTr.length).toBeGreaterThan(0);
      expect(resultsTr[0].ad).toBe('Hemşirelik');
      expect(resultsTr[0].primaryCode).toBe('4703');
      expect(resultsTr[0].generalCode).toBe('4001');

      const resultsAscii = searchDepartments('hemsirelik');
      expect(resultsAscii.length).toBeGreaterThan(0);
      expect(resultsAscii[0].ad).toBe('Hemşirelik');
      expect(resultsAscii[0].primaryCode).toBe('4703');
    });

    it('discovers Hukuk -> 4419', () => {
      const results = searchDepartments('Hukuk');
      expect(results.length).toBeGreaterThan(0);
      const top = results[0];
      expect(top.ad).toBe('Hukuk');
      expect(top.primaryCode).toBe('4419');
      expect(top.generalCode).toBe('4001');
    });

    it('discovers department via direct 4-digit code query "4531"', () => {
      const results = searchDepartments('4531');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].primaryCode).toBe('4531');
      expect(results[0].ad).toBe('Bilgisayar Mühendisliği');
    });

    it('discovers department via keywords e.g. "ceng" -> Bilgisayar Mühendisliği', () => {
      const results = searchDepartments('ceng');
      expect(results.length).toBeGreaterThan(0);
      expect(results.some((d) => d.id === 'bilgisayar-muhendisligi')).toBe(true);
    });

    it('handles prefix queries like "bilgisayar", "hemsir", "huk"', () => {
      const r1 = searchDepartments('bilgisayar');
      expect(r1.length).toBeGreaterThan(0);
      expect(r1.some((d) => d.ad.includes('Bilgisayar'))).toBe(true);

      const r2 = searchDepartments('hemsir');
      expect(r2.length).toBeGreaterThan(0);
      expect(r2.some((d) => d.ad.includes('Hemşirelik'))).toBe(true);

      const r3 = searchDepartments('huk');
      expect(r3.length).toBeGreaterThan(0);
      expect(r3.some((d) => d.ad === 'Hukuk')).toBe(true);
    });

    it('handles typo-tolerant fuzzy matching (e.g. "bilgisayr", "hemsrelik")', () => {
      const r1 = searchDepartments('bilgisayr');
      expect(r1.length).toBeGreaterThan(0);
      expect(r1.some((d) => d.id === 'bilgisayar-muhendisligi')).toBe(true);

      const r2 = searchDepartments('hemsrelik');
      expect(r2.length).toBeGreaterThan(0);
      expect(r2.some((d) => d.id === 'hemsirelik')).toBe(true);
    });

    it('returns default departments when query is empty or whitespace', () => {
      const empty = searchDepartments('');
      expect(empty.length).toBeGreaterThan(0);
      expect(empty[0].primaryCode).toBeDefined();

      const spaces = searchDepartments('   ');
      expect(spaces.length).toBeGreaterThan(0);
    });

    it('respects limit parameter', () => {
      const limit5 = searchDepartments('mühendislik', 5);
      expect(limit5.length).toBeLessThanOrEqual(5);
    });
  });

  // ==========================================================================
  // 2. Direct 4-Digit Qualification Code Lookup (searchByQualificationCode)
  // ==========================================================================
  describe('Direct Qualification Code Search (searchByQualificationCode)', () => {
    it('resolves graduation code 4531 (Bilgisayar Mühendisliği)', () => {
      const res = searchByQualificationCode('4531');
      expect(res).toBeDefined();
      expect(res?.code).toBe('4531');
      expect(res?.kod).toBe('4531');
      expect(res?.title).toBe('Bilgisayar Mühendisliği');
      expect(res?.category).toBe('lisans_mezuniyet');
      expect(res?.isSpecialCondition).toBe(false);
      expect(res?.description).toContain('Bilgisayar Mühendisliği');
      expect(res?.eligibleDepartments.some((d) => d.ad === 'Bilgisayar Mühendisliği')).toBe(true);
    });

    it('resolves graduation code 3003 (Adalet)', () => {
      const res = searchByQualificationCode('3003');
      expect(res).toBeDefined();
      expect(res?.code).toBe('3003');
      expect(res?.title).toBe('Adalet');
      expect(res?.category).toBe('onlisans_mezuniyet');
      expect(res?.isSpecialCondition).toBe(false);
      expect(res?.description).toContain('Adalet');
      expect(res?.eligibleDepartments.some((d) => d.ad === 'Adalet')).toBe(true);
    });

    it('resolves special condition code 7225 (Güvenlik Tahkikatı)', () => {
      const res = searchByQualificationCode('7225');
      expect(res).toBeDefined();
      expect(res?.code).toBe('7225');
      expect(res?.isSpecialCondition).toBe(true);
      expect(res?.category).toBe('guvenlik_ve_vardiya');
      expect(res?.title).toBe('Güvenlik Tahkikatı');
      expect(res?.description.length).toBeGreaterThan(10);
    });

    it('resolves special condition code 6225 (Bilgisayar Sertifikası)', () => {
      const res = searchByQualificationCode('6225');
      expect(res).toBeDefined();
      expect(res?.code).toBe('6225');
      expect(res?.isSpecialCondition).toBe(true);
      expect(res?.category).toBe('bilgisayar_sertifika');
      expect(res?.title).toContain('Bilgisayar Sertifikası');
      expect(res?.description).toContain('Bilgisayar');
    });

    it('resolves general code 4001 (Tüm Lisans Mezunları)', () => {
      const res = searchByQualificationCode('4001');
      expect(res).toBeDefined();
      expect(res?.code).toBe('4001');
      expect(res?.category).toBe('genel_mezuniyet');
      expect(res?.isSpecialCondition).toBe(false);
      expect(res?.title).toBe('Tüm Lisans Mezunları');
      expect(res?.description).toContain('Herhangi bir lisans');
      expect(res?.eligibleDepartments.length).toBeGreaterThan(20);
      expect(res?.eligibleDepartments.every((d) => d.level === 'lisans')).toBe(true);
    });

    it('resolves general code 3001 (Tüm Önlisans Mezunları)', () => {
      const res = searchByQualificationCode('3001');
      expect(res).toBeDefined();
      expect(res?.code).toBe('3001');
      expect(res?.category).toBe('genel_mezuniyet');
      expect(res?.isSpecialCondition).toBe(false);
      expect(res?.title).toBe('Tüm Önlisans Mezunları');
      expect(res?.description).toContain('Herhangi bir önlisans');
      expect(res?.eligibleDepartments.length).toBeGreaterThan(10);
      expect(res?.eligibleDepartments.every((d) => d.level === 'onlisans')).toBe(true);
    });

    it('resolves general code 2001 (Tüm Ortaöğretim Mezunları)', () => {
      const res = searchByQualificationCode('2001');
      expect(res).toBeDefined();
      expect(res?.code).toBe('2001');
      expect(res?.category).toBe('genel_mezuniyet');
      expect(res?.isSpecialCondition).toBe(false);
      expect(res?.title).toBe('Tüm Ortaöğretim Mezunları');
      expect(res?.description).toContain('Ortaöğretim');
      expect(res?.eligibleDepartments.length).toBeGreaterThan(5);
      expect(res?.eligibleDepartments.every((d) => d.level === 'ortaogretim')).toBe(true);
    });

    it('rejects non-4-digit strings and non-existent codes', () => {
      expect(searchByQualificationCode('abc')).toBeUndefined();
      expect(searchByQualificationCode('12')).toBeUndefined();
      expect(searchByQualificationCode('12345')).toBeUndefined();
      expect(searchByQualificationCode('')).toBeUndefined();
      expect(searchByQualificationCode('9999')).toBeUndefined();
    });
  });

  // ==========================================================================
  // 3. Direct Kadro Code Search (searchKadroByCode)
  // ==========================================================================
  describe('Direct Kadro Code Lookup (searchKadroByCode)', () => {
    it('returns authentic placement record for known 9-digit kadro code', () => {
      const record = searchKadroByCode('300010001');
      expect(record).toBeDefined();
      expect(record?.kadroKodu).toBe('300010001');
      expect(record?.kurumAdi).toBe('DEVLET HAVA MEYDANLARI İŞLETMESİ GENEL MÜDÜRLÜĞÜ');
      expect(record?.kadroUnvani).toBe('MÜHENDİS (BİLGİSAYAR)');
      expect(record?.sehir).toBe('ANKARA');
      expect(record?.kontenjan).toBeGreaterThan(0);
      expect(record?.tabanPuan).toBeGreaterThan(0);
    });

    it('returns undefined for non-existent kadro code', () => {
      expect(searchKadroByCode('999999999')).toBeUndefined();
      expect(searchKadroByCode('')).toBeUndefined();
      expect(searchKadroByCode('invalid')).toBeUndefined();
    });
  });

  // ==========================================================================
  // 4. Multi-Token Search with Turkish Character Folding (searchPlacements)
  // ==========================================================================
  describe('Multi-Token Placement Search (searchPlacements)', () => {
    it('matches "dhmi ankara" with AND semantics across institution and city', () => {
      const records = searchPlacements('dhmi ankara');
      expect(records.length).toBeGreaterThan(0);
      for (const r of records) {
        expect(r.kurumAdi).toContain('DEVLET HAVA MEYDANLARI İŞLETMESİ');
        expect(r.sehir).toBe('ANKARA');
      }
    });

    it('matches both uppercase "DHMI ANKARA" and lowercase "dhmi ankara" identically', () => {
      const lower = searchPlacements('dhmi ankara');
      const upper = searchPlacements('DHMI ANKARA');
      const mixed = searchPlacements('DHMİ Ankara');
      expect(lower.length).toBe(upper.length);
      expect(lower.length).toBe(mixed.length);
      expect(lower.map((r) => r.id)).toEqual(upper.map((r) => r.id));
    });

    it('matches "bilgisayar muhendisligi" across cadre title and qualification descriptions', () => {
      const records = searchPlacements('bilgisayar muhendisligi');
      expect(records.length).toBeGreaterThan(0);
      expect(
        records.some(
          (r) =>
            r.kadroUnvani.includes('BİLGİSAYAR') ||
            r.nitelikKodlari.includes('4531') ||
            r.nitelikKodlari.includes('4539')
        )
      ).toBe(true);
    });

    it('matches "teias muhendis" specifically', () => {
      const records = searchPlacements('teias muhendis');
      expect(records.length).toBeGreaterThan(0);
      for (const r of records) {
        expect(r.kurumAdi).toContain('TÜRKİYE ELEKTRİK İLETİM');
        expect(r.kadroUnvani).toContain('MÜHENDİS');
      }
    });

    it('enforces AND semantics: "dhmi izmir" returns DHMİ positions in İzmir only', () => {
      const records = searchPlacements('dhmi izmir');
      expect(records.length).toBeGreaterThan(0);
      for (const r of records) {
        expect(r.kurumAdi).toContain('DEVLET HAVA MEYDANLARI İŞLETMESİ');
        expect(r.sehir).toBe('İZMİR');
      }
    });

    it('filters placements by SearchOptions (education level, period, score range)', () => {
      const lisansRecords = searchPlacements('ankara', { ogrenimDuzeyi: 'lisans' });
      expect(lisansRecords.length).toBeGreaterThan(0);
      expect(lisansRecords.every((r) => r.ogrenimDuzeyi === 'lisans')).toBe(true);

      const scoreFiltered = searchPlacements('', { minPuan: 85, maxPuan: 95 });
      expect(scoreFiltered.length).toBeGreaterThan(0);
      expect(scoreFiltered.every((r) => r.tabanPuan !== null && r.tabanPuan >= 85 && r.tabanPuan <= 95)).toBe(true);

      const sortedByScore = searchPlacements('', { sortBy: 'tabanPuanAsc', limit: 10 });
      expect(sortedByScore.length).toBe(10);
      for (let i = 1; i < sortedByScore.length; i++) {
        if (sortedByScore[i].tabanPuan !== null && sortedByScore[i - 1].tabanPuan !== null) {
          expect(sortedByScore[i].tabanPuan!).toBeGreaterThanOrEqual(sortedByScore[i - 1].tabanPuan!);
        }
      }
    });
  });

  // ==========================================================================
  // 5. "Atamaları Göster" Resolvers (getPlacementsForDepartment & getPlacementsForQualificationCode)
  // ==========================================================================
  describe('"Atamaları Göster" Resolvers', () => {
    it('returns authentic placement records for department ID "bilgisayar-muhendisligi"', () => {
      const records = getPlacementsForDepartment('bilgisayar-muhendisligi');
      expect(records.length).toBe(60);
      expect(records.every((r) => r.nitelikKodlari.includes('4531') || r.nitelikKodlari.includes('4539'))).toBe(true);
    });

    it('expands with general code 4001 when includeGeneral is true', () => {
      const specific = getPlacementsForDepartment('bilgisayar-muhendisligi', { includeGeneral: false });
      const withGeneral = getPlacementsForDepartment('bilgisayar-muhendisligi', { includeGeneral: true });
      expect(specific.length).toBe(60);
      expect(withGeneral.length).toBe(93); // 60 specific + 33 general 4001
      expect(withGeneral.length).toBeGreaterThan(specific.length);
    });

    it('resolves by qualification code "4531" in getPlacementsForDepartment', () => {
      const records = getPlacementsForDepartment('4531');
      expect(records.length).toBe(60);
      expect(records.every((r) => r.nitelikKodlari.includes('4531'))).toBe(true);
    });

    it('resolves Adalet önlisans placements (code 3003)', () => {
      const byId = getPlacementsForDepartment('adalet-onlisans');
      expect(byId.length).toBe(24);
      expect(byId.every((r) => r.ogrenimDuzeyi === 'onlisans')).toBe(true);

      const byCode = getPlacementsForDepartment('3003');
      expect(byCode.length).toBe(24);
    });

    it('resolves Hemşirelik placements (code 4703)', () => {
      const records = getPlacementsForDepartment('hemsirelik');
      expect(records.length).toBe(9);
      expect(records.every((r) => r.nitelikKodlari.includes('4703'))).toBe(true);

      const byCode = getPlacementsForDepartment('4703');
      expect(byCode.length).toBe(9);
    });

    it('resolves Hukuk placements (code 4419)', () => {
      const records = getPlacementsForDepartment('hukuk');
      expect(records.length).toBe(30);
      expect(records.every((r) => r.nitelikKodlari.includes('4419'))).toBe(true);

      const byCode = getPlacementsForDepartment('4419');
      expect(byCode.length).toBe(30);
    });

    it('returns placements for direct qualification code lookup via getPlacementsForQualificationCode', () => {
      const p4531 = getPlacementsForQualificationCode('4531');
      expect(p4531.length).toBe(60);
      expect(p4531.every((r) => r.nitelikKodlari.includes('4531'))).toBe(true);

      const p7225 = getPlacementsForQualificationCode('7225');
      expect(p7225.length).toBe(252);
      expect(p7225.every((r) => r.nitelikKodlari.includes('7225'))).toBe(true);

      const p6225 = getPlacementsForQualificationCode('6225');
      expect(p6225.length).toBe(120);
      expect(p6225.every((r) => r.nitelikKodlari.includes('6225'))).toBe(true);

      const p4001 = getPlacementsForQualificationCode('4001');
      expect(p4001.length).toBe(33);
      expect(p4001.every((r) => r.nitelikKodlari.includes('4001'))).toBe(true);

      const p3001 = getPlacementsForQualificationCode('3001');
      expect(p3001.length).toBe(51);
      expect(p3001.every((r) => r.nitelikKodlari.includes('3001'))).toBe(true);

      const p2001 = getPlacementsForQualificationCode('2001');
      expect(p2001.length).toBe(54);
      expect(p2001.every((r) => r.nitelikKodlari.includes('2001'))).toBe(true);

      const nonExistent = getPlacementsForQualificationCode('9999');
      expect(nonExistent).toEqual([]);
    });

    it('returns empty array when passed unknown or empty department', () => {
      expect(getPlacementsForDepartment('')).toEqual([]);
      expect(getPlacementsForDepartment('non-existent-dept')).toEqual([]);
    });
  });

  // ==========================================================================
  // 6. Performance & Sub-Millisecond Index Retrieval
  // ==========================================================================
  describe('In-Memory Index Performance', () => {
    it('executes 1000 inverted index lookups in under 50ms', () => {
      const t0 = performance.now();
      for (let i = 0; i < 1000; i++) {
        searchByQualificationCode('4531');
        searchKadroByCode('300010001');
        getPlacementsForQualificationCode('4531');
      }
      const t1 = performance.now();
      const elapsed = t1 - t0;
      expect(elapsed).toBeLessThan(50);
    });

    it('verifies searchIndex has pre-computed data structures populated', () => {
      expect(searchIndex.recordsById.size).toBe(702);
      expect(searchIndex.recordsByKadroKodu.size).toBe(702);
      expect(searchIndex.recordsByQualificationCode.size).toBeGreaterThan(30);
      expect(searchIndex.recordsByCity.size).toBeGreaterThan(30);
      expect(searchIndex.recordSearchCorpus.size).toBe(702);
      expect(searchIndex.tokenToRecordIds.size).toBeGreaterThan(500);
    });
  });

  // ==========================================================================
  // 7. Challenger 2 Refinements
  // ==========================================================================
  describe('Challenger 2 Refinements', () => {
    it('verifies TITLE_ALIASES maps "vhki" and "v.h.k.i." to "veri hazirlama ve kontrol isletmeni"', () => {
      expect(TITLE_ALIASES['vhki']).toBeDefined();
      expect(TITLE_ALIASES['vhki']).toContain('veri hazirlama ve kontrol isletmeni');

      expect(TITLE_ALIASES['v.h.k.i.']).toBeDefined();
      expect(TITLE_ALIASES['v.h.k.i.']).toContain('veri hazirlama ve kontrol isletmeni');

      // Check searchPlacements resolves vhki and v.h.k.i. queries
      const vhkiResults = searchPlacements('vhki');
      expect(vhkiResults.length).toBeGreaterThan(0);
      expect(
        vhkiResults.some((r) => r.kadroUnvani.includes('V.H.K.İ.') || r.kadroUnvani.includes('VERİ'))
      ).toBe(true);

      const dotResults = searchPlacements('v.h.k.i.');
      expect(dotResults.length).toBeGreaterThan(0);
    });

    it('ensures pure punctuation queries return empty array gracefully without errors', () => {
      expect(searchPlacements('...')).toEqual([]);
      expect(searchPlacements('???')).toEqual([]);
      expect(searchPlacements('---')).toEqual([]);
      expect(searchPlacements('!@#$%^&*()')).toEqual([]);
      expect(searchDepartments('...')).toEqual([]);
      expect(getPlacementsForDepartment('...')).toEqual([]);
    });
  });
});
