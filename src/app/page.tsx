'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { PLACEMENT_RECORDS } from '@/data/records';
import { QUALIFICATIONS_BY_CODE } from '@/data/qualifications';
import { Department, PlacementRecord } from '@/types/kpss';
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
        />

        {/* Analytics View or Results Table View */}
        {activeView === 'analytics' ? (
          <AnalyticsPanel
            records={allFilteredRecords}
            onSelectCadre={setSelectedCadre}
          />
        ) : (
          <div id="results-section" className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
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
        )}

        {/* Slide-over Cadre Detail Drawer */}
        <CadreDetailDrawer
          cadre={selectedCadre}
          onClose={() => setSelectedCadre(null)}
          onFilterByCode={handleCodeBadgeClick}
          onFilterByKurum={handleFilterByKurum}
        />

        {/* Official Institutional Footer */}
        <footer className="mt-10 border-t border-slate-300 pt-5 pb-8 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="leading-relaxed text-center sm:text-left">
            <span className="font-semibold text-slate-700">
              T.C. KPSS Merkezi Yerleştirme ve Nitelik Kodu Sorgulama Portalı
            </span>
            <span className="block text-[11px] text-slate-500 mt-0.5">
              2024–2026 Resmî ÖSYM Tercih ve Yerleştirme Sayısal Kılavuzları referans alınmıştır.
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-600 font-mono">
            <span className="bg-white border border-slate-200 px-2 py-0.5">Lisans: KPSSP3</span>
            <span className="bg-white border border-slate-200 px-2 py-0.5">Ön Lisans: KPSSP93</span>
            <span className="bg-white border border-slate-200 px-2 py-0.5">Ortaöğretim: KPSSP94</span>
          </div>
        </footer>
      </main>
    </div>
  );
}
