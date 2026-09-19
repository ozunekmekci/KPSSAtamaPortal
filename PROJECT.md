# KPSS Atama Portal — Proje Mimari ve Teknik Şartnamesi (PROJECT.md)

## 1. Proje Özeti ve Kapsam

**KPSS Atama Portal**, 2024–2026 KPSS B Grubu Merkezi Yerleştirme dönemlerini (2024/1, 2024/2, 2025/1, 2025/2, 2026/1) kapsayan; Lisans (KPSSP3), Ön Lisans (KPSSP93) ve Ortaöğretim (KPSSP94) seviyelerinde adayların mezuniyet alanları ile ÖSYM nitelik kodlarını çift yönlü olarak eşleştiren, anlık çok kriterli filtreleme, taban/tavan puan analizi ve kontenjan istatistikleri sunan yeni nesil bir web uygulamasıdır.

- **Hedef Kitle**: Merkezi atama tercihi yapacak KPSS adayları, kariyer danışmanları ve veri analistleri.
- **Kullanım Senaryosu**: Impeccable "Operate" modu (görev odaklı, yüksek veri yoğunluğu, anlık tepki süresi, sıfır görsel gürültü).
- **Kod Tabanı ve Çalışma Dizini**: `/home/znekm/Masaüstü/kpssAtama`
- **Uzak Depo (Git Remote)**: `https://github.com/ozunekmekci/KPSSAtamaPortal.git` (branch: `main`)

---

## 2. Sistem Mimarisi

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Next.js 16 + React 19 Client                    │
│                                                                        │
│  ┌───────────────────────┐  ┌────────────────────────────────────────┐ │
│  │   Filter Sidebar      │  │        Worksurface (Operate Mode)      │ │
│  │  - Düzey (Lisans/Ön/Or)│  │ - Command Bar (Hızlı Arama, Özet Metrik)│ │
│  │  - Dönem Çoklu Seçim  │  │ - Akıllı Bölüm & Nitelik Kartı/Rozeti   │ │
│  │  - Şehir / Kurum      │  │ - Kompakt Sonuç Tablosu (Tabular Nums)  │ │
│  │  - Taban Puan Slider  │  │ - Detay Çekmecesi (Slide-over Portal)   │ │
│  │  - 4001/3001/2001 Aç/K│  │ - Dönem Analiz & Dağılım İstatistikleri│ │
│  └───────────┬───────────┘  └───────────────────▲────────────────────┘ │
│              │                                  │                      │
│              ▼                                  │                      │
│  ┌──────────────────────────────────────────────┴────────────────────┐ │
│  │        Client-Side In-Memory Engine (<2ms Filter & Index)         │ │
│  │  - Turkish Normalizer (Dotted/Dotless I, Diacritics Folding)      │ │
│  │  - Inverted Set Indexing (Map<Key, Set<RecordID>>)                │ │
│  │  - Bi-directional Qualification & Department Mappings             │ │
│  └──────────────────────────────────▲────────────────────────────────┘ │
└─────────────────────────────────────┼──────────────────────────────────┘
                                      │ Static JSON / Hydration
┌─────────────────────────────────────┴──────────────────────────────────┐
│                    Build-Time & Ingestion Pipeline                     │
│                                                                        │
│  ┌─────────────────────────┐      ┌──────────────────────────────────┐ │
│  │ ÖSYM Ham Dosyaları      │ ───► │ Data Parser & Ingestion Subsystem│ │
│  │ (CSV, JSON, Excel)      │      │ (lib/parser.ts, import-data.ts)  │ │
│  └─────────────────────────┘      └─────────────────┬────────────────┘ │
│                                                     │                  │
│                                                     ▼                  │
│                                   ┌──────────────────────────────────┐ │
│                                   │ Doğrulanmış Veri Setleri         │ │
│                                   │ (kpss_records.json, dictionaries)│ │
│                                   └──────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Özellik Envanteri (Feature Inventory)

