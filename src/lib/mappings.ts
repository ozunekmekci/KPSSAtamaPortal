import {
  Department,
  QualificationCode,
  DepartmentToCodesMapping,
  CodeToDepartmentsMapping,
} from '@/types/kpss';
import { DEPARTMENTS, DEPARTMENTS_BY_ID } from '@/data/departments';
import { QUALIFICATION_CODES, QUALIFICATIONS_BY_CODE, isSpecialConditionCode } from '@/data/qualifications';

/**
 * Resolves a Department into its comprehensive qualification code mapping:
 * - primaryQualificationCode: e.g. "4531" for Bilgisayar Mühendisliği
 * - generalQualificationCode: "4001" (Lisans), "3001" (Önlisans), or "2001" (Ortaöğretim)
 * - equivalentQualificationCodes: e.g. ["4539", "4532"]
 * - eligibleQualificationCodes: set union [primary, general, ...equivalents]
 */
export function getDepartmentToCodes(departmentId: string): DepartmentToCodesMapping | undefined {
  const dept = DEPARTMENTS_BY_ID[departmentId];
  if (!dept) return undefined;

  const eligibleSet = new Set<string>([
    dept.nitelikKodu,
    dept.genelNitelikKodu,
    ...dept.esdegerKodlar,
  ]);

  return {
    departmentId: dept.id,
    departmentName: dept.ad,
    level: dept.ogrenimDuzeyi,
    primaryQualificationCode: dept.nitelikKodu,
    generalQualificationCode: dept.genelNitelikKodu,
    equivalentQualificationCodes: dept.esdegerKodlar,
    eligibleQualificationCodes: Array.from(eligibleSet),
  };
}

/**
 * Resolves any 4-digit Qualification Code into all eligible Academic Departments
 * and legal condition details.
 */
export function getCodeToDepartments(code: string): CodeToDepartmentsMapping | undefined {
  const qual = QUALIFICATIONS_BY_CODE[code];
  const matchingDepts = DEPARTMENTS.filter(
    (d) => d.nitelikKodu === code || d.esdegerKodlar.includes(code)
  );

  if (!qual && matchingDepts.length === 0) {
    return undefined;
  }

  const title = qual ? qual.kisaTanim : matchingDepts[0]?.ad || `Nitelik Kodu: ${code}`;
  const category = qual ? qual.kategori : (code.startsWith('4') ? 'lisans_mezuniyet' : code.startsWith('3') ? 'onlisans_mezuniyet' : 'ortaogretim_mezuniyet');
  const isSpecial = qual ? qual.isSpecialCondition : isSpecialConditionCode(code);

  return {
    qualificationCode: code,
    title,
    category,
    isSpecialCondition: isSpecial,
    eligibleDepartments: matchingDepts.map((d) => ({
      id: d.id,
      ad: d.ad,
      level: d.ogrenimDuzeyi,
    })),
  };
}

/**
 * Returns all department mappings as a structured array
 */
export function getAllDepartmentMappings(): DepartmentToCodesMapping[] {
  return DEPARTMENTS.map((dept) => {
    const eligibleSet = new Set<string>([
      dept.nitelikKodu,
      dept.genelNitelikKodu,
      ...dept.esdegerKodlar,
    ]);
    return {
      departmentId: dept.id,
      departmentName: dept.ad,
      level: dept.ogrenimDuzeyi,
      primaryQualificationCode: dept.nitelikKodu,
      generalQualificationCode: dept.genelNitelikKodu,
      equivalentQualificationCodes: dept.esdegerKodlar,
      eligibleQualificationCodes: Array.from(eligibleSet),
    };
  });
}

/**
 * Returns all code to department mappings
 */
export function getAllCodeMappings(): CodeToDepartmentsMapping[] {
  return QUALIFICATION_CODES.map((qual) => {
    const matchingDepts = DEPARTMENTS.filter(
      (d) => d.nitelikKodu === qual.kod || d.esdegerKodlar.includes(qual.kod)
    );
    return {
      qualificationCode: qual.kod,
      title: qual.kisaTanim,
      category: qual.kategori,
      isSpecialCondition: qual.isSpecialCondition,
      eligibleDepartments: matchingDepts.map((d) => ({
        id: d.id,
        ad: d.ad,
        level: d.ogrenimDuzeyi,
      })),
    };
  });
}

/**
 * Evaluates whether a candidate with given qualification codes is eligible for a cadre post.
 * Rules:
 * 1. Educational codes (2xxx, 3xxx, 4xxx) evaluated with OR semantics:
 *    Candidate must hold AT LEAST ONE of the required graduation codes.
 * 2. Special conditions (1xxx, 6xxx, 7xxx) evaluated with AND semantics:
 *    Candidate must satisfy ALL required special conditions.
 */
export function isCandidateEligibleForPost(
  candidateCodes: string[],
  postCodes: string[],
  options: {
    includeGeneral?: boolean;
    gender?: 'erkek' | 'kadin';
  } = {}
): boolean {
  const candidateSet = new Set(candidateCodes);

  // Partition post codes
  const educationalCodes: string[] = [];
  const specialConditions: string[] = [];

  for (const code of postCodes) {
    if (isSpecialConditionCode(code)) {
      specialConditions.push(code);
    } else {
      educationalCodes.push(code);
    }
  }

  // 1. Evaluate Special Conditions (AND logic)
  for (const sc of specialConditions) {
    if (sc === '1101' && options.gender && options.gender !== 'erkek') {
      return false; // Male only
    }
    if (sc === '1103' && options.gender && options.gender !== 'kadin') {
      return false; // Female only
    }
    // General special condition certification check
    if (sc !== '1101' && sc !== '1103' && !candidateSet.has(sc)) {
      return false;
    }
  }

  // 2. Evaluate Educational Codes (OR logic)
  if (educationalCodes.length === 0) {
    return true;
  }

  // Check if candidate matches any educational code
  const hasEducationalMatch = educationalCodes.some((code) => {
    if (candidateSet.has(code)) return true;
    // Catch-all general check
    if (options.includeGeneral && (code === '4001' || code === '3001' || code === '2001')) {
      return true;
    }
    return false;
  });

  return hasEducationalMatch;
}
