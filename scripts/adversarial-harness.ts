/**
 * Adversarial Test Harness for KPSS Ingestion & Turkish Subsystems
 *
 * Exhaustive empirical challenge suite:
 * 1. CSV delimiter detection and edge-case parsing
 * 2. Turkish comma decimals & score parsing precision
 * 3. Unfilled cadres, zero yerlesen, null taban puan logic
 * 4. Messy qualification code extraction & categorization
 * 5. Turkish dotted/dotless I case folding & search normalization
 */

import {
  mapHeaderToField,
  parseScore,
  extractQualificationCodes,
  parseCsvRows,
  parseAndIngestContent,
  ingestRecords,
} from '../src/lib/parser';
import {
  normalizeTr,
  normalizeTrSearch,
  toTurkishUpper,
  toTurkishTitle,
} from '../src/lib/turkish';

export interface TestResult {
  suite: string;
  testName: string;
  passed: boolean;
  expected?: unknown;
  actual?: unknown;
  error?: string;
  details?: string;
}

export const results: TestResult[] = [];

function assertEqual<T>(
  suite: string,
  testName: string,
  actual: T,
  expected: T,
  details?: string
) {
  const passed = JSON.stringify(actual) === JSON.stringify(expected);
  results.push({
    suite,
    testName,
    passed,
    expected,
    actual,
    details,
  });
}

function assertTrue(
  suite: string,
  testName: string,
  condition: boolean,
  details?: string
) {
  results.push({
    suite,
    testName,
    passed: condition,
    expected: true,
    actual: condition,
    details,
  });
}

