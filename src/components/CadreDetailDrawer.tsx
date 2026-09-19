'use client';

import React, { useEffect } from 'react';
import {
  X,
  Building2,
  MapPin,
  Award,
  Users,
  FileText,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  GraduationCap,
} from 'lucide-react';
import { PlacementRecord } from '@/types/kpss';
import { QUALIFICATIONS_BY_CODE } from '@/data/qualifications';
import { SPECIAL_CONDITIONS_BY_CODE } from '@/data/special-conditions';
import { getCodeToDepartments } from '@/lib/mappings';

export interface CadreDetailDrawerProps {
  cadre: PlacementRecord | null;
  onClose: () => void;
  onFilterByCode?: (code: string) => void;
  onFilterByKurum?: (kurumAdi: string) => void;
}

export default function CadreDetailDrawer({
  cadre,
  onClose,
  onFilterByCode,
  onFilterByKurum,
}: CadreDetailDrawerProps) {
  // ESC key listener to close drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (cadre) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [cadre, onClose]);

  if (!cadre) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-2xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-xl bg-white border-l border-slate-300 shadow-2xl flex flex-col">
          {/* Top Institutional Header */}
          <div className="h-1 bg-red-700 w-full flex-shrink-0" />
          <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-start justify-between flex-shrink-0">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-black text-lg text-red-800 bg-red-50 border border-red-200 px-2.5 py-0.5 tabular-nums">
                  {cadre.kadroKodu}
                </span>
                <span className="font-mono text-xs font-bold text-slate-700 px-2 py-0.5 bg-slate-200 border border-slate-300 tabular-nums">
                  KPSS {cadre.donem}
                </span>
                <span className="uppercase text-[11px] font-bold px-2 py-0.5 bg-white border border-slate-300 text-slate-800">
                  {cadre.ogrenimDuzeyi} ({cadre.puanTuru})
                </span>
              </div>

              <h2 className="text-base font-bold text-slate-900 mt-2 leading-snug">
                {cadre.kurumAdi}
              </h2>
              <div className="text-xs font-semibold text-slate-700 mt-0.5">
                Kadro: {cadre.kadroUnvani}
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 border border-transparent hover:border-slate-300 transition-colors cursor-pointer"
              aria-label="Detay panelini kapat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Body (Scrollable) */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6 text-xs text-slate-800">
            {/* 1. KADRO ATAMA VE YERLEŞTİRME VERİLERİ */}
            <div>
              <h3 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider border-b border-slate-200 pb-1.5 mb-3 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-red-700" />
                Yerleştirme ve Kontenjan Sayısal Verileri
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 border border-slate-200 bg-slate-50">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Kontenjan:</span>
                  <span className="font-mono text-xl font-black text-slate-900 mt-0.5 block tabular-nums">
                    {cadre.kontenjan}
                  </span>
                </div>

                <div className="p-3 border border-slate-200 bg-slate-50">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Yerleşen:</span>
                  <span className="font-mono text-xl font-black text-emerald-800 mt-0.5 block tabular-nums">
                    {cadre.yerlesen}
                  </span>
                </div>

                <div className="p-3 border border-slate-200 bg-slate-50">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Boş Kalan:</span>
                  <span className={`font-mono text-xl font-black mt-0.5 block tabular-nums ${
                    cadre.bosKalan > 0 ? 'text-amber-800' : 'text-slate-400'
                  }`}>
                    {cadre.bosKalan}
                  </span>
                </div>

                <div className="p-3 border border-slate-200 bg-slate-50">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Doluluk Oranı:</span>
                  <span className="font-mono text-xl font-black text-slate-900 mt-0.5 block tabular-nums">
                    {cadre.kontenjan > 0
                      ? `%${Math.round((cadre.yerlesen / cadre.kontenjan) * 100)}`
                      : '%0'}
                  </span>
                </div>
              </div>

              {/* Score Box */}
              <div className="mt-2.5 grid grid-cols-2 gap-2.5">
                <div className="p-3.5 border border-red-200 bg-red-50/50">
                  <span className="text-[11px] font-bold text-red-900 uppercase block">
                    Kapanış Taban Puanı ({cadre.puanTuru})
                  </span>
                  <span className="font-mono text-2xl font-black text-red-800 mt-1 block tabular-nums">
                    {cadre.tabanPuan !== null ? cadre.tabanPuan.toFixed(5) : 'Dolmadı'}
                  </span>
                  <span className="text-[10px] text-slate-600 mt-0.5 block">
                    {cadre.tabanPuan !== null
                      ? 'Bu kadroya yerleşen en son adayın puanı.'
                      : 'Kontenjan dolmadığı için taban puan oluşmamıştır.'}
                  </span>
                </div>

                <div className="p-3.5 border border-slate-200 bg-slate-50">
                  <span className="text-[11px] font-bold text-slate-700 uppercase block">
                    Tavan Puan ({cadre.puanTuru})
                  </span>
                  <span className="font-mono text-2xl font-black text-slate-900 mt-1 block tabular-nums">
                    {cadre.tavanPuan !== null ? cadre.tavanPuan.toFixed(5) : '-'}
                  </span>
                  <span className="text-[10px] text-slate-600 mt-0.5 block">
                    Bu kadroya 1. sırada yerleşen adayın puanı.
                  </span>
                </div>
              </div>
            </div>

            {/* 2. TEŞKİLAT VE GÖREV YERİ DETAYLARI */}
            <div>
              <h3 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider border-b border-slate-200 pb-1.5 mb-3 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-red-700" />
                Kadro ve Teşkilat Özellikleri
              </h3>

              <div className="border border-slate-200 divide-y divide-slate-100 bg-white">
                <div className="p-2.5 flex justify-between">
                  <span className="text-slate-500 font-medium">Görev İli ve Birimi:</span>
                  <span className="font-bold text-slate-900">
                    {cadre.sehir} {cadre.ilce ? `(${cadre.ilce})` : ''}
                  </span>
                </div>
                {cadre.teskilat && (
                  <div className="p-2.5 flex justify-between">
                    <span className="text-slate-500 font-medium">Teşkilat Türü:</span>
                    <span className="font-semibold text-slate-800 uppercase">{cadre.teskilat}</span>
                  </div>
                )}
                {cadre.hizmetSinifi && (
                  <div className="p-2.5 flex justify-between">
                    <span className="text-slate-500 font-medium">Hizmet Sınıfı:</span>
                    <span className="font-semibold text-slate-800 font-mono">{cadre.hizmetSinifi}</span>
                  </div>
                )}
                {cadre.derece && (
                  <div className="p-2.5 flex justify-between">
                    <span className="text-slate-500 font-medium">Kadro Derecesi:</span>
                    <span className="font-semibold text-slate-800 font-mono">{cadre.derece}. Derece</span>
                  </div>
                )}
              </div>
            </div>

            {/* 3. ARANAN NİTELİK KODLARI VE RESMÎ YASAL ŞARTLAR */}
            <div>
              <h3 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider border-b border-slate-200 pb-1.5 mb-3 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-red-700" />
                Aranan ÖSYM Nitelik Kodları ({cadre.nitelikKodlari.length})
              </h3>

              <div className="space-y-3">
                {cadre.nitelikKodlari.map((kod) => {
                  const qual = QUALIFICATIONS_BY_CODE[kod];
                  const spec = SPECIAL_CONDITIONS_BY_CODE[kod];
                  const mapping = getCodeToDepartments(kod);

                  const title = qual?.kisaTanim || spec?.baslik || `Nitelik Kodu: ${kod}`;
                  const desc = qual?.aciklama || spec?.detay || 'Resmî kılavuz tanımı mevcut.';
                  const category = qual?.kategori || spec?.kategori || 'Genel Şart';

                  return (
                    <div key={kod} className="border border-slate-300 p-3.5 bg-white shadow-2xs">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-base font-black text-red-800 bg-red-50 border border-red-200 px-2 py-0.5 tabular-nums">
                            {kod}
                          </span>
                          <span className="font-bold text-slate-900 text-xs">{title}</span>
                        </div>
                        <span className="text-[10px] uppercase font-semibold text-slate-500 px-1.5 py-0.5 bg-slate-100 border border-slate-200">
                          {category}
                        </span>
                      </div>

                      <p className="text-xs text-slate-700 leading-relaxed font-sans">
                        {desc}
                      </p>

                      {mapping && mapping.eligibleDepartments.length > 0 && (
                        <div className="mt-2.5 pt-2 border-t border-slate-100">
                          <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                            Geçerli Mezuniyet Bölümleri ({mapping.eligibleDepartments.length}):
                          </span>
                          <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                            {mapping.eligibleDepartments.map((d, idx) => (
                              <span
                                key={d.id || d.ad || `cadre-dept-${idx}`}
                                className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 text-slate-700 text-[10px]"
                              >
                                {d.ad ?? 'Bölüm'}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {onFilterByCode && (
                        <div className="mt-2.5 pt-2 border-t border-slate-100 flex justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              onFilterByCode(kod);
                              onClose();
                            }}
                            className="text-[11px] font-bold text-red-800 hover:text-red-950 flex items-center gap-1 cursor-pointer"
                          >
                            <span>Bu kod ile açılan tüm kadroları listele</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Drawer Footer Actions */}
          <div className="p-4 border-t border-slate-300 bg-slate-100 flex items-center justify-between gap-2 flex-shrink-0">
            {onFilterByKurum && (
              <button
                type="button"
                onClick={() => {
                  onFilterByKurum(cadre.kurumAdi);
                  onClose();
                }}
                className="px-3 py-1.5 border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-semibold text-xs transition-colors cursor-pointer"
              >
                Bu Kurumun Tüm Kadrolarını Filtrele
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="ml-auto px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer"
            >
              Kapat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
