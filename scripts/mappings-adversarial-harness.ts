/**
 * Adversarial Test Harness for Qualification Mappings & Eligibility Algebra
 *
 * Runs exhaustive empirical checks on:
 * 1. Forward lookup (department-to-code) across Lisans, Önlisans, Ortaöğretim
 * 2. Reverse lookup (code-to-department) for degrees, general codes, and special conditions
 * 3. Candidate Eligibility Algebra: Disjunctive (OR) educational matching
 * 4. Candidate Eligibility Algebra: Conjunctive (AND) special conditions matching
 * 5. Catch-all expansion (4001/3001/2001) & cross-level boundary stress testing
 * 6. Edge cases: gender options, undefined options, double majors, uncatalogued codes
 */

import {
  getDepartmentToCodes,
  getCodeToDepartments,
  getAllDepartmentMappings,
  getAllCodeMappings,
  isCandidateEligibleForPost,
} from '../src/lib/mappings';
import {
  DEPARTMENTS,
  DEPARTMENTS_BY_ID,
  getDepartmentById,
  getDepartmentsByCode,
} from '../src/data/departments';
import {
  QUALIFICATION_CODES,
  QUALIFICATIONS_BY_CODE,
  isSpecialConditionCode,
} from '../src/data/qualifications';

interface TestResult {
  suite: string;
  testName: string;
  passed: boolean;
  expected?: unknown;
  actual?: unknown;
  details?: string;
}

const results: TestResult[] = [];

function assert(
  suite: string,
  testName: string,
  passed: boolean,
  expected?: unknown,
  actual?: unknown,
  details?: string
) {
  results.push({ suite, testName, passed, expected, actual, details });
}

function assertEqual<T>(
  suite: string,
  testName: string,
  actual: T,
  expected: T,
  details?: string
) {
  const passed = JSON.stringify(actual) === JSON.stringify(expected);
  results.push({ suite, testName, passed, expected, actual, details });
}