// ============================================================================
// SUITE 1: CSV Parsing with various delimiters & structures
// ============================================================================
function runSuite1() {
  const suite = 'Suite 1: CSV Parsing & Delimiters';

  // 1.1 Semicolon delimiter (Standard ÖSYM export)
  const semicolonCsv = `Kadro Kodu;Kurum Adı;Kadro Unvanı;İl;Kontenjan;Yerleşen;Taban Puan;Tavan Puan;Nitelik Kodları\n324210001;SOSYAL GÜVENLİK KURUMU;MEMUR;ANKARA;5;5;82,45120;85,10000;4001, 6225`;
  const rowsSemi = parseCsvRows(semicolonCsv);
  assertEqual(suite, '1.1 Semicolon CSV parsing returns 1 row', rowsSemi.length, 1);
  assertEqual(suite, '1.1 Semicolon CSV header parsed correctly', rowsSemi[0]?.['Kadro Kodu'], '324210001');

  // 1.2 Comma delimiter (Standard RFC CSV)
  const commaCsv = `Kadro Kodu,Kurum Adı,Kadro Unvanı,İl,Kontenjan,Yerleşen,Taban Puan,Tavan Puan,Nitelik Kodları\n324210002,DEVLET HAVA MEYDANLARI,MÜHENDİS,İSTANBUL,2,2,94.12500,95.00000,"4531, 7113"`;
  const rowsComma = parseCsvRows(commaCsv);
  assertEqual(suite, '1.2 Comma CSV parsing returns 1 row', rowsComma.length, 1);
  assertEqual(suite, '1.2 Comma CSV header parsed correctly', rowsComma[0]?.['Kadro Kodu'], '324210002');

  // 1.3 Tab delimiter (Excel TSV export)
  const tabCsv = `Kadro Kodu\tKurum Adı\tKadro Unvanı\tİl\tKontenjan\tYerleşen\tTaban Puan\tTavan Puan\tNitelik Kodları\n324210003\tTCDD\tTEKNİKER\tİZMİR\t3\t3\t80,50000\t83,00000\t3225`;
  const rowsTab = parseCsvRows(tabCsv);
  assertEqual(suite, '1.3 Tab TSV parsing returns 1 row', rowsTab.length, 1);
  assertEqual(suite, '1.3 Tab TSV header parsed correctly', rowsTab[0]?.['Kadro Kodu'], '324210003');

  // 1.4 Quoted semicolons inside comma-delimited CSV
  const quotedSemiInComma = `Kadro Kodu,Kurum Adı,Kadro Unvanı,İl,Kontenjan,Yerleşen,Taban Puan,Tavan Puan,Nitelik Kodları\n324210004,BAKANLIK,UZMAN,ANKARA,1,1,90.50000,90.50000,"4531; 7113; 6225"`;
  const rowsQuotedSemi = parseCsvRows(quotedSemiInComma);
  assertEqual(suite, '1.4 Comma CSV with semicolons inside quotes parsed', rowsQuotedSemi[0]?.['Kadro Kodu'], '324210004');
  assertEqual(suite, '1.4 Preserves quoted content containing semicolons', rowsQuotedSemi[0]?.['Nitelik Kodları'], '4531; 7113; 6225');

  // 1.5 Quoted commas inside semicolon-delimited CSV
  const quotedCommaInSemi = `Kadro Kodu;Kurum Adı;Kadro Unvanı;İl;Kontenjan;Yerleşen;Taban Puan;Tavan Puan;Nitelik Kodları\n324210005;BELEDİYE;MİMAR;ANTALYA;2;2;85,12345;86,00000;"4611, 6225, 7300"`;
  const rowsQuotedComma = parseCsvRows(quotedCommaInSemi);
  assertEqual(suite, '1.5 Semicolon CSV with commas inside quotes parsed', rowsQuotedComma[0]?.['Kadro Kodu'], '324210005');
  assertEqual(suite, '1.5 Preserves quoted content containing commas', rowsQuotedComma[0]?.['Nitelik Kodları'], '4611, 6225, 7300');

  // 1.6 Windows CRLF line endings
  const crlfCsv = "Kadro Kodu;Kurum Adı;Kadro Unvanı;Kontenjan;Yerleşen;Taban Puan\r\n324210006;DSİ;MÜHENDİS;1;1;88,00000\r\n";
  const rowsCrlf = parseCsvRows(crlfCsv);
  assertEqual(suite, '1.6 Windows CRLF parsed correctly', rowsCrlf[0]?.['Kadro Kodu'], '324210006');

  // 1.7 UTF-8 BOM in CSV
  const bomCsv = "\uFEFFKadro Kodu;Kurum Adı;Kontenjan;Yerleşen;Taban Puan;Nitelik Kodları\n324210008;SGK;1;1;80,00000;4001";
  const rowsBom = parseCsvRows(bomCsv);
  assertEqual(suite, '1.7 UTF-8 BOM handled in parseCsvRows', rowsBom[0]?.['Kadro Kodu'], '324210008');

  // 1.8 Leading blank line before CSV header in parseCsvRows
  const leadingBlankCsv = `\nKadro Kodu;Kurum Adı;Kadro Unvanı;Kontenjan;Yerleşen;Taban Puan\n324210007;MGM;MEMUR;1;1;75,00000`;
  const rowsLeadingBlank = parseCsvRows(leadingBlankCsv);
  assertEqual(
    suite,
    '1.8 Leading blank line in parseCsvRows retains semicolon delimiter',
    rowsLeadingBlank[0]?.['Kadro Kodu'],
    '324210007',
    'BUG: parseCsvRows uses csvContent.split("\\n")[0] which is empty if leading newline exists, defaulting delimiter to comma'
  );

  // 1.9 Header mapping: "Boş Kontenjan" must map to "bosKalan" NOT "kontenjan"
  assertEqual(
    suite,
    '1.9 Header mapping "Boş Kontenjan" maps to bosKalan',
    mapHeaderToField('Boş Kontenjan'),
    'bosKalan',
    'BUG: mapHeaderToField checks normalized.includes("kontenjan") before checking "bos kontenjan", causing Boş Kontenjan to overwrite Kontenjan'
  );

  // 1.10 Header mapping: "Teşkilat" must map to "teskilat" NOT "hizmetSinifi"
  assertEqual(
    suite,
    '1.10 Header mapping "Teşkilat" maps to teskilat',
    mapHeaderToField('Teşkilat'),
    'teskilat',
    'BUG: mapHeaderToField groups "teskilat" under hizmetSinifi regex, so row.teskilat is never set'
  );

  // 1.11 Full pipeline ingestion with city/district splitting
  const fullCsv = `Kadro Kodu;Kurum Adı;Kadro Unvanı;İl;Kontenjan;Yerleşen;Taban Puan;Tavan Puan;Nitelik Kodları
324210010;DEVLET DEMİRYOLLARI;HAREKET MEMURU;ANKARA / ÇANKAYA;4;4;83,12450;86,40000;3001, 7324
324210011;ÇEVRE VE ŞEHİRCİLİK BAKANLIĞI;MÜHENDİS;İZMİR;2;0;---;---;4531, 7113`;

  const ingestRes = parseAndIngestContent(fullCsv, {
    donem: '2024/1',
    ogrenimDuzeyi: 'lisans',
  });
  assertEqual(suite, '1.11 Full pipeline success', ingestRes.success, true);
  assertEqual(suite, '1.11 Full pipeline totalRows', ingestRes.totalRows, 2);
  assertEqual(suite, '1.11 City/District splitting (ANKARA / ÇANKAYA)', ingestRes.records[0].sehir, 'ANKARA');
  assertEqual(suite, '1.11 District parsed', ingestRes.records[0].ilce, 'ÇANKAYA');
  assertEqual(suite, '1.11 Deterministic composite ID format', ingestRes.records[0].id, '2024/1-lisans-324210010');

  // 1.12 Missing required fields validation
  const invalidCsv = `Kadro Kodu;Kurum Adı;Kontenjan\n;KURUMSUZ KADRO;1\n324210099;;1`;
  const invalidRes = parseAndIngestContent(invalidCsv, {
    donem: '2024/1',
    ogrenimDuzeyi: 'lisans',
  });
  assertEqual(suite, '1.12 Detects missing required fields (success is false)', invalidRes.success, false);
  assertEqual(suite, '1.12 Captures 2 validation errors', invalidRes.errors.length, 2);
}

