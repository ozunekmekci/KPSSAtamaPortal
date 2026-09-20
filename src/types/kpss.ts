// ============================================================================
// Core Domain Types: KPSS Central Placement (2024 - 2026)
// ============================================================================

export type EducationLevel = 'lisans' | 'onlisans' | 'ortaogretim';

export type ScoreType = 'P3' | 'P93' | 'P94';

export type PlacementPeriod = '2024/1' | '2024/2' | '2024/5' | '2025/1' | '2025/2' | '2026/1' | string;

export type HizmetSinifi =
  | 'TH'   // Teknik Hizmetler Sınıfı
  | 'GİH'  // Genel İdare Hizmetleri Sınıfı
  | 'SH'   // Sağlık Hizmetleri Sınıfı
  | 'AH'   // Avukatlık Hizmetleri Sınıfı
  | 'YH'   // Yardımcı Hizmetler Sınıfı
  | 'EÖH'  // Eğitim ve Öğretim Hizmetleri Sınıfı
  | 'KİT'  // Sözleşmeli Personel (399 sayılı KHK)
  | string;

export type OrganizationType =
  | 'MERKEZ'       // Bakanlık ve Başkanlık Merkez Teşkilatı (Ankara)
  | 'TASRA'        // İl ve İlçe Taşra Teşkilatı
  | 'KIT'          // Kamu İktisadi Teşebbüsleri (DHMİ, TEİAŞ, TCDD, vb.)
  | 'BELEDIYE'     // Belediyeler ve Bağlı İdareler (İSKİ, ASKİ vb.)
  | 'UNIVERSITE'   // Devlet Üniversiteleri
  | string;

// ----------------------------------------------------------------------------
// 1. PlacementRecord (Kadro ve Yerleştirme Kaydı)
// ----------------------------------------------------------------------------
export interface PlacementRecord {
  /** Deterministic unique ID: `${donem}-${ogrenimDuzeyi}-${kadroKodu}` */
  id: string;

  /** ÖSYM 9-digit official cadre code (e.g. "324210015") */
  kadroKodu: string;

  /** Central placement period */
  donem: PlacementPeriod;

  /** Education level corresponding to ÖSYM Tablo-1, 2, or 3 */
  ogrenimDuzeyi: EducationLevel;

  /** Score type evaluated for this cadre (Lisans: P3, Önlisans: P93, Ortaöğretim: P94) */
  puanTuru: ScoreType;

  /** Official hiring public institution name */
  kurumAdi: string;

  /** Cadre / position title (e.g. "MÜHENDİS", "V.H.K.İ.", "BİLGİSAYAR İŞLETMENİ") */
  kadroUnvani: string;

  /** Organization classification */
  teskilat?: OrganizationType;

  /** Public service class */
  hizmetSinifi?: HizmetSinifi;

  /** Cadre degree/rank (1-15, e.g. "8" or "9" or empty for KİT) */
  derece?: string;

  /** Normalized Turkish city name (e.g. "ANKARA", "İZMİR", or "MERKEZ") */
  sehir: string;

  /** Specific district or regional office if specified (e.g. "ÇANKAYA", "ESENBOĞA") */
  ilce?: string;

  /** Total announced quota (Kontenjan) */
  kontenjan: number;

  /** Total placed candidates (Yerleşen) */
  yerlesen: number;

  /** Unfilled positions: kontenjan - yerlesen */
  bosKalan: number;

  /** Minimum placement score (Taban Puan) - null if yerlesen === 0 */
  tabanPuan: number | null;

  /** Maximum placement score (Tavan Puan) - null if yerlesen === 0 */
  tavanPuan: number | null;

  /** All qualification codes required (e.g. ["4531", "7113", "6225"]) */
  nitelikKodlari: string[];

  /** Separated education qualification codes (starts with 2, 3, or 4) */
  mezuniyetKodlari: string[];

  /** Separated special condition codes (starts with 1, 6, or 7) */
  ozelSartlar: string[];
}

// ----------------------------------------------------------------------------
// 2. QualificationCode (Nitelik Kodu Tanımı)
// ----------------------------------------------------------------------------
export type QualificationCategory =
  | 'genel_mezuniyet'        // 4001, 3001, 2001
  | 'lisans_mezuniyet'       // 4xxx
  | 'onlisans_mezuniyet'     // 3xxx
  | 'ortaogretim_mezuniyet'  // 2xxx
  | 'cinsiyet'               // 1101, 1103
  | 'bilgisayar_sertifika'   // 6225, 6251, 6297
  | 'surucu_belgesi'         // 6501, 6505, 6509, 6513, 6514
  | 'yabanci_dil'            // 7111-7147 (YDS seviyeleri)
  | 'guvenlik_ve_vardiya'    // 7300, 7303, 7304, 7225
  | 'kurumsal_ozel_sart'     // 7322 (DHMİ), 7324 (TCDD), 7368 (Gümrük), 7257
  | 'diger_ozel_sart'
  | 'ozel_sart';

export interface QualificationCode {
  /** 4-digit numeric code string (e.g. "4531") */
  kod: string;

  /** Categorical taxonomy */
  kategori: QualificationCategory;