// ============================================================================
// SUITE 1: Forward Department-to-Code Mapping
// ============================================================================
function runSuite1() {
  const suite = 'Suite 1: Forward Department-to-Code Mapping';

  // Check Lisans departments
  const lisansKeys = [
    { id: 'bilgisayar-muhendisligi', primary: '4531', general: '4001', esdeger: ['4539', '4532'] },
    { id: 'iktisat', primary: '4421', general: '4001', esdeger: ['4431', '4459'] },
    { id: 'isletme', primary: '4431', general: '4001', esdeger: ['4421', '4459'] },
    { id: 'maliye', primary: '4459', general: '4001', esdeger: ['4421', '4431'] },
    { id: 'hemsirelik', primary: '4703', general: '4001', esdeger: [] },
    { id: 'elektrik-elektronik-muhendisligi', primary: '4611', general: '4001', esdeger: ['4619'] },
    { id: 'hukuk', primary: '4419', general: '4001', esdeger: [] },
    { id: 'makine-muhendisligi', primary: '4639', general: '4001', esdeger: [] },
    { id: 'insaat-muhendisligi', primary: '4669', general: '4001', esdeger: [] },
    { id: 'mimarlik', primary: '4641', general: '4001', esdeger: [] },
    { id: 'psikoloji', primary: '4131', general: '4001', esdeger: [] },
    { id: 'istatistik', primary: '4851', general: '4001', esdeger: ['4845'] },
    { id: 'veterinerlik', primary: '4605', general: '4001', esdeger: [] },
  ];

  for (const sample of lisansKeys) {
    const m = getDepartmentToCodes(sample.id);
    assert(suite, `1.1 Lisans dept: ${sample.id} exists`, !!m, true, !!m);
    if (m) {
      assertEqual(suite, `1.1 ${sample.id} level is lisans`, m.level, 'lisans');
      assertEqual(suite, `1.1 ${sample.id} primary is ${sample.primary}`, m.primaryQualificationCode, sample.primary);
      assertEqual(suite, `1.1 ${sample.id} general is 4001`, m.generalQualificationCode, '4001');
      assert(suite, `1.1 ${sample.id} eligible codes contains primary`, m.eligibleQualificationCodes.includes(sample.primary), true, true);
      assert(suite, `1.1 ${sample.id} eligible codes contains 4001`, m.eligibleQualificationCodes.includes('4001'), true, true);
      for (const es of sample.esdeger) {
        assert(suite, `1.1 ${sample.id} eligible codes contains equivalent ${es}`, m.eligibleQualificationCodes.includes(es), true, true);
      }
    }
  }

  // Check Önlisans departments
  const onlisansKeys = [
    { id: 'adalet-onlisans', primary: '3003', general: '3001' },
    { id: 'bilgisayar-programciligi-onlisans', primary: '3005', general: '3001' },
    { id: 'bilgisayar-teknolojisi-onlisans', primary: '3249', general: '3001' },
    { id: 'buro-yonetimi-onlisans', primary: '3029', general: '3001' },
    { id: 'harita-ve-kadastro-onlisans', primary: '3007', general: '3001' },
    { id: 'muhasebe-ve-vergi-onlisans', primary: '3173', general: '3001' },
    { id: 'insaat-teknolojisi-onlisans', primary: '3225', general: '3001' },
    { id: 'elektrik-onlisans', primary: '3253', general: '3001' },
    { id: 'tibbi-dokumantasyon-onlisans', primary: '3011', general: '3001' },
    { id: 'ilk-ve-acil-yardim-onlisans', primary: '3017', general: '3001' },
    { id: 'ozel-guvenlik-onlisans', primary: '3397', general: '3001' },
  ];

  for (const sample of onlisansKeys) {
    const m = getDepartmentToCodes(sample.id);
    assert(suite, `1.2 Önlisans dept: ${sample.id} exists`, !!m, true, !!m);
    if (m) {
      assertEqual(suite, `1.2 ${sample.id} level is onlisans`, m.level, 'onlisans');
      assertEqual(suite, `1.2 ${sample.id} primary is ${sample.primary}`, m.primaryQualificationCode, sample.primary);
      assertEqual(suite, `1.2 ${sample.id} general is 3001`, m.generalQualificationCode, '3001');
      assert(suite, `1.2 ${sample.id} eligible codes contains 3001`, m.eligibleQualificationCodes.includes('3001'), true, true);
    }
  }

  // Check Ortaöğretim departments
  const ortaogretimKeys = [
    { id: 'bilisim-teknolojileri-ortaogretim', primary: '2061', general: '2001' },
    { id: 'elektrik-elektronik-ortaogretim', primary: '2065', general: '2001' },
    { id: 'insaat-teknolojisi-ortaogretim', primary: '2087', general: '2001' },
    { id: 'makine-teknolojisi-ortaogretim', primary: '2095', general: '2001' },
    { id: 'adalet-ortaogretim', primary: '2009', general: '2001' },
    { id: 'buro-yonetimi-ortaogretim', primary: '2013', general: '2001' },
    { id: 'muhasebe-finansman-ortaogretim', primary: '2015', general: '2001' },
    { id: 'hemsirelik-ortaogretim', primary: '2147', general: '2001' },
    { id: 'acil-tip-teknisyenligi-ortaogretim', primary: '2151', general: '2001' },
    { id: 'harita-tapu-kadastro-ortaogretim', primary: '2111', general: '2001' },
  ];

  for (const sample of ortaogretimKeys) {
    const m = getDepartmentToCodes(sample.id);
    assert(suite, `1.3 Ortaöğretim dept: ${sample.id} exists`, !!m, true, !!m);
    if (m) {
      assertEqual(suite, `1.3 ${sample.id} level is ortaogretim`, m.level, 'ortaogretim');
      assertEqual(suite, `1.3 ${sample.id} primary is ${sample.primary}`, m.primaryQualificationCode, sample.primary);
      assertEqual(suite, `1.3 ${sample.id} general is 2001`, m.generalQualificationCode, '2001');
      assert(suite, `1.3 ${sample.id} eligible codes contains 2001`, m.eligibleQualificationCodes.includes('2001'), true, true);
    }
  }

  // Completeness check on entire catalog
  const allDepts = getAllDepartmentMappings();
  assertEqual(suite, '1.4 Total registered departments is 63', allDepts.length, 63);
  for (const d of allDepts) {
    const setSize = new Set(d.eligibleQualificationCodes).size;
    assertEqual(suite, `1.4 ${d.departmentId} has non-redundant eligibleQualificationCodes`, d.eligibleQualificationCodes.length, setSize);
  }
}

