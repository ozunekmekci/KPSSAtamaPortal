import React from 'react';
import Link from 'next/link';
import { FileQuestion, ArrowLeft, Search, BookOpen } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-md w-full bg-white border border-slate-300 shadow-sm p-6 sm:p-8 text-center">
        {/* Crest Icon */}
        <div className="w-16 h-16 rounded-full bg-red-50 border-2 border-red-700 mx-auto flex items-center justify-center text-red-700 mb-4">
          <FileQuestion className="w-8 h-8" />
        </div>

        {/* Status Code & Title */}
        <span className="inline-block px-2.5 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 text-xs font-mono font-bold uppercase tracking-wider mb-2">
          Hata 404 — Sayfa Bulunamadı
        </span>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mb-2">
          Aradığınız Kayıt veya Sayfa Mevcut Değil
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mb-6 leading-relaxed">
          Ulaşmaya çalıştığınız sayfa kaldırılmış, bağlantı adresi değişmiş ya da geçersiz bir parametre girilmiş olabilir.
        </p>

        {/* Primary Action CTA */}
        <div className="space-y-2.5">
          <Link
            href="/"
            className="w-full bg-red-700 hover:bg-red-800 text-white font-bold py-2.5 px-4 text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors shadow-2xs cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Ana Sayfaya ve Arama Tezgahına Dön</span>
          </Link>

          <Link
            href="/#results-section"
            className="w-full bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-semibold py-2 px-4 text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Search className="w-3.5 h-3.5 text-slate-500" />
            <span>Kadro ve Taban Puan Listesini Aç</span>
          </Link>
        </div>

        {/* Quick Reference Links */}
        <div className="mt-6 pt-5 border-t border-slate-200 text-left">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
            Hızlı Bağlantılar:
          </span>
          <div className="flex flex-wrap gap-2 text-xs">
            <Link
              href="/gizlilik-politikasi"
              className="text-slate-600 hover:text-red-700 underline decoration-slate-300"
            >
              Gizlilik Politikası
            </Link>
            <span className="text-slate-300">•</span>
            <Link
              href="/kullanim-kosullari"
              className="text-slate-600 hover:text-red-700 underline decoration-slate-300"
            >
              Kullanım Koşulları
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
