import React from 'react';
import { HelpCircle, BookOpen, Scale, Award, Layers } from 'lucide-react';

export default function SeoFaqSection() {
  const faqs = [
    {
      q: 'KPSS 4001 Nitelik Kodu Nedir ve Hangi Adayları Kapsar?',
      a: '4001 nitelik kodu, ÖSYM KPSS kılavuzlarında "Herhangi bir lisans programından mezun olmak" şartını temsil eder. Üniversitelerin 4 yıllık fakülte ve yüksekokullarından mezun olan tüm adaylar, branş farkı gözetilmeksizin KPSSP3 puan türüyle 4001 kodlu kadroları tercih edebilir.',
      icon: Award,
    },
    {
      q: 'KPSS 3001 ve 2001 Genel Nitelik Kodlarının Anlamı Nedir?',
      a: '3001 kodu herhangi bir ön lisans (2 yıllık MYO) mezuniyetini, 2001 kodu ise herhangi bir ortaöğretim (lise ve dengi okul) mezuniyetini ifade eder. Bu genel kodlar, özel bir branş şartı aranmayan memur, VHKİ, şoför ve hizmetli kadrolarında sıklıkla yer alır.',
      icon: Layers,
    },
    {
      q: 'Mezun Olunan Bölümün KPSS Nitelik Kodu Nasıl Sorgulanır?',
      a: 'Portalımızda yer alan arama tezgahında mezun olduğunuz bölümün adını (örneğin "Bilgisayar Mühendisliği", "Hemşirelik" veya "Maliye") aratarak resmi 4 haneli ÖSYM nitelik kodunuzu, bölümünüze denk kabul edilen eşdeğer branşları ve genel başvuru kodlarınızı tek tıkla listeleyebilirsiniz.',
      icon: BookOpen,
    },
    {
      q: 'Merkezi Atama Taban Puanları Nasıl Hesaplanır ve Karşılaştırılır?',
      a: 'ÖSYM merkezi yerleştirmelerinde kadroya atanan son adayın yerleştirme puanı, o kadronun "Taban Puanı" olarak tescil edilir. Sistemimizde 2024/1, 2024/2 ve 2025/1 dönemlerine ait tüm taban ve tavan puanlar virgülden sonra 5 basamaklı ÖSYM standardıyla karşılaştırmalı olarak sunulur.',
      icon: Scale,
    },
  ];

  return (
    <section
      aria-labelledby="faq-heading"
      className="mt-10 border border-slate-300 bg-white p-5 sm:p-7 shadow-2xs"
    >
      <div className="flex items-center gap-2.5 pb-4 border-b border-slate-200">
        <HelpCircle className="w-5 h-5 text-red-700 flex-shrink-0" />
        <div>
          <h2
            id="faq-heading"
            className="text-base sm:text-lg font-bold text-slate-900 tracking-tight"
          >
            KPSS Merkezi Atamaları ve Nitelik Kodları Hakkında Bilgi Rehberi
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Adayların en çok araştırdığı 4001, 3001, 2001 kodları, eşdeğer bölümler ve puan türleri hakkında resmi açıklamalar.
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {faqs.map((faq, idx) => {
          const Icon = faq.icon;
          return (
            <details
              key={idx}
              className="group border border-slate-200 bg-slate-50/60 open:bg-white open:border-slate-300 transition-colors"
            >
              <summary className="flex items-center justify-between gap-3 p-3.5 cursor-pointer font-semibold text-xs sm:text-sm text-slate-800 select-none group-hover:text-red-800">
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4 text-slate-500 group-open:text-red-700 flex-shrink-0" />
                  <span>{faq.q}</span>
                </div>
                <span className="text-slate-400 group-open:rotate-180 transition-transform text-xs font-bold ml-2">
                  ▼
                </span>
              </summary>
              <div className="px-4 pb-4 pt-1 text-xs sm:text-sm text-slate-700 leading-relaxed border-t border-slate-200/60 bg-white">
                <p>{faq.a}</p>
              </div>
            </details>
          );
        })}
      </div>

      {/* Official Legal & Institutional Disclaimer */}
      <footer className="mt-6 pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[11px] text-slate-500">
        <p>
          Veriler ÖSYM (Ölçme, Seçme ve Yerleştirme Merkezi) ve Resmî Gazete merkezi yerleştirme kılavuzlarından derlenmiştir. Bilgilendirme amaçlıdır.
        </p>
        <p className="sm:text-right font-medium text-slate-600">
          2024–2026 KPSS Merkezi Yerleştirme Dönemleri
        </p>
      </footer>
    </section>
  );
}
