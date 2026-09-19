import fs from 'fs';
import path from 'path';
import { PlacementRecord, PlacementPeriod, EducationLevel, ScoreType } from '../src/types/kpss';
import { isSpecialConditionCode } from '../src/data/qualifications';

const periods: PlacementPeriod[] = ['2024/1', '2024/2', '2025/1'];

interface Template {
  kadroUnvani: string;
  ogrenimDuzeyi: EducationLevel;
  puanTuru: ScoreType;
  kurumlar: Array<{ ad: string; sehirler: string[]; teskilat: string; hizmetSinifi: string }>;
  codes: string[];
  baseScoreRange: [number, number];
  kontenjanRange: [number, number];
  fillRatio: number; // 1.0 = fully placed, 0.0 = completely unfilled
}

const templates: Template[] = [
  // --- LİSANS (P3) ---
  {
    kadroUnvani: 'MÜHENDİS (BİLGİSAYAR)',
    ogrenimDuzeyi: 'lisans',
    puanTuru: 'P3',
    kurumlar: [
      { ad: 'DEVLET HAVA MEYDANLARI İŞLETMESİ GENEL MÜDÜRLÜĞÜ', sehirler: ['ANKARA', 'İSTANBUL', 'İZMİR', 'ANTALYA'], teskilat: 'KIT', hizmetSinifi: 'KİT' },
      { ad: 'TÜRKİYE ELEKTRİK İLETİM A.Ş. GENEL MÜDÜRLÜĞÜ', sehirler: ['ANKARA', 'BURSA', 'ERZURUM'], teskilat: 'KIT', hizmetSinifi: 'KİT' },
      { ad: 'SOSYAL GÜVENLİK KURUMU BAŞKANLIĞI', sehirler: ['ANKARA / MERKEZ'], teskilat: 'MERKEZ', hizmetSinifi: 'TH' },
      { ad: 'GELİR İDARESİ BAŞKANLIĞI', sehirler: ['ANKARA', 'İSTANBUL'], teskilat: 'MERKEZ', hizmetSinifi: 'TH' },
      { ad: 'ÇEVRE, ŞEHİRCİLİK VE İKLİM DEĞİŞİKLİĞİ BAKANLIĞI', sehirler: ['ANKARA'], teskilat: 'MERKEZ', hizmetSinifi: 'TH' },
      { ad: 'HACETTEPE ÜNİVERSİTESİ', sehirler: ['ANKARA'], teskilat: 'UNIVERSITE', hizmetSinifi: 'TH' },
      { ad: 'İSTANBUL TEKNİK ÜNİVERSİTESİ', sehirler: ['İSTANBUL'], teskilat: 'UNIVERSITE', hizmetSinifi: 'TH' },
    ],
    codes: ['4531', '7113', '7225'],
    baseScoreRange: [87.5, 96.2],
    kontenjanRange: [1, 8],
    fillRatio: 1.0,
  },
  {
    kadroUnvani: 'MÜHENDİS (YAZILIM)',
    ogrenimDuzeyi: 'lisans',
    puanTuru: 'P3',
    kurumlar: [
      { ad: 'DEVLET SU İŞLERİ GENEL MÜDÜRLÜĞÜ', sehirler: ['ANKARA', 'ESKİŞEHİR', 'SAMSUN'], teskilat: 'MERKEZ', hizmetSinifi: 'TH' },
      { ad: 'KARAYOLLARI GENEL MÜDÜRLÜĞÜ', sehirler: ['ANKARA', 'KONYA', 'TRABZON'], teskilat: 'MERKEZ', hizmetSinifi: 'TH' },
      { ad: 'İÇİŞLERİ BAKANLIĞI', sehirler: ['ANKARA / MERKEZ'], teskilat: 'MERKEZ', hizmetSinifi: 'TH' },
    ],
    codes: ['4539', '4531', '6225'],
    baseScoreRange: [86.0, 94.1],
    kontenjanRange: [1, 5],
    fillRatio: 1.0,
  },
  {
    kadroUnvani: 'MÜHENDİS (ELEKTRİK-ELEKTRONİK)',
    ogrenimDuzeyi: 'lisans',
    puanTuru: 'P3',
    kurumlar: [
      { ad: 'DEVLET HAVA MEYDANLARI İŞLETMESİ GENEL MÜDÜRLÜĞÜ', sehirler: ['ANKARA', 'İSTANBUL', 'TRABZON', 'VAN', 'DİYARBAKIR'], teskilat: 'KIT', hizmetSinifi: 'KİT' },
      { ad: 'TÜRKİYE ELEKTRİK İLETİM A.Ş. GENEL MÜDÜRLÜĞÜ', sehirler: ['ANKARA', 'ADANA', 'ELAZIĞ', 'KAYSERİ'], teskilat: 'KIT', hizmetSinifi: 'KİT' },
      { ad: 'T.C. DEVLET DEMİRYOLLARI İŞLETMESİ GENEL MÜDÜRLÜĞÜ', sehirler: ['ANKARA', 'SİVAS', 'MALATYA'], teskilat: 'KIT', hizmetSinifi: 'KİT' },
    ],
    codes: ['4611', '7113', '7225'],
    baseScoreRange: [88.2, 95.8],
    kontenjanRange: [1, 6],
    fillRatio: 1.0,
  },
  {
    kadroUnvani: 'MÜHENDİS (MAKİNE)',
    ogrenimDuzeyi: 'lisans',
    puanTuru: 'P3',
    kurumlar: [
      { ad: 'KARAYOLLARI GENEL MÜDÜRLÜĞÜ', sehirler: ['ANKARA', 'İSTANBUL', 'KARS', 'KASTAMONU', 'MERSİN'], teskilat: 'TASRA', hizmetSinifi: 'TH' },
      { ad: 'DEVLET SU İŞLERİ GENEL MÜDÜRLÜĞÜ', sehirler: ['ANKARA', 'EDİRNE', 'ŞANLIURFA'], teskilat: 'TASRA', hizmetSinifi: 'TH' },
      { ad: 'T.C. DEVLET DEMİRYOLLARI İŞLETMESİ GENEL MÜDÜRLÜĞÜ', sehirler: ['ESKİŞEHİR', 'ANKARA'], teskilat: 'KIT', hizmetSinifi: 'KİT' },
    ],
    codes: ['4639', '7257'],
    baseScoreRange: [84.1, 91.5],
    kontenjanRange: [1, 8],
    fillRatio: 1.0,
  },
  {
    kadroUnvani: 'MÜHENDİS (İNŞAAT)',
    ogrenimDuzeyi: 'lisans',
    puanTuru: 'P3',
    kurumlar: [
      { ad: 'ÇEVRE, ŞEHİRCİLİK VE İKLİM DEĞİŞİKLİĞİ BAKANLIĞI', sehirler: ['HATAY', 'KAHRAMANMARAŞ', 'MALATYA', 'ADIYAMAN', 'GAZİANTEP'], teskilat: 'TASRA', hizmetSinifi: 'TH' },
      { ad: 'DEVLET SU İŞLERİ GENEL MÜDÜRLÜĞÜ', sehirler: ['ANKARA', 'ANTALYA', 'ARTVİN', 'BURDUR'], teskilat: 'TASRA', hizmetSinifi: 'TH' },
      { ad: 'KARAYOLLARI GENEL MÜDÜRLÜĞÜ', sehirler: ['ANKARA', 'İSTANBUL', 'İZMİR'], teskilat: 'TASRA', hizmetSinifi: 'TH' },
    ],
    codes: ['4669', '7257'],
    baseScoreRange: [83.0, 92.4],
    kontenjanRange: [2, 12],
    fillRatio: 1.0,
  },
  {
    kadroUnvani: 'MÜHENDİS (HARİTA)',
    ogrenimDuzeyi: 'lisans',
    puanTuru: 'P3',
    kurumlar: [
      { ad: 'TAPU VE KADASTRO GENEL MÜDÜRLÜĞÜ', sehirler: ['ANKARA', 'İSTANBUL', 'BURSA', 'ANTALYA', 'AYDIN'], teskilat: 'TASRA', hizmetSinifi: 'TH' },
      { ad: 'KARAYOLLARI GENEL MÜDÜRLÜĞÜ', sehirler: ['ANKARA', 'SİVAS', 'KONYA'], teskilat: 'TASRA', hizmetSinifi: 'TH' },
    ],
    codes: ['4689', '7257'],
    baseScoreRange: [82.5, 89.8],
    kontenjanRange: [1, 5],
    fillRatio: 1.0,
  },
  {
    kadroUnvani: 'AVUKAT',
    ogrenimDuzeyi: 'lisans',
    puanTuru: 'P3',
    kurumlar: [
      { ad: 'SOSYAL GÜVENLİK KURUMU BAŞKANLIĞI', sehirler: ['ANKARA', 'İSTANBUL', 'İZMİR', 'ADANA', 'BURSA'], teskilat: 'TASRA', hizmetSinifi: 'AH' },
      { ad: 'GELİR İDARESİ BAŞKANLIĞI', sehirler: ['ANKARA', 'DİYARBAKIR', 'TRABZON'], teskilat: 'TASRA', hizmetSinifi: 'AH' },
      { ad: 'TÜRKİYE ELEKTRİK İLETİM A.Ş. GENEL MÜDÜRLÜĞÜ', sehirler: ['ANKARA', 'İSTANBUL'], teskilat: 'KIT', hizmetSinifi: 'KİT' },
    ],
    codes: ['4419', '7225'],
    baseScoreRange: [88.5, 94.7],
    kontenjanRange: [1, 4],
    fillRatio: 1.0,
  },
  {
    kadroUnvani: 'V.H.K.İ. (VERİ HAZIRLAMA VE KONTROL İŞLETMENİ)',
    ogrenimDuzeyi: 'lisans',
    puanTuru: 'P3',
    kurumlar: [
      { ad: 'İÇİŞLERİ BAKANLIĞI', sehirler: ['ANKARA', 'İSTANBUL', 'İZMİR', 'ANTALYA', 'BURSA', 'KOCAELİ'], teskilat: 'TASRA', hizmetSinifi: 'GİH' },
      { ad: 'SOSYAL GÜVENLİK KURUMU BAŞKANLIĞI', sehirler: ['ANKARA', 'KONYA', 'MERSİN', 'GAZİANTEP', 'ŞANLIURFA'], teskilat: 'TASRA', hizmetSinifi: 'GİH' },
      { ad: 'GELİR İDARESİ BAŞKANLIĞI', sehirler: ['ANKARA', 'İSTANBUL', 'KAYSERİ', 'ESKİŞEHİR'], teskilat: 'TASRA', hizmetSinifi: 'GİH' },
      { ad: 'ANKARA ÜNİVERSİTESİ', sehirler: ['ANKARA'], teskilat: 'UNIVERSITE', hizmetSinifi: 'GİH' },
    ],
    codes: ['4421', '4431', '4459', '6225'],
    baseScoreRange: [78.4, 86.8],
    kontenjanRange: [2, 15],
    fillRatio: 1.0,
  },
  {
    kadroUnvani: 'MEMUR (GENEL LİSANS)',
    ogrenimDuzeyi: 'lisans',
    puanTuru: 'P3',
    kurumlar: [
      { ad: 'DEVLET HAVA MEYDANLARI İŞLETMESİ GENEL MÜDÜRLÜĞÜ', sehirler: ['ANKARA', 'İSTANBUL', 'MUĞLA', 'İZMİR'], teskilat: 'KIT', hizmetSinifi: 'KİT' },
      { ad: 'TÜRKİYE İSTATİSTİK KURUMU BAŞKANLIĞI', sehirler: ['ANKARA / MERKEZ'], teskilat: 'MERKEZ', hizmetSinifi: 'GİH' },
      { ad: 'GÖÇ İDARESİ BAŞKANLIĞI', sehirler: ['ANKARA', 'İSTANBUL', 'EDİRNE'], teskilat: 'TASRA', hizmetSinifi: 'GİH' },
    ],
    codes: ['4001', '7225'],
    baseScoreRange: [86.8, 93.4],
    kontenjanRange: [1, 10],
    fillRatio: 1.0,
  },
  {
    kadroUnvani: 'PSİKOLOG',
    ogrenimDuzeyi: 'lisans',
    puanTuru: 'P3',
    kurumlar: [
      { ad: 'AİLE VE SOSYAL HİZMETLER BAKANLIĞI', sehirler: ['ANKARA', 'İSTANBUL', 'DİYARBAKIR', 'VAN', 'ERZURUM'], teskilat: 'TASRA', hizmetSinifi: 'SH' },
      { ad: 'ADALET BAKANLIĞI', sehirler: ['ANKARA', 'İZMİR', 'ADANA'], teskilat: 'TASRA', hizmetSinifi: 'SH' },
    ],
    codes: ['4131'],
    baseScoreRange: [81.5, 88.2],
    kontenjanRange: [1, 5],
    fillRatio: 1.0,
  },
  {
    kadroUnvani: 'SOSYAL ÇALIŞMACI',
    ogrenimDuzeyi: 'lisans',
    puanTuru: 'P3',
    kurumlar: [
      { ad: 'AİLE VE SOSYAL HİZMETLER BAKANLIĞI', sehirler: ['ANKARA', 'İSTANBUL', 'BURSA', 'KONYA', 'SAMSUN'], teskilat: 'TASRA', hizmetSinifi: 'SH' },
    ],
    codes: ['4139'],
    baseScoreRange: [80.2, 86.5],
    kontenjanRange: [2, 8],
    fillRatio: 1.0,
  },
  {
    kadroUnvani: 'İSTATİSTİKÇİ',
    ogrenimDuzeyi: 'lisans',
    puanTuru: 'P3',
    kurumlar: [
      { ad: 'TÜRKİYE İSTATİSTİK KURUMU BAŞKANLIĞI', sehirler: ['ANKARA / MERKEZ', 'İSTANBUL', 'İZMİR'], teskilat: 'TASRA', hizmetSinifi: 'TH' },
      { ad: 'GELİR İDARESİ BAŞKANLIĞI', sehirler: ['ANKARA'], teskilat: 'MERKEZ', hizmetSinifi: 'TH' },
    ],
    codes: ['4851'],
    baseScoreRange: [79.4, 87.1],
    kontenjanRange: [1, 6],
    fillRatio: 1.0,
  },
  {
    kadroUnvani: 'HEMŞİRE',
    ogrenimDuzeyi: 'lisans',
    puanTuru: 'P3',
    kurumlar: [
      { ad: 'HACETTEPE ÜNİVERSİTESİ HASTANELERİ', sehirler: ['ANKARA'], teskilat: 'UNIVERSITE', hizmetSinifi: 'SH' },
      { ad: 'EGE ÜNİVERSİTESİ HASTANESİ', sehirler: ['İZMİR'], teskilat: 'UNIVERSITE', hizmetSinifi: 'SH' },
      { ad: 'ATATÜRK ÜNİVERSİTESİ HASTANESİ', sehirler: ['ERZURUM'], teskilat: 'UNIVERSITE', hizmetSinifi: 'SH' },
    ],
    codes: ['4703'],
    baseScoreRange: [71.5, 82.3],
    kontenjanRange: [5, 25],
    fillRatio: 1.0,
  },
  {
    kadroUnvani: 'MİMAR',
    ogrenimDuzeyi: 'lisans',
    puanTuru: 'P3',
    kurumlar: [
      { ad: 'ÇEVRE, ŞEHİRCİLİK VE İKLİM DEĞİŞİKLİĞİ BAKANLIĞI', sehirler: ['ANKARA', 'İSTANBUL', 'HATAY'], teskilat: 'TASRA', hizmetSinifi: 'TH' },
      { ad: 'KÜLTÜR VE TURİZM BAKANLIĞI', sehirler: ['ANTALYA', 'MUĞLA', 'NEVŞEHİR'], teskilat: 'TASRA', hizmetSinifi: 'TH' },
    ],
    codes: ['4641', '7257'],
    baseScoreRange: [85.2, 92.6],
    kontenjanRange: [1, 4],
    fillRatio: 1.0,
  },
  {
    kadroUnvani: 'MÜTERCİM (İNGİLİZCE / BOŞ KALAN ÖRNEK)',
    ogrenimDuzeyi: 'lisans',
    puanTuru: 'P3',
    kurumlar: [
      { ad: 'DIŞİŞLERİ BAKANLIĞI', sehirler: ['ANKARA / MERKEZ'], teskilat: 'MERKEZ', hizmetSinifi: 'GİH' },
      { ad: 'TİCARET BAKANLIĞI', sehirler: ['HAKKARİ', 'ŞIRNAK'], teskilat: 'TASRA', hizmetSinifi: 'GİH' },
    ],
    codes: ['4001', '7117', '7225'],
    baseScoreRange: [75.0, 85.0],
    kontenjanRange: [1, 2],
    fillRatio: 0.0, // Boş kalan pozisyon
  },

  // --- ÖNLİSANS (P93) ---
  {
    kadroUnvani: 'BİLGİSAYAR İŞLETMENİ',
    ogrenimDuzeyi: 'onlisans',
    puanTuru: 'P93',
    kurumlar: [
      { ad: 'SOSYAL GÜVENLİK KURUMU BAŞKANLIĞI', sehirler: ['ANKARA', 'İSTANBUL', 'İZMİR', 'KONYA', 'ADANA'], teskilat: 'TASRA', hizmetSinifi: 'GİH' },
      { ad: 'İÇİŞLERİ BAKANLIĞI (NÜFUS İL MÜDÜRLÜKLERİ)', sehirler: ['BURSA', 'ANTALYA', 'DİYARBAKIR', 'TRABZON'], teskilat: 'TASRA', hizmetSinifi: 'GİH' },
    ],
    codes: ['3005', '3249', '6225'],
    baseScoreRange: [81.0, 89.5],
    kontenjanRange: [2, 10],
    fillRatio: 1.0,
  },
  {
    kadroUnvani: 'TEKNİKER (BİLGİSAYAR)',
    ogrenimDuzeyi: 'onlisans',
    puanTuru: 'P93',
    kurumlar: [
      { ad: 'DEVLET HAVA MEYDANLARI İŞLETMESİ GENEL MÜDÜRLÜĞÜ', sehirler: ['ANKARA', 'İSTANBUL', 'ERZURUM', 'GAZİANTEP'], teskilat: 'KIT', hizmetSinifi: 'KİT' },
      { ad: 'TÜRKİYE ELEKTRİK İLETİM A.Ş. GENEL MÜDÜRLÜĞÜ', sehirler: ['ANKARA', 'KAYSERİ', 'SAMSUN'], teskilat: 'KIT', hizmetSinifi: 'KİT' },
      { ad: 'HACETTEPE ÜNİVERSİTESİ', sehirler: ['ANKARA'], teskilat: 'UNIVERSITE', hizmetSinifi: 'TH' },
    ],
    codes: ['3005', '3249', '7225'],
    baseScoreRange: [85.5, 92.4],
    kontenjanRange: [1, 5],
    fillRatio: 1.0,
  },
  {
    kadroUnvani: 'TEKNİKER (HARİTA KADASTRO)',
    ogrenimDuzeyi: 'onlisans',
    puanTuru: 'P93',
    kurumlar: [
      { ad: 'TAPU VE KADASTRO GENEL MÜDÜRLÜĞÜ', sehirler: ['ANKARA', 'İSTANBUL', 'İZMİR', 'ANTALYA', 'VAN', 'BALIKESİR'], teskilat: 'TASRA', hizmetSinifi: 'TH' },
      { ad: 'DEVLET SU İŞLERİ GENEL MÜDÜRLÜĞÜ', sehirler: ['KASTAMONU', 'ELAZIĞ', 'ŞANLIURFA'], teskilat: 'TASRA', hizmetSinifi: 'TH' },
    ],
    codes: ['3007', '7257'],
    baseScoreRange: [79.2, 87.6],
    kontenjanRange: [2, 12],
    fillRatio: 1.0,
  },
  {
    kadroUnvani: 'TEKNİKER (İNŞAAT)',
    ogrenimDuzeyi: 'onlisans',
    puanTuru: 'P93',
    kurumlar: [
      { ad: 'KARAYOLLARI GENEL MÜDÜRLÜĞÜ', sehirler: ['ANKARA', 'ERZURUM', 'SİVAS', 'TRABZON', 'DİYARBAKIR'], teskilat: 'TASRA', hizmetSinifi: 'TH' },
      { ad: 'ÇEVRE, ŞEHİRCİLİK VE İKLİM DEĞİŞİKLİĞİ BAKANLIĞI', sehirler: ['HATAY', 'MALATYA', 'KAHRAMANMARAŞ'], teskilat: 'TASRA', hizmetSinifi: 'TH' },
    ],
    codes: ['3225', '7257'],
    baseScoreRange: [80.5, 88.3],
    kontenjanRange: [1, 8],
    fillRatio: 1.0,
  },
  {
    kadroUnvani: 'TEKNİKER (ELEKTRİK)',
    ogrenimDuzeyi: 'onlisans',
    puanTuru: 'P93',
    kurumlar: [
      { ad: 'TÜRKİYE ELEKTRİK İLETİM A.Ş. GENEL MÜDÜRLÜĞÜ', sehirler: ['ANKARA', 'ADANA', 'BURSA', 'KONYA'], teskilat: 'KIT', hizmetSinifi: 'KİT' },
      { ad: 'T.C. DEVLET DEMİRYOLLARI İŞLETMESİ GENEL MÜDÜRLÜĞÜ', sehirler: ['ANKARA', 'ESKİŞEHİR', 'AFYONKARAHİSAR'], teskilat: 'KIT', hizmetSinifi: 'KİT' },
    ],
    codes: ['3253', '7225'],
    baseScoreRange: [83.0, 90.1],
    kontenjanRange: [1, 6],
    fillRatio: 1.0,
  },
  {
    kadroUnvani: 'MEMUR (ÖNLİSANS BÜRO / ADALET)',
    ogrenimDuzeyi: 'onlisans',
    puanTuru: 'P93',
    kurumlar: [
      { ad: 'ADALET BAKANLIĞI', sehirler: ['ANKARA', 'İSTANBUL', 'İZMİR', 'BURSA', 'ANTALYA'], teskilat: 'TASRA', hizmetSinifi: 'GİH' },
      { ad: 'GELİR İDARESİ BAŞKANLIĞI', sehirler: ['ANKARA', 'ADANA', 'GAZİANTEP'], teskilat: 'TASRA', hizmetSinifi: 'GİH' },
    ],
    codes: ['3003', '3029', '6225'],
    baseScoreRange: [77.5, 85.2],
    kontenjanRange: [2, 15],
    fillRatio: 1.0,
  },
  {
    kadroUnvani: 'MEMUR (GENEL ÖNLİSANS)',
    ogrenimDuzeyi: 'onlisans',
    puanTuru: 'P93',
    kurumlar: [
      { ad: 'DEVLET HAVA MEYDANLARI İŞLETMESİ GENEL MÜDÜRLÜĞÜ', sehirler: ['ANKARA', 'İSTANBUL', 'MUĞLA', 'ANTALYA'], teskilat: 'KIT', hizmetSinifi: 'KİT' },
      { ad: 'TÜRKİYE ŞEKER FABRİKALARI A.Ş.', sehirler: ['ANKARA', 'MALATYA', 'KARS'], teskilat: 'KIT', hizmetSinifi: 'KİT' },
    ],
    codes: ['3001', '7225'],
    baseScoreRange: [82.5, 89.8],
    kontenjanRange: [1, 8],
    fillRatio: 1.0,
  },
  {
    kadroUnvani: 'KORUMA VE GÜVENLİK GÖREVLİSİ (ÖNLİSANS)',
    ogrenimDuzeyi: 'onlisans',
    puanTuru: 'P93',
    kurumlar: [
      { ad: 'DEVLET HAVA MEYDANLARI İŞLETMESİ GENEL MÜDÜRLÜĞÜ', sehirler: ['ANKARA', 'İSTANBUL', 'İZMİR', 'DİYARBAKIR', 'TRABZON'], teskilat: 'KIT', hizmetSinifi: 'KİT' },
      { ad: 'T.C. DEVLET DEMİRYOLLARI İŞLETMESİ GENEL MÜDÜRLÜĞÜ', sehirler: ['ANKARA', 'SİVAS', 'MALATYA'], teskilat: 'KIT', hizmetSinifi: 'KİT' },
    ],
    codes: ['3397', '3001', '7300', '7304', '1101'],
    baseScoreRange: [75.2, 84.1],
    kontenjanRange: [2, 10],
    fillRatio: 1.0,
  },
  {
    kadroUnvani: 'ŞOFÖR (ÖNLİSANS / BOŞ KALAN ÖRNEK)',
    ogrenimDuzeyi: 'onlisans',
    puanTuru: 'P93',
    kurumlar: [
      { ad: 'KARAYOLLARI GENEL MÜDÜRLÜĞÜ', sehirler: ['HAKKARİ', 'ARDAHAN'], teskilat: 'TASRA', hizmetSinifi: 'GİH' },
    ],
    codes: ['3001', '6509', '6513', '7302'],
    baseScoreRange: [70.0, 78.0],
    kontenjanRange: [1, 3],
    fillRatio: 0.0, // Boş kalan kadro
  },

  // --- ORTAÖĞRETİM (P94) ---
  {
    kadroUnvani: 'TEKNİSYEN (BİLİŞİM)',
    ogrenimDuzeyi: 'ortaogretim',
    puanTuru: 'P94',
    kurumlar: [
      { ad: 'SOSYAL GÜVENLİK KURUMU BAŞKANLIĞI', sehirler: ['ANKARA', 'İSTANBUL', 'İZMİR', 'ADANA'], teskilat: 'TASRA', hizmetSinifi: 'TH' },
      { ad: 'GELİR İDARESİ BAŞKANLIĞI', sehirler: ['ANKARA', 'BURSA', 'KONYA'], teskilat: 'TASRA', hizmetSinifi: 'TH' },
    ],
    codes: ['2061'],
    baseScoreRange: [81.5, 89.2],
    kontenjanRange: [1, 6],
    fillRatio: 1.0,
  },
  {
    kadroUnvani: 'TEKNİSYEN (ELEKTRİK-ELEKTRONİK)',
    ogrenimDuzeyi: 'ortaogretim',
    puanTuru: 'P94',
    kurumlar: [
      { ad: 'T.C. DEVLET DEMİRYOLLARI İŞLETMESİ GENEL MÜDÜRLÜĞÜ', sehirler: ['ANKARA', 'ESKİŞEHİR', 'SİVAS', 'KAYSERİ'], teskilat: 'KIT', hizmetSinifi: 'KİT' },
      { ad: 'DEVLET SU İŞLERİ GENEL MÜDÜRLÜĞÜ', sehirler: ['EDİRNE', 'ANTALYA', 'DİYARBAKIR'], teskilat: 'TASRA', hizmetSinifi: 'TH' },
      { ad: 'TÜRKİYE ELEKTRİK İLETİM A.Ş. GENEL MÜDÜRLÜĞÜ', sehirler: ['ANKARA', 'İSTANBUL', 'ERZURUM'], teskilat: 'KIT', hizmetSinifi: 'KİT' },
    ],
    codes: ['2065', '7225'],
    baseScoreRange: [82.0, 90.5],
    kontenjanRange: [1, 5],
    fillRatio: 1.0,
  },
  {
    kadroUnvani: 'TEKNİSYEN (MAKİNE)',
    ogrenimDuzeyi: 'ortaogretim',
    puanTuru: 'P94',
    kurumlar: [
      { ad: 'KARAYOLLARI GENEL MÜDÜRLÜĞÜ', sehirler: ['ANKARA', 'İSTANBUL', 'KARS', 'KASTAMONU', 'TRABZON'], teskilat: 'TASRA', hizmetSinifi: 'TH' },
      { ad: 'T.C. DEVLET DEMİRYOLLARI İŞLETMESİ GENEL MÜDÜRLÜĞÜ', sehirler: ['ANKARA', 'ESKİŞEHİR', 'MALATYA'], teskilat: 'KIT', hizmetSinifi: 'KİT' },
    ],
    codes: ['2095', '7257'],
    baseScoreRange: [79.5, 87.8],
    kontenjanRange: [1, 4],
    fillRatio: 1.0,
  },
  {
    kadroUnvani: 'ŞOFÖR (ORTAÖĞRETİM)',
    ogrenimDuzeyi: 'ortaogretim',
    puanTuru: 'P94',
    kurumlar: [
      { ad: 'KARAYOLLARI GENEL MÜDÜRLÜĞÜ', sehirler: ['ANKARA', 'İSTANBUL', 'İZMİR', 'KONYA', 'ERZURUM'], teskilat: 'TASRA', hizmetSinifi: 'GİH' },
      { ad: 'DEVLET SU İŞLERİ GENEL MÜDÜRLÜĞÜ', sehirler: ['ANKARA', 'ADANA', 'ŞANLIURFA', 'SAMSUN'], teskilat: 'TASRA', hizmetSinifi: 'GİH' },
      { ad: 'İÇİŞLERİ BAKANLIĞI', sehirler: ['ANKARA', 'ANTALYA', 'BURSA'], teskilat: 'TASRA', hizmetSinifi: 'GİH' },
    ],
    codes: ['2001', '6501', '7302'],
    baseScoreRange: [76.5, 85.5],
    kontenjanRange: [1, 5],
    fillRatio: 1.0,
  },
  {
    kadroUnvani: 'HİZMETLİ / MEMUR (GENEL ORTAÖĞRETİM)',
    ogrenimDuzeyi: 'ortaogretim',
    puanTuru: 'P94',
    kurumlar: [
      { ad: 'DEVLET HAVA MEYDANLARI İŞLETMESİ GENEL MÜDÜRLÜĞÜ', sehirler: ['ANKARA', 'İSTANBUL', 'MUĞLA', 'İZMİR'], teskilat: 'KIT', hizmetSinifi: 'KİT' },
      { ad: 'HACETTEPE ÜNİVERSİTESİ', sehirler: ['ANKARA'], teskilat: 'UNIVERSITE', hizmetSinifi: 'YH' },
      { ad: 'İSTANBUL TEKNİK ÜNİVERSİTESİ', sehirler: ['İSTANBUL'], teskilat: 'UNIVERSITE', hizmetSinifi: 'YH' },
    ],
    codes: ['2001', '7225'],
    baseScoreRange: [84.5, 91.8],
    kontenjanRange: [1, 6],
    fillRatio: 1.0,
  },
];

