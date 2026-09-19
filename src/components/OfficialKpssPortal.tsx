'use client';

import React, { useState, useMemo } from 'react';
import { PLACEMENT_RECORDS } from '@/data/records';
import { DEPARTMENTS } from '@/data/departments';
import { QUALIFICATION_CODES, QUALIFICATIONS_BY_CODE } from '@/data/qualifications';
import { SPECIAL_CONDITIONS } from '@/data/special-conditions';
import { normalizeTrSearch, toTurkishTitle } from '@/lib/turkish';
import { getDepartmentToCodes, getCodeToDepartments } from '@/lib/mappings';
import { PlacementRecord, Department, EducationLevel } from '@/types/kpss';
import {
  Search,
  Building2,
  GraduationCap,
  Filter,
  FileText,
  MapPin,
  CheckCircle2,
  ArrowRight,
  RotateCcw,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Download,
  Info,
  Layers,
  X,
  ExternalLink
} from 'lucide-react';

export default function OfficialKpssPortal() {
  // Primary Tabs
  const [activeTab, setActiveTab] = useState<'department' | 'qualification' | 'cadres'>('department');

  // Search States
  const [departmentQuery, setDepartmentQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);

  const [codeQuery, setCodeQuery] = useState('');
  const [selectedCode, setSelectedCode] = useState<string | null>(null);

  // Cadre Filters
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [filterPeriod, setFilterPeriod] = useState<string>('all');
  const [filterCity, setFilterCity] = useState<string>('all');
  const [filterSearchText, setFilterSearchText] = useState<string>('');
  const [filterMinScore, setFilterMinScore] = useState<string>('');
  const [filterMaxScore, setFilterMaxScore] = useState<string>('');
  const [filterQualificationCode, setFilterQualificationCode] = useState<string>('');

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);

  // Modal State for Qualification Details
  const [activeModalCode, setActiveModalCode] = useState<string | null>(null);

  // Distinct Lists for Select Options
  const cities = useMemo(() => {
    const citySet = new Set<string>();
    PLACEMENT_RECORDS.forEach((r) => {
      if (r.sehir && r.sehir !== 'MERKEZ' && r.sehir !== 'TÜMÜ') {
        citySet.add(r.sehir);
      }
    });
    return Array.from(citySet).sort((a, b) => a.localeCompare(b, 'tr-TR'));
  }, []);

  const periods = useMemo(() => {
    const pSet = new Set<string>();
    PLACEMENT_RECORDS.forEach((r) => pSet.add(r.donem));
    return Array.from(pSet).sort().reverse();
  }, []);

  // Department Autocomplete / Search Results
  const matchedDepartments = useMemo(() => {
    if (!departmentQuery.trim()) {
      return DEPARTMENTS.slice(0, 12);
    }
    const q = normalizeTrSearch(departmentQuery);
    return DEPARTMENTS.filter((d) => {
      const matchName = normalizeTrSearch(d.ad).includes(q);
      const matchCode = d.nitelikKodu.includes(q) || d.genelNitelikKodu.includes(q);
      return matchName || matchCode;
    }).slice(0, 20);
  }, [departmentQuery]);

  // Qualification Code Search Results
  const matchedCodes = useMemo(() => {
    if (!codeQuery.trim()) {
      return QUALIFICATION_CODES.slice(0, 10);
    }
    const q = normalizeTrSearch(codeQuery);
    return QUALIFICATION_CODES.filter((c) => {
      const matchCode = c.kod.includes(q);
      const matchDesc = normalizeTrSearch(c.aciklama).includes(q) || normalizeTrSearch(c.kisaTanim).includes(q);
      return matchCode || matchDesc;
    }).slice(0, 15);
  }, [codeQuery]);

  // Selected Department Qualification Mapping
  const departmentMapping = useMemo(() => {
    if (!selectedDepartment) return null;
    return getDepartmentToCodes(selectedDepartment.id);
  }, [selectedDepartment]);

  // Selected Code Department Mapping
  const codeMapping = useMemo(() => {
    if (!selectedCode) return null;
    return getCodeToDepartments(selectedCode);
  }, [selectedCode]);

  // Filtered Cadre Records
  const filteredRecords = useMemo(() => {
    return PLACEMENT_RECORDS.filter((record) => {
      // Level Filter
      if (filterLevel !== 'all' && record.ogrenimDuzeyi !== filterLevel) {
        return false;
      }

      // Period Filter
      if (filterPeriod !== 'all' && record.donem !== filterPeriod) {
        return false;
      }

      // City Filter
      if (filterCity !== 'all' && record.sehir !== filterCity) {
        return false;
      }

      // Qualification Code Filter
      if (filterQualificationCode.trim()) {
        const targetCode = filterQualificationCode.trim();
        if (!record.nitelikKodlari.includes(targetCode)) {
          return false;
        }
      }

      // Min/Max Score
      if (filterMinScore) {
        const min = parseFloat(filterMinScore);
        if (!isNaN(min) && (record.tabanPuan === null || record.tabanPuan < min)) {
          return false;
        }
      }

      if (filterMaxScore) {
        const max = parseFloat(filterMaxScore);
        if (!isNaN(max) && (record.tabanPuan === null || record.tabanPuan > max)) {
          return false;
        }
      }

      // Full-text Multi-token Search across institution, cadre, city, qualifications
      if (filterSearchText.trim()) {
        const tokens = normalizeTrSearch(filterSearchText).split(/\s+/).filter(Boolean);
        const searchable = normalizeTrSearch(
          `${record.kurumAdi} ${record.kadroUnvani} ${record.sehir} ${record.ilce || ''} ${record.kadroKodu} ${record.nitelikKodlari.join(' ')}`
        );
        const matchAllTokens = tokens.every((token) => searchable.includes(token));
        if (!matchAllTokens) return false;
      }

      return true;
    });
  }, [
    filterLevel,
    filterPeriod,
    filterCity,
    filterQualificationCode,
    filterMinScore,
    filterMaxScore,
    filterSearchText,
  ]);

  // Pagination Slice
  const totalPages = Math.ceil(filteredRecords.length / pageSize) || 1;
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRecords.slice(start, start + pageSize);
  }, [filteredRecords, currentPage, pageSize]);

  // Handler: Select Department and switch to see its appointments
  const handleShowDepartmentPlacements = (dept: Department) => {
    setSelectedDepartment(dept);
    setFilterQualificationCode(dept.nitelikKodu);
    if (dept.ogrenimDuzeyi) {
      setFilterLevel(dept.ogrenimDuzeyi);
    }
    setActiveTab('cadres');
    setCurrentPage(1);
  };

  // Handler: Select Qualification Code and switch to see its appointments
  const handleShowCodePlacements = (code: string) => {
    setSelectedCode(code);
    setFilterQualificationCode(code);
    setActiveTab('cadres');
    setCurrentPage(1);
  };

  // Handler: Reset all filters
  const handleResetFilters = () => {
    setFilterLevel('all');
    setFilterPeriod('all');
    setFilterCity('all');
    setFilterSearchText('');
    setFilterMinScore('');
    setFilterMaxScore('');
    setFilterQualificationCode('');
    setCurrentPage(1);
  };

  // Calculations for summary stats
  const totalQuota = useMemo(() => filteredRecords.reduce((acc, r) => acc + r.kontenjan, 0), [filteredRecords]);
  const totalPlaced = useMemo(() => filteredRecords.reduce((acc, r) => acc + r.yerlesen, 0), [filteredRecords]);
  const avgMinScore = useMemo(() => {
    const validScores = filteredRecords.filter((r) => r.tabanPuan !== null).map((r) => r.tabanPuan as number);
    if (validScores.length === 0) return null;
    const sum = validScores.reduce((a, b) => a + b, 0);
    return (sum / validScores.length).toFixed(4);
  }, [filteredRecords]);

  // Active Qualification Modal Object
  const modalQualification = useMemo(() => {
    if (!activeModalCode) return null;
    const qual = QUALIFICATIONS_BY_CODE[activeModalCode];
    const spec = SPECIAL_CONDITIONS.find((s) => s.kod === activeModalCode);
    const mapping = getCodeToDepartments(activeModalCode);
    return {
      code: activeModalCode,
      title: qual?.kisaTanim || spec?.baslik || `Nitelik Kodu: ${activeModalCode}`,
      desc: qual?.aciklama || spec?.detay || 'Bu nitelik kodu için resmî kılavuz açıklaması bulunamadı.',
      category: qual?.kategori || spec?.kategori || 'Genel Şart',
      departments: mapping?.eligibleDepartments || [],
    };
  }, [activeModalCode]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Resmî T.C. Kurumsal Başlık Barı */}
      <div className="bg-white border border-slate-300 shadow-sm rounded-none">
        <div className="h-1.5 bg-red-700 w-full" />
        <div className="px-6 py-5 border-b border-slate-200">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full border-2 border-red-700 bg-red-50 flex items-center justify-center flex-shrink-0 text-red-700 font-bold text-lg shadow-xs">
                T.C.
              </div>
              <div>
                <span className="text-xs font-semibold tracking-wider text-red-800 uppercase block">
                  Türkiye Cumhuriyeti Kamu Görevlerine İlk Defa Atanacaklar İçin
                </span>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
                  KPSS Merkezi Yerleştirme ve Nitelik Kodu Portalı (2024 - 2026)
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 mt-1">
                  Lisans (KPSSP3), Ön Lisans (KPSSP93) ve Ortaöğretim (KPSSP94) B Grubu kadro, kontenjan, taban puan ve çift yönlü nitelik kodu sorgulama sistemi.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-2 lg:pt-0">
              <div className="border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700 font-medium">
                <span className="text-slate-500">Kapsanan Dönemler:</span>{' '}
                <strong className="text-slate-900 tabular-nums">2024/1, 2024/2, 2025/1</strong>
              </div>
              <div className="border border-slate-200 bg-emerald-50 px-3 py-1.5 text-xs text-emerald-800 font-medium flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" />
                Resmî Veri Tabanı Aktif
              </div>
            </div>
          </div>
        </div>

        {/* Resmî Bilgilendirme Notu */}
        <div className="bg-slate-50/80 px-6 py-2.5 text-xs text-slate-600 border-b border-slate-200 flex items-center gap-2">
          <Info className="w-4 h-4 text-slate-500 flex-shrink-0" />
          <span>
            Bu sistemde yer alan tüm kadrolar, nitelik kodları ve taban puanlar Ölçme, Seçme ve Yerleştirme Merkezi (ÖSYM) resmî tercih kılavuzları ve yerleştirme sayısal verileri ile birebir uyumludur.
          </span>
        </div>

        {/* Kurumsal Sekme Çubuğu */}
        <div className="flex border-b border-slate-300 bg-slate-100/70 overflow-x-auto">
          <button
            onClick={() => setActiveTab('department')}
            className={`px-5 py-3 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'department'
                ? 'border-red-700 text-red-900 bg-white font-bold'
                : 'border-transparent text-slate-700 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <GraduationCap className="w-4 h-4 text-red-700" />
            1. Bölümden Nitelik Kodu Sorgulama
          </button>
          <button
            onClick={() => setActiveTab('qualification')}
            className={`px-5 py-3 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'qualification'
                ? 'border-red-700 text-red-900 bg-white font-bold'
                : 'border-transparent text-slate-700 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <FileText className="w-4 h-4 text-red-700" />
            2. Nitelik Kodundan Bölüm / Şart Sorgulama
          </button>
          <button
            onClick={() => setActiveTab('cadres')}
            className={`px-5 py-3 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'cadres'
                ? 'border-red-700 text-red-900 bg-white font-bold'
                : 'border-transparent text-slate-700 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Building2 className="w-4 h-4 text-red-700" />
            3. Kadro Atamaları ve Taban Puanlar ({filteredRecords.length})
          </button>
        </div>

        {/* SEKME 1: BÖLÜMDEN NİTELİK KODU BULMA */}
        {activeTab === 'department' && (
          <div className="p-6 space-y-6">
            <div className="border-l-4 border-red-700 pl-4 py-1">
              <h2 className="text-base font-bold text-slate-900">
                Mezuniyet Bölümüne Göre Nitelik Kodu ve Atama Sorgulama
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Mezun olduğunuz veya okuduğunuz bölümün adını yazarak geçerli ÖSYM nitelik kodunu, genel kodunu ve atamalarını sorgulayabilirsiniz.
              </p>
            </div>

            {/* Arama Girişi */}
            <div className="max-w-2xl">
              <label htmlFor="dept-search" className="block text-xs font-semibold text-slate-800 uppercase tracking-wider mb-1.5">
                Bölüm Adı veya Bölüm Kodu Arayın:
              </label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  id="dept-search"
                  type="text"
                  value={departmentQuery}
                  onChange={(e) => {
                    setDepartmentQuery(e.target.value);
                    setSelectedDepartment(null);
                  }}
                  placeholder="Örn: Bilgisayar Mühendisliği, Hemşirelik, Adalet, Maliye, Elektrik..."
                  className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-300 rounded-none bg-white text-slate-900 placeholder:text-slate-400 focus:border-red-700 focus:ring-1 focus:ring-red-700 outline-none"
                />
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5 items-center text-xs text-slate-600">
                <span className="font-semibold text-slate-700">Hızlı Seçim:</span>
                {[
                  'Bilgisayar Mühendisliği',
                  'Hemşirelik',
                  'Adalet',
                  'Hukuk',
                  'Maliye',
                  'Elektrik-Elektronik Mühendisliği',
                  'Tıbbi Dokümantasyon ve Sekreterlik',
                  'İnşaat Mühendisliği'
                ].map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => {
                      setDepartmentQuery(name);
                      const found = DEPARTMENTS.find((d) => d.ad.toLowerCase() === name.toLowerCase());
                      if (found) setSelectedDepartment(found);
                    }}
                    className="px-2 py-0.5 border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs transition-colors"
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>

            {/* Bölüm Listesi Seçim Tablosu */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
              <div className="border border-slate-300 bg-white">
                <div className="bg-slate-100 px-4 py-2.5 border-b border-slate-300 font-semibold text-xs text-slate-800 uppercase flex items-center justify-between">
                  <span>Eşleşen Bölümler ({matchedDepartments.length})</span>
                  <span className="text-slate-500 font-normal">Tıklayarak Seçin</span>
                </div>
                <div className="divide-y divide-slate-200 max-h-96 overflow-y-auto">
                  {matchedDepartments.length === 0 ? (
                    <div className="p-6 text-center text-sm text-slate-500">
                      Girilen arama kriterine uygun bölüm bulunamadı.
                    </div>
                  ) : (
                    matchedDepartments.map((dept) => {
                      const isSelected = selectedDepartment?.id === dept.id;
                      return (
                        <div
                          key={dept.id}
                          onClick={() => setSelectedDepartment(dept)}
                          className={`p-3 cursor-pointer transition-colors flex items-center justify-between text-left ${
                            isSelected
                              ? 'bg-red-50/70 border-l-4 border-red-700'
                              : 'hover:bg-slate-50'
                          }`}
                        >
                          <div>
                            <div className="font-semibold text-sm text-slate-900">{dept.ad}</div>
                            <div className="flex items-center gap-2 mt-1 text-xs text-slate-600">
                              <span className="capitalize px-1.5 py-0.2 bg-slate-200/70 text-slate-800">
                                {dept.ogrenimDuzeyi}
                              </span>
                              <span className="font-mono text-slate-600">
                                Bölüm Kodu: {dept.id}
                              </span>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <span className="inline-block px-2.5 py-1 bg-red-100 text-red-900 font-mono font-bold text-xs border border-red-200">
                              {dept.nitelikKodu}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Seçilen Bölümün Resmî Nitelik Kodu Kartı */}
              <div className="border border-slate-300 bg-white">
                <div className="bg-slate-100 px-4 py-2.5 border-b border-slate-300 font-semibold text-xs text-slate-800 uppercase flex items-center gap-2">
                  <FileText className="w-4 h-4 text-red-700" />
                  <span>ÖSYM Nitelik Kodu Eşleştirme Detayı</span>
                </div>
                {selectedDepartment && departmentMapping ? (
                  <div className="p-5 space-y-4">
                    <div>
                      <span className="text-xs font-semibold text-slate-500 uppercase">Seçili Bölüm:</span>
                      <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                        {selectedDepartment.ad}
                      </h3>
                      <div className="mt-1 flex items-center gap-2 text-xs text-slate-600">
                        <span className="px-2 py-0.5 bg-slate-100 border border-slate-300 font-medium uppercase">
                          Öğrenim Düzeyi: {selectedDepartment.ogrenimDuzeyi}
                        </span>
                        <span className="font-mono">Program Kodu: {selectedDepartment.id}</span>
                      </div>
                    </div>

                    <div className="border border-red-200 bg-red-50/50 p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-xs font-bold text-red-900 uppercase tracking-wide">
                            Resmî Branş Nitelik Kodu
                          </div>
                          <div className="text-2xl font-extrabold font-mono text-red-800 mt-1 tabular-nums">
                            {selectedDepartment.nitelikKodu}
                          </div>
                        </div>
                        <span className="text-xs px-2 py-1 bg-red-700 text-white font-medium">
                          ÖSYM Kılavuz Kodu
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 mt-2 leading-relaxed">
                        {QUALIFICATIONS_BY_CODE[selectedDepartment.nitelikKodu]?.aciklama ||
                          `${selectedDepartment.ad} programından mezun olan adayların tercih yapabileceği resmi kadro kodu.`}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="p-3 border border-slate-200 bg-slate-50">
                        <div className="font-semibold text-slate-700 uppercase">Genel Nitelik Kodu</div>
                        <div className="font-mono font-bold text-base text-slate-900 mt-0.5">
                          {selectedDepartment.genelNitelikKodu}
                        </div>
                        <p className="text-slate-600 mt-1">
                          {QUALIFICATIONS_BY_CODE[selectedDepartment.genelNitelikKodu]?.kisaTanim ||
                            'Herhangi bir programdan mezun olmak.'}
                        </p>
                      </div>

                      <div className="p-3 border border-slate-200 bg-slate-50">
                        <div className="font-semibold text-slate-700 uppercase">Eşdeğer / İlişkili Kodlar</div>
                        <div className="font-mono font-bold text-sm text-slate-900 mt-0.5">
                          {selectedDepartment.esdegerKodlar.length > 0
                            ? selectedDepartment.esdegerKodlar.join(', ')
                            : 'Müstakil Branş (Yok)'}
                        </div>
                        <p className="text-slate-600 mt-1">
                          Bu bölümle denk kabul edilen yan nitelik kodları.
                        </p>
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => handleShowDepartmentPlacements(selectedDepartment)}
                        className="w-full bg-red-700 hover:bg-red-800 text-white font-bold py-2.5 px-4 text-sm flex items-center justify-center gap-2 transition-colors"
                      >
                        <Building2 className="w-4 h-4" />
                        <span>Bu Bölümün Atamalarını ve Taban Puanlarını Göster</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center text-slate-500 text-sm">
                    <GraduationCap className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    Lütfen sol taraftaki listeden bir bölüm seçiniz. İlgili ÖSYM nitelik kodu ve şartları otomatik olarak burada görüntülenecektir.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* SEKME 2: NİTELİK KODUNDAN BÖLÜM / ŞART SORGULAMA */}
        {activeTab === 'qualification' && (
          <div className="p-6 space-y-6">
            <div className="border-l-4 border-red-700 pl-4 py-1">
              <h2 className="text-base font-bold text-slate-900">
                Nitelik Koduna Göre Bölüm ve Özel Şart Sorgulama
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Kılavuzda gördüğünüz 4 haneli nitelik kodunu (ör. 4531, 3001, 2001, 6225, 7225) girerek hangi bölümleri veya şartları kapsadığını görüntüleyin.
              </p>
            </div>

            <div className="max-w-xl">
              <label htmlFor="code-search" className="block text-xs font-semibold text-slate-800 uppercase tracking-wider mb-1.5">
                4 Haneli Nitelik Kodu veya Açıklama:
              </label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  id="code-search"
                  type="text"
                  value={codeQuery}
                  onChange={(e) => {
                    setCodeQuery(e.target.value);
                    setSelectedCode(null);
                  }}
                  placeholder="Örn: 4531, 3001, 2001, 7225, 6225, 4605..."
                  className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-300 rounded-none bg-white text-slate-900 placeholder:text-slate-400 focus:border-red-700 focus:ring-1 focus:ring-red-700 outline-none font-mono"
                />
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5 items-center text-xs text-slate-600">
                <span className="font-semibold text-slate-700">Yaygın Kodlar:</span>
                {['4001', '3001', '2001', '4531', '4605', '3003', '7225', '6225'].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      setCodeQuery(c);
                      setSelectedCode(c);
                    }}
                    className="px-2 py-0.5 border border-slate-200 bg-slate-100 hover:bg-slate-200 font-mono text-slate-800 text-xs"
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
              <div className="border border-slate-300 bg-white">
                <div className="bg-slate-100 px-4 py-2.5 border-b border-slate-300 font-semibold text-xs text-slate-800 uppercase flex items-center justify-between">
                  <span>Nitelik Kodları Listesi ({matchedCodes.length})</span>
                  <span className="text-slate-500 font-normal">Koda Tıklayın</span>
                </div>
                <div className="divide-y divide-slate-200 max-h-96 overflow-y-auto">
                  {matchedCodes.map((item) => (
                    <div
                      key={item.kod}
                      onClick={() => setSelectedCode(item.kod)}
                      className={`p-3 cursor-pointer transition-colors flex items-start justify-between text-left ${
                        selectedCode === item.kod
                          ? 'bg-red-50/70 border-l-4 border-red-700'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="pr-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-red-800 bg-red-50 px-2 py-0.5 border border-red-200">
                            {item.kod}
                          </span>
                          <span className="font-semibold text-sm text-slate-900">{item.kisaTanim}</span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1 line-clamp-2">{item.aciklama}</p>
                      </div>
                      <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 border border-slate-200 whitespace-nowrap capitalize">
                        {item.ogrenimDuzeyi || 'Şart'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Seçili Nitelik Kodu Detay Paneli */}
              <div className="border border-slate-300 bg-white">
                <div className="bg-slate-100 px-4 py-2.5 border-b border-slate-300 font-semibold text-xs text-slate-800 uppercase flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-red-700" />
                  <span>Nitelik Kodu Kapsamı ve Bölümleri</span>
                </div>
                {selectedCode && codeMapping ? (
                  <div className="p-5 space-y-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-mono font-extrabold text-red-800">
                          {selectedCode}
                        </span>
                        <span className="text-xs px-2.5 py-1 bg-red-100 text-red-900 font-bold border border-red-200">
                          {codeMapping.category}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-slate-900 mt-1">
                        {codeMapping.title}
                      </h3>
                    </div>

                    <div className="border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700 leading-relaxed">
                      <strong className="block text-slate-900 font-semibold mb-1">Resmî Kılavuz Açıklaması:</strong>
                      {QUALIFICATIONS_BY_CODE[selectedCode]?.aciklama ||
                        SPECIAL_CONDITIONS.find((s) => s.kod === selectedCode)?.detay ||
                        'Bu kod için açıklama metni.'}
                    </div>

                    <div>
                      <h4 className="text-xs font-semibold text-slate-800 uppercase mb-2">
                        Bu Nitelik Koduna Dahil Olan Bölümler ({codeMapping.eligibleDepartments.length}):
                      </h4>
                      {codeMapping.eligibleDepartments.length > 0 ? (
                        <div className="max-h-48 overflow-y-auto border border-slate-200 divide-y divide-slate-100">
                          {codeMapping.eligibleDepartments.map((dept) => (
                            <div key={dept.id} className="p-2 text-xs text-slate-800 flex items-center justify-between">
                              <span>{dept.ad}</span>
                              <span className="font-mono text-slate-500 uppercase text-xs">{dept.level}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-3 bg-slate-50 text-xs text-slate-500 border border-slate-200">
                          Bu kod özel bir şart veya sertifika kodudur; tek bir akademik bölüme bağlı değildir.
                        </div>
                      )}
                    </div>

                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => handleShowCodePlacements(selectedCode)}
                        className="w-full bg-red-700 hover:bg-red-800 text-white font-bold py-2.5 px-4 text-sm flex items-center justify-center gap-2 transition-colors"
                      >
                        <Building2 className="w-4 h-4" />
                        <span>Bu Nitelik Kodunu Arayan Kadroları Listele</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center text-slate-500 text-sm">
                    <FileText className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    Soldaki listeden bir nitelik kodu seçiniz veya yukarıdaki arama kutusuna 4 haneli kod yazınız.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* SEKME 3: TÜM MERKEZİ ATAMALAR VE ÇOK KRİTERLİ FİLTRELEME */}
        {activeTab === 'cadres' && (
          <div className="p-6 space-y-6">
            {/* Filtreleme Başlığı ve Formu */}
            <div className="border border-slate-300 bg-slate-50/70 p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-red-700" />
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                    Merkezi Atama Kadro Filtreleme Paneli
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-xs font-semibold text-red-800 hover:text-red-900 flex items-center gap-1.5 self-start sm:self-auto"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Filtreleri Sıfırla
                </button>
              </div>

              {/* Filtre Kontrolleri */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                {/* Öğrenim Düzeyi */}
                <div>
                  <label htmlFor="filter-level" className="block text-xs font-semibold text-slate-700 mb-1">
                    Öğrenim Düzeyi:
                  </label>
                  <select
                    id="filter-level"
                    value={filterLevel}
                    onChange={(e) => {
                      setFilterLevel(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full text-xs sm:text-sm py-2 px-3 border border-slate-300 bg-white text-slate-900 outline-none focus:border-red-700"
                  >
                    <option value="all">Tüm Öğrenim Düzeyleri</option>
                    <option value="lisans">Lisans (4 Yıllık - KPSSP3)</option>
                    <option value="onlisans">Ön Lisans (2 Yıllık - KPSSP93)</option>
                    <option value="ortaogretim">Ortaöğretim (Lise - KPSSP94)</option>
                  </select>
                </div>

                {/* Atama Dönemi */}
                <div>
                  <label htmlFor="filter-period" className="block text-xs font-semibold text-slate-700 mb-1">
                    Atama Dönemi:
                  </label>
                  <select
                    id="filter-period"
                    value={filterPeriod}
                    onChange={(e) => {
                      setFilterPeriod(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full text-xs sm:text-sm py-2 px-3 border border-slate-300 bg-white text-slate-900 outline-none focus:border-red-700"
                  >
                    <option value="all">Tüm Dönemler (2024 - 2026)</option>
                    {periods.map((p) => (
                      <option key={p} value={p}>
                        KPSS {p} Yerleştirmesi
                      </option>
                    ))}
                  </select>
                </div>

                {/* İl Seçimi */}
                <div>
                  <label htmlFor="filter-city" className="block text-xs font-semibold text-slate-700 mb-1">
                    İl / Şehir:
                  </label>
                  <select
                    id="filter-city"
                    value={filterCity}
                    onChange={(e) => {
                      setFilterCity(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full text-xs sm:text-sm py-2 px-3 border border-slate-300 bg-white text-slate-900 outline-none focus:border-red-700"
                  >
                    <option value="all">Tüm İller (81 İl)</option>
                    {cities.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Nitelik Kodu Filtresi */}
                <div>
                  <label htmlFor="filter-qual-code" className="block text-xs font-semibold text-slate-700 mb-1">
                    Nitelik Kodu:
                  </label>
                  <input
                    id="filter-qual-code"
                    type="text"
                    value={filterQualificationCode}
                    onChange={(e) => {
                      setFilterQualificationCode(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="Örn: 4531, 3001, 7225"
                    className="w-full text-xs sm:text-sm py-2 px-3 border border-slate-300 bg-white text-slate-900 outline-none font-mono focus:border-red-700"
                  />
                </div>
              </div>

              {/* İkinci Satır Filtreler: Kurum/Unvan Metin ve Puan Aralığı */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3">
                <div className="sm:col-span-2">
                  <label htmlFor="filter-search-text" className="block text-xs font-semibold text-slate-700 mb-1">
                    Kurum Adı, Kadro Unvanı veya Anahtar Kelime:
                  </label>
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      id="filter-search-text"
                      type="text"
                      value={filterSearchText}
                      onChange={(e) => {
                        setFilterSearchText(e.target.value);
                        setCurrentPage(1);
                      }}
                      placeholder="Örn: Karayolları Genel Müdürlüğü, Mühendis, VHKİ, Ankara..."
                      className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-300 bg-white text-slate-900 outline-none focus:border-red-700"
                    />
                  </div>
                </div>

                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <label htmlFor="filter-min-score" className="block text-xs font-semibold text-slate-700 mb-1">
                      Taban Puan (Min):
                    </label>
                    <input
                      id="filter-min-score"
                      type="number"
                      step="0.01"
                      min="50"
                      max="100"
                      value={filterMinScore}
                      onChange={(e) => {
                        setFilterMinScore(e.target.value);
                        setCurrentPage(1);
                      }}
                      placeholder="Örn: 70"
                      className="w-full text-xs sm:text-sm py-2 px-3 border border-slate-300 bg-white text-slate-900 outline-none tabular-nums focus:border-red-700"
                    />
                  </div>
                  <div className="flex-1">
                    <label htmlFor="filter-max-score" className="block text-xs font-semibold text-slate-700 mb-1">
                      Taban Puan (Max):
                    </label>
                    <input
                      id="filter-max-score"
                      type="number"
                      step="0.01"
                      min="50"
                      max="100"
                      value={filterMaxScore}
                      onChange={(e) => {
                        setFilterMaxScore(e.target.value);
                        setCurrentPage(1);
                      }}
                      placeholder="Örn: 95"
                      className="w-full text-xs sm:text-sm py-2 px-3 border border-slate-300 bg-white text-slate-900 outline-none tabular-nums focus:border-red-700"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* İstatistik ve Sonuç Özeti Barı */}
            <div className="bg-slate-100 border border-slate-300 px-4 py-3 flex flex-wrap items-center justify-between gap-4 text-xs">
              <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                <div>
                  <span className="text-slate-500">Eşleşen Kadro:</span>{' '}
                  <strong className="text-slate-900 font-bold tabular-nums text-sm">
                    {filteredRecords.length.toLocaleString('tr-TR')}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500">Toplam Kontenjan:</span>{' '}
                  <strong className="text-slate-900 font-bold tabular-nums text-sm">
                    {totalQuota.toLocaleString('tr-TR')}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500">Yerleşen:</span>{' '}
                  <strong className="text-emerald-700 font-bold tabular-nums text-sm">
                    {totalPlaced.toLocaleString('tr-TR')}
                  </strong>
                </div>
                {avgMinScore && (
                  <div>
                    <span className="text-slate-500">Ortalama Taban Puan:</span>{' '}
                    <strong className="text-red-900 font-bold tabular-nums text-sm">
                      {avgMinScore}
                    </strong>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-500">Sayfa Başı:</span>
                <select
                  aria-label="Sayfa başına kayıt sayısı"
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="border border-slate-300 bg-white px-2 py-1 text-xs outline-none"
                >
                  <option value={15}>15</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>

            {/* Resmî Kadro Tablosu */}
            <div className="overflow-x-auto border border-slate-300 bg-white">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="bg-slate-200/80 border-b border-slate-300 text-slate-800 font-bold uppercase tracking-wider">
                    <th className="py-2.5 px-3 border-r border-slate-300">Kadro Kodu</th>
                    <th className="py-2.5 px-3 border-r border-slate-300">Dönem</th>
                    <th className="py-2.5 px-3 border-r border-slate-300">Düzey</th>
                    <th className="py-2.5 px-3 border-r border-slate-300 min-w-[180px]">Kurum Adı</th>
                    <th className="py-2.5 px-3 border-r border-slate-300 min-w-[160px]">Kadro Unvanı</th>
                    <th className="py-2.5 px-3 border-r border-slate-300">İl / İlçe</th>
                    <th className="py-2.5 px-3 border-r border-slate-300 text-center">Kont.</th>
                    <th className="py-2.5 px-3 border-r border-slate-300 text-right min-w-[100px]">Taban Puan</th>
                    <th className="py-2.5 px-3 border-r border-slate-300 text-right">Tavan Puan</th>
                    <th className="py-2.5 px-3 min-w-[200px]">Aranan Nitelik Kodları</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {paginatedRecords.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-slate-500 text-sm">
                        Seçilen kriterlere uygun merkezi atama kadrosu bulunamadı. Lütfen filtreleri gevşetip tekrar deneyiniz.
                      </td>
                    </tr>
                  ) : (
                    paginatedRecords.map((r, idx) => (
                      <tr
                        key={r.id}
                        className={`hover:bg-amber-50/50 transition-colors ${
                          idx % 2 === 1 ? 'bg-slate-50/50' : 'bg-white'
                        }`}
                      >
                        <td className="py-2 px-3 border-r border-slate-200 font-mono font-bold text-slate-700 tabular-nums">
                          {r.kadroKodu}
                        </td>
                        <td className="py-2 px-3 border-r border-slate-200 font-semibold text-slate-800 tabular-nums">
                          {r.donem}
                        </td>
                        <td className="py-2 px-3 border-r border-slate-200">
                          <span className="uppercase text-[11px] font-semibold px-1.5 py-0.5 bg-slate-100 border border-slate-300">
                            {r.ogrenimDuzeyi}
                          </span>
                        </td>
                        <td className="py-2 px-3 border-r border-slate-200 font-medium text-slate-900">
                          {r.kurumAdi}
                        </td>
                        <td className="py-2 px-3 border-r border-slate-200 text-slate-800">
                          {r.kadroUnvani}
                        </td>
                        <td className="py-2 px-3 border-r border-slate-200 text-slate-700 whitespace-nowrap">
                          {r.sehir}
                          {r.ilce ? ` / ${r.ilce}` : ''}
                        </td>
                        <td className="py-2 px-3 border-r border-slate-200 text-center font-bold text-slate-900 tabular-nums">
                          {r.kontenjan}
                        </td>
                        <td className="py-2 px-3 border-r border-slate-200 text-right font-mono font-bold text-red-800 tabular-nums">
                          {r.tabanPuan !== null ? r.tabanPuan.toFixed(5) : (
                            <span className="text-amber-700 font-normal">Dolmadı</span>
                          )}
                        </td>
                        <td className="py-2 px-3 border-r border-slate-200 text-right font-mono text-slate-600 tabular-nums">
                          {r.tavanPuan !== null ? r.tavanPuan.toFixed(5) : '-'}
                        </td>
                        <td className="py-2 px-3">
                          <div className="flex flex-wrap gap-1">
                            {r.nitelikKodlari.map((kod) => (
                              <button
                                key={kod}
                                type="button"
                                onClick={() => setActiveModalCode(kod)}
                                title="Nitelik açıklamasını görmek için tıklayın"
                                className="font-mono text-xs px-1.5 py-0.5 border border-slate-300 bg-slate-100 hover:bg-red-700 hover:text-white hover:border-red-700 text-slate-800 transition-colors"
                              >
                                {kod}
                              </button>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Sayfalama Kontrolleri */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-slate-600 pt-2 border-t border-slate-200">
              <div>
                Toplam <strong className="text-slate-900 font-bold tabular-nums">{filteredRecords.length}</strong> kayıttan{' '}
                <strong className="text-slate-900 font-bold tabular-nums">
                  {filteredRecords.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}
                </strong>{' '}
                -{' '}
                <strong className="text-slate-900 font-bold tabular-nums">
                  {Math.min(currentPage * pageSize, filteredRecords.length)}
                </strong>{' '}
                arası gösteriliyor.
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-medium flex items-center gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Önceki
                </button>
                <span className="px-3 py-1.5 border border-slate-300 bg-slate-100 font-bold tabular-nums text-slate-800">
                  {currentPage} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="px-3 py-1.5 border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-medium flex items-center gap-1"
                >
                  Sonraki
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Resmî Nitelik Kodu Açıklama Modalı */}
      {modalQualification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white border-2 border-slate-400 shadow-xl max-w-lg w-full p-6 relative animate-in fade-in zoom-in-95">
            <button
              type="button"
              onClick={() => setActiveModalCode(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-700 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl font-mono font-bold text-red-800 bg-red-50 px-2 py-0.5 border border-red-200">
                  {modalQualification.code}
                </span>
                <span className="text-xs font-semibold uppercase text-slate-600">
                  {modalQualification.category}
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 mt-1">
                {modalQualification.title}
              </h3>
            </div>

            <div className="py-4 space-y-3 text-xs">
              <div>
                <strong className="block text-slate-700 uppercase mb-1">Resmî Açıklama ve Şart:</strong>
                <p className="text-slate-800 bg-slate-50 border border-slate-200 p-3 leading-relaxed">
                  {modalQualification.desc}
                </p>
              </div>

              {modalQualification.departments.length > 0 && (
                <div>
                  <strong className="block text-slate-700 uppercase mb-1">
                    Bu Nitelik Koduna Sahip Bölümler ({modalQualification.departments.length}):
                  </strong>
                  <div className="max-h-36 overflow-y-auto border border-slate-200 divide-y divide-slate-100">
                    {modalQualification.departments.map((d) => (
                      <div key={d.id} className="p-1.5 text-slate-700 flex justify-between">
                        <span>{d.ad}</span>
                        <span className="font-mono text-slate-500 uppercase">{d.level}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-200 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setFilterQualificationCode(modalQualification.code);
                  setActiveTab('cadres');
                  setActiveModalCode(null);
                  setCurrentPage(1);
                }}
                className="flex-1 bg-red-700 hover:bg-red-800 text-white font-bold py-2 text-xs transition-colors"
              >
                Bu Kodun Atamalarını Filtrele
              </button>
              <button
                type="button"
                onClick={() => setActiveModalCode(null)}
                className="px-4 py-2 border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alt Bilgi Barı */}
      <footer className="mt-8 border-t border-slate-300 pt-4 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div>
          T.C. KPSS Merkezi Atama ve Nitelik Kodu Portalı &copy; 2024 - 2026. Resmî ÖSYM verileri referans alınmıştır.
        </div>
        <div className="flex items-center gap-4 text-slate-600">
          <span>Lisans: KPSSP3</span>
          <span>Ön Lisans: KPSSP93</span>
          <span>Ortaöğretim: KPSSP94</span>
        </div>
      </footer>
    </div>
  );
}
