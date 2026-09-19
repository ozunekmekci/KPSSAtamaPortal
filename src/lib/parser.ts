import Papa from 'papaparse';
import {
  EducationLevel,
  PlacementPeriod,
  PlacementRecord,
  ScoreType,
  ImportResult,
  ImportValidationError,
} from '@/types/kpss';
import { normalizeTrSearch, toTurkishUpper } from './turkish';
import { isSpecialConditionCode } from '@/data/qualifications';

export interface ParseOptions {
  donem: PlacementPeriod;
  ogrenimDuzeyi: EducationLevel;
  existingRecords?: PlacementRecord[];
}

/**
 * Score type inference based on education level
 */
export function getScoreTypeByLevel(level: EducationLevel): ScoreType {
  switch (level) {
    case 'lisans':
      return 'P3';
    case 'onlisans':
      return 'P93';
    case 'ortaogretim':
      return 'P94';
  }
}

/**
 * Normalizes ÖSYM table headers dynamically using fuzzy token matching
 */
export function mapHeaderToField(header: string): string | null {
  const normalized = normalizeTrSearch(header);

  if (/^(kadro\s*kodu|pozisyon\s*kodu|kod)$/.test(normalized) || normalized.includes('kadro kod')) {
    return 'kadroKodu';
  }
  if (/^(kurum\s*adi|kurum|atanan\s*kurum)$/.test(normalized) || normalized.includes('kurum')) {
    return 'kurumAdi';
  }
  if (/^(kadro\s*unvani|unvan|pozisyon\s*unvani)$/.test(normalized) || normalized.includes('unvan')) {
    return 'kadroUnvani';
  }
  if (/^(hizmet\s*sinifi|sinif|sinifi|teskilat)$/.test(normalized)) {
    return 'hizmetSinifi';
  }
  if (/^(derece|kadro\s*derecesi)$/.test(normalized)) {
    return 'derece';
  }
  if (/^(il|sehir|il\s*adi|birim|gorev\s*yeri)$/.test(normalized)) {
    return 'sehir';
  }
  if (/^(kontenjan|sayi|kadro\s*sayisi|adet)$/.test(normalized) || normalized.includes('kontenjan')) {
    return 'kontenjan';
  }
  if (/^(yerlesen|yerlesen\s*sayisi|atanan)$/.test(normalized) || normalized.includes('yerlesen')) {
    return 'yerlesen';
  }
  if (/^(bos\s*kalan|bos\s*kontenjan|bos)$/.test(normalized)) {
    return 'bosKalan';
  }
  if (/^(taban\s*puan|en\s*kucuk\s*puan|min\s*puan|taban)$/.test(normalized) || normalized.includes('en kucuk')) {
    return 'tabanPuan';
  }
  if (/^(tavan\s*puan|en\s*buyuk\s*puan|max\s*puan|tavan)$/.test(normalized) || normalized.includes('en buyuk')) {
    return 'tavanPuan';
  }
  if (/^(nitelik\s*kodlari|aranan\s*nitelik\s*kodlari|nitelik|nitelikler|sartlar)$/.test(normalized) || normalized.includes('nitelik')) {
    return 'nitelikKodlari';
  }

  return null;
}

/**
 * Cleans and converts Turkish formatted float strings (e.g. "84,12435" or "---")
 */
export function parseScore(val: unknown, yerlesenCount: number): number | null {
  if (yerlesenCount === 0 || val === null || val === undefined) {
    return null;
  }
  const str = String(val).trim();
  if (str === '' || str === '-' || str === '--' || str === '---' || str === '0' || str === '0,00000') {
    return null;
  }

  const normalized = str.replace(/\s+/g, '').replace(',', '.');
  const num = parseFloat(normalized);
  if (isNaN(num)) return null;

  // Round to 5 decimal places (standard ÖSYM score precision)
  return Math.round(num * 100000) / 100000;
}

/**
 * Extracts 4-digit qualification codes from a string (e.g. "4531, 7113; 6225")
 */
