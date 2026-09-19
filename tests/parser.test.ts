import { describe, it, expect } from 'vitest';
import {
  mapHeaderToField,
  parseScore,
  extractQualificationCodes,
  parseCsvRows,
  parseAndIngestContent,
} from '@/lib/parser';

describe('Data Ingestion & Parser Subsystem', () => {
  describe('Header Mapping', () => {
    it('maps variations of Kadro Kodu', () => {
      expect(mapHeaderToField('Kadro Kodu')).toBe('kadroKodu');
      expect(mapHeaderToField('KADRO KODU')).toBe('kadroKodu');
      expect(mapHeaderToField('Pozisyon Kodu')).toBe('kadroKodu');
    });

    it('maps variations of Kurum Adı and Unvan', () => {
      expect(mapHeaderToField('Kurum Adı')).toBe('kurumAdi');
      expect(mapHeaderToField('Atanan Kurum')).toBe('kurumAdi');
      expect(mapHeaderToField('Kadro Unvanı')).toBe('kadroUnvani');
      expect(mapHeaderToField('Unvan')).toBe('kadroUnvani');
    });

    it('maps scores and quotas', () => {
      expect(mapHeaderToField('Kontenjan')).toBe('kontenjan');
      expect(mapHeaderToField('Yerleşen')).toBe('yerlesen');
      expect(mapHeaderToField('Taban Puan')).toBe('tabanPuan');
      expect(mapHeaderToField('En Küçük Puan')).toBe('tabanPuan');
      expect(mapHeaderToField('Tavan Puan')).toBe('tavanPuan');
      expect(mapHeaderToField('En Büyük Puan')).toBe('tavanPuan');
    });
  });

  describe('Score & Code Sanitization', () => {
    it('parses Turkish comma float string into number with 5 decimal precision', () => {
      expect(parseScore('84,12431', 5)).toBe(84.12431);
      expect(parseScore('92,5', 1)).toBe(92.5);
      expect(parseScore('76.84000', 3)).toBe(76.84);
    });

    it('returns null for empty or unfilled post scores', () => {
      expect(parseScore('---', 0)).toBeNull();
      expect(parseScore('-', 2)).toBeNull();
      expect(parseScore('', 1)).toBeNull();
      expect(parseScore(null, 5)).toBeNull();
      // If yerlesen === 0, score is strictly null even if string contains zero
      expect(parseScore('0,00000', 0)).toBeNull();
    });

    it('extracts and partitions 4-digit qualification codes', () => {
      const raw = '4531, 7113; 6225 - 7300, 4539';
      const extracted = extractQualificationCodes(raw);

      expect(extracted.all).toEqual(['4531', '7113', '6225', '7300', '4539']);
      expect(extracted.mezuniyet).toEqual(['4531', '4539']);
      expect(extracted.ozelSartlar).toEqual(['7113', '6225', '7300']);
    });
  });

  describe('CSV Parsing Delimiter Auto-Detection', () => {
    it('parses semicolon delimited CSV', () => {
      const csv = `Kadro Kodu;Kurum Adı;Kadro Unvanı;Kontenjan;Yerleşen;Taban Puan;Nitelik Kodları\n324210001;SGK;MEMUR;5;5;82,45120;4001, 6225`;
      const rows = parseCsvRows(csv);
      expect(rows.length).toBe(1);
      expect(rows[0]['Kadro Kodu']).toBe('324210001');
    });

    it('parses comma delimited CSV', () => {
      const csv = `Kadro Kodu,Kurum Adı,Kadro Unvanı,Kontenjan,Yerleşen,Taban Puan,Nitelik Kodları\n324210002,DHMİ,MÜHENDİS,2,2,94.12500,"4531, 7113"`;
      const rows = parseCsvRows(csv);
      expect(rows.length).toBe(1);
      expect(rows[0]['Kadro Kodu']).toBe('324210002');
    });
  });

  describe('Full Content Ingestion Pipeline', () => {
    it('ingests CSV content and produces validated PlacementRecord[] with deterministic ID', () => {
      const csvContent = `Kadro Kodu;Kurum Adı;Kadro Unvanı;İl;Kontenjan;Yerleşen;Taban Puan;Tavan Puan;Nitelik Kodları
324210101;DEVLET HAVA MEYDANLARI;MÜHENDİS;ANKARA;3;3;93,45000;96,12000;4531, 7113, 7225
324210102;SOSYAL GÜVENLİK KURUMU;V.H.K.İ.;İSTANBUL;10;10;79,85124;84,10000;4421, 4431, 6225
324210103;DIŞİŞLERİ BAKANLIĞI;MÜTERCİM;ANKARA;2;0;---;---;4001, 7117`;

      const result = parseAndIngestContent(csvContent, {
        donem: '2024/1',
        ogrenimDuzeyi: 'lisans',
      });

      expect(result.success).toBe(true);
      expect(result.totalRows).toBe(3);
      expect(result.records.length).toBe(3);

      const dhmi = result.records[0];
      expect(dhmi.id).toBe('2024/1-lisans-324210101');
      expect(dhmi.kadroKodu).toBe('324210101');
      expect(dhmi.puanTuru).toBe('P3');
      expect(dhmi.tabanPuan).toBe(93.45);
      expect(dhmi.tavanPuan).toBe(96.12);
      expect(dhmi.nitelikKodlari).toEqual(['4531', '7113', '7225']);
      expect(dhmi.mezuniyetKodlari).toEqual(['4531']);
      expect(dhmi.ozelSartlar).toEqual(['7113', '7225']);

      const unfilled = result.records[2];
      expect(unfilled.yerlesen).toBe(0);
      expect(unfilled.bosKalan).toBe(2);
      expect(unfilled.tabanPuan).toBeNull();
      expect(unfilled.tavanPuan).toBeNull();
    });

    it('ingests JSON content and updates existing records idempotently', () => {
      const existing = [
        {
          id: '2024/2-lisans-324210999',
          kadroKodu: '324210999',
          donem: '2024/2' as const,
          ogrenimDuzeyi: 'lisans' as const,
          puanTuru: 'P3' as const,
          kurumAdi: 'ESKİ KURUM',
          kadroUnvani: 'MEMUR',
          sehir: 'ANKARA',
          kontenjan: 1,
          yerlesen: 1,
          bosKalan: 0,
          tabanPuan: 80.0,
          tavanPuan: 80.0,
          nitelikKodlari: ['4001'],
          mezuniyetKodlari: ['4001'],
          ozelSartlar: [],
        },
      ];

      const jsonContent = JSON.stringify([
        {
          kadroKodu: '324210999',
          kurumAdi: 'GÜNCELLENMİŞ KURUM',
          kadroUnvani: 'MEMUR',
          kontenjan: 2,
          yerlesen: 2,
          tabanPuan: '81,50000',
          nitelikKodlari: '4001',
        },
      ]);

      const result = parseAndIngestContent(jsonContent, {
        donem: '2024/2',
        ogrenimDuzeyi: 'lisans',
        existingRecords: existing,
      });

      expect(result.success).toBe(true);
      expect(result.updated).toBe(1);
      expect(result.inserted).toBe(0);
      expect(result.records[0].kurumAdi).toBe('GÜNCELLENMİŞ KURUM');
      expect(result.records[0].kontenjan).toBe(2);
      expect(result.records[0].tabanPuan).toBe(81.5);
    });
  });
});
