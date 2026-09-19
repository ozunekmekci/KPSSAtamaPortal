'use client';

import React from 'react';
import { Download, BarChart3, Database, CheckCircle2, Table2 } from 'lucide-react';
import { PlacementRecord } from '@/types/kpss';

export interface HeaderProps {
  totalRecordsCount: number;
  filteredRecords: PlacementRecord[];
  activeView: 'table' | 'analytics';
  onViewChange: (view: 'table' | 'analytics') => void;
}

export function exportToCsv(records: PlacementRecord[]): void {
  if (!records || records.length === 0) {
    alert('Dışa aktarılacak kayıt bulunamadı.');
    return;
  }

  const headers = [
    'Kadro Kodu',
    'Dönem',
    'Öğrenim Düzeyi',
    'Puan Türü',
    'Kurum Adı',
    'Kadro Unvanı',
    'Teşkilat',
    'Hizmet Sınıfı',
    'Derece',
    'İl',
    'İlçe',
    'Kontenjan',
    'Yerleşen',
    'Boş Kalan',
    'Taban Puan',
    'Tavan Puan',
    'Nitelik Kodları',
  ];

  const rows = records.map((r) => [
    `"${r.kadroKodu}"`,
    `"${r.donem}"`,
    `"${r.ogrenimDuzeyi}"`,
    `"${r.puanTuru}"`,
    `"${(r.kurumAdi || '').replace(/"/g, '""')}"`,
    `"${(r.kadroUnvani || '').replace(/"/g, '""')}"`,
    `"${r.teskilat || ''}"`,
    `"${r.hizmetSinifi || ''}"`,
    `"${r.derece || ''}"`,
    `"${r.sehir || ''}"`,
    `"${r.ilce || ''}"`,
    r.kontenjan,
    r.yerlesen,
    r.bosKalan,
    r.tabanPuan !== null ? r.tabanPuan.toFixed(5) : 'Dolmadı',
    r.tavanPuan !== null ? r.tavanPuan.toFixed(5) : '-',
    `"${r.nitelikKodlari.join(', ')}"`,
  ]);

  // UTF-8 BOM for Excel compatibility with Turkish characters
  const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((row) => row.join(';'))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `kpss_atamalari_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function Header({
  totalRecordsCount,
  filteredRecords,
  activeView,
  onViewChange,
}: HeaderProps) {
  const handleExport = () => {
    exportToCsv(filteredRecords);
  };

  return (
    <header className="bg-white border border-slate-300 shadow-xs mb-6">
      {/* Official Republic Accent Stripe */}
      <div className="h-1 bg-red-700 w-full" />

      {/* Main Institutional Header Bar */}
      <div className="px-5 py-4 border-b border-slate-200">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Emblem & Portal Title */}
          <div className="flex items-start gap-3.5">
            {/* Republic Emblem Icon */}
            <div
              className="w-12 h-12 rounded-full border-2 border-red-700 bg-red-50 flex items-center justify-center flex-shrink-0 text-red-800 font-bold text-base shadow-2xs select-none"
              aria-hidden="true"
            >
              <div className="text-center leading-none">
                <span className="text-[10px] font-bold block text-red-700">T.C.</span>
                <span className="text-xs font-black tracking-tighter">KPSS</span>
              </div>
            </div>

            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                KPSS Merkezi Yerleştirme ve Nitelik Kodu Portalı
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-semibold bg-red-50 text-red-900 border border-red-200">
                  Türkiye Cumhuriyeti Kamu Görevlerine İlk Defa Atanacaklar İçin
                </span>
                <span className="text-xs text-slate-600">
                  2024–2026 B Grubu Lisans (KPSSP3), Ön Lisans (KPSSP93) ve Ortaöğretim (KPSSP94) resmi yerleştirme kadroları ve taban puan analitiği.
                </span>
              </div>
            </div>
          </div>

          {/* System Status Chips & Actions */}
          <div className="flex flex-wrap items-center gap-2 pt-2 lg:pt-0">
            {/* Active Cadres Metric Chip */}
            <div className="border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700 font-medium flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-slate-500" />
              <span>Aktif Kadro:</span>
              <strong className="text-slate-900 font-mono tabular-nums font-bold">
                {totalRecordsCount.toLocaleString('tr-TR')}
              </strong>
            </div>

            {/* Periods Covered Chip */}
            <div className="border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700 font-medium">
              <span className="text-slate-500">Dönemler:</span>{' '}
              <strong className="text-slate-900 font-mono tabular-nums">2024/1, 2024/2, 2025/1</strong>
            </div>

            {/* Dev Server Status Chip */}
            <div className="border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs text-emerald-800 font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block animate-pulse" />
              <span>Dev Server:</span>
              <strong className="font-semibold">Çevrimiçi (3000)</strong>
            </div>

            {/* CSV Export Button */}
            <button
              type="button"
              onClick={handleExport}
              className="border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 hover:text-slate-900 px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Aktif filtrelerle eşleşen kayıtları CSV dosyası olarak dışa aktar"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>CSV Olarak İndir</span>
              <span className="font-mono text-slate-500 font-normal">({filteredRecords.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Official Institutional Notice & Navigation Toolbar */}
      <div className="bg-slate-50 px-5 py-2.5 text-xs text-slate-600 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 flex-shrink-0" />
          <span>
            Veriler ÖSYM B Grubu Merkezi Yerleştirme Kılavuzları ve sayısal verileri ile %100 birebir uyumludur.
          </span>
        </div>

        {/* View Toggle Buttons */}
        <div className="flex items-center gap-1 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => onViewChange('table')}
            className={`px-3 py-1 text-xs font-semibold flex items-center gap-1.5 border transition-colors ${
              activeView === 'table'
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
            }`}
          >
            <Table2 className="w-3.5 h-3.5" />
            <span>Kadro Tablosu</span>
          </button>
          <button
            type="button"
            onClick={() => onViewChange('analytics')}
            className={`px-3 py-1 text-xs font-semibold flex items-center gap-1.5 border transition-colors ${
              activeView === 'analytics'
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Analiz & Grafikler</span>
          </button>
        </div>
      </div>
    </header>
  );
}