// ============================================================================
// SUITE 2: Turkish comma decimals (parseScore)
// ============================================================================
function runSuite2() {
  const suite = 'Suite 2: Turkish Comma Decimals';

  // 2.1 Standard Turkish comma format with 5 decimals
  assertEqual(suite, '2.1 Parse "84,34125" with yerlesen=5', parseScore('84,34125', 5), 84.34125);
  assertEqual(suite, '2.1 Parse "91,50000" with yerlesen=1', parseScore('91,50000', 1), 91.5);
  assertEqual(suite, '2.1 Parse "70,00000" with yerlesen=2', parseScore('70,00000', 2), 70);

  // 2.2 Standard dot format
  assertEqual(suite, '2.2 Parse dot format "84.34125"', parseScore('84.34125', 5), 84.34125);

  // 2.3 Variable decimal length
  assertEqual(suite, '2.3 Parse single decimal "84,1"', parseScore('84,1', 1), 84.1);
  assertEqual(suite, '2.3 Parse two decimals "84,12"', parseScore('84,12', 1), 84.12);
  assertEqual(suite, '2.3 Parse three decimals "84,123"', parseScore('84,123', 1), 84.123);
  assertEqual(suite, '2.3 Parse four decimals "84,1234"', parseScore('84,1234', 1), 84.1234);

  // 2.4 Precision & Rounding (ÖSYM 5-decimal standard)
  assertEqual(suite, '2.4 Round 6 decimals up "84,341256"', parseScore('84,341256', 5), 84.34126);
  assertEqual(suite, '2.4 Round 6 decimals down "84,341254"', parseScore('84,341254', 5), 84.34125);

  // 2.5 Whitespace resilience
  assertEqual(suite, '2.5 Whitespace around score "  84,34125  "', parseScore('  84,34125  ', 5), 84.34125);
  assertEqual(suite, '2.5 Space after comma "84, 34125"', parseScore('84, 34125', 5), 84.34125);

  // 2.6 Native number input
  assertEqual(suite, '2.6 Native float 84.34125', parseScore(84.34125, 5), 84.34125);

  // 2.7 Boundary scores
  assertEqual(suite, '2.7 Min boundary "50,00000"', parseScore('50,00000', 1), 50);
  assertEqual(suite, '2.7 Max boundary "100,00000"', parseScore('100,00000', 1), 100);

  // 2.8 Zero formatted as dot "0.00000" vs comma "0,00000"
  assertEqual(
    suite,
    '2.8 Zero with dot "0.00000" returns null for yerlesen=1',
    parseScore('0.00000', 1),
    null,
    'ANOMALY: parseScore hardcodes str === "0,00000" check; "0.00000" bypasses it and returns 0'
  );

  // 2.9 Malformed strings & edge inputs
  assertEqual(suite, '2.9 Non-numeric "abc"', parseScore('abc', 1), null);
  assertEqual(suite, '2.9 String "NaN"', parseScore('NaN', 1), null);
  assertEqual(suite, '2.9 Null input', parseScore(null, 1), null);
  assertEqual(suite, '2.9 Undefined input', parseScore(undefined, 1), null);
}

