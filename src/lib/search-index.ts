import {
  PlacementRecord,
  Department,
  QualificationCode,
  EducationLevel,
  PlacementPeriod,
} from '@/types/kpss';
import { PLACEMENT_RECORDS } from '@/data/records';
import { DEPARTMENTS, DEPARTMENTS_BY_ID, DEPARTMENTS_BY_CODE } from '@/data/departments';
import { QUALIFICATION_CODES, QUALIFICATIONS_BY_CODE } from '@/data/qualifications';
import { SPECIAL_CONDITIONS_BY_CODE } from '@/data/special-conditions';
import { normalizeTrSearch } from '@/lib/turkish';

// ============================================================================
// Acronym & Alias Dictionaries for High-Fidelity Turkish Matching
// ============================================================================
export const INSTITUTION_ALIASES: Record<string, string[]> = {
  'DEVLET HAVA MEYDANLARI İŞLETMESİ GENEL MÜDÜRLÜĞÜ': ['dhmi', 'dhmi genel mudurlugu', 'hava meydanlari'],
  'TÜRKİYE ELEKTRİK İLETİM A.Ş. GENEL MÜDÜRLÜĞÜ': ['teias', 'teias genel mudurlugu'],
  'SOSYAL GÜVENLİK KURUMU BAŞKANLIĞI': ['sgk', 'sgk baskanligi'],
  'GELİR İDARESİ BAŞKANLIĞI': ['gib', 'gelir idaresi'],
  'ÇEVRE, ŞEHİRCİLİK VE İKLİM DEĞİŞİKLİĞİ BAKANLIĞI': ['csb', 'csidb', 'cevre sehircilik'],
  'DEVLET SU İŞLERİ GENEL MÜDÜRLÜĞÜ': ['dsi', 'dsi genel mudurlugu'],
  'KARAYOLLARI GENEL MÜDÜRLÜĞÜ': ['kgm', 'karayollari'],
  'T.C. DEVLET DEMİRYOLLARI İŞLETMESİ GENEL MÜDÜRLÜĞÜ': ['tcdd', 'demiryollari'],
  'TAPU VE KADASTRO GENEL MÜDÜRLÜĞÜ': ['tkgm', 'tapu kadastro'],
  'TÜRKİYE İSTATİSTİK KURUMU BAŞKANLIĞI': ['tuik', 'istatistik'],
  'GÖÇ İDARESİ BAŞKANLIĞI': ['goc idaresi', 'goc'],
  'METEOROLOJİ GENEL MÜDÜRLÜĞÜ': ['mgm', 'meteoroloji'],
  'HACETTEPE ÜNİVERSİTESİ': ['hacettepe', 'hu'],
  'İSTANBUL TEKNİK ÜNİVERSİTESİ': ['itu', 'teknik universite'],
  'ANKARA ÜNİVERSİTESİ': ['au', 'ankara uni'],
  'İÇİŞLERİ BAKANLIĞI': ['icisleri'],
  'TİCARET BAKANLIĞI': ['gumruk', 'ticaret'],
};

export const TITLE_ALIASES: Record<string, string[]> = {
  'vhki': ['veri hazirlama ve kontrol isletmeni', 'v.h.k.i.', 'vhki'],
  'v.h.k.i.': ['veri hazirlama ve kontrol isletmeni', 'vhki', 'v.h.k.i.'],
  'V.H.K.İ.': ['vhki', 'v.h.k.i.', 'veri hazirlama ve kontrol isletmeni', 'veri hazirlama'],
  'V.H.K.İ. (VERİ HAZIRLAMA VE KONTROL İŞLETMENİ)': ['vhki', 'v.h.k.i.', 'veri hazirlama ve kontrol isletmeni', 'veri hazirlama'],
  'VERİ HAZIRLAMA VE KONTROL İŞLETMENİ': ['vhki', 'v.h.k.i.', 'veri hazirlama ve kontrol isletmeni', 'veri hazirlama'],
  'BİLGİSAYAR İŞLETMENİ': ['bilgisayar isletmeni'],
  'ARFF MEMURU': ['arff', 'itfaiye', 'hava meydani itfaiye'],
  'AIM MEMURU': ['aim', 'havacilik bilgi yonetimi', 'havacilik bilgi memuru'],
  'İKM': ['ikm', 'infaz koruma memuru', 'gardiyan'],
  'MÜHENDİS': ['muhendis', 'eng'],
};

// ============================================================================
// Pre-computed Inverted Index Data Structures
// ============================================================================

export interface SearchIndex {
  recordsById: Map<string, PlacementRecord>;
  recordsByKadroKodu: Map<string, PlacementRecord>;
  recordsByQualificationCode: Map<string, PlacementRecord[]>;
  recordsByCity: Map<string, PlacementRecord[]>;
  recordsByEducationLevel: Map<EducationLevel, PlacementRecord[]>;
  recordsByPeriod: Map<PlacementPeriod, PlacementRecord[]>;
  recordsByInstitution: Map<string, PlacementRecord[]>;
  recordSearchCorpus: Map<string, string>;
  tokenToRecordIds: Map<string, Set<string>>;
  departmentsById: Map<string, Department>;
  departmentsByCode: Map<string, Department[]>;
  qualificationByCode: Map<string, QualificationCode>;
}

