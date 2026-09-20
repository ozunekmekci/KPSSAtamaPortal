import { describe, it, expect } from 'vitest';
import {
  getDepartmentToCodes,
  getCodeToDepartments,
  getAllDepartmentMappings,
  getAllCodeMappings,
  isCandidateEligibleForPost,
} from '@/lib/mappings';
import { DEPARTMENTS, DEPARTMENTS_BY_ID, getDepartmentById, getDepartmentsByCode } from '@/data/departments';
import {
  QUALIFICATION_CODES,
  QUALIFICATIONS_BY_CODE,
  getQualificationByCode,
  isSpecialConditionCode,
} from '@/data/qualifications';

describe('Empirical Challenge: Bi-directional Qualification Mapping and Candidate Eligibility Algebra', () => {

  // ==========================================================================
  // 1. FORWARD LOOKUP (Department -> Codes) ACROSS ALL TIERS
  // ==========================================================================
  describe('1. Department-to-Code Forward Lookup', () => {
    it('1.1 Lisans major departments map accurately to 4xxx and general 4001', () => {
      const lisansSamples = [
        { id: 'bilgisayar-muhendisligi', primary: '4531', general: '4001', esdeger: ['4539', '4532'] },
        { id: 'iktisat', primary: '4421', general: '4001', esdeger: ['4431', '4459'] },
        { id: 'isletme', primary: '4431', general: '4001', esdeger: ['4421', '4459'] },
        { id: 'hemsirelik', primary: '4703', general: '4001', esdeger: [] },
        { id: 'elektrik-elektronik-muhendisligi', primary: '4611', general: '4001', esdeger: ['4619'] },
        { id: 'hukuk', primary: '4419', general: '4001', esdeger: [] },
        { id: 'makine-muhendisligi', primary: '4639', general: '4001', esdeger: [] },
        { id: 'insaat-muhendisligi', primary: '4669', general: '4001', esdeger: [] },
      ];

      for (const sample of lisansSamples) {
        const mapping = getDepartmentToCodes(sample.id);
        expect(mapping, `Mapping for ${sample.id} must be defined`).toBeDefined();
        expect(mapping?.level).toBe('lisans');
        expect(mapping?.primaryQualificationCode).toBe(sample.primary);
        expect(mapping?.generalQualificationCode).toBe(sample.general);
        expect(mapping?.eligibleQualificationCodes).toContain(sample.primary);
        expect(mapping?.eligibleQualificationCodes).toContain(sample.general);
        for (const es of sample.esdeger) {
          expect(mapping?.eligibleQualificationCodes).toContain(es);
        }
      }
    });

    it('1.2 Önlisans major departments map accurately to 3xxx and general 3001', () => {
      const onlisansSamples = [
        { id: 'adalet-onlisans', primary: '3003', general: '3001' },
        { id: 'bilgisayar-programciligi-onlisans', primary: '3005', general: '3001' },
        { id: 'bilgisayar-teknolojisi-onlisans', primary: '3249', general: '3001' },
        { id: 'harita-ve-kadastro-onlisans', primary: '3007', general: '3001' },
        { id: 'buro-yonetimi-onlisans', primary: '3029', general: '3001' },
        { id: 'muhasebe-ve-vergi-onlisans', primary: '3173', general: '3001' },
      ];

      for (const sample of onlisansSamples) {
        const mapping = getDepartmentToCodes(sample.id);
        expect(mapping, `Mapping for ${sample.id} must be defined`).toBeDefined();
        expect(mapping?.level).toBe('onlisans');
        expect(mapping?.primaryQualificationCode).toBe(sample.primary);
        expect(mapping?.generalQualificationCode).toBe(sample.general);
        expect(mapping?.eligibleQualificationCodes).toContain(sample.primary);
        expect(mapping?.eligibleQualificationCodes).toContain(sample.general);
      }
    });

    it('1.3 Ortaöğretim major disciplines map accurately to 2xxx and general 2001', () => {
      const ortaogretimSamples = [
        { id: 'bilisim-teknolojileri-ortaogretim', primary: '2061', general: '2001' },
        { id: 'elektrik-elektronik-ortaogretim', primary: '2065', general: '2001' },
        { id: 'insaat-teknolojisi-ortaogretim', primary: '2087', general: '2001' },
        { id: 'makine-teknolojisi-ortaogretim', primary: '2095', general: '2001' },
        { id: 'adalet-ortaogretim', primary: '2009', general: '2001' },
        { id: 'hemsirelik-ortaogretim', primary: '2147', general: '2001' },
        { id: 'acil-tip-teknisyenligi-ortaogretim', primary: '2151', general: '2001' },
      ];

      for (const sample of ortaogretimSamples) {
        const mapping = getDepartmentToCodes(sample.id);
        expect(mapping, `Mapping for ${sample.id} must be defined`).toBeDefined();
        expect(mapping?.level).toBe('ortaogretim');
        expect(mapping?.primaryQualificationCode).toBe(sample.primary);
        expect(mapping?.generalQualificationCode).toBe(sample.general);
        expect(mapping?.eligibleQualificationCodes).toContain(sample.primary);
        expect(mapping?.eligibleQualificationCodes).toContain(sample.general);
      }
    });

    it('1.4 Returns undefined for unknown department IDs without throwing', () => {
      expect(getDepartmentToCodes('non-existent-dept')).toBeUndefined();
      expect(getDepartmentToCodes('')).toBeUndefined();
      expect(getDepartmentToCodes('random-123')).toBeUndefined();
    });

    it('1.5 All departments have complete, non-redundant eligibleQualificationCodes', () => {
      const all = getAllDepartmentMappings();
      expect(all.length).toBe(68);
      for (const m of all) {
        // Set size must match array length (no duplicate codes)
        const uniqueSet = new Set(m.eligibleQualificationCodes);
        expect(m.eligibleQualificationCodes.length).toBe(uniqueSet.size);
        expect(m.eligibleQualificationCodes).toContain(m.primaryQualificationCode);
        expect(m.eligibleQualificationCodes).toContain(m.generalQualificationCode);
      }
    });
  });

  // ==========================================================================
  // 2. REVERSE LOOKUP (Code -> Departments)
  // ==========================================================================
  describe('2. Reverse Code-to-Department Lookup', () => {
    it('2.1 Resolves discipline codes back to all eligible departments', () => {
      // 4531 should reverse to Bilgisayar Mühendisliği
      const rev4531 = getCodeToDepartments('4531');
      expect(rev4531).toBeDefined();
      expect(rev4531?.eligibleDepartments.some((d) => d.id === 'bilgisayar-muhendisligi')).toBe(true);

      // 4539 (Yazılım) is primary for Yazılım/Bilişim and equivalent for Bilgisayar
      const rev4539 = getCodeToDepartments('4539');
      expect(rev4539).toBeDefined();
      const depts4539 = rev4539?.eligibleDepartments.map((d) => d.id);
      expect(depts4539).toContain('yazilim-muhendisligi');
      expect(depts4539).toContain('bilisim-sistemleri-muhendisligi');
      expect(depts4539).toContain('bilgisayar-muhendisligi');

      // 3003 should reverse to Adalet
      const rev3003 = getCodeToDepartments('3003');
      expect(rev3003).toBeDefined();
      expect(rev3003?.eligibleDepartments.some((d) => d.id === 'adalet-onlisans')).toBe(true);

      // 2061 should reverse to Bilişim Teknolojileri Ortaöğretim
      const rev2061 = getCodeToDepartments('2061');
      expect(rev2061).toBeDefined();
      expect(rev2061?.eligibleDepartments.some((d) => d.id === 'bilisim-teknolojileri-ortaogretim')).toBe(true);
    });

    it('2.2 Reverse lookup for special conditions returns isSpecialCondition: true and empty eligibleDepartments', () => {
      const rev6225 = getCodeToDepartments('6225');
      expect(rev6225).toBeDefined();
      expect(rev6225?.isSpecialCondition).toBe(true);
      expect(rev6225?.eligibleDepartments).toEqual([]);

      const rev7113 = getCodeToDepartments('7113');
      expect(rev7113).toBeDefined();
      expect(rev7113?.isSpecialCondition).toBe(true);
      expect(rev7113?.eligibleDepartments).toEqual([]);
    });

    it('2.3 Returns undefined for completely uncatalogued codes', () => {
      expect(getCodeToDepartments('9999')).toBeUndefined();
      expect(getCodeToDepartments('0000')).toBeUndefined();
      expect(getCodeToDepartments('')).toBeUndefined();
    });
  });

  // ==========================================================================
  // 3. CANDIDATE ELIGIBILITY ALGEBRA: DISJUNCTIVE (OR) MATCHING
  // ==========================================================================
  describe('3. Disjunctive (OR) Matching for Multiple Discipline Codes', () => {
    it('3.1 Any single matching educational code among multiple satisfies the post requirement', () => {
      const multiDisciplinePost = ['4531', '4539', '4611', '4619']; // CS, Software, EE, Telecom

      expect(isCandidateEligibleForPost(['4531'], multiDisciplinePost)).toBe(true);
      expect(isCandidateEligibleForPost(['4539'], multiDisciplinePost)).toBe(true);
      expect(isCandidateEligibleForPost(['4611'], multiDisciplinePost)).toBe(true);
      expect(isCandidateEligibleForPost(['4619'], multiDisciplinePost)).toBe(true);
    });

    it('3.2 Candidate with unrelated educational code is rejected', () => {
      const multiDisciplinePost = ['4531', '4539', '4611', '4619'];
      expect(isCandidateEligibleForPost(['4421'], multiDisciplinePost)).toBe(false); // İktisat
      expect(isCandidateEligibleForPost(['4431'], multiDisciplinePost)).toBe(false); // İşletme
      expect(isCandidateEligibleForPost(['4703'], multiDisciplinePost)).toBe(false); // Hemşirelik
      expect(isCandidateEligibleForPost(['3005'], multiDisciplinePost)).toBe(false); // Önlisans CS
    });

    it('3.3 Candidate with multiple qualifications (double major) matches if at least one matches', () => {
      const postCodes = ['4531', '4539'];
      expect(isCandidateEligibleForPost(['4431', '4531'], postCodes)).toBe(true);
      expect(isCandidateEligibleForPost(['4431', '4421'], postCodes)).toBe(false);
    });
  });

  // ==========================================================================
  // 4. CANDIDATE ELIGIBILITY ALGEBRA: CONJUNCTIVE (AND) MATCHING
  // ==========================================================================
  describe('4. Conjunctive (AND) Matching for Special Conditions', () => {
    it('4.1 Candidate must satisfy EVERY special condition code on the post', () => {
      const postCodes = ['4531', '6225', '6501', '7113', '7225']; // CS + CompCert + Driver B + YDS-C + Security

      // All satisfied
      expect(isCandidateEligibleForPost(
        ['4531', '6225', '6501', '7113', '7225'],
        postCodes
      )).toBe(true);

      // Missing only security clearance (7225)
      expect(isCandidateEligibleForPost(
        ['4531', '6225', '6501', '7113'],
        postCodes
      )).toBe(false);

      // Missing only YDS-C (7113)
      expect(isCandidateEligibleForPost(
        ['4531', '6225', '6501', '7225'],
        postCodes
      )).toBe(false);

      // Missing only Driver B (6501)
      expect(isCandidateEligibleForPost(
        ['4531', '6225', '7113', '7225'],
        postCodes
      )).toBe(false);

      // Missing only Computer Cert (6225)
      expect(isCandidateEligibleForPost(
        ['4531', '6501', '7113', '7225'],
        postCodes
      )).toBe(false);
    });

    it('4.2 Even if all special conditions are met, wrong degree code rejects candidate', () => {
      const postCodes = ['4531', '6225', '7113', '7225'];
      expect(isCandidateEligibleForPost(
        ['4431', '6225', '7113', '7225'], // İşletme instead of CS
        postCodes
      )).toBe(false);
    });

    it('4.3 Respects explicit gender condition when gender option is provided', () => {
      const malePost = ['4531', '1101'];
      const femalePost = ['4531', '1103'];

      // When gender: 'erkek'
      expect(isCandidateEligibleForPost(['4531'], malePost, { gender: 'erkek' })).toBe(true);
      expect(isCandidateEligibleForPost(['4531'], femalePost, { gender: 'erkek' })).toBe(false);

      // When gender: 'kadin'
      expect(isCandidateEligibleForPost(['4531'], malePost, { gender: 'kadin' })).toBe(false);
      expect(isCandidateEligibleForPost(['4531'], femalePost, { gender: 'kadin' })).toBe(true);
    });
  });

  // ==========================================================================
  // 5. CATCH-ALL EXPANSION (4001 / 3001 / 2001) BEHAVIOR
  // ==========================================================================
  describe('5. Catch-all Expansion (4001 / 3001 / 2001)', () => {
    it('5.1 Candidate holding 4001 directly matches a 4001 post', () => {
      expect(isCandidateEligibleForPost(['4001'], ['4001'])).toBe(true);
      expect(isCandidateEligibleForPost(['4531', '4001'], ['4001'])).toBe(true);
    });

    it('5.2 Candidate without 4001 in candidateCodes matches 4001 when includeGeneral: true', () => {
      expect(isCandidateEligibleForPost(['4531'], ['4001'], { includeGeneral: true })).toBe(true);
    });

    it('5.3 Candidate without 4001 in candidateCodes fails 4001 when includeGeneral: false', () => {
      expect(isCandidateEligibleForPost(['4531'], ['4001'], { includeGeneral: false })).toBe(false);
    });
  });

  // ==========================================================================
  // 6. ADVERSARIAL STRESS CHALLENGES & VULNERABILITY TESTS
  // ==========================================================================
  describe('6. Adversarial Stress Challenges (Remediation Verification)', () => {

    it('6.1 [REMEDIATED] Cross-level catch-all leakage prevented: Ortaöğretim candidate rejected from Lisans 4001 post', () => {
      // Ortaöğretim candidate (2061) setting includeGeneral: true
      const crossEligible = isCandidateEligibleForPost(['2061'], ['4001'], { includeGeneral: true });
      // In actual ÖSYM rules, high school graduate cannot apply for Lisans cadre!
      // Tier-aware expansion ensures Ortaöğretim candidate cannot match Lisans 4001:
      expect(crossEligible).toBe(false);
    });

    it('6.2 [REMEDIATED] Empty candidate rejected from general posts even when includeGeneral: true', () => {
      const emptyMatches4001 = isCandidateEligibleForPost([], ['4001'], { includeGeneral: true });
      expect(emptyMatches4001).toBe(false);
    });

    it('6.3 [REMEDIATED] Strict gender restriction enforcement when options.gender is omitted', () => {
      // Post requires Male (1101). Candidate does not supply gender option.
      const maleBypass = isCandidateEligibleForPost(['4531'], ['4531', '1101']);
      expect(maleBypass).toBe(false);

      const femaleBypass = isCandidateEligibleForPost(['4531'], ['4531', '1103']);
      expect(femaleBypass).toBe(false);
    });

    it('6.4 [REMEDIATED] General post reverse lookup returns all tier departments', () => {
      const rev4001 = getCodeToDepartments('4001');
      expect(rev4001).toBeDefined();
      // Semantically covers all Lisans departments (38 departments):
      expect(rev4001?.eligibleDepartments.length).toBe(38);

      const rev3001 = getCodeToDepartments('3001');
      expect(rev3001?.eligibleDepartments.length).toBe(19);

      const rev2001 = getCodeToDepartments('2001');
      expect(rev2001?.eligibleDepartments.length).toBe(11);
    });

    it('6.5 [REMEDIATED] Discrepancy between getDepartmentsByCode and getCodeToDepartments resolved on equivalent codes', () => {
      // '4539' is Yazılım Mühendisliği (primary) and Bilgisayar Mühendisliği (equivalent)
      const fromMappings = getCodeToDepartments('4539');
      const fromData = getDepartmentsByCode('4539');

      // Both should include equivalent departments (3 depts)
      expect(fromMappings?.eligibleDepartments.length).toBe(3);
      expect(fromData.length).toBe(3);
      expect(fromData.some((d) => d.id === 'bilgisayar-muhendisligi')).toBe(true);
    });

    it('6.6 [REMEDIATED] Opt-out precedence verified when 4001 is already present in candidateCodes', () => {
      // getDepartmentToCodes returns eligibleQualificationCodes with 4001 included
      const mapping = getDepartmentToCodes('bilgisayar-muhendisligi');
      const candidateCodes = mapping!.eligibleQualificationCodes; // contains '4001'

      // User unchecks "includeGeneral" (wants only specific CS posts, not 4001 general posts)
      const eligible = isCandidateEligibleForPost(candidateCodes, ['4001'], { includeGeneral: false });
      // Explicit opt-out filters out 4001:
      expect(eligible).toBe(false);
    });
  });
});