// ============================================================================
// SUITE 3: Unfilled cadres (yerlesen === 0 -> tabanPuan === null)
// ============================================================================
function runSuite3() {
  const suite = 'Suite 3: Unfilled Cadres & Zero Placed';

  // 3.1 yerlesen === 0 strictly forces null score even with numeric input
  assertEqual(suite, '3.1 Score strictly null when yerlesen=0 with valid score string', parseScore('84,34125', 0), null);
  assertEqual(suite, '3.1 Score strictly null when yerlesen=0 with native float', parseScore(84.34125, 0), null);
  assertEqual(suite, '3.1 Score strictly null when yerlesen=0 with "0,00000"', parseScore('0,00000', 0), null);
  assertEqual(suite, '3.1 Score strictly null when yerlesen=0 with "0.00000"', parseScore('0.00000', 0), null);
  assertEqual(suite, '3.1 Score strictly null when yerlesen=0 with 0', parseScore(0, 0), null);
  assertEqual(suite, '3.1 Score strictly null when yerlesen=0 with "---"', parseScore('---', 0), null);

  // 3.2 Dash and empty score representations when yerlesen > 0
  assertEqual(suite, '3.2 Dash "---" score returns null', parseScore('---', 2), null);
  assertEqual(suite, '3.2 Dash "--" score returns null', parseScore('--', 2), null);
  assertEqual(suite, '3.2 Dash "-" score returns null', parseScore('-', 2), null);
  assertEqual(suite, '3.2 Empty string score returns null', parseScore('', 2), null);
  assertEqual(suite, '3.2 Whitespace string score returns null', parseScore('   ', 2), null);
  assertEqual(suite, '3.2 String "0" returns null', parseScore('0', 2), null);
  assertEqual(suite, '3.2 String "0,00000" returns null', parseScore('0,00000', 2), null);

  // 3.3 Full Ingestion Pipeline behavior on unfilled cadres
  const unfilledRows = [
    {
      kadroKodu: '324210901',
      kurumAdi: 'TEST KURUMU',
      kadroUnvani: 'MÜTERCİM',
      kontenjan: '3',
      yerlesen: '0',
      tabanPuan: '75,45000', // Erroneously filled in source
      tavanPuan: '75,45000',
      nitelikKodlari: '4001',
    },
    {
      kadroKodu: '324210902',
      kurumAdi: 'TEST KURUMU 2',
      kadroUnvani: 'MEMUR',
      kontenjan: '5',
      yerlesen: '2',
      tabanPuan: '81,20000',
      tavanPuan: '84,50000',
      nitelikKodlari: '4001',
    },
    {
      kadroKodu: '324210903',
      kurumAdi: 'TEST KURUMU 3',
      kadroUnvani: 'AVUKAT',
      kontenjan: '2',
      yerlesen: '4', // yerlesen > kontenjan
      tabanPuan: '88,00000',
      tavanPuan: '90,00000',
      nitelikKodlari: '4421',
    },
  ];

  const ingestRes = ingestRecords(unfilledRows, {
    donem: '2024/1',
    ogrenimDuzeyi: 'lisans',
  });

  const rec0 = ingestRes.records.find((r) => r.kadroKodu === '324210901')!;
  assertEqual(suite, '3.3 Ingest: yerlesen === 0 overrides erroneous tabanPuan to null', rec0.tabanPuan, null);
  assertEqual(suite, '3.3 Ingest: yerlesen === 0 overrides erroneous tavanPuan to null', rec0.tavanPuan, null);
  assertEqual(suite, '3.3 Ingest: bosKalan correctly computed as 3 - 0 = 3', rec0.bosKalan, 3);

  const rec1 = ingestRes.records.find((r) => r.kadroKodu === '324210902')!;
  assertEqual(suite, '3.3 Ingest: partially filled bosKalan is 5 - 2 = 3', rec1.bosKalan, 3);
  assertEqual(suite, '3.3 Ingest: partially filled tabanPuan preserved', rec1.tabanPuan, 81.2);

  const rec2 = ingestRes.records.find((r) => r.kadroKodu === '324210903')!;
  assertEqual(suite, '3.3 Ingest: yerlesen > kontenjan is clamped to kontenjan (2)', rec2.yerlesen, 2);
  assertEqual(suite, '3.3 Ingest: clamped bosKalan is 0', rec2.bosKalan, 0);
  assertTrue(
    suite,
    '3.3 Ingest: generates warning for yerlesen exceeding quota',
    ingestRes.warnings.some((w) => w.kadroKodu === '324210903')
  );
}

