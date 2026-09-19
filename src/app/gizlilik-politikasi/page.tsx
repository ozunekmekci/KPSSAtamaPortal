import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ShieldCheck, ArrowLeft, Lock, Database, Eye } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Gizlilik Politikası ve KVKK Aydınlatma Metni',
  description:
    'KPSS Atama ve Nitelik Kodu Portalı gizlilik politikası, 6698 sayılı KVKK kapsamında kişisel verilerin korunması ve çerez kullanım esasları.',
  alternates: {
    canonical: '/gizlilik-politikasi',
  },
};

export default function GizlilikPolitikasiPage() {
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
            <ShieldCheck className="w-6 h-6" />
            <span className="text-xs font-bold uppercase tracking-wider">
              T.C. 6698 Sayılı KVKK Uyumluluk Bildirimi
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Gizlilik Politikası ve Kişisel Verilerin Korunması
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-2">
            Son Güncelleme Tarihi: 20 Eylül 2026
          </p>
        </div>

        {/* Policy Body */}
        <div className="space-y-6 text-xs sm:text-sm text-slate-700 leading-relaxed">
          <section>
            <h2 className="text-base font-bold text-slate-900 mb-2 flex items-center gap-2">
              <Lock className="w-4 h-4 text-slate-600" />
              1. Genel İlke ve Amaç
            </h2>
            <p>
              KPSS Merkezi Yerleştirme ve Nitelik Kodu Portalı (&quot;Portal&quot;), kamu görevlerine ilk defa atanacak adayların ÖSYM merkezi yerleştirme verilerine hızlı, şeffaf ve güvenli bir şekilde erişmesini amaçlamaktadır. Kullanıcılarımızın mahremiyetine ve kişisel verilerinin korunmasına azami özen gösterilmektedir.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-slate-900 mb-2 flex items-center gap-2">
              <Database className="w-4 h-4 text-slate-600" />
              2. İşlenen Veriler ve Toplama Yöntemi
            </h2>
            <p>
              Portalımız, ziyaretçilerinden kimlik (T.C. Kimlik No, Ad-Soyad vb.), iletişim veya diğer özel nitelikli kişisel verileri <strong>kesinlikle talep etmez, kaydetmez ve veritabanında depolamaz</strong>.
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1 text-slate-600">
              <li>
                <strong>Yerel Tercihler (Local Storage):</strong> Sayfa filtresi tercihleri (örneğin son seçilen öğrenim düzeyi) yalnızca kullanıcının kendi tarayıcısında (client-side) saklanır.
              </li>
              <li>
                <strong>Anonim Teknik Veriler:</strong> Sayfa yükleme hızı, hata kayıtları ve genel ziyaretçi hacmini anlamak adına IP adresleri maskelenmiş, anonimleştirilmiş teknik oturum verileri kullanılır.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-slate-900 mb-2 flex items-center gap-2">
              <Eye className="w-4 h-4 text-slate-600" />
              3. Çerez (Cookie) Kullanımı
            </h2>
            <p>
              Portalımızda yalnızca sistemin çalışması için zorunlu olan teknik çerezler ile kullanıcı deneyimini optimize etmeye yarayan anonim performans çerezleri kullanılır. Reklam hedeflemesi veya üçüncü taraf veri ticareti amaçlı çerezler kullanılmamaktadır. Çerez tercihlerinizi sitemizin altındaki onay bantından veya tarayıcı ayarlarınızdan dilediğiniz an değiştirebilirsiniz.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-slate-900 mb-2">
              4. 6698 Sayılı KVKK Kapsamındaki Haklarınız
            </h2>
            <p>
              KVKK&apos;nın 11. maddesi uyarınca veri sahipleri; kişisel verilerinin işlenip işlenmediğini öğrenme, işlenmişse buna ilişkin bilgi talep etme ve amaca uygun kullanılıp kullanılmadığını sorgulama hakkına sahiptir. Portalımızda kişiselleştirilmiş kimlik verisi tutulmadığından, veri tabanımızda şahsınıza ait bir profil bulunmamaktadır.
            </p>
          </section>
        </div>

        {/* Footer Note */}
        <div className="mt-8 pt-6 border-t border-slate-200 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>KPSS Atama ve Nitelik Kodu Portalı — Açık Kamu Verisi İnceleme Platformu</span>
          <Link href="/kullanim-kosullari" className="text-red-700 font-semibold hover:underline">
            Kullanım Koşullarını İnceleyin →
          </Link>
        </div>
      </div>
    </div>
  );
}