  /** Target education level */
  ogrenimDuzeyi: EducationLevel | 'hepsi';

  /** Full verbatim text from ÖSYM guide */
  aciklama: string;

  /** Clean concise label for UI badges/chips (e.g. "Bilgisayar Mühendisliği") */
  kisaTanim: string;

  /** Indicates if this code represents a non-educational condition */
  isSpecialCondition: boolean;

  /** Associated academic departments for education codes */
  bolumler?: string[];
}

// ----------------------------------------------------------------------------
// 3. Department (Akademik Bölüm / Mezuniyet Alanı)
// ----------------------------------------------------------------------------
export interface Department {
  /** Unique URL-safe slug e.g. "bilgisayar-muhendisligi" */
  id: string;

  /** Official Turkish title of the department */
  ad: string;

  /** Education level */
  ogrenimDuzeyi: EducationLevel;

  /** Primary ÖSYM 4-digit discipline qualification code */
  nitelikKodu: string;

  /** General level fallback qualification code (4001 / 3001 / 2001) */
  genelNitelikKodu: string;

  /** Faculty or school category */
  fakulte?: string;

  /** Broad domain group (e.g. "Mühendislik", "İİBF", "Sağlık", "Teknik") */
  alanGrubu?: string;

  /** Equivalent or related degree codes that also qualify */
  esdegerKodlar: string[];

  /** Search keywords including ASCII transliterations for resilient search */
  anahtarKelimeler: string[];
}

// ----------------------------------------------------------------------------
// 4. SpecialCondition (Özel Şart Tanımı)
// ----------------------------------------------------------------------------
export interface SpecialCondition {
  /** 4-digit numeric condition code (e.g. "6225") */
  kod: string;

  /** Concise heading for cards and modals */
  baslik: string;

  /** Full legal/official criteria description */
  detay: string;

  /** Condition category */
  kategori: 'sertifika' | 'dil' | 'ehliyet' | 'cinsiyet' | 'fiziksel_saglik' | 'vardiya_gorev' | 'guvenlik' | 'kurumsal_ozel_sart';

  /** Required document / proof (e.g. "MEB Onaylı Kurs Belgesi veya Üniversite Transkripti") */
  belgeGereksinimi: string;

  /** Issuing or evaluating authority (e.g. "MEB", "ÖSYM", "EGM", "Sağlık Kurulu") */
  yetkiliKurum: string;

  /** Positions that frequently require this condition */
  sikliklaGorulenUnvanlar: string[];
}

// ----------------------------------------------------------------------------
// 5. Bi-directional Mapping Schema
// ----------------------------------------------------------------------------
export interface DepartmentToCodesMapping {
  departmentId: string;
  departmentName: string;
  level: EducationLevel;
  primaryQualificationCode: string;
  generalQualificationCode: string;
  equivalentQualificationCodes: string[];
  eligibleQualificationCodes: string[]; // [primaryCode, generalCode, ...equivalentCodes]
}

export interface CodeToDepartmentsMapping {
  qualificationCode: string;
  title: string;
  category: QualificationCategory;
  isSpecialCondition: boolean;
  eligibleDepartments: Array<{
    id: string;
    ad: string;
    level: EducationLevel;
  }>;
}

// ----------------------------------------------------------------------------
// 6. Search & Filter Parameters Schema
// ----------------------------------------------------------------------------
export interface FilterCriteria {
  ogrenimDuzeyi?: EducationLevel;
  donemler?: PlacementPeriod[];
  sehirler?: string[];
  kurumlar?: string[];
  unvanlar?: string[];
  hizmetSiniflari?: string[];
  nitelikKodlari?: string[];
  minPuan?: number;
  maxPuan?: number;
  sadeceBosKalanlar?: boolean; // filter cadrolar where bosKalan > 0
  includeGeneralCodes?: boolean; // include 4001/3001/2001 when filtering by department
  searchQuery?: string; // free text search matching institution, title, city
}

// ----------------------------------------------------------------------------
// 7. Analytics & Trend Analysis Schema
// ----------------------------------------------------------------------------
export interface PeriodSummary {
  period: PlacementPeriod;
  minScore: number | null;
  maxScore: number | null;
  avgScore: number | null;
  medianScore: number | null;
  totalQuota: number;
  totalPlaced: number;
  totalVacant: number;
}

export interface TrendAnalysis {
  periodStats: PeriodSummary[];
  topInstitutions: Array<{
    kurumAdi: string;
    kontenjan: number;
    yerlesen: number;
    tabanPuan: number | null;
  }>;
  lowestClosingPositions: PlacementRecord[];
  highestClosingPositions: PlacementRecord[];
}

// ----------------------------------------------------------------------------
// 8. Ingestion & Parser Subsystem Schema
// ----------------------------------------------------------------------------
export interface ImportValidationError {
  row?: number;
  kadroKodu?: string;
  field?: string;
  message: string;
}

export interface ImportResult {
  success: boolean;
  donem: PlacementPeriod;
  ogrenimDuzeyi: EducationLevel;
  totalRows: number;
  inserted: number;
  updated: number;
  errors: ImportValidationError[];
  warnings: ImportValidationError[];
  records: PlacementRecord[];
}
