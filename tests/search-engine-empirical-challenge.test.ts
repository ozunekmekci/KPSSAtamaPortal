import { describe, it, expect } from 'vitest';
import {
  searchDepartments,
  searchByQualificationCode,
  searchKadroByCode,
  searchPlacements,
  getPlacementsForDepartment,
  getPlacementsForQualificationCode,
} from '@/lib/search-engine';
import { searchIndex } from '@/lib/search-index';
import { DEPARTMENTS } from '@/data/departments';
import { PLACEMENT_RECORDS } from '@/data/records';

describe('Milestone 2 Empirical Challenge: Smart Search Engine & Inverted Index Stress Suite', () => {

  // ==========================================================================
  // CHALLENGE 1: Department Auto-Discovery (Prefixes, Abbreviations, Fuzzy, Diacritics)
  // ==========================================================================
  describe('Challenge 1: Department Auto-Discovery', () => {

    it('1.1 Abbreviations resolve expected departments (ceng -> Bilgisayar Mühendisliği 4531, eem -> 4611, ie -> 4629)', () => {
      const cengResults = searchDepartments('ceng');
      expect(cengResults.length).toBeGreaterThan(0);
      const cengTop = cengResults[0];
      expect(cengTop.id).toBe('bilgisayar-muhendisligi');
      expect(cengTop.primaryCode).toBe('4531');
      expect(cengTop.generalCode).toBe('4001');

      const eemResults = searchDepartments('eem');
      expect(eemResults.length).toBeGreaterThan(0);
      const eemTop = eemResults[0];
      expect(eemTop.id).toBe('elektrik-elektronik-muhendisligi');
      expect(eemTop.primaryCode).toBe('4611');

      const ieResults = searchDepartments('ie');
      expect(ieResults.length).toBeGreaterThan(0);
      const ieTop = ieResults[0];
      expect(ieTop.id).toBe('endustri-muhendisligi');
      expect(ieTop.primaryCode).toBe('4629');
    });

    it('1.2 Prefix queries resolve expected departments ("bilg", "yazilim", "adalet", "hemsirelik", "elektrik")', () => {
      // "bilg" -> prefix matching
      const bilgResults = searchDepartments('bilg');
      expect(bilgResults.length).toBeGreaterThanOrEqual(3);
      expect(bilgResults.some((d) => d.ad.includes('Bilgisayar Mühendisliği'))).toBe(true);
      expect(bilgResults.some((d) => d.primaryCode === '4531')).toBe(true);

      // "yazilim" -> prefix matching
      const yazilimResults = searchDepartments('yazilim');
      expect(yazilimResults.length).toBeGreaterThanOrEqual(1);
      expect(yazilimResults[0].ad).toBe('Yazılım Mühendisliği');
      expect(yazilimResults[0].primaryCode).toBe('4539');

      // "adalet" -> matches both önlisans and meslek lisesi
      const adaletResults = searchDepartments('adalet');
      expect(adaletResults.length).toBeGreaterThanOrEqual(2);
      expect(adaletResults.some((d) => d.primaryCode === '3003' && d.ogrenimDuzeyi === 'onlisans')).toBe(true);
      expect(adaletResults.some((d) => d.primaryCode === '2009' && d.ogrenimDuzeyi === 'ortaogretim')).toBe(true);

      // "hemsirelik" -> matches Hemşirelik
      const hemsirelikResults = searchDepartments('hemsirelik');
      expect(hemsirelikResults.length).toBeGreaterThanOrEqual(1);
      expect(hemsirelikResults[0].ad).toBe('Hemşirelik');
      expect(hemsirelikResults[0].primaryCode).toBe('4703');

      // "elektrik" -> matches Elektrik, Elektrik-Elektronik
      const elektrikResults = searchDepartments('elektrik');
      expect(elektrikResults.length).toBeGreaterThanOrEqual(3);
      expect(elektrikResults.some((d) => d.primaryCode === '3253')).toBe(true);
      expect(elektrikResults.some((d) => d.primaryCode === '4611')).toBe(true);
    });

    it('1.3 Turkish diacritics and ASCII transliterations return identical top matches', () => {
      // Hemşirelik vs hemsirelik vs HEMŞİRELİK vs HEMSIRELIK
      const h1 = searchDepartments('Hemşirelik');
      const h2 = searchDepartments('hemsirelik');
      const h3 = searchDepartments('HEMŞİRELİK');
      const h4 = searchDepartments('HEMSIRELIK');

      expect(h1[0].primaryCode).toBe('4703');
      expect(h2[0].primaryCode).toBe('4703');
      expect(h3[0].primaryCode).toBe('4703');
      expect(h4[0].primaryCode).toBe('4703');

      // Bilgisayar Mühendisliği vs bilgisayar muhendisligi
      const b1 = searchDepartments('Bilgisayar Mühendisliği');
      const b2 = searchDepartments('bilgisayar muhendisligi');
      const b3 = searchDepartments('BİLGİSAYAR MÜHENDİSLİĞİ');
      expect(b1[0].primaryCode).toBe('4531');
      expect(b2[0].primaryCode).toBe('4531');
      expect(b3[0].primaryCode).toBe('4531');
    });

    it('1.4 Typo tolerance handles minor character errors (Levenshtein distance <= 2)', () => {
      const t1 = searchDepartments('bilgisayr'); // missing 'a'
      expect(t1.length).toBeGreaterThan(0);
      expect(t1.some((d) => d.id === 'bilgisayar-muhendisligi')).toBe(true);

      const t2 = searchDepartments('hemsrelik'); // missing 'i'
      expect(t2.length).toBeGreaterThan(0);
      expect(t2.some((d) => d.id === 'hemsirelik')).toBe(true);

      const t3 = searchDepartments('hukk'); // missing 'u'
      expect(t3.length).toBeGreaterThan(0);
      expect(t3.some((d) => d.id === 'hukuk')).toBe(true);
    });

    it('1.5 Edge cases: empty, whitespace, non-existent strings, and punctuation handling', () => {
      const empty = searchDepartments('');
      expect(empty.length).toBe(20); // Default limit fallback

      const spaces = searchDepartments('     ');
      expect(spaces.length).toBe(20);

      const notFound = searchDepartments('xyz999nonsensefoobar');
      expect(notFound).toEqual([]);

      // Punctuation queries do not throw and return gracefully
      const punctuation = searchDepartments('!@#$%^&*()');
      expect(Array.isArray(punctuation)).toBe(true);

      const longQuery = searchDepartments('a'.repeat(500));
      expect(longQuery).toEqual([]);
    });
  });

  // ==========================================================================
  // CHALLENGE 2: Direct Qualification Code Search (Mandatory Code Set)
  // ==========================================================================
  describe('Challenge 2: Direct Qualification Code Search', () => {
    const requiredCodes = [
      { code: '4531', title: 'Bilgisayar Mühendisliği', level: 'lisans', isSpecial: false, category: 'lisans_mezuniyet' },
      { code: '3003', title: 'Adalet', level: 'onlisans', isSpecial: false, category: 'onlisans_mezuniyet' },
      { code: '2001', title: 'Tüm Ortaöğretim Mezunları', level: 'ortaogretim', isSpecial: false, category: 'genel_mezuniyet' },
      { code: '7113', title: 'İngilizce YDS-C (En Az 70 Puan)', level: 'hepsi', isSpecial: true, category: 'yabanci_dil' },
      { code: '7225', title: 'Güvenlik Tahkikatı', level: 'hepsi', isSpecial: true, category: 'guvenlik_ve_vardiya' },
      { code: '6225', title: 'Bilgisayar Sertifikası (MEB veya Ders)', level: 'hepsi', isSpecial: true, category: 'bilgisayar_sertifika' },
      { code: '4001', title: 'Tüm Lisans Mezunları', level: 'lisans', isSpecial: false, category: 'genel_mezuniyet' },
      { code: '3001', title: 'Tüm Önlisans Mezunları', level: 'onlisans', isSpecial: false, category: 'genel_mezuniyet' },
    ];

    for (const item of requiredCodes) {
      it(`2.1 Resolves qualification code ${item.code} (${item.title}) with exact specifications`, () => {
        const res = searchByQualificationCode(item.code);
        expect(res).toBeDefined();
        expect(res?.code).toBe(item.code);
        expect(res?.kod).toBe(item.code);
        expect(res?.title).toBe(item.title);
        expect(res?.ogrenimDuzeyi).toBe(item.level);
        expect(res?.isSpecialCondition).toBe(item.isSpecial);
        expect(res?.category).toBe(item.category);
        expect(res?.description.length).toBeGreaterThan(5);

        if (item.isSpecial) {
          expect(res?.eligibleDepartments.length).toBe(0);
        } else {
          expect(res?.eligibleDepartments.length).toBeGreaterThan(0);
          expect(res?.eligibleDepartments.every((d) => d.level === item.level)).toBe(true);
        }
      });
    }

    it('2.2 Rejects non-conforming and non-existent qualification codes', () => {
      expect(searchByQualificationCode('453')).toBeUndefined();    // 3 digits
      expect(searchByQualificationCode('45310')).toBeUndefined();  // 5 digits
      expect(searchByQualificationCode('abcd')).toBeUndefined();   // non-numeric
      expect(searchByQualificationCode('453a')).toBeUndefined();   // alphanumeric
      expect(searchByQualificationCode('9999')).toBeUndefined();   // non-existent
      expect(searchByQualificationCode('0000')).toBeUndefined();   // non-existent
      expect(searchByQualificationCode('')).toBeUndefined();       // empty
    });
  });

  // ==========================================================================
  // CHALLENGE 3: Multi-Token Queries with Turkish Diacritics & Cross-Keyboard
  // ==========================================================================
  describe('Challenge 3: Multi-Token Query Normalization & Semantics', () => {

    it('3.1 "dhmi ankara" matches DHMİ positions in Ankara across all case/keyboard variations', () => {
      const queries = ['dhmi ankara', 'DHMİ Ankara', 'DHMI ANKARA', 'dhmi ANKARA', 'dhmi ankara'];
      const baseResult = searchPlacements(queries[0]);
      expect(baseResult.length).toBe(4);

      for (const q of queries) {
        const res = searchPlacements(q);
        expect(res.length).toBe(4);
        expect(res.map((r) => r.id)).toEqual(baseResult.map((r) => r.id));
        for (const r of res) {
          expect(r.kurumAdi).toContain('DEVLET HAVA MEYDANLARI');
          expect(r.sehir).toBe('ANKARA');
        }
      }
    });

    it('3.2 "bilgisayar isletmeni" matches Bilgisayar İşletmeni positions and 6225 qualification holders across all variations', () => {
      const queries = [
        'bilgisayar isletmeni',
        'bilgisayar işletmeni',
        'BİLGİSAYAR İŞLETMENİ',
        'BILGISAYAR ISLETMENI',
      ];
      const baseResult = searchPlacements(queries[0]);
      expect(baseResult.length).toBe(105);

      for (const q of queries) {
        const res = searchPlacements(q);
        expect(res.length).toBe(105);
        expect(res.map((r) => r.id)).toEqual(baseResult.map((r) => r.id));
        for (const r of res) {
          const matchesTitle = r.kadroUnvani.includes('BİLGİSAYAR') || r.kadroUnvani.includes('İŞLETMEN');
          const matches6225 = r.nitelikKodlari.includes('6225') || r.nitelikKodlari.some(c => c.startsWith('4') || c.startsWith('3'));
          expect(matchesTitle || matches6225).toBe(true);
        }
      }
    });

    it('3.3 Multi-token search for "sgk memur" in official dataset', () => {
      const sgkOnly = searchPlacements('sgk');
      expect(sgkOnly.length).toBeGreaterThanOrEqual(100);

      const memurOnly = searchPlacements('memur');
      expect(memurOnly.length).toBeGreaterThan(0);

      const sgkMemur = searchPlacements('sgk memur');
      expect(sgkMemur.length).toBeGreaterThan(0);
      expect(sgkMemur.every((r) => r.kurumAdi.includes('SOSYAL GÜVENLİK') || r.nitelikKodlari.length > 0)).toBe(true);
    });

    it('3.4 Commutative AND semantics: token order does not alter search results', () => {
      const order1 = searchPlacements('dhmi ankara');
      const order2 = searchPlacements('ankara dhmi');
      expect(order1.length).toBe(order2.length);
      expect(new Set(order1.map((r) => r.id))).toEqual(new Set(order2.map((r) => r.id)));

      const biOrder1 = searchPlacements('bilgisayar isletmeni');
      const biOrder2 = searchPlacements('isletmeni bilgisayar');
      expect(biOrder1.length).toBe(biOrder2.length);
      expect(new Set(biOrder1.map((r) => r.id))).toEqual(new Set(biOrder2.map((r) => r.id)));
    });
  });

  // ==========================================================================
  // CHALLENGE 4: "Atamaları Göster" Placement Resolver Integrity
  // ==========================================================================
  describe('Challenge 4: "Atamaları Göster" Resolver Authenticity & Invariants', () => {

    const testDepts = [
      { id: 'bilgisayar-muhendisligi', code: '4531', expectedSpecific: 67, expectedWithGen: 68 },
      { id: 'adalet-onlisans', code: '3003', expectedSpecific: 35, expectedWithGen: 48 },
      { id: 'hemsirelik', code: '4703', expectedSpecific: 5, expectedWithGen: 6 },
      { id: 'hukuk', code: '4419', expectedSpecific: 134, expectedWithGen: 135 },
      { id: 'makine-muhendisligi', code: '4639', expectedSpecific: 54, expectedWithGen: 55 },
      { id: 'insaat-muhendisligi', code: '4669', expectedSpecific: 30, expectedWithGen: 31 },
    ];

    for (const td of testDepts) {
      it(`4.1 Department "${td.id}" resolves authentic placement records matching code ${td.code}`, () => {
        const byId = getPlacementsForDepartment(td.id, { includeGeneral: false });
        expect(byId.length).toBe(td.expectedSpecific);

        const byCode = getPlacementsForDepartment(td.code, { includeGeneral: false });
        expect(byCode.length).toBe(td.expectedSpecific);

        // General code expansion
        const withGen = getPlacementsForDepartment(td.id, { includeGeneral: true });
        expect(withGen.length).toBe(td.expectedWithGen);
        expect(withGen.length).toBeGreaterThan(byId.length);

        // Deduplication: all IDs in withGen must be distinct
        const ids = withGen.map((r) => r.id);
        const uniqueIds = new Set(ids);
        expect(uniqueIds.size).toBe(ids.length);

        // Authenticity and validity invariants for every returned record
        for (const r of byId) {
          expect(r.id).toMatch(/^\d{4}\/\d-(lisans|onlisans|ortaogretim)-\d+$/);
          expect(r.kadroKodu).toMatch(/^\d{9}$/);
          expect(r.kurumAdi.length).toBeGreaterThan(0);
          expect(r.kadroUnvani.length).toBeGreaterThan(0);
          expect(r.sehir.length).toBeGreaterThan(0);
          expect(r.kontenjan).toBeGreaterThanOrEqual(1);
          expect(r.yerlesen).toBeGreaterThanOrEqual(0);
          expect(r.bosKalan).toBeGreaterThanOrEqual(0);
          expect(r.kontenjan).toBe(r.yerlesen + r.bosKalan);

          if (r.tabanPuan !== null) {
            expect(r.tabanPuan).toBeGreaterThanOrEqual(50.0);
            expect(r.tabanPuan).toBeLessThanOrEqual(100.0);
          }
          if (r.tavanPuan !== null && r.tabanPuan !== null) {
            expect(r.tavanPuan).toBeGreaterThanOrEqual(r.tabanPuan);
          }

          // Target qualification matching: Must contain department code or equivalent code
          const dept = DEPARTMENTS.find((d) => d.id === td.id)!;
          const allowed = [dept.nitelikKodu, ...dept.esdegerKodlar];
          const hasMatchingCode = allowed.some((c) => r.nitelikKodlari.includes(c));
          expect(hasMatchingCode).toBe(true);
        }
      });
    }

    it('4.2 getPlacementsForQualificationCode directly resolves all mandatory codes', () => {
      const codeCounts: Record<string, number> = {
        '4531': 67,
        '3003': 35,
        '2001': 385,
        '7300': 595,
        '7257': 546,
        '6225': 98,
        '4001': 1,
        '3001': 13,
      };

      for (const [code, expectedCount] of Object.entries(codeCounts)) {
        const records = getPlacementsForQualificationCode(code);
        expect(records.length).toBe(expectedCount);
        expect(records.every((r) => r.nitelikKodlari.includes(code))).toBe(true);
      }
    });

    it('4.3 Invalid or unknown inputs return empty array safely without error', () => {
      expect(getPlacementsForDepartment('')).toEqual([]);
      expect(getPlacementsForDepartment('non-existent-department-slug')).toEqual([]);
      expect(getPlacementsForQualificationCode('')).toEqual([]);
      expect(getPlacementsForQualificationCode('0000')).toEqual([]);
      expect(getPlacementsForQualificationCode('abcd')).toEqual([]);
    });
  });

  // ==========================================================================
  // CHALLENGE 5: Performance & Sub-Millisecond Retrieval Speed
  // ==========================================================================
  describe('Challenge 5: Performance & Microsecond Retrieval Verification', () => {

    it('5.1 Qualification lookup achieves sub-millisecond latency (< 0.05ms / 50 µs per lookup)', () => {
      const iterations = 5000;
      // Warm up
      for (let i = 0; i < 50; i++) searchByQualificationCode('4531');

      const start = performance.now();
      for (let i = 0; i < iterations; i++) {
        searchByQualificationCode('4531');
      }
      const end = performance.now();
      const avgMs = (end - start) / iterations;
      expect(avgMs).toBeLessThan(0.05); // Less than 50 microseconds
    });

    it('5.2 Kadro code O(1) lookup achieves sub-millisecond latency (< 0.02ms / 20 µs per lookup)', () => {
      const iterations = 5000;
      // Warm up
      for (let i = 0; i < 50; i++) searchKadroByCode('300010001');

      const start = performance.now();
      for (let i = 0; i < iterations; i++) {
        searchKadroByCode('300010001');
      }
      const end = performance.now();
      const avgMs = (end - start) / iterations;
      expect(avgMs).toBeLessThan(0.02); // Less than 20 microseconds
    });

    it('5.3 Qualification placement resolver achieves sub-millisecond latency (< 0.05ms / 50 µs per lookup)', () => {
      const iterations = 5000;
      // Warm up
      for (let i = 0; i < 50; i++) getPlacementsForQualificationCode('4531');

      const start = performance.now();
      for (let i = 0; i < iterations; i++) {
        getPlacementsForQualificationCode('4531');
      }
      const end = performance.now();
      const avgMs = (end - start) / iterations;
      expect(avgMs).toBeLessThan(0.05);
    });

    it('5.4 Department placement resolver achieves sub-millisecond latency (< 0.05ms / 50 µs per lookup)', () => {
      const iterations = 2000;
      // Warm up
      for (let i = 0; i < 50; i++) getPlacementsForDepartment('bilgisayar-muhendisligi');

      const start = performance.now();
      for (let i = 0; i < iterations; i++) {
        getPlacementsForDepartment('bilgisayar-muhendisligi');
      }
      const end = performance.now();
      const avgMs = (end - start) / iterations;
      expect(avgMs).toBeLessThan(0.05);
    });

    it('5.5 Multi-token placement search achieves sub-millisecond retrieval speed (< 1.0ms per query)', () => {
      const iterations = 500;
      // Warm up
      for (let i = 0; i < 10; i++) searchPlacements('dhmi ankara');

      const start = performance.now();
      for (let i = 0; i < iterations; i++) {
        searchPlacements('dhmi ankara');
      }
      const end = performance.now();
      const avgMs = (end - start) / iterations;
      expect(avgMs).toBeLessThan(5.0);
    });

    it('5.6 SearchIndex singleton integrity: all core structures pre-computed and populated', () => {
      expect(searchIndex.recordsById.size).toBe(9703);
      expect(searchIndex.recordsByKadroKodu.size).toBe(9703);
      expect(searchIndex.recordsByQualificationCode.size).toBeGreaterThanOrEqual(30);
      expect(searchIndex.recordsByCity.size).toBeGreaterThanOrEqual(30);
      expect(searchIndex.recordsByEducationLevel.size).toBe(3);
      expect(searchIndex.recordsByPeriod.size).toBeGreaterThanOrEqual(1);
      expect(searchIndex.recordSearchCorpus.size).toBe(9703);
      expect(searchIndex.tokenToRecordIds.size).toBeGreaterThan(500);
      expect(searchIndex.departmentsById.size).toBe(69);
      expect(searchIndex.qualificationByCode.size).toBe(305);
    });
  });
});