// ============================================================================
// SUITE 2: Reverse Code-to-Department Mapping
// ============================================================================
function runSuite2() {
  const suite = 'Suite 2: Reverse Code-to-Department Mapping';

  // 2.1 Degree code resolution
  const testCodes = [
    { code: '4531', expectedDepts: ['bilgisayar-muhendisligi'] },
    { code: '4539', expectedDepts: ['yazilim-muhendisligi', 'bilisim-sistemleri-muhendisligi', 'bilgisayar-muhendisligi'] },
    { code: '4421', expectedDepts: ['iktisat', 'isletme', 'maliye'] }, // equivalent in isletme & maliye
    { code: '4703', expectedDepts: ['hemsirelik', 'ebelik'] }, // equivalent in ebelik
    { code: '3003', expectedDepts: ['adalet-onlisans'] },
    { code: '3005', expectedDepts: ['bilgisayar-programciligi-onlisans', 'bilgisayar-teknolojisi-onlisans'] },
    { code: '3249', expectedDepts: ['bilgisayar-teknolojisi-onlisans', 'bilgisayar-programciligi-onlisans'] },
    { code: '2061', expectedDepts: ['bilisim-teknolojileri-ortaogretim'] },
    { code: '2065', expectedDepts: ['elektrik-elektronik-ortaogretim'] },
  ];

  for (const tc of testCodes) {
    const rev = getCodeToDepartments(tc.code);
    assert(suite, `2.1 Reverse lookup for ${tc.code} exists`, !!rev, true, !!rev);
    if (rev) {
      for (const expDept of tc.expectedDepts) {
        assert(
          suite,
          `2.1 Code ${tc.code} reverses to department ${expDept}`,
          rev.eligibleDepartments.some((d) => d.id === expDept),
          true,
          true
        );
      }
    }
  }

  // 2.2 Special condition codes
  const specialCodes = ['1101', '1103', '6225', '6501', '7113', '7225', '7300', '7322', '7324', '7368'];
  for (const sc of specialCodes) {
    const rev = getCodeToDepartments(sc);
    assert(suite, `2.2 Special code ${sc} reverse lookup exists`, !!rev, true, !!rev);
    if (rev) {
      assertEqual(suite, `2.2 Special code ${sc} has isSpecialCondition=true`, rev.isSpecialCondition, true);
      assertEqual(suite, `2.2 Special code ${sc} has empty eligibleDepartments`, rev.eligibleDepartments.length, 0);
    }
  }

  // 2.3 Uncatalogued / Unknown code handling
  assertEqual(suite, '2.3 Code "9999" returns undefined', getCodeToDepartments('9999'), undefined);
  assertEqual(suite, '2.3 Empty string returns undefined', getCodeToDepartments(''), undefined);
}

// ============================================================================
// SUITE 3: Eligibility Algebra — Disjunctive (OR) Matching
// ============================================================================
function runSuite3() {
  const suite = 'Suite 3: Eligibility Algebra — Disjunctive OR';

  const multiPost = ['4531', '4539', '4611', '4619'];

  // Single valid code
  assertEqual(suite, '3.1 Matches when candidate has 4531', isCandidateEligibleForPost(['4531'], multiPost), true);
  assertEqual(suite, '3.1 Matches when candidate has 4539', isCandidateEligibleForPost(['4539'], multiPost), true);
  assertEqual(suite, '3.1 Matches when candidate has 4611', isCandidateEligibleForPost(['4611'], multiPost), true);
  assertEqual(suite, '3.1 Matches when candidate has 4619', isCandidateEligibleForPost(['4619'], multiPost), true);

  // Unrelated code
  assertEqual(suite, '3.2 Fails when candidate has unrelated 4421 (İktisat)', isCandidateEligibleForPost(['4421'], multiPost), false);
  assertEqual(suite, '3.2 Fails when candidate has unrelated 3005 (Önlisans)', isCandidateEligibleForPost(['3005'], multiPost), false);
  assertEqual(suite, '3.2 Fails when candidate has unrelated 2061 (Ortaöğretim)', isCandidateEligibleForPost(['2061'], multiPost), false);

  // Double degree
  assertEqual(suite, '3.3 Double degree candidate [4431, 4531] matches', isCandidateEligibleForPost(['4431', '4531'], multiPost), true);
  assertEqual(suite, '3.3 Double degree candidate [4431, 4421] fails', isCandidateEligibleForPost(['4431', '4421'], multiPost), false);
}

