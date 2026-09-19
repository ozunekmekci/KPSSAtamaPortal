import { describe, it, expect } from 'vitest';
import {
  getDepartmentToCodes,
  getCodeToDepartments,
  getAllDepartmentMappings,
  isCandidateEligibleForPost,
} from '@/lib/mappings';
import { isSpecialConditionCode, getQualificationByCode } from '@/data/qualifications';
import { getSpecialConditionByCode } from '@/data/special-conditions';

describe('Bi-directional Qualification & Department Mappings', () => {
  it('maps Bilgisayar Mühendisliği to primary 4531, general 4001, and equivalent 4539', () => {
    const mapping = getDepartmentToCodes('bilgisayar-muhendisligi');
    expect(mapping).toBeDefined();
    expect(mapping?.primaryQualificationCode).toBe('4531');
    expect(mapping?.generalQualificationCode).toBe('4001');
    expect(mapping?.equivalentQualificationCodes).toContain('4539');
    expect(mapping?.eligibleQualificationCodes).toContain('4531');
    expect(mapping?.eligibleQualificationCodes).toContain('4001');
    expect(mapping?.eligibleQualificationCodes).toContain('4539');
  });

  it('maps Önlisans Adalet to 3003 and general 3001', () => {
    const mapping = getDepartmentToCodes('adalet-onlisans');
    expect(mapping).toBeDefined();
    expect(mapping?.level).toBe('onlisans');
    expect(mapping?.primaryQualificationCode).toBe('3003');
    expect(mapping?.generalQualificationCode).toBe('3001');
  });

  it('maps Ortaöğretim Bilişim Teknolojileri to 2061 and general 2001', () => {
    const mapping = getDepartmentToCodes('bilisim-teknolojileri-ortaogretim');
    expect(mapping).toBeDefined();
    expect(mapping?.level).toBe('ortaogretim');
    expect(mapping?.primaryQualificationCode).toBe('2061');
    expect(mapping?.generalQualificationCode).toBe('2001');
  });

  it('reverse maps qualification code 4531 to Bilgisayar Mühendisliği', () => {
    const reverse = getCodeToDepartments('4531');
    expect(reverse).toBeDefined();
    expect(reverse?.qualificationCode).toBe('4531');
    expect(reverse?.isSpecialCondition).toBe(false);
    expect(reverse?.eligibleDepartments.some((d) => d.ad === 'Bilgisayar Mühendisliği')).toBe(true);
  });

  it('correctly identifies special condition codes and their legal details', () => {
    expect(isSpecialConditionCode('6225')).toBe(true);
    expect(isSpecialConditionCode('7113')).toBe(true);
    expect(isSpecialConditionCode('7300')).toBe(true);
    expect(isSpecialConditionCode('7322')).toBe(true);
    expect(isSpecialConditionCode('1101')).toBe(true);

    expect(isSpecialConditionCode('4531')).toBe(false);
    expect(isSpecialConditionCode('3001')).toBe(false);
    expect(isSpecialConditionCode('2001')).toBe(false);

    const cond6225 = getSpecialConditionByCode('6225');
    expect(cond6225).toBeDefined();
    expect(cond6225?.baslik).toContain('Bilgisayar');
    expect(cond6225?.yetkiliKurum).toContain('Milli Eğitim');
  });

  it('evaluates candidate eligibility with OR degree logic and AND condition logic', () => {
    // Post requires [4531, 7113, 7225]
    const postCodes = ['4531', '7113', '7225'];

    // Candidate has 4531, 7113, 7225 -> Eligible
    expect(isCandidateEligibleForPost(['4531', '7113', '7225'], postCodes)).toBe(true);

    // Candidate has degree 4531 and 7225 but lacks 7113 (English) -> Ineligible
    expect(isCandidateEligibleForPost(['4531', '7225'], postCodes)).toBe(false);

    // Candidate has different degree 4431 (İşletme) -> Ineligible
    expect(isCandidateEligibleForPost(['4431', '7113', '7225'], postCodes)).toBe(false);

    // Post requiring multiple degrees [4531, 4539] with no special conditions
    // Candidate with either 4531 or 4539 must match
    expect(isCandidateEligibleForPost(['4539'], ['4531', '4539'])).toBe(true);
    expect(isCandidateEligibleForPost(['4531'], ['4531', '4539'])).toBe(true);
    expect(isCandidateEligibleForPost(['4611'], ['4531', '4539'])).toBe(false);
  });

  it('respects includeGeneral flag for catch-all 4001 posts', () => {
    const post4001 = ['4001', '7225'];
    // Candidate holds specific degree 4531 + 7225
    // Without includeGeneral: false
    expect(isCandidateEligibleForPost(['4531', '7225'], post4001, { includeGeneral: false })).toBe(false);
    // With includeGeneral: true
    expect(isCandidateEligibleForPost(['4531', '7225'], post4001, { includeGeneral: true })).toBe(true);
  });

  it('exports valid non-empty department mapping dictionary', () => {
    const mappings = getAllDepartmentMappings();
    expect(mappings.length).toBeGreaterThanOrEqual(30);
    for (const m of mappings) {
      expect(m.departmentId).toBeTruthy();
      expect(m.primaryQualificationCode).toMatch(/^\d{4}$/);
      expect(m.generalQualificationCode).toMatch(/^(4001|3001|2001)$/);
    }
  });
});