export function extractQualificationCodes(rawCodes: unknown): {
  all: string[];
  mezuniyet: string[];
  ozelSartlar: string[];
} {
  if (!rawCodes) {
    return { all: [], mezuniyet: [], ozelSartlar: [] };
  }

  const str = String(rawCodes);
  const matches = str.match(/\b\d{4}\b/g) || [];
  const uniqueCodes = Array.from(new Set(matches));

  const mezuniyet: string[] = [];
  const ozelSartlar: string[] = [];

  for (const code of uniqueCodes) {
    if (isSpecialConditionCode(code)) {
      ozelSartlar.push(code);
    } else {
      mezuniyet.push(code);
    }
  }

  return {
    all: uniqueCodes,
    mezuniyet,
    ozelSartlar,
  };
}

/**
 * Parses raw CSV content (auto-detecting comma, semicolon, or tab)
 */
export function parseCsvRows(csvContent: string): Record<string, string>[] {
  // Check first line to detect delimiter
  const firstLine = csvContent.split('\n')[0] || '';
  let delimiter = ',';
  const semicolonCount = (firstLine.match(/;/g) || []).length;
  const tabCount = (firstLine.match(/\t/g) || []).length;
  const commaCount = (firstLine.match(/,/g) || []).length;

  if (semicolonCount > commaCount && semicolonCount > tabCount) {
    delimiter = ';';
  } else if (tabCount > commaCount && tabCount > semicolonCount) {
    delimiter = '\t';
  }

  const result = Papa.parse<Record<string, string>>(csvContent, {
    header: true,
    delimiter,
    skipEmptyLines: 'greedy',
  });

  return result.data;
}

/**
 * Parses JSON content (either raw PlacementRecord[] or ÖSYM key-value rows)
 */
export function parseJsonRows(jsonContent: string): Record<string, unknown>[] {
  const parsed = JSON.parse(jsonContent);
  if (!Array.isArray(parsed)) {
    throw new Error('JSON formatı bir dizi (array) içermelidir.');
  }
  return parsed;
}

/**
 * Core Ingestion Pipeline: Transforms raw records into validated PlacementRecord[]
 */
