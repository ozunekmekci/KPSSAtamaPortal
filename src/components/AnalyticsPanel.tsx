'use client';

import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  PieChart,
  Award,
  BarChart2,
  Users,
  Building2,
  ArrowDownRight,
  ArrowUpRight,
  Info,
} from 'lucide-react';
import { PlacementRecord } from '@/types/kpss';
import {
  computeAnalytics,
  ComprehensiveAnalytics,
  PeriodTrendStats,
} from '@/lib/analytics-engine';

export interface AnalyticsPanelProps {
  records: PlacementRecord[];
  onSelectCadre?: (cadre: PlacementRecord) => void;
}

export default function AnalyticsPanel({ records, onSelectCadre }: AnalyticsPanelProps) {
  const [activeSubTab, setActiveSubTab] = useState<'trends' | 'quota' | 'extremes' | 'histogram'>('trends');

  // Compute analytics from current dataset using analytics-engine
  const analytics: ComprehensiveAnalytics = useMemo(() => {
    return computeAnalytics(records);
  }, [records]);

  const { periodTrends, extremes, quotaAnalysis, scoreDistribution } = analytics;

  return (
    <div className="bg-white border border-slate-300 shadow-xs mb-6">
      {/* Analytics Panel Header */}
      <div className="border-b border-slate-200 bg-slate-50/90 px-5 py-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-red-700" />
            <h2 className="text-sm font-bold text-slate-900 tracking-tight uppercase">
              Merkezi Yerleştirme İstatistik ve Analiz Paneli
            </h2>
            <span className="font-mono text-xs text-slate-500 font-semibold tabular-nums">
              ({records.length} Kadro Analiz Edildi)
            </span>
          </div>

          {/* Sub-tab Navigation */}
          <div className="inline-flex rounded-none border border-slate-300 bg-white p-0.5 text-xs font-semibold overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveSubTab('trends')}
              className={`px-3 py-1.5 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                activeSubTab === 'trends'
                  ? 'bg-red-700 text-white font-bold'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Dönem Puan Trendleri</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('quota')}
              className={`px-3 py-1.5 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                activeSubTab === 'quota'
                  ? 'bg-red-700 text-white font-bold'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <PieChart className="w-3.5 h-3.5" />
              <span>Kontenjan Dağılımı</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('extremes')}
              className={`px-3 py-1.5 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                activeSubTab === 'extremes'
                  ? 'bg-red-700 text-white font-bold'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Uç Değerler (Min / Max)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('histogram')}
              className={`px-3 py-1.5 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                activeSubTab === 'histogram'
                  ? 'bg-red-700 text-white font-bold'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>Puan Histogramı</span>
            </button>
          </div>
        </div>
      </div>

      <div className="p-5">
        {records.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            <Info className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            İstatistik üretmek için en az bir atama kaydı gereklidir. Lütfen filtreleri genişletiniz.
          </div>
        ) : (
          <>
            {/* SUB-TAB 1: DÖNEM PUAN TRENDLERİ */}
            {activeSubTab === 'trends' && (
              <div className="space-y-6">
                <div className="border-l-3 border-red-700 pl-3">
                  <h3 className="text-xs font-bold text-slate-900 uppercase">
                    Dönemler Arası Taban Puan Değişim Seyri (2024 - 2026)
                  </h3>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    KPSS yerleştirme dönemlerine göre oluşan asgari, ortalama ve azami kapanış puanları.
                  </p>
                </div>

                {/* SVG Line / Bar Trend Chart */}
                <div className="border border-slate-200 bg-slate-50/50 p-4">
                  <div className="h-64 w-full flex items-end justify-between gap-4 pt-8 pb-4 px-6 relative">
                    {/* SVG Chart */}
                    <svg className="absolute inset-0 w-full h-full p-4" preserveAspectRatio="none">
                      {/* Grid Lines */}
                      <line x1="5%" y1="20%" x2="95%" y2="20%" stroke="#e2e8f0" strokeDasharray="3 3" />
                      <line x1="5%" y1="50%" x2="95%" y2="50%" stroke="#e2e8f0" strokeDasharray="3 3" />
                      <line x1="5%" y1="80%" x2="95%" y2="80%" stroke="#e2e8f0" strokeDasharray="3 3" />
                    </svg>

                    {/* Bars and Markers */}
                    {periodTrends.map((trend) => {
                      const avg = trend.avgScore || 0;
                      // Normalize score 50-100 to height percentage 0-100%
                      const heightPercent = Math.max(10, Math.min(100, (avg - 50) * 2));
                      return (
                        <div
                          key={trend.period}
                          className="flex-1 flex flex-col items-center justify-end h-full z-1 max-w-[120px]"
                        >
                          {/* Score Label on top */}
                          <div className="font-mono text-xs font-bold text-slate-900 mb-1 tabular-nums">
                            {trend.avgScore !== null ? trend.avgScore.toFixed(2) : '-'}
                          </div>

                          {/* Bar Container */}
                          <div className="w-full bg-slate-200/80 rounded-none h-44 flex items-end">
                            <div
                              style={{ height: `${heightPercent}%` }}
                              className="w-full bg-red-700 hover:bg-red-800 transition-all relative group flex items-center justify-center"
                            >
                              <span className="text-[10px] text-white font-mono font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                                %{Math.round(trend.placedRatio * 100)}
                              </span>
                            </div>
                          </div>

                          {/* Period Title */}
                          <div className="font-mono text-xs font-bold text-slate-800 mt-2 tabular-nums">
                            KPSS {trend.period}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono tabular-nums">
                            {trend.recordCount} Kadro
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Chart Legend */}
                  <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-center gap-6 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 bg-red-700 inline-block" />
                      <span>Ortalama Taban Puan</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 bg-slate-200 inline-block" />
                      <span>Toplam Puan Ölçeği (50 - 100)</span>
                    </div>
                  </div>
                </div>

                {/* Period Trend Numerical Table */}
                <div className="overflow-x-auto border border-slate-300">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-300 font-bold uppercase text-slate-800 text-[11px]">
                        <th className="py-2 px-3 border-r border-slate-300">Dönem</th>
                        <th className="py-2 px-3 border-r border-slate-300 text-center">Kadro</th>
                        <th className="py-2 px-3 border-r border-slate-300 text-center">Kontenjan</th>
                        <th className="py-2 px-3 border-r border-slate-300 text-center">Yerleşen</th>
                        <th className="py-2 px-3 border-r border-slate-300 text-center">Boş Kalan</th>
                        <th className="py-2 px-3 border-r border-slate-300 text-right">En Düşük</th>
                        <th className="py-2 px-3 border-r border-slate-300 text-right">Ortalama</th>
                        <th className="py-2 px-3 text-right">En Yüksek</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-mono">
                      {periodTrends.map((t) => (
                        <tr key={t.period} className="hover:bg-slate-50 tabular-nums">
                          <td className="py-2 px-3 border-r border-slate-200 font-bold text-slate-900">
                            KPSS {t.period}
                          </td>
                          <td className="py-2 px-3 border-r border-slate-200 text-center text-slate-700">
                            {t.recordCount}
                          </td>
                          <td className="py-2 px-3 border-r border-slate-200 text-center font-bold text-slate-900">
                            {t.totalQuota}
                          </td>
                          <td className="py-2 px-3 border-r border-slate-200 text-center text-emerald-800 font-semibold">
                            {t.totalPlaced}
                          </td>
                          <td className="py-2 px-3 border-r border-slate-200 text-center text-amber-800 font-semibold">
                            {t.totalVacant}
                          </td>
                          <td className="py-2 px-3 border-r border-slate-200 text-right text-red-800 font-bold">
                            {t.minScore !== null ? t.minScore.toFixed(5) : '-'}
                          </td>
                          <td className="py-2 px-3 border-r border-slate-200 text-right text-slate-900 font-bold">
                            {t.avgScore !== null ? t.avgScore.toFixed(2) : '-'}
                          </td>
                          <td className="py-2 px-3 text-right text-slate-700">
                            {t.maxScore !== null ? t.maxScore.toFixed(5) : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* SUB-TAB 2: KONTENJAN VE DOLULUK ANALİZİ */}
            {activeSubTab === 'quota' && (
              <div className="space-y-6">
                <div className="border-l-3 border-red-700 pl-3">
                  <h3 className="text-xs font-bold text-slate-900 uppercase">
                    Öğrenim Düzeylerine Göre Kontenjan ve Doluluk Analizi
                  </h3>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Lisans, Ön Lisans ve Ortaöğretim kadro kontenjanları ve yerleşme yüzdeleri.
                  </p>
                </div>

                {/* Level Comparison Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {(['lisans', 'onlisans', 'ortaogretim'] as const).map((lvl) => {
                    const stats = quotaAnalysis.byEducationLevel[lvl];
                    if (!stats) return null;
                    return (
                      <div key={lvl} className="border border-slate-300 p-4 bg-white shadow-2xs">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-3">
                          <span className="font-bold text-slate-900 uppercase text-xs">
                            {stats.label}
                          </span>
                          <span className="font-mono text-xs font-bold text-slate-600 tabular-nums">
                            %{stats.percentage}
                          </span>
                        </div>

                        <div className="space-y-2 font-mono text-xs">
                          <div className="flex justify-between">
                            <span className="text-slate-500 font-sans">Açılan Kontenjan:</span>
                            <span className="font-bold text-slate-900 tabular-nums">{stats.totalQuota}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500 font-sans">Yerleşen:</span>
                            <span className="font-bold text-emerald-800 tabular-nums">{stats.totalPlaced}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500 font-sans">Boş Kalan:</span>
                            <span className="font-bold text-amber-800 tabular-nums">{stats.totalVacant}</span>
                          </div>
                        </div>

                        {/* Visual Quota Fill Bar */}
                        <div className="mt-3 pt-2 border-t border-slate-100">
                          <div className="w-full bg-slate-200 h-2">
                            <div
                              style={{ width: `${Math.round(stats.placedRatio * 100)}%` }}
                              className="bg-emerald-700 h-2"
                            />
                          </div>
                          <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-sans">
                            <span>Doluluk</span>
                            <span className="font-mono tabular-nums">%{Math.round(stats.placedRatio * 100)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Top 5 Institutions by Quota */}
                <div>
                  <h4 className="font-bold text-slate-900 uppercase text-[11px] mb-2">
                    En Yüksek Kontenjan Açan İlk 5 Kamu Kurumu:
                  </h4>
                  <div className="overflow-x-auto border border-slate-300">
                    <table className="w-full border-collapse text-left text-xs">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-300 font-bold uppercase text-slate-800 text-[11px]">
                          <th className="py-2 px-3 border-r border-slate-300">Kurum Adı</th>
                          <th className="py-2 px-3 border-r border-slate-300 text-center">Kadro Sayısı</th>
                          <th className="py-2 px-3 border-r border-slate-300 text-center">Kontenjan</th>
                          <th className="py-2 px-3 border-r border-slate-300 text-center">Yerleşen</th>
                          <th className="py-2 px-3 text-right">Ortalama Taban</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 font-mono">
                        {quotaAnalysis.topInstitutions.slice(0, 5).map((inst) => (
                          <tr key={inst.kurumAdi} className="hover:bg-slate-50 tabular-nums">
                            <td className="py-2 px-3 border-r border-slate-200 font-sans font-medium text-slate-900">
                              {inst.kurumAdi}
                            </td>
                            <td className="py-2 px-3 border-r border-slate-200 text-center text-slate-700">
                              {inst.cadreCount}
                            </td>
                            <td className="py-2 px-3 border-r border-slate-200 text-center font-bold text-slate-900">
                              {inst.kontenjan}
                            </td>
                            <td className="py-2 px-3 border-r border-slate-200 text-center text-emerald-800 font-semibold">
                              {inst.yerlesen}
                            </td>
                            <td className="py-2 px-3 text-right text-red-900 font-bold">
                              {inst.avgTabanPuan !== null ? inst.avgTabanPuan.toFixed(2) : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* SUB-TAB 3: UÇ DEĞERLER (EN DÜŞÜK VE EN YÜKSEK KAPATAN KADROLAR) */}
            {activeSubTab === 'extremes' && (
              <div className="space-y-6">
                <div className="border-l-3 border-red-700 pl-3">
                  <h3 className="text-xs font-bold text-slate-900 uppercase">
                    En Düşük ve En Yüksek Taban Puanla Kapatan Kadrolar (Uç Değerler)
                  </h3>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Bu filtreleme kriterinde en taban ve en tavan puanla merkezi ataması yapılan ilk 5 pozisyon.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {/* Top 5 Lowest Closing Positions */}
                  <div className="border border-slate-300 bg-white">
                    <div className="bg-emerald-50 px-3.5 py-2.5 border-b border-emerald-200 flex items-center justify-between">
                      <span className="font-bold text-xs uppercase text-emerald-950 flex items-center gap-1.5">
                        <ArrowDownRight className="w-4 h-4 text-emerald-700" />
                        En Düşük Puanla Kapatan 5 Kadro
                      </span>
                      <span className="text-[10px] text-emerald-800 font-bold">Asgari Kapanış</span>
                    </div>

                    <div className="divide-y divide-slate-200 text-xs">
                      {extremes.lowestClosingPositions.slice(0, 5).map((cadre) => (
                        <div
                          key={cadre.id}
                          className="p-3 hover:bg-slate-50 transition-colors flex items-center justify-between"
                        >
                          <div className="pr-3">
                            <div className="font-semibold text-slate-900 line-clamp-1">
                              {cadre.kurumAdi}
                            </div>
                            <div className="text-slate-600 text-[11px] mt-0.5">
                              {cadre.kadroUnvani} • <span className="text-slate-500">{cadre.sehir}</span>
                            </div>
                            <div className="text-[10px] font-mono text-slate-500 mt-1">
                              Kadro Kodu: {cadre.kadroKodu} • Kontenjan: {cadre.kontenjan}
                            </div>
                          </div>

                          <div className="text-right flex-shrink-0">
                            <span className="font-mono text-base font-black text-emerald-800 tabular-nums">
                              {cadre.tabanPuan !== null ? cadre.tabanPuan.toFixed(5) : '-'}
                            </span>
                            <span className="text-[10px] block font-mono text-slate-500">
                              KPSS {cadre.donem}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Top 5 Highest Closing Positions */}
                  <div className="border border-slate-300 bg-white">
                    <div className="bg-red-50 px-3.5 py-2.5 border-b border-red-200 flex items-center justify-between">
                      <span className="font-bold text-xs uppercase text-red-950 flex items-center gap-1.5">
                        <ArrowUpRight className="w-4 h-4 text-red-700" />
                        En Yüksek Puanla Kapatan 5 Kadro
                      </span>
                      <span className="text-[10px] text-red-800 font-bold">Azami Kapanış</span>
                    </div>

                    <div className="divide-y divide-slate-200 text-xs">
                      {extremes.highestClosingPositions.slice(0, 5).map((cadre) => (
                        <div
                          key={cadre.id}
                          className="p-3 hover:bg-slate-50 transition-colors flex items-center justify-between"
                        >
                          <div className="pr-3">
                            <div className="font-semibold text-slate-900 line-clamp-1">
                              {cadre.kurumAdi}
                            </div>
                            <div className="text-slate-600 text-[11px] mt-0.5">
                              {cadre.kadroUnvani} • <span className="text-slate-500">{cadre.sehir}</span>
                            </div>
                            <div className="text-[10px] font-mono text-slate-500 mt-1">
                              Kadro Kodu: {cadre.kadroKodu} • Kontenjan: {cadre.kontenjan}
                            </div>
                          </div>

                          <div className="text-right flex-shrink-0">
                            <span className="font-mono text-base font-black text-red-800 tabular-nums">
                              {cadre.tabanPuan !== null ? cadre.tabanPuan.toFixed(5) : '-'}
                            </span>
                            <span className="text-[10px] block font-mono text-slate-500">
                              KPSS {cadre.donem}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SUB-TAB 4: TABAN PUAN DAĞILIM HİSTOGRAMI */}
            {activeSubTab === 'histogram' && (
              <div className="space-y-6">
                <div className="border-l-3 border-red-700 pl-3">
                  <h3 className="text-xs font-bold text-slate-900 uppercase">
                    Taban Puan Frekans Dağılım Histogramı (8 Aralık)
                  </h3>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Kapanış puanlarının 50 ile 100 puan arasındaki 8 ana aralığa göre dağılımı.
                  </p>
                </div>

                {/* SVG Histogram Visual */}
                <div className="border border-slate-200 bg-slate-50/50 p-4">
                  <div className="h-56 w-full flex items-end justify-between gap-2 sm:gap-3 pt-6 pb-2 px-2 relative">
                    {scoreDistribution.bins.map((bin) => {
                      const maxBinCount = Math.max(
                        ...scoreDistribution.bins.map((b) => b.count),
                        1
                      );
                      const heightPercent = Math.max(
                        bin.count > 0 ? 8 : 2,
                        (bin.count / maxBinCount) * 100
                      );

                      return (
                        <div
                          key={bin.bin}
                          className="flex-1 flex flex-col items-center justify-end h-full"
                        >
                          <span className="font-mono text-[10px] font-bold text-slate-800 mb-1 tabular-nums">
                            {bin.count}
                          </span>

                          <div className="w-full bg-slate-200 h-36 flex items-end">
                            <div
                              style={{ height: `${heightPercent}%` }}
                              className={`w-full transition-all ${
                                bin.count > 0 ? 'bg-red-700' : 'bg-slate-300'
                              }`}
                              title={`${bin.bin} aralığı: ${bin.count} kadro, ${bin.quota} kontenjan`}
                            />
                          </div>

                          <span className="font-mono text-[10px] text-slate-700 font-semibold mt-1.5 whitespace-nowrap">
                            {bin.bin}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Histogram Data Table */}
                <div className="overflow-x-auto border border-slate-300">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-300 font-bold uppercase text-slate-800 text-[11px]">
                        <th className="py-2 px-3 border-r border-slate-300">Puan Aralığı</th>
                        <th className="py-2 px-3 border-r border-slate-300 text-center">Kadro Sayısı</th>
                        <th className="py-2 px-3 border-r border-slate-300 text-center">Toplam Kontenjan</th>
                        <th className="py-2 px-3 text-right">Oran (%)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-mono">
                      {scoreDistribution.bins.map((b) => (
                        <tr key={b.bin} className="hover:bg-slate-50 tabular-nums">
                          <td className="py-2 px-3 border-r border-slate-200 font-bold text-slate-900">
                            {b.bin} Puan
                          </td>
                          <td className="py-2 px-3 border-r border-slate-200 text-center text-slate-800 font-semibold">
                            {b.count}
                          </td>
                          <td className="py-2 px-3 border-r border-slate-200 text-center text-slate-800">
                            {b.quota}
                          </td>
                          <td className="py-2 px-3 text-right text-slate-700">
                            %{b.percentage}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
