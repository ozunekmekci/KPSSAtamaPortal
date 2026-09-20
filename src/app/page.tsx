'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { PLACEMENT_RECORDS } from '@/data/records';
import { QUALIFICATIONS_BY_CODE } from '@/data/qualifications';
import { Department, PlacementRecord, EducationLevel } from '@/types/kpss';
import {
  ExtendedFilterCriteria,
  FilterSortOption,
  filterPlacements,
  getFilterFacets,
  filterCriteriaToSearchParams,
  searchParamsToFilterCriteria,
} from '@/lib/filter-engine';

import Header from '@/components/Header';
import SearchWorkbench from '@/components/SearchWorkbench';
import FilterSidebar from '@/components/FilterSidebar';
import CadreTable from '@/components/CadreTable';
import CadreDetailDrawer from '@/components/CadreDetailDrawer';
import AnalyticsPanel from '@/components/AnalyticsPanel';
import SeoFaqSection from '@/components/SeoFaqSection';

export default function HomePage() {
  // Global View State: Table vs Analytics
  const [activeView, setActiveView] = useState<'table' | 'analytics'>('table');

  // Slide-over Drawer State
  const [selectedCadre, setSelectedCadre] = useState<PlacementRecord | null>(null);

  // Multi-variable Filter Criteria with lazy initialization from URL search params
  const [criteria, setCriteria] = useState<ExtendedFilterCriteria>(() => {
    const defaultCriteria: ExtendedFilterCriteria = {
      page: 1,
      pageSize: 20,
      sortBy: 'tabanPuanAsc',
    };
    if (typeof window !== 'undefined' && window.location.search) {
      const parsed = searchParamsToFilterCriteria(window.location.search);
      return {
        ...defaultCriteria,
        ...parsed,
        page: parsed.page || 1,
        pageSize: parsed.pageSize || 20,
        sortBy: parsed.sortBy || 'tabanPuanAsc',
      };
    }
    return defaultCriteria;
  });

  // Listen to popstate event for browser back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      if (typeof window !== 'undefined' && window.location.search) {
        const parsed = searchParamsToFilterCriteria(window.location.search);
        setCriteria((prev) => ({
          ...prev,
          ...parsed,
        }));
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Update URL search parameters when criteria changes (without page reload)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = filterCriteriaToSearchParams(criteria);
      const newQuery = params.toString();
      const currentQuery = window.location.search.startsWith('?')
        ? window.location.search.slice(1)
        : window.location.search;
      if (newQuery !== currentQuery) {
        const newUrl = newQuery ? `${window.location.pathname}?${newQuery}` : window.location.pathname;
        window.history.replaceState(null, '', newUrl);
      }
    }
  }, [criteria]);

  // Compute Facets across all placement records
  const facets = useMemo(() => {
    return getFilterFacets(PLACEMENT_RECORDS);
  }, []);

  // Filter and Sort Placements (all matching records without pagination slice)
  const allFilteredRecords = useMemo(() => {
    // Exclude pagination to calculate totals
    const criteriaWithoutPagination: ExtendedFilterCriteria = {
      ...criteria,
      page: undefined,
      pageSize: undefined,
    };
    return filterPlacements(PLACEMENT_RECORDS, criteriaWithoutPagination);
  }, [criteria]);

  // Paginated records for current page display
  const pageSize = criteria.pageSize || 20;
  const totalPages = Math.max(1, Math.ceil(allFilteredRecords.length / pageSize));
  const currentPage = Math.min(Math.max(1, criteria.page || 1), totalPages);
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return allFilteredRecords.slice(start, start + pageSize);
  }, [allFilteredRecords, currentPage, pageSize]);

  // Statistical Metrics for Summary Bar
  const totalQuota = useMemo(() => {
    return allFilteredRecords.reduce((acc, r) => acc + (r.kontenjan || 0), 0);
  }, [allFilteredRecords]);

  const totalPlaced = useMemo(() => {
    return allFilteredRecords.reduce((acc, r) => acc + (r.yerlesen || 0), 0);
  }, [allFilteredRecords]);

  const totalVacant = useMemo(() => {
    return allFilteredRecords.reduce((acc, r) => acc + (r.bosKalan || 0), 0);
  }, [allFilteredRecords]);

  const avgMinScore = useMemo(() => {
    const validScores = allFilteredRecords
      .filter((r) => r.tabanPuan !== null && !isNaN(r.tabanPuan))
      .map((r) => r.tabanPuan as number);
    if (validScores.length === 0) return null;
    const sum = validScores.reduce((a, b) => a + b, 0);
    return (sum / validScores.length).toFixed(4);
  }, [allFilteredRecords]);

  // Handler: Reset Filters
  const handleResetFilters = useCallback(() => {
    setCriteria({
      page: 1,
      pageSize: 20,
      sortBy: 'tabanPuanAsc',
    });
  }, []);

  // Handler: One-click "Bu Bölümün Atamalarını Listele" from SearchWorkbench
  const handleSelectDepartmentPlacements = useCallback((dept: Department) => {
    setCriteria((prev) => ({
      ...prev,
      ogrenimDuzeyi: dept.ogrenimDuzeyi,
      nitelikKodlari: [dept.nitelikKodu],
      page: 1,
    }));
    setActiveView('table');
    // Scroll smoothly to results table
    const tableEl = document.getElementById('results-section');
    if (tableEl) {
      tableEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  // Handler: One-click "Bu Kod ile Açılan Kadroları Listele" from SearchWorkbench
  const handleSelectCodePlacements = useCallback((code: string) => {
    const qual = QUALIFICATIONS_BY_CODE[code];
    const resolvedLevel =
      qual?.ogrenimDuzeyi === 'lisans' ||
      qual?.ogrenimDuzeyi === 'onlisans' ||
      qual?.ogrenimDuzeyi === 'ortaogretim'
        ? qual.ogrenimDuzeyi
        : undefined;

    setCriteria((prev) => ({
      ...prev,
      ogrenimDuzeyi: resolvedLevel,
      nitelikKodlari: [code],
      page: 1,
    }));
    setActiveView('table');
    const tableEl = document.getElementById('results-section');
    if (tableEl) {
      tableEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  // Handler: Sort change
  const handleSortChange = useCallback((newSort: FilterSortOption) => {
    setCriteria((prev) => ({
      ...prev,
      sortBy: newSort,
      page: 1,
    }));
  }, []);

  // Handler: Page change
  const handlePageChange = useCallback((newPage: number) => {
    setCriteria((prev) => ({
      ...prev,
      page: newPage,
    }));
    const tableEl = document.getElementById('results-section');
    if (tableEl) {
      tableEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  // Handler: Page size change
  const handlePageSizeChange = useCallback((newSize: number) => {
    setCriteria((prev) => ({
      ...prev,
      pageSize: newSize,
      page: 1,
    }));
  }, []);

  // Handler: Click code badge from table -> filter by code
  const handleCodeBadgeClick = useCallback((code: string) => {
    setCriteria((prev) => {
      const currentCodes = prev.nitelikKodlari || [];
      if (currentCodes.includes(code)) return prev;
      return {
        ...prev,
        nitelikKodlari: [...currentCodes, code],
        page: 1,
      };
    });
  }, []);

  // Handler: Filter by institution from drawer
  const handleFilterByKurum = useCallback((kurumAdi: string) => {
    setCriteria((prev) => ({
      ...prev,
      kurumlar: [kurumAdi],
      page: 1,
    }));
  }, []);

  // Handler: Filter by score from SearchWorkbench
  const handleFilterByScore = useCallback((score: number, level?: EducationLevel) => {
    setCriteria((prev) => ({
      ...prev,
      ogrenimDuzeyi: level || prev.ogrenimDuzeyi,
      maxPuan: score,
      minPuan: undefined,
      sortBy: 'tabanPuanDesc',
      page: 1,
    }));
    setActiveView('table');
  }, []);

  // Handler: Quick level pill filter
  const handleQuickFilterLevel = useCallback((level?: EducationLevel) => {
    setCriteria((prev) => ({
      ...prev,
      ogrenimDuzeyi: level,
      page: 1,
    }));
    setActiveView('table');
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-red-100 selection:text-red-900 font-sans">
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-6">
        {/* Institutional Official Header */}
        <Header
          totalRecordsCount={PLACEMENT_RECORDS.length}
          filteredRecords={allFilteredRecords}
          activeView={activeView}
          onViewChange={setActiveView}
        />

        {/* Dual-Mode Search Workbench */}
        <SearchWorkbench
          onSelectDepartmentPlacements={handleSelectDepartmentPlacements}
          onSelectCodePlacements={handleSelectCodePlacements}
          onFilterByScore={handleFilterByScore}
          onQuickFilterLevel={handleQuickFilterLevel}
          activeLevel={criteria.ogrenimDuzeyi}
          totalRecordsCount={PLACEMENT_RECORDS.length}
        />

        {/* Analytics View or Results Table View */}
        {activeView === 'analytics' ? (
          <AnalyticsPanel
            records={allFilteredRecords}
            onSelectCadre={setSelectedCadre}
          />
        ) : (
          <div id="results-section" className="space-y-3">
            {/* Active Context & Results Counter Banner */}
            <div className="bg-white border border-slate-300 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-slate-900">
                  {allFilteredRecords.length.toLocaleString('tr-TR')} Kadro Listeleniyor
                </span>
                <span className="text-slate-300">|</span>
                <span className="text-slate-600">
                  {criteria.ogrenimDuzeyi
                    ? `${criteria.ogrenimDuzeyi === 'lisans' ? 'Lisans' : criteria.ogrenimDuzeyi === 'onlisans' ? 'Ön Lisans' : 'Ortaöğretim'} Kadroları`
                    : 'Tüm Öğrenim Düzeyleri (2024/1 & 2024/2)'}
                </span>
                {criteria.nitelikKodlari && criteria.nitelikKodlari.length > 0 && (
                  <span className="px-2 py-0.5 bg-red-50 text-red-800 border border-red-200 font-mono font-bold text-[11px]">
                    Kod: {criteria.nitelikKodlari.join(', ')}
                  </span>
                )}
                {criteria.maxPuan !== undefined && (
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold text-[11px]">
                    Puan: ≤ {criteria.maxPuan}
                  </span>
                )}
              </div>

              {(criteria.ogrenimDuzeyi ||
                (criteria.nitelikKodlari && criteria.nitelikKodlari.length > 0) ||
                (criteria.sehirler && criteria.sehirler.length > 0) ||
                (criteria.kurumlar && criteria.kurumlar.length > 0) ||
                criteria.maxPuan !== undefined ||
                criteria.minPuan !== undefined ||
                criteria.searchQuery) && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-xs font-semibold text-red-700 hover:text-red-900 underline cursor-pointer"
                >
                  Filtreleri Temizle
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* Left Filter Sidebar (3 cols on large screens) */}
              <div className="lg:col-span-4 xl:col-span-3">
                <FilterSidebar
                  criteria={criteria}
                  facets={facets}
                  allRecords={PLACEMENT_RECORDS}
                  onCriteriaChange={setCriteria}
                  onReset={handleResetFilters}
                />
              </div>

              {/* Right Results Table (8/9 cols on large screens) */}
              <div className="lg:col-span-8 xl:col-span-9">
                <CadreTable
                  records={paginatedRecords}
                  allFilteredRecordsCount={allFilteredRecords.length}
                  totalQuota={totalQuota}
                  totalPlaced={totalPlaced}
                  totalVacant={totalVacant}
                  avgMinScore={avgMinScore}
                  currentPage={currentPage}
                  pageSize={pageSize}
                  sortBy={criteria.sortBy}
                  onSortChange={handleSortChange}
                  onPageChange={handlePageChange}
                  onPageSizeChange={handlePageSizeChange}
                  onSelectCadre={setSelectedCadre}
                  onSelectCode={handleCodeBadgeClick}
                />
              </div>
            </div>
          </div>
        )}

        {/* Slide-over Cadre Detail Drawer */}
        <CadreDetailDrawer
          cadre={selectedCadre}
          onClose={() => setSelectedCadre(null)}
          onFilterByCode={handleCodeBadgeClick}
          onFilterByKurum={handleFilterByKurum}
        />

        {/* SEO FAQ & Public Information Guide */}
        <SeoFaqSection />

        {/* Official Institutional Footer */}
        <footer className="mt-12 border-t border-slate-300 pt-6 pb-12 text-xs text-slate-600">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div className="leading-relaxed text-center md:text-left max-w-md">
              <span className="font-semibold text-slate-800 block text-sm">
                T.C. KPSS Merkezi Yerleştirme ve Nitelik Kodu Portalı
              </span>
              <span className="block text-[11px] text-slate-500 mt-1">
                2024–2026 Resmî ÖSYM Tercih ve Yerleştirme Sayısal Kılavuzları referans alınmıştır. Kamu yararına açık bilgi sistemidir.
              </span>
            </div>

            {/* Legal & Reference Navigation */}
            <nav aria-label="Yasal ve Yardım Bağlantıları" className="flex flex-wrap items-center justify-center md:justify-end gap-x-6 gap-y-2 text-xs font-medium">
              <Link
                href="/gizlilik-politikasi"
                className="text-slate-600 hover:text-red-700 hover:underline transition-colors"
              >
                Gizlilik Politikası (KVKK)
              </Link>
              <Link
                href="/kullanim-kosullari"
                className="text-slate-600 hover:text-red-700 hover:underline transition-colors"
              >
                Kullanım Koşulları
              </Link>
              <a
                href="https://www.osym.gov.tr"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-600 hover:text-red-700 hover:underline transition-colors inline-flex items-center gap-1"
              >
                <span>Resmî ÖSYM</span>
                <span className="text-[10px] text-slate-600 font-mono">↗</span>
              </a>
              <a
                href="#results-section"
                className="text-slate-600 hover:text-red-700 hover:underline transition-colors"
              >
                Sonuçlara Dön ↑
              </a>
            </nav>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500 font-mono">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-white border border-slate-200 px-2 py-0.5 text-slate-600">Lisans: KPSSP3</span>
              <span className="bg-white border border-slate-200 px-2 py-0.5 text-slate-600">Ön Lisans: KPSSP93</span>
              <span className="bg-white border border-slate-200 px-2 py-0.5 text-slate-600">Ortaöğretim: KPSSP94</span>
            </div>
            <span>v1.2.0 • Güvenli Kamu Açık Veri Portalı</span>
          </div>
        </footer>
      </main>
    </div>
  );
}