// ============================================================================
// SUITE 4: Eligibility Algebra — Conjunctive (AND) Matching
// ============================================================================
function runSuite4() {
  const suite = 'Suite 4: Eligibility Algebra — Conjunctive AND';

  const complexPost = ['4531', '6225', '6501', '7113', '7225'];

  assertEqual(
    suite,
    '4.1 Matches when candidate satisfies degree and all 4 special conditions',
    isCandidateEligibleForPost(['4531', '6225', '6501', '7113', '7225'], complexPost),
    true
  );

  assertEqual(
    suite,
    '4.2 Fails when missing 7225 (Security)',
    isCandidateEligibleForPost(['4531', '6225', '6501', '7113'], complexPost),
    false
  );

  assertEqual(
    suite,
    '4.2 Fails when missing 7113 (English YDS-C)',
    isCandidateEligibleForPost(['4531', '6225', '6501', '7225'], complexPost),
    false
  );

  assertEqual(
    suite,
    '4.2 Fails when missing 6501 (Driver B)',
    isCandidateEligibleForPost(['4531', '6225', '7113', '7225'], complexPost),
    false
  );

  assertEqual(
    suite,
    '4.2 Fails when missing 6225 (Computer cert)',
    isCandidateEligibleForPost(['4531', '6501', '7113', '7225'], complexPost),
    false
  );

  assertEqual(
    suite,
    '4.3 Fails when all special conditions met but wrong degree (4431 instead of 4531)',
    isCandidateEligibleForPost(['4431', '6225', '6501', '7113', '7225'], complexPost),
    false
  );

  // Gender testing with options
  const malePost = ['4531', '1101'];
  const femalePost = ['4531', '1103'];
  assertEqual(suite, '4.4 Male candidate matches male post', isCandidateEligibleForPost(['4531'], malePost, { gender: 'erkek' }), true);
  assertEqual(suite, '4.4 Female candidate fails male post', isCandidateEligibleForPost(['4531'], malePost, { gender: 'kadin' }), false);
  assertEqual(suite, '4.4 Female candidate matches female post', isCandidateEligibleForPost(['4531'], femalePost, { gender: 'kadin' }), true);
  assertEqual(suite, '4.4 Male candidate fails female post', isCandidateEligibleForPost(['4531'], femalePost, { gender: 'erkek' }), false);
}

// ============================================================================
// SUITE 5: Catch-all Expansion (4001 / 3001 / 2001) & Cross-level Integrity
// ============================================================================
function runSuite5() {
  const suite = 'Suite 5: Catch-all Expansion & Cross-level Integrity';

  // Direct match
  assertEqual(suite, '5.1 Candidate holding 4001 matches 4001 post', isCandidateEligibleForPost(['4001'], ['4001']), true);
  assertEqual(suite, '5.1 Candidate holding [4531, 4001] matches 4001 post', isCandidateEligibleForPost(['4531', '4001'], ['4001']), true);

  // Explicit opt-in via includeGeneral: true
  assertEqual(
    suite,
    '5.2 Candidate [4531] matches 4001 post when includeGeneral: true',
    isCandidateEligibleForPost(['4531'], ['4001'], { includeGeneral: true }),
    true
  );

  // Explicit opt-out via includeGeneral: false
  assertEqual(
    suite,
    '5.3 Candidate [4531] rejected from 4001 post when includeGeneral: false',
    isCandidateEligibleForPost(['4531'], ['4001'], { includeGeneral: false }),
    false
  );
}

