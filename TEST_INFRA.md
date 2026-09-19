# KPSS Atama Portal — Test Altyapısı ve Doğrulama Şartnamesi (TEST_INFRA.md)

## 1. Test Felsefesi ve Doğruluk İlkeleri

Bu projedeki tüm testler şu temel ilkelere sıkı sıkıya bağlıdır:

1. **İddialardan Önce Kanıt (Evidence Before Assertions)**:
   - Başarı beyan edilmeden önce gerçek test komutları koşturulur ve çıktıları doğrulanır.
   - Test sonuçları, beklenen değerler veya sahte doğrulamalar kaynak koda asla sabitlenemez (hardcoded yapılamaz).
2. **Gerçek Mantık ve Durum Doğrulaması**:
   - Tüm fonksiyonlar, ayrıştırıcılar ve filtre motorları gerçek durum (real state) tutar ve gerçek veri üzerinde çalışır. Sahte (facade/dummy) uygulamalar kabul edilmez.
3. **Sıfır Regresyon Prensibi**:
   - Her yeni özellik veya değişiklik sonrasında tüm test takımları baştan sona çalıştırılır.

---

## 2. 4 Katmanlı Test Mimarisi (4-Tier Test Architecture)

```
┌────────────────────────────────────────────────────────────────────────┐
│ Katman 4: Bileşen ve Arayüz Entegrasyon Testleri (Component / UI)      │
│ - React Testing Library + jsdom ile filtre etkileşimleri               │
│ - Modal/Drawer açılma-kapanma ve sayfalama testleri                    │
├────────────────────────────────────────────────────────────────────────┤
│ Katman 3: Veri Ayrıştırma ve İçe Aktarma Boru Hattı (Ingestion/Parser) │
│ - CSV (virgül, noktalı virgül, tab) ve JSON ayrıştırma doğrulaması     │
│ - Türkçe virgüllü ondalık dönüşümü ("84,12345" -> 84.12345)            │
│ - Dolmayan kadro ("---", yerlesen=0 -> null puan) uç durumları         │
├────────────────────────────────────────────────────────────────────────┤
│ Katman 2: Çift Yönlü Haritalama ve Şema Bütünlüğü (Mappings & Schema)  │
│ - Bölüm -> Nitelik Kodu ve Nitelik Kodu -> Bölümler referans uyumu    │
│ - Genel kodlar (4001, 3001, 2001) otomatik eşleştirme kuralları        │
│ - Özel şart (6225, 7113, 7300, 7322) ayrıştırma mantığı                │
├────────────────────────────────────────────────────────────────────────┤
│ Katman 1: Temel Algoritmalar ve Normalizasyon (Unit & Algorithms)      │
│ - İki aşamalı Türkçe karakter katlama (Turkish dotted/dotless I)       │
│ - Arama belirteçleme (tokenization) ve regex kod çıkarımı              │
│ - Taban/Tavan puan sınır doğrulamaları [50.0 - 100.0]                  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Test Dosyaları ve Kapsam Matrisi

| Test Dosyası | Katman | Hedeflenen Modül | Kritik Test Senaryoları |
|--------------|--------|------------------|-------------------------|
| `tests/turkish.test.ts` | Katman 1 | `src/lib/turkish.ts` | - Dotted/dotless I: `İSTANBUL` -> `istanbul`, `IĞDIR` -> `igdir`<br>- Diakritik yumuşatma: `ç, ğ, ö, ş, ü`<br>- Çapraz klavye uyumu (İngilizce klavye girişi ile arama) |
| `tests/mappings.test.ts` | Katman 2 | `src/lib/mappings.ts`, `src/data/` | - `4531` -> Bilgisayar Mühendisliği / Yazılım<br>- Bölümden kod türetme: "Hemşirelik" -> `4703`<br>- Genel kod ekleme: Lisans için `4001` eklenmesi<br>- Özel şart kategorizasyonu: `6225`, `7113` özel şart bayrağı |
| `tests/parser.test.ts` | Katman 3 | `src/lib/parser.ts` | - Virgül, noktalı virgül ve tab ayraçlı CSV dosyalarını otomatik algılama<br>- Türkçe başlık fuzzy eşleştirme ("Kadro Unvanı" vs "Unvan")<br>- Boş kadrolarda puanın `null` olması<br>- Bileşik ID benzersizliği `${donem}-${duzey}-${kod}` |
| `tests/filter.test.ts` | Katman 2/3 | `src/lib/filter.ts` | - Seviye (Lisans/Önlisans/Ortaöğretim) filtreleme<br>- Puan aralığı (min/max) sınır hassasiyeti<br>- Şehir ve kurum çoklu seçimi<br>- Boş sonuç kümesi güvenliği |
| `tests/analytics.test.ts` | Katman 1/2 | `src/lib/analytics.ts` | - Dönem bazlı medyan, ortalama ve min puan hesaplamaları<br>- Boş kadroların puan ortalamalarını bozmaması<br>- En düşük/en yüksek kapatan kurum sıralaması |

---

## 4. Kapsam ve Başarım Eşikleri (Thresholds)

Proje için belirlenen asgari test başarım ve kapsam hedefleri:

- **Birim Test Geçiş Oranı**: %100 (Tüm testler yeşil olmalıdır).
- **Mantık Fonksiyonları Kapsamı**:
  - `src/lib/turkish.ts`: ≥ %95 Statement / Branch
  - `src/lib/mappings.ts`: ≥ %95 Statement / Branch
  - `src/lib/parser.ts`: ≥ %90 Statement / Branch
  - `src/lib/filter.ts`: ≥ %90 Statement / Branch
  - `src/lib/analytics.ts`: ≥ %90 Statement / Branch
- **Derleme Kuralları**: Sıfır TypeScript derleme hatası (`tsc --noEmit`), sıfır Next.js derleme hatası (`npm run build`).

---

## 5. Çalıştırma Komutları

```bash
# Tüm testleri tek seferde çalıştırma
npm test

# Testleri izleme modunda çalıştırma
npm run test:watch

# Test kapsam raporu üretme
npx vitest run --coverage

# TypeScript tip kontrolü
npx tsc --noEmit

# Üretim derlemesi
npm run build
```