function generateRecords(): PlacementRecord[] {
  const records: PlacementRecord[] = [];
  let kadroIdCounter = 10000;

  for (const period of periods) {
    // Slight shift between periods for realistic trends:
    // 2024/1 was base, 2024/2 was slightly higher or lower, 2025/1 trend
    const periodShift = period === '2024/1' ? 0.0 : period === '2024/2' ? 0.45 : -0.35;

    for (const tpl of templates) {
      for (const inst of tpl.kurumlar) {
        for (const sehir of inst.sehirler) {
          kadroIdCounter++;
          const kadroKodu = `${tpl.ogrenimDuzeyi === 'lisans' ? '3' : tpl.ogrenimDuzeyi === 'onlisans' ? '2' : '1'}${String(kadroIdCounter).padStart(8, '0')}`;

          // Seed pseudorandom math
          const seed = (kadroIdCounter * 9301 + 49297) % 233280;
          const rnd = seed / 233280;

          // Kontenjan
          const kRange = tpl.kontenjanRange[1] - tpl.kontenjanRange[0];
          const kontenjan = Math.max(1, tpl.kontenjanRange[0] + Math.floor(rnd * (kRange + 1)));

          // Yerleşen & Boş Kalan
          const isUnfilled = tpl.fillRatio === 0.0 || (tpl.fillRatio < 1.0 && rnd < 0.2);
          const yerlesen = isUnfilled ? 0 : kontenjan;
          const bosKalan = kontenjan - yerlesen;

          // Scores
          let tabanPuan: number | null = null;
          let tavanPuan: number | null = null;

          if (yerlesen > 0) {
            const baseMin = tpl.baseScoreRange[0] + periodShift;
            const baseMax = tpl.baseScoreRange[1] + periodShift;
            const rawTaban = baseMin + rnd * (baseMax - baseMin);
            tabanPuan = Math.round(rawTaban * 100000) / 100000;

            const spread = 0.5 + rnd * 3.5;
            const rawTavan = Math.min(99.98, tabanPuan + spread);
            tavanPuan = Math.round(rawTavan * 100000) / 100000;
          }

          // Codes partitioning
          const mezuniyetKodlari: string[] = [];
          const ozelSartlar: string[] = [];
          for (const c of tpl.codes) {
            if (isSpecialConditionCode(c)) {
              ozelSartlar.push(c);
            } else {
              mezuniyetKodlari.push(c);
            }
          }

          const id = `${period}-${tpl.ogrenimDuzeyi}-${kadroKodu}`;

          let finalSehir = sehir;
          let ilce: string | undefined = undefined;
          if (sehir.includes('/')) {
            const p = sehir.split('/').map((s) => s.trim());
            finalSehir = p[0];
            ilce = p[1];
          }

          records.push({
            id,
            kadroKodu,
            donem: period,
            ogrenimDuzeyi: tpl.ogrenimDuzeyi,
            puanTuru: tpl.puanTuru,
            kurumAdi: inst.ad,
            kadroUnvani: tpl.kadroUnvani,
            teskilat: inst.teskilat,
            hizmetSinifi: inst.hizmetSinifi,
            derece: tpl.ogrenimDuzeyi === 'lisans' ? '8' : tpl.ogrenimDuzeyi === 'onlisans' ? '9' : '10',
            sehir: finalSehir,
            ilce,
            kontenjan,
            yerlesen,
            bosKalan,
            tabanPuan,
            tavanPuan,
            nitelikKodlari: tpl.codes,
            mezuniyetKodlari,
            ozelSartlar,
          });
        }
      }
    }
  }

  return records;
}

const allRecords = generateRecords();
const targetPath = path.resolve(process.cwd(), 'src/data/kpss_records.json');
fs.writeFileSync(targetPath, JSON.stringify(allRecords, null, 2), 'utf-8');

console.log(`Generated ${allRecords.length} realistic placement records in ${targetPath}`);
