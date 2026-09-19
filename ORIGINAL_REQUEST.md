# Original User Request

## 2026-09-19T16:24:59Z

2024-2026 KPSS atama verilerini (lisans, önlisans, ortaöğretim) kapsayan, bölüm ve nitelik kodu çift yönlü otomatik eşleştirmeli, gelişmiş filtreleme ve analiz özelliklerine sahip Next.js + TypeScript tabanlı modern web uygulaması.

Working directory: /home/znekm/Masaüstü/kpssAtama
Integrity mode: demo

## Requirements

### R1. Veri Modeli, Nitelik Kodu Eşleştirme ve Veri Altyapısı
- Lisans, Önlisans ve Ortaöğretim kategorilerinde 2024-2026 KPSS merkezi yerleştirme (kadro, kurum, branş, kontenjan, taban/tavan puan, il ve nitelik kodları) verilerini barındıran yapılandırılmış veri mimarisi oluşturulması.
- ÖSYM mezuniyet alan kodları ile nitelik kodlarının çift yönlü haritası (Bölüm -> Nitelik Kodları ve Nitelik Kodu -> Bölümler/Şartlar).
- Yeni dönem verilerinin (JSON/Excel/CSV) kolayca sisteme dahil edilmesini sağlayan içe aktarma/ayrıştırma (import/parser) betiği.

### R2. Akıllı Bölüm ve Nitelik Kodu Arama Motoru
- Kullanıcı mezun olduğu bölümü yazdığında veya seçtiğinde, sistemin ilgili nitelik kodunu/kodlarını otomatik olarak bulup seçime eklemesi.
- Doğrudan nitelik kodu ile arama yapıldığında kodun kapsadığı bölümlerin ve geçerli şartların görüntülenmesi.
- "Atamaları Göster" aksiyonu ile seçilen kriterlere uyan tüm atama kayıtlarının anında listelenmesi.

### R3. Çok Kriterli Filtreleme, Analiz ve İstatistik Paneli
- Öğrenim düzeyi (Lisans / Önlisans / Ortaöğretim), Atama Dönemi (2024/1, 2024/2, 2025/1 vb.), Şehir/Bölge, Kurum Adı, Unvan ve Taban Puan aralığına göre çoklu filtreleme imkanı.
- Seçilen bölüm veya kadro için dönemler arası taban puan değişim grafiği, kontenjan analizleri ve en düşük/en yüksek kapatan kurumların özeti.

### R4. Modern, Erişilebilir ve Hızlı Web Arayüzü (Next.js + TypeScript + Tailwind CSS)
- Impeccable tasarım yönergelerine uygun, "Operate" modunda (hızlı taranabilir, yüksek kontrastlı, gereksiz görsel karmaşadan arındırılmış, mobil ve masaüstü uyumlu) profesyonel kullanıcı arayüzü.
- Hızlı veri filtreleme, sayfalama (pagination) ve detay kartı/modal görüntüleme.

## Acceptance Criteria

### Derleme ve Tip Güvenliği
- [ ] Next.js ve TypeScript projesi sıfır hata ve sıfır type warning ile derlenir (`npm run build`).

### Fonksiyonel Doğrulama
- [ ] Lisans, Önlisans ve Ortaöğretim kategorilerinin her biri için geçerli veri seti ve nitelik kodları yüklenmiştir.
- [ ] Bir bölüm seçildiğinde (örn. Bilgisayar Mühendisliği veya Adalet veya Hemşirelik) ilgili nitelik kodları otomatik olarak görüntülenir.
- [ ] Nitelik koduna göre arama yapıldığında o nitelik koduna sahip kadro ve atamalar filtrelenerek listelenir.
- [ ] İl, kurum, dönem ve puan aralığı filtreleri dinamik olarak sonuç tablosunu günceller.
- [ ] Atama detayında kurum adı, unvan, il, kontenjan, taban puan, tavan puan ve aranan nitelik kodları eksiksiz listelenir.

### Test ve Doğrulama
- [ ] Arama motoru ve nitelik kodu eşleme mantığını doğrulayan birim testleri (unit tests) başarıyla geçer (`npm test`).

## 2026-09-19T16:25:51Z

User Directive: The project must be pushed to GitHub at https://github.com/ozunekmekci/KPSSAtamaPortal.git.
Git origin is configured to https://github.com/ozunekmekci/KPSSAtamaPortal.git (branch main), and github credentials are authenticated.
Please ensure that as changes and milestones are implemented, commits and git pushes to origin main are performed regularly.