function buildSearchIndex(): SearchIndex {
  const recordsById = new Map<string, PlacementRecord>();
  const recordsByKadroKodu = new Map<string, PlacementRecord>();
  const recordsByQualificationCode = new Map<string, PlacementRecord[]>();
  const recordsByCity = new Map<string, PlacementRecord[]>();
  const recordsByEducationLevel = new Map<EducationLevel, PlacementRecord[]>();
  const recordsByPeriod = new Map<PlacementPeriod, PlacementRecord[]>();
  const recordsByInstitution = new Map<string, PlacementRecord[]>();
  const recordSearchCorpus = new Map<string, string>();
  const tokenToRecordIds = new Map<string, Set<string>>();

  // 1. Index All Placement Records
  for (const record of PLACEMENT_RECORDS) {
    recordsById.set(record.id, record);
    recordsByKadroKodu.set(record.kadroKodu, record);

    // Inverted index by qualification code
    for (const code of record.nitelikKodlari) {
      const list = recordsByQualificationCode.get(code);
      if (list) {
        list.push(record);
      } else {
        recordsByQualificationCode.set(code, [record]);
      }
    }

    // Inverted index by normalized city
    const cityNorm = normalizeTrSearch(record.sehir);
    if (cityNorm) {
      const cityList = recordsByCity.get(cityNorm);
      if (cityList) {
        cityList.push(record);
      } else {
        recordsByCity.set(cityNorm, [record]);
      }
    }

    // Inverted index by education level
    const eduList = recordsByEducationLevel.get(record.ogrenimDuzeyi);
    if (eduList) {
      eduList.push(record);
    } else {
      recordsByEducationLevel.set(record.ogrenimDuzeyi, [record]);
    }

    // Inverted index by placement period
    const periodList = recordsByPeriod.get(record.donem);
    if (periodList) {
      periodList.push(record);
    } else {
      recordsByPeriod.set(record.donem, [record]);
    }

    // Inverted index by normalized institution
    const instNorm = normalizeTrSearch(record.kurumAdi);
    if (instNorm) {
      const instList = recordsByInstitution.get(instNorm);
      if (instList) {
        instList.push(record);
      } else {
        recordsByInstitution.set(instNorm, [record]);
      }
    }

    // Build rich searchable text corpus for multi-token fuzzy matching
    const corpusParts: string[] = [
      record.kadroKodu,
      record.kurumAdi,
      record.kadroUnvani,
      record.sehir,
      record.ilce || '',
      record.teskilat || '',
      record.hizmetSinifi || '',
      record.donem,
      record.puanTuru,
      record.ogrenimDuzeyi,
      ...record.nitelikKodlari,
    ];

    // Append institution aliases
    const instAliases = INSTITUTION_ALIASES[record.kurumAdi];
    if (instAliases) {
      corpusParts.push(...instAliases);
    }

    // Append title aliases
    const titleAliases = TITLE_ALIASES[record.kadroUnvani];
    if (titleAliases) {
      corpusParts.push(...titleAliases);
    }
    for (const [titleKey, aliases] of Object.entries(TITLE_ALIASES)) {
      if (record.kadroUnvani.includes(titleKey)) {
        corpusParts.push(...aliases);
      }
    }

    // Append qualification metadata & eligible departments
    for (const code of record.nitelikKodlari) {
      const qual = QUALIFICATIONS_BY_CODE[code];
      if (qual) {
        corpusParts.push(qual.kisaTanim);
        corpusParts.push(qual.aciklama);
        if (qual.bolumler) {
          corpusParts.push(...qual.bolumler);
        }
      }

      const spec = SPECIAL_CONDITIONS_BY_CODE[code];
      if (spec) {
        corpusParts.push(spec.baslik);
        corpusParts.push(spec.detay);
      }

      const depts = DEPARTMENTS_BY_CODE[code];
      if (depts) {
        for (const d of depts) {
          corpusParts.push(d.ad);
          corpusParts.push(...d.anahtarKelimeler);
        }
      }
    }

    const fullCorpus = normalizeTrSearch(corpusParts.join(' '));
    recordSearchCorpus.set(record.id, fullCorpus);

    // Populate token inverted index for sub-millisecond prefix & token lookups
    const tokens = new Set(fullCorpus.split(/\s+/).filter(Boolean));
    for (const token of tokens) {
      let recordSet = tokenToRecordIds.get(token);
      if (!recordSet) {
        recordSet = new Set<string>();
        tokenToRecordIds.set(token, recordSet);
      }
      recordSet.add(record.id);
    }
  }

  // 2. Department lookups
  const departmentsById = new Map<string, Department>(Object.entries(DEPARTMENTS_BY_ID));
  const departmentsByCode = new Map<string, Department[]>(Object.entries(DEPARTMENTS_BY_CODE));

  // 3. Qualification lookup
  const qualificationByCode = new Map<string, QualificationCode>(
    QUALIFICATION_CODES.map((q) => [q.kod, q])
  );

  return {
    recordsById,
    recordsByKadroKodu,
    recordsByQualificationCode,
    recordsByCity,
    recordsByEducationLevel,
    recordsByPeriod,
    recordsByInstitution,
    recordSearchCorpus,
    tokenToRecordIds,
    departmentsById,
    departmentsByCode,
    qualificationByCode,
  };
}

// Global cached in-memory singleton
export const searchIndex: SearchIndex = buildSearchIndex();
