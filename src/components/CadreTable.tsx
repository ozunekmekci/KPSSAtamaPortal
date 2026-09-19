'use client';

import React from 'react';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Info,
} from 'lucide-react';
import { PlacementRecord } from '@/types/kpss';
import { FilterSortOption } from '@/lib/filter-engine';

export interface CadreTableProps {
  records: PlacementRecord[];
  allFilteredRecordsCount: number;
  totalQuota: number;
  totalPlaced: number;
  totalVacant: number;
  avgMinScore: string | null;
  currentPage: number;
  pageSize: number;
  sortBy?: FilterSortOption;
  onSortChange: (sortOption: FilterSortOption) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onSelectCadre: (record: PlacementRecord) => void;
  onSelectCode: (code: string) => void;
}

export default function CadreTable({
  records,
  allFilteredRecordsCount,
  totalQuota,
  totalPlaced,
  totalVacant,
  avgMinScore,
  currentPage,
  pageSize,
  sortBy,
  onSortChange,
  onPageChange,
  onPageSizeChange,
  onSelectCadre,
  onSelectCode,
}: CadreTableProps) {
  const totalPages = Math.max(1, Math.ceil(allFilteredRecordsCount / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);

  // Sort helper
  const handleSortClick = (field: 'puan' | 'kontenjan' | 'kurum' | 'unvan') => {
    switch (field) {
      case 'puan':
        onSortChange(sortBy === 'tabanPuanAsc' ? 'tabanPuanDesc' : 'tabanPuanAsc');
        break;
      case 'kontenjan':
        onSortChange('kontenjanDesc');
        break;
      case 'kurum':
        onSortChange('kurumAdiAsc');
        break;
      case 'unvan':
        onSortChange('unvanAsc');
        break;
    }
  };

  const getSortIcon = (field: 'puan' | 'kontenjan' | 'kurum' | 'unvan') => {
    if (field === 'puan') {
      if (sortBy === 'tabanPuanAsc') return <ArrowUp className="w-3.5 h-3.5 text-red-700 inline ml-1" />;
      if (sortBy === 'tabanPuanDesc') return <ArrowDown className="w-3.5 h-3.5 text-red-700 inline ml-1" />;
    } else if (field === 'kontenjan' && sortBy === 'kontenjanDesc') {
      return <ArrowDown className="w-3.5 h-3.5 text-red-700 inline ml-1" />;
    } else if (field === 'kurum' && sortBy === 'kurumAdiAsc') {
      return <ArrowUp className="w-3.5 h-3.5 text-red-700 inline ml-1" />;
    } else if (field === 'unvan' && sortBy === 'unvanAsc') {
      return <ArrowUp className="w-3.5 h-3.5 text-red-700 inline ml-1" />;
    }
    return <ArrowUpDown className="w-3 h-3 text-slate-400 inline ml-1 opacity-60" />;
  };

  return (
    <div className="bg-white border border-slate-300 shadow-xs flex flex-col">
      {/* Table Summary Metric Header Strip */}
      <div className="bg-slate-100 border-b border-slate-300 px-4 py-3 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          <div>
            <span className="text-slate-500 font-medium">Eşleşen Kadro:</span>{' '}
            <strong className="text-slate-900 font-mono font-bold tabular-nums text-sm">
              {allFilteredRecordsCount.toLocaleString('tr-TR')}
            </strong>
          </div>
          <div>
            <span className="text-slate-500 font-medium">Toplam Kontenjan:</span>{' '}
            <strong className="text-slate-900 font-mono font-bold tabular-nums text-sm">
              {totalQuota.toLocaleString('tr-TR')}
            </strong>
          </div>
          <div>
            <span className="text-slate-500 font-medium">Yerleşen:</span>{' '}
            <strong className="text-emerald-700 font-mono font-bold tabular-nums text-sm">
              {totalPlaced.toLocaleString('tr-TR')}
            </strong>
          </div>
          {totalVacant > 0 && (
            <div>
              <span className="text-slate-500 font-medium">Boş Kalan:</span>{' '}
              <strong className="text-amber-800 font-mono font-bold tabular-nums text-sm">
                {totalVacant.toLocaleString('tr-TR')}
              </strong>
            </div>
          )}
          {avgMinScore && (
            <div>
              <span className="text-slate-500 font-medium">Ortalama Taban Puan:</span>{' '}
              <strong className="text-red-900 font-mono font-bold tabular-nums text-sm">
                {avgMinScore}
              </strong>
            </div>
          )}
        </div>

        {/* Page Size Selector */}
        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          <label htmlFor="page-size-select" className="text-slate-500">
            Sayfa Başına:
          </label>
          <select
            id="page-size-select"
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-800 outline-none focus:border-red-700"
          >
            <option value={20}>20 Kadro</option>
            <option value={50}>50 Kadro</option>
            <option value={100}>100 Kadro</option>
          </select>
        </div>
      </div>

      {/* Official Dense ÖSYM-Style Table with Sticky Header */}
      <div className="overflow-x-auto max-h-[720px] relative border-b border-slate-300">
        <table className="w-full border-collapse text-left text-xs">
          <thead className="sticky top-0 z-10 bg-slate-200/95 border-b border-slate-300 shadow-2xs backdrop-blur-xs">
            <tr className="text-slate-800 font-bold uppercase tracking-wider text-[11px] h-10">
              <th className="py-2 px-3 border-r border-slate-300 whitespace-nowrap">Kadro Kodu</th>
              <th className="py-2 px-3 border-r border-slate-300 whitespace-nowrap">Dönem</th>
              <th className="py-2 px-3 border-r border-slate-300 whitespace-nowrap">Düzey</th>
              <th className="py-2 px-3 border-r border-slate-300 min-w-[200px]">
                <button
                  type="button"
                  onClick={() => handleSortClick('kurum')}
                  className="flex items-center font-bold uppercase tracking-wider text-slate-800 hover:text-red-800 cursor-pointer"
                >
                  <span>Kurum Adı</span>
                  {getSortIcon('kurum')}
                </button>
              </th>
              <th className="py-2 px-3 border-r border-slate-300 min-w-[160px]">
                <button
                  type="button"
                  onClick={() => handleSortClick('unvan')}
                  className="flex items-center font-bold uppercase tracking-wider text-slate-800 hover:text-red-800 cursor-pointer"
                >
                  <span>Kadro Unvanı</span>
                  {getSortIcon('unvan')}
                </button>
              </th>
              <th className="py-2 px-3 border-r border-slate-300 whitespace-nowrap">İl / İlçe</th>
              <th className="py-2 px-2.5 border-r border-slate-300 text-center whitespace-nowrap">
                <button
                  type="button"
                  onClick={() => handleSortClick('kontenjan')}
                  className="flex items-center justify-center font-bold uppercase tracking-wider text-slate-800 hover:text-red-800 w-full cursor-pointer"
                >
                  <span>Kont.</span>
                  {getSortIcon('kontenjan')}
                </button>
              </th>
              <th className="py-2 px-2.5 border-r border-slate-300 text-center whitespace-nowrap">Yerl.</th>
              <th className="py-2 px-3 border-r border-slate-300 text-right min-w-[110px] whitespace-nowrap">
                <button
                  type="button"
                  onClick={() => handleSortClick('puan')}
                  className="flex items-center justify-end font-bold uppercase tracking-wider text-slate-800 hover:text-red-800 w-full cursor-pointer"
                >
                  <span>Taban Puan</span>
                  {getSortIcon('puan')}
                </button>
              </th>
              <th className="py-2 px-3 border-r border-slate-300 text-right whitespace-nowrap">Tavan Puan</th>
              <th className="py-2 px-3 border-r border-slate-300 min-w-[190px]">Aranan Nitelik Kodları</th>
              <th className="py-2 px-2.5 text-center whitespace-nowrap">Detay</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {records.length === 0 ? (
              <tr>
                <td colSpan={12} className="py-16 text-center text-slate-500">
                  <Info className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  <p className="font-semibold text-slate-700">
                    Seçilen kriterlere uygun kadro bulunamadı.
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Lütfen sol paneldeki filtreleri gevşetip tekrar deneyiniz.
                  </p>
                </td>
              </tr>
            ) : (
              records.map((r, idx) => (
                <tr
                  key={r.id}
                  className={`h-10 hover:bg-amber-50/60 transition-colors ${
                    idx % 2 === 1 ? 'bg-slate-50/50' : 'bg-white'
                  }`}
                >
                  {/* Kadro Kodu */}
                  <td className="py-2 px-3 border-r border-slate-200 font-mono font-bold text-slate-700 tabular-nums whitespace-nowrap">
                    {r.kadroKodu}
                  </td>

                  {/* Dönem */}
                  <td className="py-2 px-3 border-r border-slate-200 font-semibold text-slate-800 font-mono tabular-nums whitespace-nowrap">
                    {r.donem}
                  </td>

                  {/* Düzey Badge */}
                  <td className="py-2 px-3 border-r border-slate-200 whitespace-nowrap">
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 border uppercase ${
                        r.ogrenimDuzeyi === 'lisans'
                          ? 'bg-blue-50 text-blue-900 border-blue-200'
                          : r.ogrenimDuzeyi === 'onlisans'
                          ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                          : 'bg-amber-50 text-amber-900 border-amber-200'
                      }`}
                    >
                      {r.ogrenimDuzeyi}
                    </span>
                  </td>

                  {/* Kurum Adı */}
                  <td className="py-2 px-3 border-r border-slate-200 font-medium text-slate-900">
                    <span className="line-clamp-1" title={r.kurumAdi}>
                      {r.kurumAdi}
                    </span>
                  </td>

                  {/* Kadro Unvanı */}
                  <td className="py-2 px-3 border-r border-slate-200 text-slate-800">
                    <span className="line-clamp-1" title={r.kadroUnvani}>
                      {r.kadroUnvani}
                    </span>
                  </td>

                  {/* İl / İlçe */}
                  <td className="py-2 px-3 border-r border-slate-200 text-slate-700 whitespace-nowrap">
                    <span>{r.sehir}</span>
                    {r.ilce && <span className="text-slate-400 font-normal"> / {r.ilce}</span>}
                  </td>

                  {/* Kontenjan */}
                  <td className="py-2 px-2.5 border-r border-slate-200 text-center font-mono font-bold text-slate-900 tabular-nums">
                    {r.kontenjan}
                  </td>

                  {/* Yerleşen */}
                  <td
                    className={`py-2 px-2.5 border-r border-slate-200 text-center font-mono font-bold tabular-nums ${
                      r.yerlesen === r.kontenjan ? 'text-emerald-700' : 'text-amber-800'
                    }`}
                  >
                    {r.yerlesen}
                  </td>

                  {/* Taban Puan */}
                  <td className="py-2 px-3 border-r border-slate-200 text-right font-mono font-bold text-red-800 tabular-nums whitespace-nowrap">
                    {r.tabanPuan !== null ? (
                      r.tabanPuan.toFixed(5)
                    ) : (
                      <span className="text-amber-700 font-normal italic text-[11px]">Dolmadı</span>
                    )}
                  </td>

                  {/* Tavan Puan */}
                  <td className="py-2 px-3 border-r border-slate-200 text-right font-mono text-slate-600 tabular-nums whitespace-nowrap">
                    {r.tavanPuan !== null ? r.tavanPuan.toFixed(5) : '-'}
                  </td>

                  {/* Nitelik Kodları Badges */}
                  <td className="py-1.5 px-3 border-r border-slate-200">
                    <div className="flex flex-wrap gap-1">
                      {r.nitelikKodlari.map((kod) => (
                        <button
                          key={kod}
                          type="button"
                          onClick={() => onSelectCode(kod)}
                          title={`${kod} nitelik kodu açıklamasını görüntüle`}
                          className="font-mono text-[11px] px-1.5 py-0.5 border border-slate-300 bg-slate-50 hover:bg-red-700 hover:text-white hover:border-red-700 text-slate-800 transition-colors tabular-nums cursor-pointer font-semibold"
                        >
                          {kod}
                        </button>
                      ))}
                    </div>
                  </td>

                  {/* İncele Butonu */}
                  <td className="py-2 px-2.5 text-center whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => onSelectCadre(r)}
                      title="Kadro detayını ve resmi şartları incele"
                      className="p-1 border border-slate-200 hover:border-slate-400 bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-slate-600">
        <div>
          Toplam <strong className="text-slate-900 font-mono font-bold tabular-nums">{allFilteredRecordsCount}</strong> kadrodan{' '}
          <strong className="text-slate-900 font-mono font-bold tabular-nums">
            {allFilteredRecordsCount > 0 ? (safePage - 1) * pageSize + 1 : 0}
          </strong>{' '}
          -{' '}
          <strong className="text-slate-900 font-mono font-bold tabular-nums">
            {Math.min(safePage * pageSize, allFilteredRecordsCount)}
          </strong>{' '}
          arası listeleniyor.
        </div>

        {/* Page Buttons */}
        <div className="flex items-center gap-1 self-center sm:self-auto">
          <button
            type="button"
            disabled={safePage <= 1}
            onClick={() => onPageChange(safePage - 1)}
            className="px-2.5 py-1 border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-semibold text-slate-800 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Önceki</span>
          </button>

          <span className="px-3 py-1 border border-slate-300 bg-slate-100 font-mono font-bold text-slate-900 tabular-nums">
            {safePage} / {totalPages}
          </span>

          <button
            type="button"
            disabled={safePage >= totalPages}
            onClick={() => onPageChange(safePage + 1)}
            className="px-2.5 py-1 border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-semibold text-slate-800 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>Sonraki</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