// ============================================================================
// SUITE 4: Messy qualification code strings (extractQualificationCodes)
// ============================================================================
function runSuite4() {
  const suite = 'Suite 4: Qualification Code Extraction';

  // 4.1 Messy qualification string with diverse delimiters
  const messyInput = '4531, 7113; 6225 - 7300 / 4539';
  const extracted = extractQualificationCodes(messyInput);
  assertEqual(suite, '4.1 Extracts all 5 distinct 4-digit codes', extracted.all, [
    '4531',
    '7113',
    '6225',
    '7300',
    '4539',
  ]);
  assertEqual(suite, '4.1 Correctly partitions mezuniyet codes', extracted.mezuniyet, [
    '4531',
    '4539',
  ]);
  assertEqual(suite, '4.1 Correctly partitions ozelSartlar codes', extracted.ozelSartlar, [
    '7113',
    '6225',
    '7300',
  ]);

  // 4.2 Deduplication of repeated codes
  const duplicateInput = '4531, 4531, 7113, 7113; 6225, 6225';
  const deduped = extractQualificationCodes(duplicateInput);
  assertEqual(suite, '4.2 Deduplicates repeated codes', deduped.all, ['4531', '7113', '6225']);

  // 4.3 Codes embedded in descriptive Turkish prose
  const textInput =
    'Adayların 4531 veya 4539 mezunu olması, ayrıca 7113 İngilizce YDS ve 6225 MEB onaylı sertifikaya sahip olması şarttır.';
  const fromText = extractQualificationCodes(textInput);
  assertEqual(suite, '4.3 Extracts 4-digit codes from natural text', fromText.all, [
    '4531',
    '4539',
    '7113',
    '6225',
  ]);

  // 4.4 Boundary length rejection (ignores non-4-digit numbers)
  const lengthTest = '123 12345 4531 67890 7113 45';
  const fromLength = extractQualificationCodes(lengthTest);
  assertEqual(suite, '4.4 Only extracts exactly 4-digit numbers', fromLength.all, ['4531', '7113']);

  // 4.5 Underscore-separated codes: "4531_7113"
  const underscoreCodes = extractQualificationCodes('4531_7113');
  assertEqual(
    suite,
    '4.5 Underscore separated codes "4531_7113" extracts both',
    underscoreCodes.all,
    ['4531', '7113'],
    'ANOMALY: \\b\\d{4}\\b fails on underscore delimiters because "_" is treated as a word character in regex'
  );

  // 4.6 Array or native inputs
  assertEqual(suite, '4.6 Array of codes stringified', extractQualificationCodes(['4531', '7113']).all, [
    '4531',
    '7113',
  ]);
  assertEqual(suite, '4.6 Empty/null returns empty arrays', extractQualificationCodes(null), {
    all: [],
    mezuniyet: [],
    ozelSartlar: [],
  });

  // 4.7 Education levels across Lisans, Önlisans, Ortaöğretim
  const crossLevel = '4001, 3001, 2001, 1101, 6225, 7322';
  const crossExtracted = extractQualificationCodes(crossLevel);
  assertEqual(suite, '4.7 Mezuniyet contains 4001, 3001, 2001', crossExtracted.mezuniyet, [
    '4001',
    '3001',
    '2001',
  ]);
  assertEqual(suite, '4.7 OzelSartlar contains 1101, 6225, 7322', crossExtracted.ozelSartlar, [
    '1101',
    '6225',
    '7322',
  ]);
}

