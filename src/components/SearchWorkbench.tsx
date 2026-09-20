'use client';

import React, { useState, useMemo } from 'react';
import {
  GraduationCap,
  FileCode2,
  Search,
  ArrowRight,
  CheckCircle2,
  BookOpen,
  Sparkles,
  HelpCircle,
  Target,
  Layers,
} from 'lucide-react';
import { Department, EducationLevel } from '@/types/kpss';
import { DEPARTMENTS } from '@/data/departments';
import { QUALIFICATIONS_BY_CODE } from '@/data/qualifications';
import {
  searchDepartments,
  searchByQualificationCode,
  DepartmentSearchResult,
  QualificationLookupResult,
} from '@/lib/search-engine';
import { trackEvent } from '@/lib/analytics';

export interface SearchWorkbenchProps {
  onSelectDepartmentPlacements: (department: Department) => void;
  onSelectCodePlacements: (code: string) => void;
  onOpenCodeDetail?: (code: string) => void;
  onFilterByScore?: (score: number, level?: EducationLevel) => void;
  onQuickFilterLevel?: (level?: EducationLevel) => void;
  activeLevel?: EducationLevel;
  totalRecordsCount?: number;
}

const POPULAR_DEPARTMENTS = [
  'Bilgisayar Mühendisliği',
  'Hemşirelik',
  'Hukuk',
  'Adalet',
  'Maliye',
  'Elektrik-Elektronik Mühendisliği',
  'İnşaat Mühendisliği',
  'Veteriner Hekimliği',
  'İlahiyat',
  'Tıbbi Dokümantasyon ve Sekreterlik',
];

const POPULAR_CODES = [
  { code: '4001', label: '4001 (Herhangi Lisans)' },
  { code: '3001', label: '3001 (Herhangi Ön Lisans)' },
  { code: '2001', label: '2001 (Herhangi Lise)' },
  { code: '4419', label: '4419 (Hukuk)' },
  { code: '4531', label: '4531 (Bilgisayar Müh.)' },
  { code: '4605', label: '4605 (Hemşirelik)' },
  { code: '3003', label: '3003 (Adalet)' },
  { code: '6225', label: '6225 (Bilgisayar Sertifikası)' },
  { code: '7225', label: '7225 (Güvenlik Tahkikatı)' },
  { code: '7205', label: '7205 (Avukatlık Ruhsatı)' },
];

