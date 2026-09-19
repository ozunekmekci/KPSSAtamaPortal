'use client';

import React, { useState, useMemo, useCallback } from 'react';
import {
  Filter,
  RotateCcw,
  Search,
  X,
  ChevronDown,
  ChevronUp,
  GraduationCap,
  MapPin,
  Building2,
  Briefcase,
  SlidersHorizontal,
  Check,
} from 'lucide-react';
import { EducationLevel, PlacementPeriod, PlacementRecord } from '@/types/kpss';
import { ExtendedFilterCriteria, FilterFacets } from '@/lib/filter-engine';
import { normalizeTrSearch } from '@/lib/turkish';

export interface FilterSidebarProps {
  criteria: ExtendedFilterCriteria;
  facets: FilterFacets;
  allRecords: PlacementRecord[];
  onCriteriaChange: (newCriteria: ExtendedFilterCriteria) => void;
  onReset: () => void;
}

export default function FilterSidebar({
  criteria,
  facets,
  allRecords,
  onCriteriaChange,
  onReset,
}: FilterSidebarProps) {
  // Collapsible section toggles
  const [openSections, setOpenSections] = useState<{
    level: boolean;
    period: boolean;
    location: boolean;
    institution: boolean;
    score: boolean;
    toggles: boolean;
  }>({
    level: true,
    period: true,
    location: true,
    institution: true,
    score: true,
    toggles: true,
  });

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // City search within city dropdown
  const [citySearch, setCitySearch] = useState('');
  const filteredCities = useMemo(() => {
    if (!citySearch.trim()) return facets.cities;
    const qNorm = normalizeTrSearch(citySearch);
    return facets.cities.filter((c) => normalizeTrSearch(c).includes(qNorm));
  }, [facets.cities, citySearch]);

  // Real-time facet counts calculation based on current level
  const periodCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of allRecords) {
      if (!criteria.ogrenimDuzeyi || r.ogrenimDuzeyi === criteria.ogrenimDuzeyi) {
        map.set(r.donem, (map.get(r.donem) || 0) + 1);
      }
    }
    return map;
  }, [allRecords, criteria.ogrenimDuzeyi]);

  const levelCounts = useMemo(() => {
    const map: Record<EducationLevel, number> = { lisans: 0, onlisans: 0, ortaogretim: 0 };
    for (const r of allRecords) {
      if (r.ogrenimDuzeyi in map) {
        map[r.ogrenimDuzeyi] += 1;
      }
    }
    return map;
  }, [allRecords]);

  // Handler helpers wrapped in useCallback
  const handleLevelChange = useCallback((level: EducationLevel | undefined) => {
    onCriteriaChange({
      ...criteria,
      ogrenimDuzeyi: level,
      page: 1,
    });
  }, [criteria, onCriteriaChange]);

  const handlePeriodToggle = useCallback((period: PlacementPeriod) => {
    const current = criteria.donemler || [];
    const next = current.includes(period)
      ? current.filter((p) => p !== period)
      : [...current, period];
    onCriteriaChange({
      ...criteria,
      donemler: next.length > 0 ? next : undefined,
      page: 1,
    });
  }, [criteria, onCriteriaChange]);

  const handleCitySelect = useCallback((city: string) => {
    const current = criteria.sehirler || [];
    const next = current.includes(city)
      ? current.filter((c) => c !== city)
      : [...current, city];
    onCriteriaChange({
      ...criteria,
      sehirler: next.length > 0 ? next : undefined,
      page: 1,
    });
  }, [criteria, onCriteriaChange]);

  const handleMinScoreChange = useCallback((val: string) => {
    const num = val === '' ? undefined : parseFloat(val);
    onCriteriaChange({
      ...criteria,
      minPuan: num !== undefined && !isNaN(num) ? num : undefined,
      page: 1,
    });
  }, [criteria, onCriteriaChange]);

  const handleMaxScoreChange = useCallback((val: string) => {
    const num = val === '' ? undefined : parseFloat(val);
    onCriteriaChange({
      ...criteria,
      maxPuan: num !== undefined && !isNaN(num) ? num : undefined,
      page: 1,
    });
  }, [criteria, onCriteriaChange]);

  const handleSearchQueryChange = useCallback((val: string) => {
    onCriteriaChange({
      ...criteria,
      searchQuery: val.trim() ? val : undefined,
      page: 1,
    });
  }, [criteria, onCriteriaChange]);

  // Active filter chips list for easy removal
  const activeChips = useMemo(() => {
    const chips: Array<{ id: string; label: string; onRemove: () => void }> = [];

    if (criteria.ogrenimDuzeyi) {
      const labels: Record<EducationLevel, string> = {
        lisans: 'Lisans (P3)',
        onlisans: 'Ön Lisans (P93)',
        ortaogretim: 'Ortaöğretim (P94)',
      };
      chips.push({
        id: 'level',
        label: `Düzey: ${labels[criteria.ogrenimDuzeyi] || criteria.ogrenimDuzeyi}`,
        onRemove: () => handleLevelChange(undefined),
      });
    }

    if (criteria.donemler && criteria.donemler.length > 0) {
      for (const d of criteria.donemler) {
        chips.push({
          id: `period-${d}`,
          label: `Dönem: ${d}`,
          onRemove: () => handlePeriodToggle(d),
        });
      }
    }

    if (criteria.sehirler && criteria.sehirler.length > 0) {
      for (const c of criteria.sehirler) {
        chips.push({
          id: `city-${c}`,
          label: `İl: ${c}`,
          onRemove: () => handleCitySelect(c),
        });
      }
    }

    if (criteria.kurumlar && criteria.kurumlar.length > 0) {
      chips.push({
        id: 'kurum',
        label: `Kurum: ${criteria.kurumlar.join(', ')}`,
        onRemove: () => onCriteriaChange({ ...criteria, kurumlar: undefined, page: 1 }),
      });
    }

    if (criteria.unvanlar && criteria.unvanlar.length > 0) {
      chips.push({
        id: 'unvan',
        label: `Unvan: ${criteria.unvanlar.join(', ')}`,
        onRemove: () => onCriteriaChange({ ...criteria, unvanlar: undefined, page: 1 }),
      });
    }

    if (criteria.nitelikKodlari && criteria.nitelikKodlari.length > 0) {
      chips.push({
        id: 'kod',
        label: `Kod: ${criteria.nitelikKodlari.join(', ')}`,
        onRemove: () => onCriteriaChange({ ...criteria, nitelikKodlari: undefined, page: 1 }),
      });
    }

    if (criteria.minPuan !== undefined) {
      chips.push({
        id: 'minPuan',
        label: `Min: ${criteria.minPuan}`,
        onRemove: () => onCriteriaChange({ ...criteria, minPuan: undefined, page: 1 }),
      });
    }

    if (criteria.maxPuan !== undefined) {
      chips.push({
        id: 'maxPuan',
        label: `Max: ${criteria.maxPuan}`,
        onRemove: () => onCriteriaChange({ ...criteria, maxPuan: undefined, page: 1 }),
      });
    }

    if (criteria.sadeceBosKalanlar) {
      chips.push({
        id: 'bosKalan',
        label: 'Sadece Boş Kalanlar',
        onRemove: () => onCriteriaChange({ ...criteria, sadeceBosKalanlar: undefined, page: 1 }),
      });
    }

    if (criteria.includeGeneralCodes) {
      chips.push({
        id: 'genelKod',
        label: 'Genel Kodlar Dahil (4001/3001/2001)',
        onRemove: () => onCriteriaChange({ ...criteria, includeGeneralCodes: undefined, page: 1 }),
      });
    }

    if (criteria.searchQuery) {
      chips.push({
        id: 'search',
        label: `Arama: "${criteria.searchQuery}"`,
        onRemove: () => onCriteriaChange({ ...criteria, searchQuery: undefined, page: 1 }),
      });
    }

    return chips;
  }, [
    criteria,
    handleCitySelect,
    handleLevelChange,
    handlePeriodToggle,
    onCriteriaChange,
  ]);

  return (
    <aside className="bg-white border border-slate-300 shadow-xs flex flex-col">
      {/* Sidebar Header */}
      <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-red-700" />
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Filtreleme Paneli
          </h2>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="text-xs font-semibold text-red-800 hover:text-red-950 flex items-center gap-1 transition-colors cursor-pointer"
          title="Tüm filtreleri sıfırla"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Sıfırla</span>
        </button>
      </div>

      {/* Free Text Filter Input */}
      <div className="p-3.5 border-b border-slate-200 bg-white">
        <label htmlFor="filter-query-input" className="block text-[11px] font-bold text-slate-800 uppercase tracking-wider mb-1">
          Hızlı Kadro Arama:
        </label>
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
          <input
            id="filter-query-input"
            type="text"
            value={criteria.searchQuery || ''}
            onChange={(e) => handleSearchQueryChange(e.target.value)}
            placeholder="Kurum, unvan, il veya kod..."
            className="w-full pl-8 pr-2.5 py-1.5 text-xs border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:border-red-700 focus:ring-1 focus:ring-red-700 outline-none"
          />
          {criteria.searchQuery && (
            <button
              type="button"
              onClick={() => handleSearchQueryChange('')}
              className="absolute right-2 top-2 text-slate-400 hover:text-slate-700"
              aria-label="Aramayı temizle"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Active Filter Chips */}
      {activeChips.length > 0 && (
        <div className="p-3 border-b border-slate-200 bg-slate-50/60">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            Aktif Filtreler ({activeChips.length}):
          </div>
          <div className="flex flex-wrap gap-1">
            {activeChips.map((chip) => (
              <span
                key={chip.id}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-slate-300 text-slate-800 text-[11px] font-medium"
              >
                <span>{chip.label}</span>
                <button
                  type="button"
                  onClick={chip.onRemove}
                  className="text-slate-400 hover:text-red-700 ml-0.5 cursor-pointer"
                  aria-label={`${chip.label} filtresini kaldır`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Filter Sections Accordion */}
      <div className="divide-y divide-slate-200 text-xs">
        {/* SECTION 1: ÖĞRENİM DÜZEYİ */}
        <div className="p-3.5">
          <button
            type="button"
            onClick={() => toggleSection('level')}
            className="w-full flex items-center justify-between font-bold text-slate-900 uppercase tracking-wider text-[11px] cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-slate-600" />
              Öğrenim Düzeyi
            </span>
            {openSections.level ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {openSections.level && (
            <div className="mt-2.5 space-y-1.5">
              <button
                type="button"
                onClick={() => handleLevelChange(undefined)}
                className={`w-full text-left px-2.5 py-1.5 text-xs font-semibold flex items-center justify-between transition-colors border ${
                  criteria.ogrenimDuzeyi === undefined
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span>Tümü (Tüm Düzeyler)</span>
                <span className="font-mono text-[11px] tabular-nums font-normal">
                  {allRecords.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleLevelChange('lisans')}
                className={`w-full text-left px-2.5 py-1.5 text-xs font-semibold flex items-center justify-between transition-colors border ${
                  criteria.ogrenimDuzeyi === 'lisans'
                    ? 'bg-red-700 text-white border-red-700'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span>Lisans (KPSSP3)</span>
                <span className="font-mono text-[11px] tabular-nums font-normal">
                  {levelCounts.lisans}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleLevelChange('onlisans')}
                className={`w-full text-left px-2.5 py-1.5 text-xs font-semibold flex items-center justify-between transition-colors border ${
                  criteria.ogrenimDuzeyi === 'onlisans'
                    ? 'bg-red-700 text-white border-red-700'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span>Ön Lisans (KPSSP93)</span>
                <span className="font-mono text-[11px] tabular-nums font-normal">
                  {levelCounts.onlisans}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleLevelChange('ortaogretim')}
                className={`w-full text-left px-2.5 py-1.5 text-xs font-semibold flex items-center justify-between transition-colors border ${
                  criteria.ogrenimDuzeyi === 'ortaogretim'
                    ? 'bg-red-700 text-white border-red-700'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span>Ortaöğretim (KPSSP94)</span>
                <span className="font-mono text-[11px] tabular-nums font-normal">
                  {levelCounts.ortaogretim}
                </span>
              </button>
            </div>
          )}
        </div>

        {/* SECTION 2: YERLEŞTİRME DÖNEMİ */}
        <div className="p-3.5">
          <button
            type="button"
            onClick={() => toggleSection('period')}
            className="w-full flex items-center justify-between font-bold text-slate-900 uppercase tracking-wider text-[11px] cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-600" />
              Atama Dönemleri
            </span>
            {openSections.period ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {openSections.period && (
            <div className="mt-2.5 space-y-1.5">
              {facets.periods.map((p) => {
                const isChecked = (criteria.donemler || []).includes(p);
                const count = periodCounts.get(p) || 0;
                return (
                  <label
                    key={p}
                    className={`flex items-center justify-between p-2 border cursor-pointer transition-colors ${
                      isChecked
                        ? 'border-red-300 bg-red-50/50 font-bold text-red-950'
                        : 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        aria-label={`KPSS ${p}`}
                        checked={isChecked}
                        onChange={() => handlePeriodToggle(p)}
                        className="rounded-none text-red-700 focus:ring-red-700 h-3.5 w-3.5 border-slate-300"
                      />
                      <span className="font-mono text-xs tabular-nums">KPSS {p}</span>
                    </div>
                    <span className="font-mono text-[11px] text-slate-500 tabular-nums">
                      {count}
                    </span>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {/* SECTION 3: ŞEHİR / İL */}
        <div className="p-3.5">
          <button
            type="button"
            onClick={() => toggleSection('location')}
            className="w-full flex items-center justify-between font-bold text-slate-900 uppercase tracking-wider text-[11px] cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-600" />
              Şehir / İl Seçimi ({criteria.sehirler?.length || 0})
            </span>
            {openSections.location ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {openSections.location && (
            <div className="mt-2.5 space-y-2">
              <div className="relative">
                <input
                  type="text"
                  value={citySearch}
                  onChange={(e) => setCitySearch(e.target.value)}
                  placeholder="İl adına göre ara..."
                  className="w-full px-2 py-1 text-xs border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:border-red-700 outline-none"
                />
              </div>
              <div className="max-h-36 overflow-y-auto divide-y divide-slate-100 border border-slate-200 bg-white">
                {filteredCities.map((city) => {
                  const isSelected = (criteria.sehirler || []).includes(city);
                  return (
                    <div
                      key={city}
                      role="button"
                      tabIndex={0}
                      onClick={() => handleCitySelect(city)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          handleCitySelect(city);
                        }
                      }}
                      className={`px-2.5 py-1.5 text-xs flex items-center justify-between cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-red-50 text-red-950 font-bold border-l-2 border-red-700'
                          : 'hover:bg-slate-50 text-slate-800'
                      }`}
                    >
                      <span>{city}</span>
                      {isSelected && <Check className="w-3 h-3 text-red-700" />}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* SECTION 4: KURUM & UNVAN */}
        <div className="p-3.5">
          <button
            type="button"
            onClick={() => toggleSection('institution')}
            className="w-full flex items-center justify-between font-bold text-slate-900 uppercase tracking-wider text-[11px] cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-600" />
              Kurum ve Unvan
            </span>
            {openSections.institution ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {openSections.institution && (
            <div className="mt-2.5 space-y-2.5">
              <div>
                <label htmlFor="inst-input" className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Kurum Adı:
                </label>
                <input
                  id="inst-input"
                  type="text"
                  value={criteria.kurumlar?.[0] || ''}
                  onChange={(e) => {
                    const val = e.target.value.trim();
                    onCriteriaChange({
                      ...criteria,
                      kurumlar: val ? [val] : undefined,
                      page: 1,
                    });
                  }}
                  placeholder="Örn: Karayolları, DHMİ, DSİ, Bakanlık..."
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 bg-white text-slate-900 focus:border-red-700 outline-none"
                />
              </div>

              <div>
                <label htmlFor="title-input" className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Kadro Unvanı:
                </label>
                <input
                  id="title-input"
                  type="text"
                  value={criteria.unvanlar?.[0] || ''}
                  onChange={(e) => {
                    const val = e.target.value.trim();
                    onCriteriaChange({
                      ...criteria,
                      unvanlar: val ? [val] : undefined,
                      page: 1,
                    });
                  }}
                  placeholder="Örn: Mühendis, Memur, V.H.K.İ., Tekniker..."
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 bg-white text-slate-900 focus:border-red-700 outline-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* SECTION 5: TABAN PUAN ARALIĞI */}
        <div className="p-3.5">
          <button
            type="button"
            onClick={() => toggleSection('score')}
            className="w-full flex items-center justify-between font-bold text-slate-900 uppercase tracking-wider text-[11px] cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-slate-600" />
              Taban Puan Aralığı
            </span>
            {openSections.score ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {openSections.score && (
            <div className="mt-2.5 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label htmlFor="min-score-input" className="block text-[11px] text-slate-600 mb-0.5">
                    Min Puan:
                  </label>
                  <input
                    id="min-score-input"
                    type="number"
                    step="0.01"
                    min="50"
                    max="100"
                    value={criteria.minPuan !== undefined ? criteria.minPuan : ''}
                    onChange={(e) => handleMinScoreChange(e.target.value)}
                    placeholder="50.00"
                    className="w-full px-2 py-1 text-xs border border-slate-300 bg-white text-slate-900 font-mono tabular-nums outline-none focus:border-red-700"
                  />
                </div>
                <div>
                  <label htmlFor="max-score-input" className="block text-[11px] text-slate-600 mb-0.5">
                    Max Puan:
                  </label>
                  <input
                    id="max-score-input"
                    type="number"
                    step="0.01"
                    min="50"
                    max="100"
                    value={criteria.maxPuan !== undefined ? criteria.maxPuan : ''}
                    onChange={(e) => handleMaxScoreChange(e.target.value)}
                    placeholder="100.00"
                    className="w-full px-2 py-1 text-xs border border-slate-300 bg-white text-slate-900 font-mono tabular-nums outline-none focus:border-red-700"
                  />
                </div>
              </div>

              {/* Slider for quick visual adjustments */}
              <div className="pt-1">
                <input
                  type="range"
                  min="50"
                  max="100"
                  step="1"
                  value={criteria.minPuan || 50}
                  onChange={(e) => handleMinScoreChange(e.target.value)}
                  className="w-full accent-red-700 cursor-pointer"
                  title="Asgari Taban Puan"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>50</span>
                  <span>75</span>
                  <span>100</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SECTION 6: KONTENJAN VE GENEL KOD SEÇENEKLERİ */}
        <div className="p-3.5 space-y-2">
          {/* Boş Kalan Kontenjanlar Toggle */}
          <label className="flex items-start gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={!!criteria.sadeceBosKalanlar}
              onChange={(e) => {
                onCriteriaChange({
                  ...criteria,
                  sadeceBosKalanlar: e.target.checked ? true : undefined,
                  page: 1,
                });
              }}
              className="mt-0.5 rounded-none text-red-700 focus:ring-red-700 h-3.5 w-3.5 border-slate-300"
            />
            <div>
              <span className="text-xs font-semibold text-slate-900 block">
                Sadece Boş Kalan Kontenjanlar
              </span>
              <span className="text-[11px] text-slate-500 block">
                Dolmayan ve boş kadrosu kalan birimleri listele.
              </span>
            </div>
          </label>

          {/* Genel Mezuniyet Kodları Toggle (4001, 3001, 2001) */}
          <label className="flex items-start gap-2 cursor-pointer select-none pt-1">
            <input
              type="checkbox"
              checked={!!criteria.includeGeneralCodes}
              onChange={(e) => {
                onCriteriaChange({
                  ...criteria,
                  includeGeneralCodes: e.target.checked ? true : undefined,
                  page: 1,
                });
              }}
              className="mt-0.5 rounded-none text-red-700 focus:ring-red-700 h-3.5 w-3.5 border-slate-300"
            />
            <div>
              <span className="text-xs font-semibold text-slate-900 block">
                Genel Mezuniyet Kodlarını Dahil Et
              </span>
              <span className="text-[11px] text-slate-500 block">
                4001, 3001 ve 2001 kodlu kadroları aramalara ekle.
              </span>
            </div>
          </label>
        </div>
      </div>
    </aside>
  );
}