| ID | Modül | Özellik | Açıklama | Kabul Kriteri |
|----|-------|---------|----------|---------------|
| **F-01** | Domain / Veri | 3 Düzeyli Eğitim Hiyerarşisi | Lisans (P3), Önlisans (P93) ve Ortaöğretim (P94) verilerinin ayrık tablo ve şemalarla yönetilmesi. | Puan türleri ve düzeyler asla karışmaz. |
| **F-02** | Eşleştirme | Genel Nitelik Kodları Entegrasyonu | 4001 (Herhangi Lisans), 3001 (Herhangi Önlisans), 2001 (Herhangi Ortaöğretim) kadrolarının bölüm aramalarına opsiyonel dahil edilmesi. | Toggle açıkken genel kadrolar listelenir, kapalıyken sadece branş kadroları gelir. |
| **F-03** | Eşleştirme | Çift Yönlü Nitelik-Bölüm Haritası | Bölüm seçilince nitelik kodunun (`4531`), nitelik kodu yazılınca ilgili bölümlerin ve şartların anında çözümlenmesi. | 4531 seçildiğinde Bilgisayar Mühendisliği ve Yazılım Mühendisliği eşdeğerlikleri listelenir. |
| **F-04** | Arama | Akıllı Türkçe Arama Motoru | `İ` / `ı`, `ğ`, `ü`, `ş`, `ö`, `ç` duyarsız, İngilizce klavye uyumlu, çoklu anahtar kelimeli arama. | "istanbul bilisim" sorgusu "İSTANBUL BİLİŞİM" kadrosunu bulur. |
| **F-05** | Filtreleme | Çok Kriterli Anlık Filtreleme Paneli | Düzey, Dönem, Şehir, Kurum, Unvan, Taban Puan aralığı, Nitelik Kodu kesişim filtrelemesi. | 15.000 kayıt üzerinde filtre sonucu <2ms içinde hesaplanır. |
| **F-06** | Analiz | Dönemler Arası Taban Puan Grafiği | Seçilen bölüm/kadro için 2024/1'den itibaren taban puanın seyri, medyan ve min/max değerleri. | Çizgi/alan grafiğinde dönem bazlı min/ort/max puanlar hatasız gösterilir. |
| **F-07** | Analiz | Kontenjan ve Kapatan Kurumlar Özeti | En yüksek/en düşük puanla kapatan kurumlar, toplam kontenjan ve yerleşen dağılımı. | Dolmayan kontenjanlar (`yerlesen < kontenjan`) ve boş kalanlar ayrıştırılır. |
| **F-08** | Veri İçe Aktarma | Çoklu Format Ayrıştırıcı (Ingestion) | JSON ve CSV (virgül, noktalı virgül, tab; Windows-1254, UTF-8) formatlarında veri içe aktarımı. | `scripts/import-data.ts` üzerinden yeni ÖSYM dönem verileri tek komutla aktarılır. |
| **F-09** | Arayüz | Impeccable "Operate" UI | Yüksek bilgi yoğunluğu, `tabular-nums` sayısal tipografi, kart yığını içermeyen düz tablo düzeni, klavye kısayolları. | Impeccable kurallarına (kart yığını yok, kicker yok, gradient metin yok) %100 uyum. |
| **F-10** | Dışa Aktarma | Filtrelenmiş Sonuçları CSV İndirme | Adayın aktif filtrelerine uyan sonuçları yerel CSV dosyası olarak dışa aktarabilmesi. | Tarayıcıda anında `.csv` formatında UTF-8 BOM ile dosya üretilir. |

---

## 4. Kilometre Taşları (Milestones)

- **Milestone 1 (M1 — Şu anki aşama)**:
  - Proje mimari ve test altyapısı belgelerinin (`PROJECT.md`, `TEST_INFRA.md`) oluşturulması.
  - Next.js 16 + TypeScript + Tailwind CSS v4 + Vitest çalışma ortamının kurulması.
  - Tip tanımları (`src/types/kpss.ts`) ve çift yönlü nitelik/bölüm sözlüklerinin (`src/data/`) yazılması.
  - Veri içe aktarma motoru (`src/lib/parser.ts`, `scripts/import-data.ts`) ve kapsamlı gerçekçi tohum veri setinin (`src/data/kpss_records.json`) üretilmesi.
  - Temel birim testleri ve derleme doğrulaması (`npm run build`, `npm test`).
  - Git commit ve GitHub uzak depoya (`origin main`) push.