export default function SearchWorkbench({
  onSelectDepartmentPlacements,
  onSelectCodePlacements,
  onOpenCodeDetail,
  onFilterByScore,
  onQuickFilterLevel,
  activeLevel,
  totalRecordsCount = 1783,
}: SearchWorkbenchProps) {
  const [searchMode, setSearchMode] = useState<'department' | 'code' | 'score'>('department');

  // Mode A: Department Search States
  const [deptQuery, setDeptQuery] = useState<string>('');
  const [selectedDept, setSelectedDept] = useState<DepartmentSearchResult | null>(() => {
    const initial = DEPARTMENTS.find((d) => d.id === 'bilgisayar-muhendisligi') || DEPARTMENTS[0];
    if (initial) {
      return {
        ...initial,
        primaryCode: initial.nitelikKodu,
        generalCode: initial.genelNitelikKodu,
        equivalentCodes: initial.esdegerKodlar,
      };
    }
    return null;
  });

  // Mode B: Qualification Code Search States
  const [codeQuery, setCodeQuery] = useState<string>('4531');
  const [selectedCodeResult, setSelectedCodeResult] = useState<QualificationLookupResult | null | undefined>(() => {
    return searchByQualificationCode('4531') ?? null;
  });

  // Mode C: Score Search State
  const [userScore, setUserScore] = useState<string>('82.50');
  const [userScoreLevel, setUserScoreLevel] = useState<EducationLevel>('lisans');

  // Department search computation using search-engine
  const matchedDepartments = useMemo(() => {
    return searchDepartments(deptQuery, 15);
  }, [deptQuery]);

  // Code search computation using search-engine with numeric sanitization
  const handleCodeInputChange = (value: string) => {
    const numericOnly = (value ?? '').replace(/\D/g, '').slice(0, 4);
    setCodeQuery(numericOnly);
    if (numericOnly.length === 4) {
      const result = searchByQualificationCode(numericOnly);
      setSelectedCodeResult(result ?? null);
      trackEvent('lookup_qualification_code', { code: numericOnly });
    } else if (numericOnly === '') {
      setSelectedCodeResult(null);
    }
  };

  const handleSelectCodeChip = (code: string) => {
    const safeCode = (code ?? '').replace(/\D/g, '').slice(0, 4);
    setCodeQuery(safeCode);
    const result = searchByQualificationCode(safeCode);
    setSelectedCodeResult(result ?? null);
    trackEvent('lookup_qualification_code', { code: safeCode, source: 'chip' });
  };

  const handleScoreSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(userScore.replace(',', '.'));
    if (!isNaN(parsed) && parsed >= 50 && parsed <= 100) {
      if (onFilterByScore) {
        onFilterByScore(parsed, userScoreLevel);
      }
      const tableEl = document.getElementById('results-section');
      if (tableEl) {
        tableEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const getEducationLevelBadge = (level?: EducationLevel | 'hepsi' | string | null) => {
    switch (level) {
      case 'lisans':
        return <span className="px-2 py-0.5 bg-blue-50 text-blue-900 border border-blue-200 font-semibold text-[11px] uppercase">Lisans (KPSSP3)</span>;
      case 'onlisans':
        return <span className="px-2 py-0.5 bg-emerald-50 text-emerald-900 border border-emerald-200 font-semibold text-[11px] uppercase">Ön Lisans (KPSSP93)</span>;
      case 'ortaogretim':
        return <span className="px-2 py-0.5 bg-amber-50 text-amber-900 border border-amber-200 font-semibold text-[11px] uppercase">Ortaöğretim (KPSSP94)</span>;
      default:
        return <span className="px-2 py-0.5 bg-slate-100 text-slate-800 border border-slate-300 font-semibold text-[11px] uppercase">Tüm Düzeyler</span>;
    }
  };

  return (
    <section aria-label="Aday Tercih Asistanı ve Hızlı Arama" className="bg-white border border-slate-300 shadow-xs mb-6">
      {/* Workbench Header & Mode Selector Tabs */}
      <div className="border-b border-slate-200 bg-slate-50/90 px-4 sm:px-5 py-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-red-700 flex-shrink-0" />
            <div>
              <h2 className="text-sm font-bold text-slate-900 tracking-tight uppercase">
                Aday Tercih Asistanı & Hızlı Arama
              </h2>
              <span className="text-[11px] text-slate-500 hidden sm:inline">
                Akıllı Arama ve Çift Yönlü Nitelik Eşleştirme Tezgahı: Mezuniyetinize, nitelik koduna veya puanınıza göre kadroları anında eşleştirin.
              </span>
            </div>
          </div>

          {/* Mode Switcher Buttons */}
          <div className="inline-flex rounded-none border border-slate-300 bg-white p-0.5 text-xs font-semibold self-start md:self-auto">
            <button
              type="button"
              onClick={() => setSearchMode('department')}
              className={`px-3 py-1.5 flex items-center gap-1.5 transition-colors cursor-pointer ${
                searchMode === 'department'
                  ? 'bg-red-700 text-white font-bold shadow-2xs'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Bölümümle Ara (Mod A: Bölümden Koda)</span>
            </button>
            <button
              type="button"
              onClick={() => setSearchMode('code')}
              className={`px-3 py-1.5 flex items-center gap-1.5 transition-colors cursor-pointer ${
                searchMode === 'code'
                  ? 'bg-red-700 text-white font-bold shadow-2xs'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <FileCode2 className="w-3.5 h-3.5" />
              <span>Kod Sorgula (Mod B: Koddan Bölüme / Şarta)</span>
            </button>
            <button
              type="button"
              onClick={() => setSearchMode('score')}
              className={`px-3 py-1.5 flex items-center gap-1.5 transition-colors cursor-pointer ${
                searchMode === 'score'
                  ? 'bg-red-700 text-white font-bold shadow-2xs'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Target className="w-3.5 h-3.5" />
              <span>Puanımla Bul</span>
            </button>
          </div>
        </div>
      </div>

      {/* QUICK LEVEL FILTER STRIP: One-Click Narrowing */}
      <div className="bg-slate-100/70 border-b border-slate-200 px-4 sm:px-5 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="font-bold text-slate-700 flex items-center gap-1 mr-1">
            <Layers className="w-3.5 h-3.5 text-slate-500" />
            Hızlı Düzey Filtresi:
          </span>
          <button
            type="button"
            onClick={() => onQuickFilterLevel && onQuickFilterLevel(undefined)}
            className={`px-2.5 py-1 text-xs border transition-colors cursor-pointer font-medium ${
              activeLevel === undefined
                ? 'bg-slate-900 text-white border-slate-900 font-bold'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            Tüm Kadrolar ({totalRecordsCount})
          </button>
          <button
            type="button"
            onClick={() => onQuickFilterLevel && onQuickFilterLevel('lisans')}
            className={`px-2.5 py-1 text-xs border transition-colors cursor-pointer font-medium ${
              activeLevel === 'lisans'
                ? 'bg-blue-800 text-white border-blue-800 font-bold'
                : 'bg-white text-blue-900 border-blue-200 hover:bg-blue-50'
            }`}
          >
            Lisans (KPSSP3)
          </button>
          <button
            type="button"
            onClick={() => onQuickFilterLevel && onQuickFilterLevel('onlisans')}
            className={`px-2.5 py-1 text-xs border transition-colors cursor-pointer font-medium ${
              activeLevel === 'onlisans'
                ? 'bg-emerald-800 text-white border-emerald-800 font-bold'
                : 'bg-white text-emerald-900 border-emerald-200 hover:bg-emerald-50'
            }`}
          >
            Ön Lisans (KPSSP93)
          </button>
          <button
            type="button"
            onClick={() => onQuickFilterLevel && onQuickFilterLevel('ortaogretim')}
            className={`px-2.5 py-1 text-xs border transition-colors cursor-pointer font-medium ${
              activeLevel === 'ortaogretim'
                ? 'bg-amber-800 text-white border-amber-800 font-bold'
                : 'bg-white text-amber-900 border-amber-200 hover:bg-amber-50'
            }`}
          >
            Ortaöğretim (KPSSP94)
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleSelectCodeChip('4001')}
            className="text-[11px] font-mono text-slate-600 bg-white border border-slate-300 px-2 py-0.5 hover:border-red-700 hover:text-red-700 transition-colors"
          >
            4001 Kadroları
          </button>
          <button
            type="button"
            onClick={() => handleSelectCodeChip('3001')}
            className="text-[11px] font-mono text-slate-600 bg-white border border-slate-300 px-2 py-0.5 hover:border-red-700 hover:text-red-700 transition-colors"
          >
            3001 Kadroları
          </button>
        </div>
      </div>

      {/* MODE A: BÖLÜMDEN NİTELİK KODUNA */}
      {searchMode === 'department' && (
        <div className="p-4 sm:p-5">
          <div className="mb-4">
            <label
              htmlFor="department-search-input"
              className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5"
            >
              Mezun Olunan Akademik Bölüm / Program Adı:
            </label>
            <div className="relative max-w-2xl">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                id="department-search-input"
                type="text"
                value={deptQuery}
                onChange={(e) => setDeptQuery(e.target.value)}
                placeholder="Örn: Bilgisayar Mühendisliği, Hemşirelik, Hukuk, Adalet, Maliye..."
                className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:border-red-700 focus:ring-1 focus:ring-red-700 outline-none"
              />
            </div>

            {/* Quick Pick Chips */}
            <div className="mt-2.5 flex flex-wrap gap-1.5 items-center text-xs text-slate-600">
              <span className="font-semibold text-slate-700 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-red-700" />
                Popüler Bölümler:
              </span>
              {POPULAR_DEPARTMENTS.map((deptName) => (
                <button
                  key={deptName}
                  type="button"
                  onClick={() => {
                    setDeptQuery(deptName);
                    const found = DEPARTMENTS.find(
                      (d) => d.ad.toLowerCase() === deptName.toLowerCase()
                    );
                    if (found) {
                      setSelectedDept({
                        ...found,
                        primaryCode: found.nitelikKodu,
                        generalCode: found.genelNitelikKodu,
                        equivalentCodes: found.esdegerKodlar,
                      });
                    }
                  }}
                  className="px-2 py-0.5 border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs transition-colors cursor-pointer"
                >
                  {deptName}
                </button>
              ))}
            </div>
          </div>

          {/* Department Two-Column Split Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-2">
            {/* Left: Matched Departments List */}
            <div className="lg:col-span-5 border border-slate-300 bg-white flex flex-col h-[340px]">
              <div className="bg-slate-100 px-3.5 py-2 border-b border-slate-300 text-xs font-bold text-slate-800 uppercase flex items-center justify-between">
                <span>Eşleşen Bölümler ({matchedDepartments.length})</span>
                <span className="text-slate-500 font-normal">Seçmek için tıklayın</span>
              </div>
              <div className="divide-y divide-slate-200 overflow-y-auto flex-1">
                {matchedDepartments.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500">
                    Arama kriterine uygun akademik bölüm bulunamadı.
                  </div>
                ) : (
                  matchedDepartments.map((dept, idx) => {
                    const isSelected = selectedDept?.id === dept.id;
                    const deptKey = dept.id || dept.ad || `matched-dept-${idx}`;
                    return (
                      <div
                        key={deptKey}
                        role="button"
                        tabIndex={0}
                        onClick={() => setSelectedDept(dept)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            setSelectedDept(dept);
                          }
                        }}
                        className={`p-3 cursor-pointer transition-colors flex items-center justify-between text-left ${
                          isSelected
                            ? 'bg-red-50/80 border-l-4 border-red-700'
                            : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="pr-2">
                          <div className="font-semibold text-xs sm:text-sm text-slate-900 leading-snug">
                            {dept.ad}
                          </div>
                          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-500">
                            <span className="uppercase font-medium text-slate-700">
                              {dept.ogrenimDuzeyi}
                            </span>
                            <span>•</span>
                            <span>Kod: <strong className="font-mono text-red-700 font-bold">{dept.nitelikKodu}</strong></span>
                          </div>
                        </div>
                        <ArrowRight className={`w-4 h-4 flex-shrink-0 ${isSelected ? 'text-red-700' : 'text-slate-400'}`} />
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right: Selected Department Details & Qualification Resolution */}
            <div className="lg:col-span-7 border border-slate-300 bg-white p-4 sm:p-5 flex flex-col justify-between">
              {selectedDept ? (
                <div className="space-y-4">
                  {/* Department Overview Banner */}
                  <div className="border-b border-slate-200 pb-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                        {selectedDept.ad}
                      </h3>
                      {getEducationLevelBadge(selectedDept.ogrenimDuzeyi)}
                    </div>
                    {selectedDept.fakulte && (
                      <div className="text-xs text-slate-500 mt-1">
                        {selectedDept.fakulte} {selectedDept.alanGrubu ? `• ${selectedDept.alanGrubu} Alanı` : ''}
                      </div>
                    )}
                  </div>

                  {/* Qualification Codes Breakdown */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Primary Code */}
                    <div className="border border-slate-200 bg-slate-50/60 p-3">
                      <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                        Bölüm Mezuniyet Nitelik Kodu:
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 bg-red-700 text-white font-mono font-bold text-sm">
                          {selectedDept.primaryCode}
                        </span>
                        <span className="text-xs text-slate-600">
                          ÖSYM doğrudan alan şartı
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-2">
                        {QUALIFICATIONS_BY_CODE[selectedDept.primaryCode]?.aciklama || 'Bu bölüm mezunları için belirlenmiş resmî alan kodudur.'}
                      </p>
                    </div>

                    {/* General Fallback Code */}
                    <div className="border border-slate-200 bg-slate-50/60 p-3">
                      <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                        Genel Başvuru Kodu (Tüm Mezunlar):
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 bg-slate-800 text-white font-mono font-bold text-sm">
                          {selectedDept.generalCode}
                        </span>
                        <span className="text-xs text-slate-600">
                          {selectedDept.ogrenimDuzeyi === 'lisans'
                            ? 'Tüm Lisans (4001)'
                            : selectedDept.ogrenimDuzeyi === 'onlisans'
                            ? 'Tüm Ön Lisans (3001)'
                            : 'Tüm Lise (2001)'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-2">
                        {QUALIFICATIONS_BY_CODE[selectedDept.generalCode]?.aciklama || 'Bölüm fark etmeksizin tüm mezunların başvurabileceği ortak kadrolardır.'}
                      </p>
                    </div>
                  </div>

                  {/* Equivalent Codes If Any */}
                  {selectedDept.equivalentCodes && selectedDept.equivalentCodes.length > 0 && (
                    <div className="border border-slate-200 p-3 bg-white">
                      <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                        Eşdeğer ve İlgili Bölüm Kodları:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {selectedDept.equivalentCodes.map((eqCode) => (
                          <span
                            key={eqCode}
                            className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-slate-100 border border-slate-300 font-mono text-xs text-slate-800"
                          >
                            <strong>{eqCode}</strong>
                            <span className="text-slate-500 text-[10px]">
                              {QUALIFICATIONS_BY_CODE[eqCode]?.kisaTanim || ''}
                            </span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Primary Action Button */}
                  <div className="pt-2">
                    <button
                      type="button"
                      aria-label="Bu Bölümün Atamalarını ve Taban Puanlarını Listele"
                      onClick={() => {
                        onSelectDepartmentPlacements(selectedDept);
                        trackEvent('search_department', {
                          department: selectedDept.ad,
                          code: selectedDept.primaryCode,
                        });
                      }}
                      className="w-full py-3 px-4 bg-red-700 hover:bg-red-800 active:scale-[0.99] text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer"
                    >
                      <span>Bu Bölümün Atamalarını ve Taban Puanlarını Listele</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-10 text-center text-slate-500 text-xs flex flex-col items-center justify-center h-full">
                  <HelpCircle className="w-8 h-8 text-slate-300 mb-2" />
                  <span>Sol listeden incelemek istediğiniz bir akademik bölüm seçiniz.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODE B: KODDAN BÖLÜME / ŞARTA */}
      {searchMode === 'code' && (
        <div className="p-4 sm:p-5">
          <div className="mb-4">
            <label
              htmlFor="code-search-input"
              className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5"
            >
              4 Haneli ÖSYM Nitelik Kodu Giriniz:
            </label>
            <div className="relative max-w-sm">
              <input
                id="code-search-input"
                type="text"
                value={codeQuery}
                onChange={(e) => handleCodeInputChange(e.target.value)}
                placeholder="Örn: 4001, 3001, 7225, 4531..."
                maxLength={4}
                className="w-full px-3.5 py-2.5 text-base font-mono font-bold tracking-widest border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:border-red-700 focus:ring-1 focus:ring-red-700 outline-none"
              />
              {codeQuery.length > 0 && codeQuery.length < 4 && (
                <span className="absolute right-3 top-3 text-[11px] text-amber-700 font-sans">
                  4 haneli kod bekleniyor
                </span>
              )}
            </div>

            {/* Quick Chips for Popular Codes */}
            <div className="mt-2.5 flex flex-wrap gap-1.5 items-center text-xs text-slate-600">
              <span className="font-semibold text-slate-700 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-red-700" />
                Önemli Nitelik Kodları:
              </span>
              {POPULAR_CODES.map((item) => (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => handleSelectCodeChip(item.code)}
                  className={`px-2 py-0.5 border text-xs font-mono transition-colors cursor-pointer ${
                    codeQuery === item.code
                      ? 'bg-red-700 text-white border-red-700 font-bold'
                      : 'border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-800'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Code Search Result Card */}
          <div className="border border-slate-300 bg-white p-4 sm:p-5 max-w-3xl">
            {selectedCodeResult ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="px-3 py-1 bg-slate-900 text-white font-mono font-bold text-base">
                      {selectedCodeResult.code}
                    </span>
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-slate-900">
                        {selectedCodeResult.title || selectedCodeResult.kisaTanim}
                      </h3>
                      <span className="text-xs text-slate-500">
                        {selectedCodeResult.isSpecialCondition ? 'Özel Şart / Sertifika / Belge Kodu' : 'Akademik Mezuniyet Alan Kodu'}
                      </span>
                    </div>
                  </div>
                  {getEducationLevelBadge(selectedCodeResult.ogrenimDuzeyi)}
                </div>

                {/* Full Legal Description */}
                <div className="bg-slate-50 border border-slate-200 p-3.5">
                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    ÖSYM Kılavuzundaki Resmî Açıklama:
                  </span>
                  <p className="text-xs sm:text-sm text-slate-800 leading-relaxed">
                    {selectedCodeResult.description || selectedCodeResult.aciklama}
                  </p>
                </div>

                {/* Eligible Departments List if applicable */}
                {selectedCodeResult.eligibleDepartments && selectedCodeResult.eligibleDepartments.length > 0 && (
                  <div>
                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-2">
                      Bu Kod ile Başvurabilecek Akademik Bölümler ({selectedCodeResult.eligibleDepartments.length}):
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto border border-slate-200 p-2.5 bg-slate-50/50">
                      {selectedCodeResult.eligibleDepartments.map((dept) => (
                        <div key={dept.id} className="text-xs text-slate-800 flex items-start gap-1.5">
                          <span className="text-red-700 font-bold">•</span>
                          <span>{dept.ad}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action CTA */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      onSelectCodePlacements(selectedCodeResult.code);
                      trackEvent('lookup_qualification_code', {
                        code: selectedCodeResult.code,
                        action: 'list_placements',
                      });
                    }}
                    className="w-full sm:w-auto py-2.5 px-5 bg-red-700 hover:bg-red-800 active:scale-[0.99] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer"
                  >
                    <span>Bu Kod ile Açılan Kadroları Listele</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 text-xs">
                {codeQuery.length === 4 ? (
                  <div>
                    <p className="font-bold text-slate-800 mb-1">
                      {codeQuery} kodu için tanım bulunamadı.
                    </p>
                    <p className="text-slate-500">
                      Lütfen geçerli bir 4 haneli ÖSYM nitelik kodu giriniz (Örn: 4001, 3001, 7225).
                    </p>
                  </div>
                ) : (
                  <div>
                    <HelpCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p>Sorgulamak istediğiniz 4 haneli nitelik kodunu yukarıdaki alana giriniz.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODE C: PUANIMA GÖRE KADRO BUL */}
      {searchMode === 'score' && (
        <div className="p-4 sm:p-5">
          <form onSubmit={handleScoreSearch} className="max-w-2xl space-y-4">
            <div>
              <span className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                1. Mezuniyet Düzeyinizi Seçin:
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setUserScoreLevel('lisans')}
                  className={`py-2 px-3 text-xs font-semibold border text-center transition-colors cursor-pointer ${
                    userScoreLevel === 'lisans'
                      ? 'bg-blue-800 text-white border-blue-800 font-bold shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  Lisans (KPSSP3)
                </button>
                <button
                  type="button"
                  onClick={() => setUserScoreLevel('onlisans')}
                  className={`py-2 px-3 text-xs font-semibold border text-center transition-colors cursor-pointer ${
                    userScoreLevel === 'onlisans'
                      ? 'bg-emerald-800 text-white border-emerald-800 font-bold shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  Ön Lisans (KPSSP93)
                </button>
                <button
                  type="button"
                  onClick={() => setUserScoreLevel('ortaogretim')}
                  className={`py-2 px-3 text-xs font-semibold border text-center transition-colors cursor-pointer ${
                    userScoreLevel === 'ortaogretim'
                      ? 'bg-amber-800 text-white border-amber-800 font-bold shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  Ortaöğretim (KPSSP94)
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="user-kpss-score" className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                2. KPSS Puanınızı Girin:
              </label>
              <div className="flex items-center gap-3">
                <input
                  id="user-kpss-score"
                  type="text"
                  value={userScore}
                  onChange={(e) => setUserScore(e.target.value)}
                  placeholder="Örn: 82.50"
                  className="w-40 px-3.5 py-2.5 text-base font-mono font-bold border border-slate-300 bg-white text-slate-900 focus:border-red-700 focus:ring-1 focus:ring-red-700 outline-none"
                />
                <button
                  type="submit"
                  className="py-2.5 px-6 bg-red-700 hover:bg-red-800 active:scale-[0.99] text-white font-bold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-sm cursor-pointer"
                >
                  <span>Puanıma Uygun Kadroları Listele</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                Puanınız ve altındaki taban puanla kapatan kadrolar puan sıralı olarak tabloya filtrelenecektir.
              </p>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
