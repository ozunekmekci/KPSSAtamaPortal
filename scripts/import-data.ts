import fs from 'fs';
import path from 'path';
import { parseAndIngestContent } from '../src/lib/parser';
import { EducationLevel, PlacementPeriod, PlacementRecord } from '../src/types/kpss';

/**
 * Command-line data ingestion utility for KPSS Central Placement records.
 * Usage:
 *   npx tsx scripts/import-data.ts <filePath> --donem <2024/1|2024/2|...> --level <lisans|onlisans|ortaogretim> [--output <destPath>]
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
KPSS Central Placement Data Ingestion CLI
=========================================
Kullanım:
  npx tsx scripts/import-data.ts <dosyaYolu> --donem <2024/1|2024/2|2025/1> --level <lisans|onlisans|ortaogretim> [--output <hedef.json>]

Seçenekler:
  --donem    Atama Dönemi (2024/1, 2024/2, 2025/1, 2025/2, 2026/1) [Zorunlu]
  --level    Öğrenim Düzeyi (lisans, onlisans, ortaogretim) [Zorunlu]
  --output   Çıktı JSON dosya yolu (Varsayılan: src/data/kpss_records.json)
`);
    process.exit(0);
  }

  const filePath = args[0];
  let donem: PlacementPeriod | undefined;
  let level: EducationLevel | undefined;
  let outputPath = path.resolve(process.cwd(), 'src/data/kpss_records.json');

  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--donem' && args[i + 1]) {
      donem = args[i + 1] as PlacementPeriod;
      i++;
    } else if (args[i] === '--level' && args[i + 1]) {
      level = args[i + 1] as EducationLevel;
      i++;
    } else if (args[i] === '--output' && args[i + 1]) {
      outputPath = path.resolve(process.cwd(), args[i + 1]);
      i++;
    }
  }

  if (!donem || !level) {
    console.error('Hata: --donem ve --level parametreleri zorunludur.');
    process.exit(1);
  }

  if (!fs.existsSync(filePath)) {
    console.error(`Hata: '${filePath}' dosyası bulunamadı.`);
    process.exit(1);
  }

  console.log(`Veri içe aktarma başlatılıyor:`);
  console.log(`- Girdi Dosyası: ${filePath}`);
  console.log(`- Dönem: ${donem}`);
  console.log(`- Öğrenim Düzeyi: ${level}`);
  console.log(`- Hedef: ${outputPath}`);

  const content = fs.readFileSync(filePath, 'utf-8');

  // Load existing records if target file exists
  let existingRecords: PlacementRecord[] = [];
  if (fs.existsSync(outputPath)) {
    try {
      const rawExisting = fs.readFileSync(outputPath, 'utf-8');
      existingRecords = JSON.parse(rawExisting);
    } catch {
      existingRecords = [];
    }
  }

  const result = parseAndIngestContent(content, {
    donem,
    ogrenimDuzeyi: level,
    existingRecords,
  });

  console.log(`\nAyrıştırma Sonucu:`);
  console.log(`- Toplam Satır: ${result.totalRows}`);
  console.log(`- Eklenen Kayıt: ${result.inserted}`);
  console.log(`- Güncellenen Kayıt: ${result.updated}`);
  console.log(`- Uyarı Sayısı: ${result.warnings.length}`);
  console.log(`- Hata Sayısı: ${result.errors.length}`);

  if (result.warnings.length > 0) {
    console.log(`\nİlk 5 Uyarı:`);
    result.warnings.slice(0, 5).forEach((w) => {
      console.log(`  [Satır ${w.row}] ${w.field}: ${w.message}`);
    });
  }

  if (result.errors.length > 0) {
    console.error(`\nHatalar:`);
    result.errors.slice(0, 10).forEach((e) => {
      console.error(`  [Satır ${e.row}] ${e.field}: ${e.message}`);
    });
    console.error('İçe aktarma işleminde kritik hatalar oluştu.');
    process.exit(1);
  }

  // Save updated records
  fs.writeFileSync(outputPath, JSON.stringify(result.records, null, 2), 'utf-8');
  console.log(`\nBaşarılı: ${result.records.length} kayıt '${outputPath}' dosyasına kaydedildi.`);
}

main().catch((err) => {
  console.error('Beklenmeyen hata:', err);
  process.exit(1);
});