// ============================================================================
// SUITE 5: Turkish uppercase/lowercase folding across dotted and dotless I
// ============================================================================
function runSuite5() {
  const suite = 'Suite 5: Turkish Character Normalization';

  // 5.1 Direct single character conversions
  assertEqual(suite, '5.1 toTurkishUpper("i") === "İ"', toTurkishUpper('i'), 'İ');
  assertEqual(suite, '5.1 toTurkishUpper("ı") === "I"', toTurkishUpper('ı'), 'I');
  assertEqual(suite, '5.1 normalizeTr("İ") === "i"', normalizeTr('İ'), 'i');
  assertEqual(suite, '5.1 normalizeTr("I") === "ı"', normalizeTr('I'), 'ı');

  // 5.2 Canonical normalization with full city names
  assertEqual(suite, '5.2 normalizeTr("İSTANBUL") === "istanbul"', normalizeTr('İSTANBUL'), 'istanbul');
  assertEqual(suite, '5.2 normalizeTr("IĞDIR") === "ığdır"', normalizeTr('IĞDIR'), 'ığdır');
  assertEqual(suite, '5.2 normalizeTr("İZMİR") === "izmir"', normalizeTr('İZMİR'), 'izmir');
  assertEqual(suite, '5.2 normalizeTr("ISPARTA") === "ısparta"', normalizeTr('ISPARTA'), 'ısparta');
  assertEqual(suite, '5.2 normalizeTr("DİYARBAKIR") === "diyarbakır"', normalizeTr('DİYARBAKIR'), 'diyarbakır');

  // 5.3 Universal search folding across Turkish and English keyboards
  // Isparta variations (English 'isparta', Turkish 'ısparta', English upper 'ISPARTA')
  const searchIsparta1 = normalizeTrSearch('ISPARTA');
  const searchIsparta2 = normalizeTrSearch('ısparta');
  const searchIsparta3 = normalizeTrSearch('isparta');
  const searchIsparta4 = normalizeTrSearch('Isparta');
  assertTrue(
    suite,
    '5.3 All 4 Isparta variants fold to "isparta"',
    searchIsparta1 === 'isparta' &&
      searchIsparta2 === 'isparta' &&
      searchIsparta3 === 'isparta' &&
      searchIsparta4 === 'isparta'
  );

  // Istanbul variations
  const searchIst1 = normalizeTrSearch('İSTANBUL');
  const searchIst2 = normalizeTrSearch('istanbul');
  const searchIst3 = normalizeTrSearch('ISTANBUL');
  const searchIst4 = normalizeTrSearch('İstanbul');
  assertTrue(
    suite,
    '5.3 All 4 Istanbul variants fold to "istanbul"',
    searchIst1 === 'istanbul' &&
      searchIst2 === 'istanbul' &&
      searchIst3 === 'istanbul' &&
      searchIst4 === 'istanbul'
  );

  // Iğdır variations
  const searchIgdir1 = normalizeTrSearch('IĞDIR');
  const searchIgdir2 = normalizeTrSearch('ığdır');
  const searchIgdir3 = normalizeTrSearch('igdir');
  const searchIgdir4 = normalizeTrSearch('IGDIR');
  assertTrue(
    suite,
    '5.3 All 4 Iğdır variants fold to "igdir"',
    searchIgdir1 === 'igdir' &&
      searchIgdir2 === 'igdir' &&
      searchIgdir3 === 'igdir' &&
      searchIgdir4 === 'igdir'
  );

  // 5.4 Other Turkish diacritics
  assertEqual(
    suite,
    '5.4 normalizeTrSearch folds Ç, Ğ, Ö, Ş, Ü correctly',
    normalizeTrSearch('ÇALIŞMA VE SOSYAL GÜVENLİK BAKANLIĞI'),
    'calisma ve sosyal guvenlik bakanligi'
  );
  assertEqual(
    suite,
    '5.4 normalizeTrSearch circumflex folding (HÂKİM, KÂTİP)',
    normalizeTrSearch('HÂKİM VE KÂTİP'),
    'hakim ve katip'
  );

  // 5.5 toTurkishUpper conversions
  assertEqual(suite, '5.5 toTurkishUpper("istanbul") === "İSTANBUL"', toTurkishUpper('istanbul'), 'İSTANBUL');
  assertEqual(suite, '5.5 toTurkishUpper("ığdır") === "IĞDIR"', toTurkishUpper('ığdır'), 'IĞDIR');
  assertEqual(suite, '5.5 toTurkishUpper("izmir") === "İZMİR"', toTurkishUpper('izmir'), 'İZMİR');
  assertEqual(suite, '5.5 toTurkishUpper("ısparta") === "ISPARTA"', toTurkishUpper('ısparta'), 'ISPARTA');

  // 5.6 toTurkishTitle conversions
  assertEqual(suite, '5.6 toTurkishTitle("istanbul valiliği")', toTurkishTitle('istanbul valiliği'), 'İstanbul Valiliği');
  assertEqual(suite, '5.6 toTurkishTitle("ığdır il özel idaresi")', toTurkishTitle('ığdır il özel idaresi'), 'Iğdır İl Özel İdaresi');
  assertEqual(suite, '5.6 toTurkishTitle("İSTANBUL VALİLİĞİ")', toTurkishTitle('İSTANBUL VALİLİĞİ'), 'İstanbul Valiliği');
  assertEqual(suite, '5.6 toTurkishTitle("IĞDIR İL ÖZEL İDARESİ")', toTurkishTitle('IĞDIR İL ÖZEL İDARESİ'), 'Iğdır İl Özel İdaresi');

  // 5.7 toTurkishTitle with leading/trailing whitespace
  assertEqual(
    suite,
    '5.7 toTurkishTitle trims leading and trailing whitespace',
    toTurkishTitle('  istanbul valiliği  '),
    'İstanbul Valiliği',
    'ANOMALY: toTurkishTitle preserves leading and trailing space (" İstanbul Valiliği ") because text is not trimmed before split'
  );
}