export function ingestRecords(
  rawRows: Record<string, unknown>[],
  options: ParseOptions
): ImportResult {
  const { donem, ogrenimDuzeyi } = options;
  const puanTuru = getScoreTypeByLevel(ogrenimDuzeyi);

  const errors: ImportValidationError[] = [];
  const warnings: ImportValidationError[] = [];
  const recordMap = new Map<string, PlacementRecord>();

  // If existing records provided, preload to allow upserts
  if (options.existingRecords) {
    for (const rec of options.existingRecords) {
      recordMap.set(rec.id, rec);
    }
  }

  let insertedCount = 0;
  let updatedCount = 0;

  for (let i = 0; i < rawRows.length; i++) {
    const raw = rawRows[i];
    const rowNum = i + 1;

    // Normalizing columns
    const row: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(raw)) {
      const field = mapHeaderToField(key);
      if (field) {
        row[field] = value;
      } else {
        row[key] = value;
      }
    }

    // Required fields check
    const rawKadroKodu = row.kadroKodu !== undefined ? String(row.kadroKodu).trim() : '';
    const rawKurumAdi = row.kurumAdi !== undefined ? String(row.kurumAdi).trim() : '';
    const rawUnvan = row.kadroUnvani !== undefined ? String(row.kadroUnvani).trim() : '';

    if (!rawKadroKodu) {
      errors.push({
        row: rowNum,
        field: 'kadroKodu',
        message: 'Kadro Kodu alanı boş bırakılamaz.',
      });
      continue;
    }

    if (!rawKurumAdi) {
      errors.push({
        row: rowNum,
        kadroKodu: rawKadroKodu,
        field: 'kurumAdi',
        message: 'Kurum Adı alanı boş bırakılamaz.',
      });
      continue;
    }

    // Quotas
    const rawKontenjan = parseInt(String(row.kontenjan || '0'), 10);
    const kontenjan = isNaN(rawKontenjan) || rawKontenjan < 0 ? 0 : rawKontenjan;

    const rawYerlesen = parseInt(String(row.yerlesen !== undefined ? row.yerlesen : kontenjan), 10);
    let yerlesen = isNaN(rawYerlesen) || rawYerlesen < 0 ? 0 : rawYerlesen;

    if (yerlesen > kontenjan) {
      warnings.push({
        row: rowNum,
        kadroKodu: rawKadroKodu,
        field: 'yerlesen',
        message: `Yerleşen sayısı (${yerlesen}) kontenjanı (${kontenjan}) aşıyor. Kontenjana eşitlendi.`,
      });
      yerlesen = kontenjan;
    }

    const bosKalan = kontenjan - yerlesen;

    // Scores
    const tabanPuan = parseScore(row.tabanPuan, yerlesen);
    const tavanPuan = parseScore(row.tavanPuan, yerlesen);

    if (tabanPuan !== null && (tabanPuan < 50.0 || tabanPuan > 100.0)) {
      warnings.push({
        row: rowNum,
        kadroKodu: rawKadroKodu,
        field: 'tabanPuan',
        message: `Taban puan standart aralık dışında (50-100): ${tabanPuan}`,
      });
    }

    if (tavanPuan !== null && (tavanPuan < 50.0 || tavanPuan > 100.0)) {
      warnings.push({
        row: rowNum,
        kadroKodu: rawKadroKodu,
        field: 'tavanPuan',
        message: `Tavan puan standart aralık dışında (50-100): ${tavanPuan}`,
      });
    }

    // Location (City and district)
    let sehir = String(row.sehir || 'MERKEZ').trim();
    let ilce: string | undefined = undefined;

    if (sehir.includes('/')) {
      const parts = sehir.split('/').map((s) => s.trim());
      sehir = toTurkishUpper(parts[0]);
      ilce = toTurkishUpper(parts[1]);
    } else {
      sehir = toTurkishUpper(sehir);
    }

    // Qualification codes
    const codes = extractQualificationCodes(row.nitelikKodlari);
    if (codes.all.length === 0) {
      warnings.push({
        row: rowNum,
        kadroKodu: rawKadroKodu,
        field: 'nitelikKodlari',
        message: 'Kadroda aranan nitelik kodu bulunamadı.',
      });
    }

    // Unique composite ID: `${donem}-${ogrenimDuzeyi}-${kadroKodu}`
    const id = `${donem}-${ogrenimDuzeyi}-${rawKadroKodu}`;

    const record: PlacementRecord = {
      id,
      kadroKodu: rawKadroKodu,
      donem,
      ogrenimDuzeyi,
      puanTuru,
      kurumAdi: toTurkishUpper(rawKurumAdi),
      kadroUnvani: toTurkishUpper(rawUnvan || 'MEMUR'),
      hizmetSinifi: row.hizmetSinifi ? String(row.hizmetSinifi).trim() : undefined,
      teskilat: row.teskilat ? String(row.teskilat).trim() : undefined,
      derece: row.derece ? String(row.derece).trim() : undefined,
      sehir,
      ilce,
      kontenjan,
      yerlesen,
      bosKalan,
      tabanPuan,
      tavanPuan,
      nitelikKodlari: codes.all,
      mezuniyetKodlari: codes.mezuniyet,
      ozelSartlar: codes.ozelSartlar,
    };

    if (recordMap.has(id)) {
      updatedCount++;
    } else {
      insertedCount++;
    }
    recordMap.set(id, record);
  }

  const finalRecords = Array.from(recordMap.values());

  return {
    success: errors.length === 0,
    donem,
    ogrenimDuzeyi,
    totalRows: rawRows.length,
    inserted: insertedCount,
    updated: updatedCount,
    errors,
    warnings,
    records: finalRecords,
  };
}

/**
 * High-level parser that takes a raw string (CSV or JSON) and options
 */
export function parseAndIngestContent(
  content: string,
  options: ParseOptions
): ImportResult {
  const trimmed = content.trim();
  let rawRows: Record<string, unknown>[];

  if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
    rawRows = parseJsonRows(trimmed);
  } else {
    rawRows = parseCsvRows(trimmed);
  }

  return ingestRecords(rawRows, options);
}