- **Milestone 2 (M2)**:
  - Türkçe normalizasyon kütüphanesi (`src/lib/turkish.ts`).
  - Çift yönlü eşleştirme motoru ve arama çekirdeği (`src/lib/search.ts`, `src/lib/mappings.ts`).
  - Ters dizin indeksleme ve anlık bellek içi filtreleme modülü (`src/lib/filter.ts`).
  - Arama ve filtreleme birim test suiteleri.

- **Milestone 3 (M3)**:
  - İstatistik ve analiz motoru (`src/lib/analytics.ts`).
  - Impeccable Operate-mode UI bileşenleri: Header/Command Bar, Filter Sidebar, Data Table, Detail Drawer, Trend & Quota Charts.
  - Sayfalama, URL senkronizasyonu (search params), CSV dışa aktarma.

- **Milestone 4 (M4)**:
  - Uçtan uca entegrasyon testleri ve Impeccable UI erişilebilirlik/kontrast denetimi.
  - Performans doğrulaması (60fps etkileşim, sub-millisecond filtreleme).
  - Final derleme (`npm run build`), tüm testlerin geçmesi (`npm test`), son git push ve handoff raporu.

---

## 5. Arayüz Sözleşmeleri (Interface Contracts)

### 5.1. Yerleştirme Kaydı (`PlacementRecord`)

```typescript
export interface PlacementRecord {
  id: string;                      // `${donem}-${ogrenimDuzeyi}-${kadroKodu}`
  kadroKodu: string;               // 9 haneli resmi ÖSYM kodu (örn. "324210015")
  donem: PlacementPeriod;          // '2024/1' | '2024/2' | '2025/1' | '2025/2' | '2026/1'
  ogrenimDuzeyi: EducationLevel;   // 'lisans' | 'onlisans' | 'ortaogretim'
  puanTuru: ScoreType;             // 'P3' | 'P93' | 'P94'
  kurumAdi: string;                // Kurum adı (örn. "DEVLET HAVA MEYDANLARI İŞLETMESİ")
  kadroUnvani: string;             // Unvan (örn. "MÜHENDİS", "V.H.K.İ.")
  teskilat?: OrganizationType;     // 'MERKEZ' | 'TASRA' | 'KIT' | 'BELEDIYE' | 'UNIVERSITE'
  hizmetSinifi?: HizmetSinifi;     // 'TH' | 'GİH' | 'SH' | 'AH' | 'YH' | 'EÖH' | 'KİT'
  derece?: string;                 // "8", "9", vb.
  sehir: string;                   // İl adı (örn. "ANKARA", "İSTANBUL", "İZMİR")
  ilce?: string;                   // İlçe / Birim adı
  kontenjan: number;               // Açılan toplam kontenjan sayısı
  yerlesen: number;                // Yerleşen aday sayısı
  bosKalan: number;                // kontenjan - yerlesen
  tabanPuan: number | null;        // En küçük puan (yerleşen 0 ise null)
  tavanPuan: number | null;        // En büyük puan (yerleşen 0 ise null)
  nitelikKodlari: string[];        // Kadroda aranan tüm 4 haneli kodlar
  mezuniyetKodlari: string[];      // 2xxx, 3xxx, 4xxx mezuniyet kodları
  ozelSartlar: string[];           // 1xxx, 6xxx, 7xxx özel şart kodları
}
```

### 5.2. Nitelik Kodu ve Bölüm Sözleşmeleri