// ============================================================================
// Execution and Summary
// ============================================================================
function main() {
  console.log('Running Empirical Adversarial Harness for Ingestion & Turkish Subsystems...\n');

  runSuite1();
  runSuite2();
  runSuite3();
  runSuite4();
  runSuite5();

  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  console.log('============================================================');
  console.log(`TOTAL TESTS: ${total} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('============================================================\n');

  const suiteNames = [
    'Suite 1: CSV Parsing & Delimiters',
    'Suite 2: Turkish Comma Decimals',
    'Suite 3: Unfilled Cadres & Zero Placed',
    'Suite 4: Qualification Code Extraction',
    'Suite 5: Turkish Character Normalization',
  ];

  for (const s of suiteNames) {
    const sTotal = results.filter((r) => r.suite === s).length;
    const sPassed = results.filter((r) => r.suite === s && r.passed).length;
    const sFailed = results.filter((r) => r.suite === s && !r.passed).length;
    console.log(`  ${s}: ${sPassed}/${sTotal} passed (${sFailed} failed)`);
  }

  console.log('\n------------------------------------------------------------');
  if (failed > 0) {
    console.log('EMPIRICAL FAILURES & ANOMALIES IDENTIFIED:');
    for (const res of results.filter((r) => !r.passed)) {
      console.log(`\n❌ [${res.suite}] ${res.testName}`);
      console.log(`   Expected: ${JSON.stringify(res.expected)}`);
      console.log(`   Actual:   ${JSON.stringify(res.actual)}`);
      if (res.details) console.log(`   Details:  ${res.details}`);
    }
  } else {
    console.log('ALL ADVERSARIAL CHALLENGES PASSED EMPIRICALLY!');
  }
  console.log('------------------------------------------------------------\n');
}

main();
