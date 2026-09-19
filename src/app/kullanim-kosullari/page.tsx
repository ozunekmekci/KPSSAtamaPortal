import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { FileText, ArrowLeft, Scale, AlertTriangle, CheckCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Kullanım Koşulları ve Hukuki Uyarı',
  description:
    'KPSS Atama ve Nitelik Kodu Portalı kullanım koşulları, veri kaynakları, yasal sorumluluk sınırları ve kamu açık veri esasları.',
  alternates: {
    canonical: '/kullanim-kosullari',
  },
};

export default function KullanimKosullariPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white border border-slate-300 shadow-xs p-6 sm:p-10">
        {/* Navigation Back */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-red-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Ana Sayfaya ve Arama Tezgahına Dön</span>
          </Link>
        </div>

        {/* Page Header */}
        <div className="border-b border-slate-200 pb-5 mb-6">
          <div className="flex items-center gap-2.5 text-red-700 mb-2">
            <FileText className="w-6 h-6" />
            <span className="text-xs font-bold uppercase tracking-wider">
              Hukuki Bildirim ve Hizmet Şartları
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Kullanım Koşulları ve Sorumluluk Reddi Beyanı
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-2">
            Son Güncelleme Tarihi: 20 Eylül 2026
          </p>
        </div>

        {/* Terms Body */}
        <div className="space-y-6 text-xs sm:text-sm text-slate-700 leading-relaxed">
          <section className="bg-amber-50 border border-amber-200 p-4 text-amber-900 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold mb-0.5">Resmi Hukuki Dayanak Uyarısı:</strong>
              <span>
                Bu portal bilgilendirme, istatistiki analiz ve adaylara rehberlik amacıyla bağımsız olarak hazırlanmıştır. Resmî tercih işlemlerinizde ve hak iddialarınızda münhasıran <strong>ÖSYM (osym.gov.tr)</strong> tarafından yayımlanan güncel Tercih Kılavuzları ve <strong>Resmî Gazete</strong> ilanları bağlayıcıdır.
              </span>
            </div>
          </section>

          <section>
            <h2 className="text-base font-bold text-slate-900 mb-2 flex items-center gap-2">
              <Scale className="w-4 h-4 text-slate-600" />
              1. Veri Kaynakları ve Doğruluk
            </h2>
            <p>
              Portalda yer alan tüm atama verileri (kadro unvanları, kurum adları, şehirler, kontenjanlar, taban ve tavan puanlar), ÖSYM&apos;nin 2024/1, 2024/2, 2025/1 ve müteakip KPSS B Grubu yerleştirme sonuç tablolarından derlenmiştir. Verilerin aslına sadık kalınarak aktarılması için azami gayret gösterilmekle birlikte, tipografik veya teknik hatalardan kaynaklanabilecek aksaklıklardan portal yöneticileri sorumlu tutulamaz.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-slate-900 mb-2 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-slate-600" />
              2. Hizmetin Niteliği ve Ücretsiz Kullanım
            </h2>
            <p>
              Portalımız kamu yararı gözetilerek adayların hizmetine <strong>tamamen ücretsiz</strong> olarak sunulmuştur. Kadro arama, nitelik kodu filtreleme, taban puan analizi ve veri görüntüleme işlemleri için hiçbir surette ücret talep edilmez.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-slate-900 mb-2">
              3. Adil Kullanım ve Sistem Güvenliği
            </h2>
            <p>
              Kullanıcılar, platformun olağan işleyişini sekteye uğratacak otomatik veri çekme (otonom botlar, yoğun DDoS veya sunucu tıkayıcı istekler) faaliyetlerinde bulunamaz. Sistem güvenliğini ve diğer adayların erişim hakkını korumak amacıyla sunucu seviyesinde hız sınırlaması (rate limiting) uygulanmaktadır.
            </p>
          </section>
        </div>

        {/* Footer Note */}
        <div className="mt-8 pt-6 border-t border-slate-200 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>T.C. KPSS Kamu Görevlerine İlk Defa Atanacaklar Portalı</span>
          <Link href="/gizlilik-politikasi" className="text-red-700 font-semibold hover:underline">
            Gizlilik Politikasını İnceleyin →
          </Link>
        </div>
      </div>
    </div>
  );
}