```typescript
export interface QualificationCode {
  kod: string;                     // 4 haneli kod (örn. "4531")
  kategori: QualificationCategory; // 'genel_mezuniyet' | 'lisans_mezuniyet' | 'sertifika' | vb.
  ogrenimDuzeyi: EducationLevel | 'hepsi';
  aciklama: string;                // ÖSYM kılavuzundaki tam metin
  kisaTanim: string;               // Rozet ve etiket için kısa başlık
  isSpecialCondition: boolean;     // Özel şart mı (mezuniyet harici)?
  bolumler?: string[];             // İlgili akademik bölümler
}

export interface Department {
  id: string;                      // URL uyumlu slug (örn. "bilgisayar-muhendisligi")
  ad: string;                      // Resmi bölüm adı
  ogrenimDuzeyi: EducationLevel;   // 'lisans' | 'onlisans' | 'ortaogretim'
  nitelikKodu: string;             // Birincil ÖSYM nitelik kodu (örn. "4531")
  genelNitelikKodu: string;        // 4001 / 3001 / 2001
  fakulte?: string;
  alanGrubu?: string;              // "Mühendislik", "İİBF", "Sağlık", vb.
  esdegerKodlar: string[];         // Eşdeğer kabul edilen kodlar
  anahtarKelimeler: string[];      // Arama optimizasyonu için etiketler
}
```

---

## 6. Kod Düzeni (Code Layout)

```
kpssAtama/
├── .agents/                 # Takım ajanları çalışma ve el sıkışma dizinleri
├── .git/                    # Git versiyon kontrolü
├── public/                  # Statik varlıklar ve favicon
├── scripts/
│   └── import-data.ts       # CSV/JSON ÖSYM veri içe aktarma CLI betiği
├── src/
│   ├── app/
│   │   ├── globals.css      # Tailwind CSS v4 ve Impeccable CSS değişkenleri
│   │   ├── layout.tsx       # Ana HTML kabuğu ve tema sağlayıcı
│   │   └── page.tsx         # Ana sayfa (Operate Dashboard)
│   ├── components/
│   │   ├── analytics/       # Grafik ve analiz paneli bileşenleri
│   │   ├── search/          # Akıllı arama ve bölüm seçici bileşenleri
│   │   ├── table/           # Kompakt sonuç tablosu, sayfalama ve çekmece
│   │   └── ui/              # Atomik düğme, girdi, rozet ve modal bileşenleri
│   ├── data/
│   │   ├── departments.ts   # Bölüm ve mezuniyet alanları sözlüğü
│   │   ├── qualifications.ts# 4 haneli nitelik kodları sözlüğü
│   │   ├── special-conditions.ts # Özel şartlar sözlüğü
│   │   └── kpss_records.json# 2024-2026 merkezi yerleştirme tohum veri seti
│   ├── lib/
│   │   ├── analytics.ts     # İstatistik ve dağılım hesaplayıcı
│   │   ├── filter.ts        # Bellek içi ters indeks filtreleme motoru
│   │   ├── mappings.ts      # Çift yönlü bölüm-nitelik eşleştirici
│   │   ├── parser.ts        # Çok formatlı CSV/JSON ayrıştırma motoru
│   │   └── turkish.ts       # İki aşamalı Türkçe karakter normalizasyonu
│   └── types/
│       └── kpss.ts          # Temel TypeScript tipleri ve arayüz sözleşmeleri
├── tests/
│   ├── analytics.test.ts    # İstatistik ve analiz testleri
│   ├── filter.test.ts       # Çok kriterli filtreleme testleri
│   ├── mappings.test.ts     # Çift yönlü eşleştirme testleri
│   ├── parser.test.ts       # Veri ayrıştırma ve şema doğrulama testleri
│   └── turkish.test.ts      # Türkçe normalizasyon testleri
├── ORIGINAL_REQUEST.md      # Orijinal kullanıcı isterleri
├── PROJECT.md               # Proje mimari ve teknik şartnamesi
├── TEST_INFRA.md            # Test felsefesi ve altyapı dokümantasyonu
├── next.config.ts           # Next.js yapılandırması
├── package.json             # Bağımlılıklar ve komut betikleri
├── postcss.config.mjs       # Tailwind CSS v4 PostCSS yapılandırması
├── tsconfig.json            # TypeScript derleme ayarları
├── vitest.config.ts         # Vitest test koşucu yapılandırması
└── vitest.setup.ts          # Test ortamı kurulumu
```
