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

export interface SearchWorkbenchProps {
  onSelectDepartmentPlacements: (department: Department) => void;
  onSelectCodePlacements: (code: string) => void;
  onOpenCodeDetail?: (code: string) => void;
}

const POPULAR_DEPARTMENTS = [
  'Bilgisayar Mühendisliği',
  'Hemşirelik',
  'Adalet',
  'Hukuk',
  'Maliye',
  'Elektrik-Elektronik Mühendisliği',
  'Tıbbi Dokümantasyon ve Sekreterlik',
  'İnşaat Mühendisliği',
];

const POPULAR_CODES = ['4001', '3001', '2001', '4531', '4605', '3003', '7225', '6225'];

export default function SearchWorkbench({
  onSelectDepartmentPlacements,
  onSelectCodePlacements,
  onOpenCodeDetail,
}: SearchWorkbenchProps) {
  const [searchMode, setSearchMode] = useState<'department' | 'code'>('department');

  // Mode A: Department Search States
  const [deptQuery, setDeptQuery] = useState<string>('');
  const [selectedDept, setSelectedDept] = useState<DepartmentSearchResult | null>(() => {
    // Default select first department (Bilgisayar Mühendisliği) for rich immediate state
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
  const [selectedCodeResult, setSelectedCodeResult] = useState<QualificationLookupResult | undefined>(() => {
    return searchByQualificationCode('4531');
  });

  // Department search computation using search-engine
  const matchedDepartments = useMemo(() => {
    return searchDepartments(deptQuery, 15);
  }, [deptQuery]);

  // Code search computation using search-engine
  const handleCodeInputChange = (value: string) => {
    setCodeQuery(value);
    const trimmed = value.trim();
    if (/^\d{4}$/.test(trimmed)) {
      const result = searchByQualificationCode(trimmed);
      setSelectedCodeResult(result);
    } else if (trimmed === '') {
      setSelectedCodeResult(undefined);
    }
  };

  const handleSelectCodeChip = (code: string) => {
    setCodeQuery(code);
    const result = searchByQualificationCode(code);
    setSelectedCodeResult(result);
  };

  const getEducationLevelBadge = (level: EducationLevel | 'hepsi') => {
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
    <div className="bg-white border border-slate-300 shadow-xs mb-6">
      {/* Workbench Header & Mode Selector Segmented Tabs */}
      <div className="border-b border-slate-200 bg-slate-50/80 px-5 py-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-red-700" />
            <h2 className="text-sm font-bold text-slate-900 tracking-tight uppercase">
              Akıllı Arama ve Çift Yönlü Nitelik Eşleştirme Tezgahı
            </h2>
          </div>

          {/* Mode Switcher Buttons */}
          <div className="inline-flex rounded-none border border-slate-300 bg-white p-0.5 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setSearchMode('department')}
              className={`px-3.5 py-1.5 flex items-center gap-1.5 transition-colors cursor-pointer ${
                searchMode === 'department'
                  ? 'bg-red-700 text-white font-bold'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Mod A: Bölümden Koda</span>
            </button>
            <button
              type="button"
              onClick={() => setSearchMode('code')}
              className={`px-3.5 py-1.5 flex items-center gap-1.5 transition-colors cursor-pointer ${
                searchMode === 'code'
                  ? 'bg-red-700 text-white font-bold'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <FileCode2 className="w-3.5 h-3.5" />
              <span>Mod B: Koddan Bölüme / Şarta</span>
            </button>
          </div>
        </div>
      </div>

      {/* MODE A: BÖLÜMDEN NİTELİK KODUNA */}
      {searchMode === 'department' && (
        <div className="p-5">
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
                placeholder="Örn: Bilgisayar Mühendisliği, Hemşirelik, Adalet, Maliye, Elektrik..."
                className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:border-red-700 focus:ring-1 focus:ring-red-700 outline-none"
              />
            </div>

            {/* Quick Pick Chips */}
            <div className="mt-2.5 flex flex-wrap gap-1.5 items-center text-xs text-slate-600">
              <span className="font-semibold text-slate-700 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-red-700" />
                Hızlı Seçim:
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
                  matchedDepartments.map((dept) => {
                    const isSelected = selectedDept?.id === dept.id;
                    return (
                      <div
                        key={dept.id}
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
                            {dept.alanGrubu && <span>• {dept.alanGrubu}</span>}
                          </div>
                        </div>
                        <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-900 font-mono font-bold text-xs border border-slate-300 flex-shrink-0 tabular-nums">
                          {dept.primaryCode}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right: Selected Department Detail & Action Card */}
            <div className="lg:col-span-7 border border-slate-300 bg-white flex flex-col justify-between p-4 sm:p-5">
              {selectedDept ? (
                <div className="space-y-4">
                  {/* Title & Degree Level */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-200 pb-3">
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-slate-900">
                        {selectedDept.ad}
                      </h3>
                      {selectedDept.fakulte && (
                        <p className="text-xs text-slate-600 mt-0.5">{selectedDept.fakulte}</p>
                      )}
                    </div>
                    <div>{getEducationLevelBadge(selectedDept.ogrenimDuzeyi)}</div>
                  </div>

                  {/* Primary Code Callout */}
                  <div className="border border-red-200 bg-red-50/60 p-3.5">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-[11px] font-bold text-red-900 uppercase tracking-wider">
                          Resmî Branş Nitelik Kodu
                        </div>
                        <div className="text-2xl font-black font-mono text-red-800 mt-0.5 tabular-nums">
                          {selectedDept.primaryCode}
                        </div>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 bg-red-700 text-white font-bold uppercase">
                        ÖSYM Birincil Kod
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 mt-1.5 leading-relaxed">
                      {QUALIFICATIONS_BY_CODE[selectedDept.primaryCode]?.aciklama ||
                        `${selectedDept.ad} programından mezun olan adaylar için belirlenmiş birincil ÖSYM kodudur.`}
                    </p>
                  </div>

                  {/* General Code & Equivalent Codes */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 border border-slate-200 bg-slate-50">
                      <div className="font-bold text-slate-800 uppercase text-[11px]">
                        Genel Mezuniyet Kodu:
                      </div>
                      <div className="font-mono font-bold text-base text-slate-900 mt-0.5 tabular-nums">
                        {selectedDept.generalCode}
                      </div>
                      <p className="text-slate-600 mt-1 text-[11px] leading-normal">
                        {QUALIFICATIONS_BY_CODE[selectedDept.generalCode]?.kisaTanim ||
                          'Herhangi bir programdan mezun olmak şartı arayan genel kadrolar.'}
                      </p>
                    </div>

                    <div className="p-3 border border-slate-200 bg-slate-50">
                      <div className="font-bold text-slate-800 uppercase text-[11px]">
                        Eşdeğer / İlişkili Kodlar:
                      </div>
                      <div className="font-mono font-bold text-sm text-slate-900 mt-0.5 tabular-nums">
                        {selectedDept.equivalentCodes && selectedDept.equivalentCodes.length > 0
                          ? selectedDept.equivalentCodes.join(', ')
                          : 'Müstakil Branş (Yok)'}
                      </div>
                      <p className="text-slate-600 mt-1 text-[11px] leading-normal">
                        Bu bölüm mezunlarının tercih edebileceği denk kılavuz kodları.
                      </p>
                    </div>
                  </div>

                  {/* One-Click Action Button */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => onSelectDepartmentPlacements(selectedDept)}
                      className="w-full bg-red-700 hover:bg-red-800 text-white font-bold py-2.5 px-4 text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-2xs"
                    >
                      <span>Bu Bölümün Atamalarını ve Taban Puanlarını Listele</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500 text-xs my-auto">
                  <HelpCircle className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  Sol taraftaki listeden bir akademik bölüm seçiniz.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODE B: NİTELİK KODUNDAN BÖLÜME / ŞARTA */}
      {searchMode === 'code' && (
        <div className="p-5">
          <div className="mb-4">
            <label
              htmlFor="code-search-input"
              className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5"
            >
              4 Haneli ÖSYM Nitelik Kodu Giriniz:
            </label>
            <div className="relative max-w-xs">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                id="code-search-input"
                type="text"
                maxLength={4}
                value={codeQuery}
                onChange={(e) => handleCodeInputChange(e.target.value)}
                placeholder="Örn: 4531, 3001, 7225"
                className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-300 bg-white text-slate-900 font-mono font-bold tracking-wider placeholder:text-slate-400 focus:border-red-700 focus:ring-1 focus:ring-red-700 outline-none tabular-nums"
              />
            </div>

            {/* Quick Pick Code Chips */}
            <div className="mt-2.5 flex flex-wrap gap-1.5 items-center text-xs text-slate-600">
              <span className="font-semibold text-slate-700 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-red-700" />
                Yaygın Kodlar:
              </span>
              {POPULAR_CODES.map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => handleSelectCodeChip(code)}
                  className={`px-2 py-0.5 border font-mono text-xs transition-colors cursor-pointer tabular-nums ${
                    codeQuery === code
                      ? 'border-red-700 bg-red-50 text-red-900 font-bold'
                      : 'border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-800'
                  }`}
                >
                  {code}
                </button>
              ))}
            </div>
          </div>

          {/* Mode B: Code Resolution Card */}
          <div className="border border-slate-300 bg-white p-4 sm:p-5">
            {selectedCodeResult ? (
              <div className="space-y-4">
                {/* Header Line: Code Badge, Title, Category */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-200 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-2xl font-black text-red-800 bg-red-50 px-3 py-1 border border-red-200 tabular-nums">
                      {selectedCodeResult.code}
                    </span>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">
                        {selectedCodeResult.title}
                      </h3>
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                        Kategori: {selectedCodeResult.category}
                      </span>
                    </div>
                  </div>
                  <div>{getEducationLevelBadge(selectedCodeResult.ogrenimDuzeyi)}</div>
                </div>

                {/* Legal Official ÖSYM Description Text */}
                <div className="border border-slate-200 bg-slate-50 p-3.5 text-xs">
                  <strong className="block text-slate-800 uppercase font-bold text-[11px] mb-1">
                    ÖSYM Resmî Kılavuz Tanımı ve Yasal Şart Metni:
                  </strong>
                  <p className="text-slate-900 leading-relaxed font-sans">
                    {selectedCodeResult.description}
                  </p>
                </div>

                {/* Special Condition Details (if applicable) */}
                {selectedCodeResult.specialConditionDetails && (
                  <div className="border border-amber-200 bg-amber-50/60 p-3 text-xs">
                    <strong className="block text-amber-950 uppercase font-bold text-[11px] mb-1">
                      Özel Şart ve Belge Gereksinimi:
                    </strong>
                    <p className="text-amber-900">
                      {selectedCodeResult.specialConditionDetails.detay}
                    </p>
                  </div>
                )}

                {/* Eligible Academic Departments Grid */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Bu Nitelik Koduna Sahip Akademik Programlar ({selectedCodeResult.eligibleDepartments.length}):
                    </h4>
                    {selectedCodeResult.eligibleDepartments.length > 0 && (
                      <span className="text-[11px] text-slate-500">
                        Geçerli mezuniyet alanları
                      </span>
                    )}
                  </div>

                  {selectedCodeResult.eligibleDepartments.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto border border-slate-200 p-2.5 bg-slate-50/50">
                      {selectedCodeResult.eligibleDepartments.map((dept) => (
                        <div
                          key={dept.id}
                          className="bg-white border border-slate-200 p-2 text-xs text-slate-800 flex items-center justify-between"
                        >
                          <span className="font-medium pr-1 line-clamp-1" title={dept.ad}>
                            {dept.ad}
                          </span>
                          <span className="text-[10px] uppercase font-bold text-slate-500 font-mono flex-shrink-0">
                            {dept.level}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 bg-slate-50 border border-slate-200 text-xs text-slate-600">
                      Bu kod genel bir sertifika, sürücü belgesi veya özel hizmet şartıdır; müstakil bir lisans/önlisans programına bağlı değildir.
                    </div>
                  )}
                </div>

                {/* Action Button */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => onSelectCodePlacements(selectedCodeResult.code)}
                    className="w-full bg-red-700 hover:bg-red-800 text-white font-bold py-2.5 px-4 text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-2xs"
                  >
                    <span>Bu Kod ile Açılan Kadroları Listele</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 text-xs">
                <HelpCircle className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                Girilen 4 haneli kod için eşleşme bulunamadı. Lütfen geçerli bir ÖSYM kodu yazınız (örn: 4531, 3001, 7225).
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