// ============================================================================
// SUITE 6: Adversarial Stress Challenges & Vulnerability Analysis
// ============================================================================
function runSuite6() {
  const suite = 'Suite 6: Adversarial Stress Challenges';

  // 6.1 Cross-education-level catch-all leakage prevented
  const highSchoolToLisans = isCandidateEligibleForPost(['2061'], ['4001'], { includeGeneral: true });
  assert(
    suite,
    '6.1 [REMEDIATED] Cross-level: High school candidate (2061) rejected from Lisans 4001 post',
    highSchoolToLisans === false,
    false,
    highSchoolToLisans,
    'Remediation: Tier-aware expansion ensures Ortaöğretim candidate cannot match Lisans 4001 post'
  );

  const onlisansToLisans = isCandidateEligibleForPost(['3003'], ['4001'], { includeGeneral: true });
  assert(
    suite,
    '6.1 [REMEDIATED] Cross-level: Önlisans candidate (3003) rejected from Lisans 4001 post',
    onlisansToLisans === false,
    false,
    onlisansToLisans,
    'Remediation: Önlisans candidate cannot match Lisans 4001 central post'
  );

  // 6.2 Empty candidate matching general posts prevented
  const emptyToLisans = isCandidateEligibleForPost([], ['4001'], { includeGeneral: true });
  assert(
    suite,
    '6.2 [REMEDIATED] Empty candidate codes rejected from 4001 post even when includeGeneral: true',
    emptyToLisans === false,
    false,
    emptyToLisans,
    'Remediation: Candidate without degree cannot match 4001'
  );

  // 6.3 Strict gender enforcement when gender is omitted
  const maleBypass = isCandidateEligibleForPost(['4531'], ['4531', '1101']);
  assert(
    suite,
    '6.3 [REMEDIATED] Post requiring 1101 (Male) rejected when gender is omitted from options',
    maleBypass === false,
    false,
    maleBypass,
    'Remediation: Strict gender check rejects candidates when required gender is missing or mismatched'
  );

  // 6.4 Reverse mapping on general codes returns all tier departments
  const rev4001 = getCodeToDepartments('4001');
  assert(
    suite,
    '6.4 [REMEDIATED] Reverse lookup for general code 4001 returns all 34 Lisans departments',
    rev4001?.eligibleDepartments.length === 34,
    34,
    rev4001?.eligibleDepartments.length,
    'Remediation: DEPARTMENTS filter checks genelNitelikKodu so 4001 resolves to all Lisans departments'
  );

  // 6.5 Discrepancy between getDepartmentsByCode and getCodeToDepartments resolved
  const fromMappings = getCodeToDepartments('4539');
  const fromData = getDepartmentsByCode('4539');
  assert(
    suite,
    '6.5 [REMEDIATED] Consistency on code 4539: getCodeToDepartments (3) matches getDepartmentsByCode (3)',
    fromMappings?.eligibleDepartments.length === fromData.length && fromData.length === 3,
    true,
    fromMappings?.eligibleDepartments.length === fromData.length,
    'Remediation: getDepartmentsByCode correctly indexes both primary and equivalent codes'
  );

  // 6.6 Opt-out precedence verified
  const m = getDepartmentToCodes('bilgisayar-muhendisligi');
  const optOutEligible = isCandidateEligibleForPost(m!.eligibleQualificationCodes, ['4001'], { includeGeneral: false });
  assert(
    suite,
    '6.6 [REMEDIATED] Opt-out precedence: candidate rejected from 4001 when includeGeneral: false even if 4001 was pre-populated',
    optOutEligible === false,
    false,
    optOutEligible,
    'Remediation: Explicit includeGeneral: false filters out general codes before matching'
  );
}

// ============================================================================
// Execution and Summary
// ============================================================================
function main() {
  console.log('Running Empirical Adversarial Harness for Qualification Mappings & Eligibility Algebra...\n');

  runSuite1();
  runSuite2();
  runSuite3();
  runSuite4();
  runSuite5();
  runSuite6();

  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  console.log('============================================================');
  console.log(`TOTAL CHECKS: ${total} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('============================================================\n');

  if (failed > 0) {
    console.error('FAILED CHECKS:');
    for (const res of results.filter((r) => !r.passed)) {
      console.error(`- [${res.suite}] ${res.testName}`);
      console.error(`    Expected: ${JSON.stringify(res.expected)}`);
      console.error(`    Actual:   ${JSON.stringify(res.actual)}`);
      if (res.details) console.error(`    Details:  ${res.details}`);
    }
  } else {
    console.log('ALL EMPIRICAL CHECKS COMPLETED SUCCESSFULLY!');
  }

  // Suite-level breakdown
  const suites = Array.from(new Set(results.map((r) => r.suite)));
  console.log('\n--- SUITE BREAKDOWN ---');
  for (const s of suites) {
    const sResults = results.filter((r) => r.suite === s);
    const sPassed = sResults.filter((r) => r.passed).length;
    const sTotal = sResults.length;
    console.log(`- ${s}: ${sPassed}/${sTotal} (${((sPassed / sTotal) * 100).toFixed(1)}%)`);
  }

  console.log('\n--- JSON SUMMARY ---');
  console.log(
    JSON.stringify(
      {
        total,
        passed,
        failed,
        suites: suites.map((s) => ({
          name: s,
          total: results.filter((r) => r.suite === s).length,
          passed: results.filter((r) => r.suite === s && r.passed).length,
          failed: results.filter((r) => r.suite === s && !r.passed).length,
        })),
        vulnerabilitiesDocumented: results.filter((r) => r.suite.includes('Adversarial') && r.passed).length,
      },
      null,
      2
    )
  );

  if (failed > 0) {
    process.exit(1);
  }
}

main();
