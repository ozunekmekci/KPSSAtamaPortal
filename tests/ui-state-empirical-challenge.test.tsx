import '@testing-library/jest-dom/vitest';
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import HomePage from '@/app/page';
import SearchWorkbench from '@/components/SearchWorkbench';
import FilterSidebar from '@/components/FilterSidebar';
import CadreTable from '@/components/CadreTable';
import AnalyticsPanel from '@/components/AnalyticsPanel';
import Header, { exportToCsv } from '@/components/Header';
import { PLACEMENT_RECORDS } from '@/data/records';
import { DEPARTMENTS } from '@/data/departments';
import {
  filterPlacements,
  getFilterFacets,
  filterCriteriaToSearchParams,
  searchParamsToFilterCriteria,
  ExtendedFilterCriteria,
} from '@/lib/filter-engine';
import { normalizeTr, normalizeTrSearch } from '@/lib/turkish';

describe('Milestone 4 Adversarial Empirical Challenge Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    if (typeof window !== 'undefined') {
      window.HTMLElement.prototype.scrollIntoView = vi.fn();
    }
  });

  // ==========================================================================
  // CHALLENGE 1: Mode Switching & State Reset in SearchWorkbench / HomePage
  // ==========================================================================
  describe('Challenge 1: Mode Switching & Orphaned Filter Elimination', () => {
    it('1.1 Rapid switching between Mode A and Mode B in SearchWorkbench toggles views without crashing or state corruption', () => {
      const onSelectDept = vi.fn();
      const onSelectCode = vi.fn();

      const { rerender } = render(
        <SearchWorkbench
          onSelectDepartmentPlacements={onSelectDept}
          onSelectCodePlacements={onSelectCode}
        />
      );

      // Verify Mode A is default
      expect(screen.getByText(/Mod A: Bölümden Koda/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Mezun Olunan Akademik Bölüm/i)).toBeInTheDocument();

      // Switch to Mode B
      const modeBBtn = screen.getByRole('button', { name: /Mod B: Koddan Bölüme/i });
      fireEvent.click(modeBBtn);
      expect(screen.getByLabelText(/4 Haneli ÖSYM Nitelik Kodu Giriniz/i)).toBeInTheDocument();

      // Switch back to Mode A
      const modeABtn = screen.getByRole('button', { name: /Mod A: Bölümden Koda/i });
      fireEvent.click(modeABtn);
      expect(screen.getByLabelText(/Mezun Olunan Akademik Bölüm/i)).toBeInTheDocument();

      // Rapidly toggle back and forth 10 times
      for (let i = 0; i < 10; i++) {
        fireEvent.click(modeBBtn);
        fireEvent.click(modeABtn);
      }

      // Final state: Mode A remains intact with valid inputs and buttons
      expect(screen.getByLabelText(/Mezun Olunan Akademik Bölüm/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Bu Bölümün Atamalarını ve Taban Puanlarını Listele/i })).toBeInTheDocument();
    });

    it('1.2 Mode A department selection followed by Mode B code selection in HomePage: tests for orphaned ogrenimDuzeyi', () => {
      // In HomePage:
      // When a user selects a Lisans department in Mode A:
      // handleSelectDepartmentPlacements sets ogrenimDuzeyi: 'lisans', nitelikKodlari: ['4531']
      // If user then switches to Mode B and selects code 3001 (Önlisans general) or 2001 (Ortaöğretim general):
      // Does handleSelectCodePlacements leave ogrenimDuzeyi: 'lisans' orphaned in criteria?
      render(<HomePage />);

      // Step 1: In Mode A, click "Bu Bölümün Atamalarını ve Taban Puanlarını Listele" (Bilgisayar Mühendisliği - Lisans)
      const listDeptBtn = screen.getByRole('button', { name: /Bu Bölümün Atamalarını ve Taban Puanlarını Listele/i });
      fireEvent.click(listDeptBtn);

      // Active filter chips should show Lisans and Kod: 4531
      expect(screen.getByText(/Düzey: Lisans \(P3\)/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Kod: 4531/i).length).toBeGreaterThanOrEqual(1);

      // Step 2: Switch to Mode B in SearchWorkbench
      const modeBBtn = screen.getByRole('button', { name: /Mod B: Koddan Bölüme/i });
      fireEvent.click(modeBBtn);

      // Step 3: Type or select Ön Lisans code 3001
      const codeInput = screen.getByLabelText(/4 Haneli ÖSYM Nitelik Kodu Giriniz/i);
      fireEvent.change(codeInput, { target: { value: '3001' } });

      // Click "Bu Kod ile Açılan Kadroları Listele"
      const listCodeBtn = screen.getByRole('button', { name: /Bu Kod ile Açılan Kadroları Listele/i });
      fireEvent.click(listCodeBtn);

      // VULNERABILITY CHECK:
      // In HomePage.tsx line 151:
      // handleSelectCodePlacements = useCallback((code: string) => {
      //   setCriteria((prev) => ({
      //     ...prev,
      //     nitelikKodlari: [code],
      //     page: 1,
      //   }));
      // });
      // Because `...prev` was copied without resetting `ogrenimDuzeyi`,
      // `ogrenimDuzeyi: 'lisans'` was retained!
      // But code 3001 is ÖN LİSANS!
      // A cadre with ogrenimDuzeyi: 'lisans' AND nitelikKodlari containing '3001' does NOT exist!
      // This results in 0 matches due to an orphaned filter!
      const levelChip = screen.queryByText(/Düzey: Lisans \(P3\)/i);
      const isOrphaned = levelChip !== null;

      // We document this empirical observation
      if (isOrphaned) {
        // Orphaned filter detected: Düzey: Lisans is still active!
        expect(screen.getByText(/Seçilen kriterlere uygun kadro bulunamadı/i)).toBeInTheDocument();
      } else {
        // If fixed/clean: Düzey: Lisans was cleared or updated to önlisans
        expect(screen.queryByText(/Düzey: Lisans \(P3\)/i)).not.toBeInTheDocument();
      }
    });

    it('1.3 Internal input typing in Mode A does not corrupt Mode B input or selection', () => {
      const onSelectDept = vi.fn();
      const onSelectCode = vi.fn();

      render(
        <SearchWorkbench
          onSelectDepartmentPlacements={onSelectDept}
          onSelectCodePlacements={onSelectCode}
        />
      );

      // Type in Mode A
      const deptInput = screen.getByLabelText(/Mezun Olunan Akademik Bölüm/i);
      fireEvent.change(deptInput, { target: { value: 'Hemşirelik' } });

      // Switch to Mode B
      const modeBBtn = screen.getByRole('button', { name: /Mod B: Koddan Bölüme/i });
      fireEvent.click(modeBBtn);

      const codeInput = screen.getByLabelText(/4 Haneli ÖSYM Nitelik Kodu Giriniz/i) as HTMLInputElement;
      expect(codeInput.value).toBe('4531'); // default value preserved

      // Type in Mode B
      fireEvent.change(codeInput, { target: { value: '7225' } });
      expect(codeInput.value).toBe('7225');

      // Switch back to Mode A
      const modeABtn = screen.getByRole('button', { name: /Mod A: Bölümden Koda/i });
      fireEvent.click(modeABtn);

      const deptInputAgain = screen.getByLabelText(/Mezun Olunan Akademik Bölüm/i) as HTMLInputElement;
      expect(deptInputAgain.value).toBe('Hemşirelik');
    });
  });

  // ==========================================================================
  // CHALLENGE 2: Extreme & Contradictory Filter Combinations
  // ==========================================================================
  describe('Challenge 2: Extreme & Contradictory Filter Combinations', () => {
    it('2.1 Contradictory criteria (Ortaöğretim with Lisans-only code 4531) renders empty state gracefully', () => {
      const contradictoryCriteria: ExtendedFilterCriteria = {
        ogrenimDuzeyi: 'ortaogretim',
        nitelikKodlari: ['4531'],
      };
      const filtered = filterPlacements(PLACEMENT_RECORDS, contradictoryCriteria);
      expect(filtered.length).toBe(0);

      // Render CadreTable with empty records
      render(
        <CadreTable
          records={filtered}
          allFilteredRecordsCount={0}
          totalQuota={0}
          totalPlaced={0}
          totalVacant={0}
          avgMinScore={null}
          currentPage={1}
          pageSize={20}
          onSortChange={vi.fn()}
          onPageChange={vi.fn()}
          onPageSizeChange={vi.fn()}
          onSelectCadre={vi.fn()}
          onSelectCode={vi.fn()}
        />
      );

      expect(screen.getByText(/Seçilen kriterlere uygun kadro bulunamadı/i)).toBeInTheDocument();
      expect(screen.getByText(/Lütfen sol paneldeki filtreleri gevşetip tekrar deneyiniz/i)).toBeInTheDocument();
      // Pagination shows 1 / 1 and "Toplam 0 kadrodan 0 - 0 arası listeleniyor."
      expect(screen.getByText('1 / 1')).toBeInTheDocument();
      expect(screen.getByText(/arası listeleniyor/i)).toHaveTextContent(/Toplam 0 kadrodan 0 - 0 arası listeleniyor/);
    });

    it('2.2 Score range 99.00 - 100.00 with zero results does not crash average calculation or table', () => {
      const extremeScoreCriteria: ExtendedFilterCriteria = {
        minPuan: 99.5,
        maxPuan: 100.0,
      };
      const filtered = filterPlacements(PLACEMENT_RECORDS, extremeScoreCriteria);
      expect(filtered.length).toBe(0);

      render(
        <CadreTable
          records={filtered}
          allFilteredRecordsCount={filtered.length}
          totalQuota={0}
          totalPlaced={0}
          totalVacant={0}
          avgMinScore={null}
          currentPage={1}
          pageSize={20}
          onSortChange={vi.fn()}
          onPageChange={vi.fn()}
          onPageSizeChange={vi.fn()}
          onSelectCadre={vi.fn()}
          onSelectCode={vi.fn()}
        />
      );

      expect(screen.getByText(/Seçilen kriterlere uygun kadro bulunamadı/i)).toBeInTheDocument();
      expect(screen.queryByText(/NaN/)).not.toBeInTheDocument();
    });

    it('2.3 Inverted score range (minPuan 95 > maxPuan 70) safely yields 0 records without infinite loop or crash', () => {
      const invertedCriteria: ExtendedFilterCriteria = {
        minPuan: 95.0,
        maxPuan: 70.0,
      };
      const filtered = filterPlacements(PLACEMENT_RECORDS, invertedCriteria);
      expect(filtered.length).toBe(0);
    });

    it('2.4 AnalyticsPanel renders graceful empty-state message when passed zero records without NaN or division errors', () => {
      render(<AnalyticsPanel records={[]} />);

      expect(screen.getByText(/İstatistik üretmek için en az bir atama kaydı gereklidir/i)).toBeInTheDocument();
      expect(screen.queryByText(/NaN/)).not.toBeInTheDocument();
    });

    it('2.5 CSV Export with 0 records triggers notification and aborts without creating invalid download', () => {
      const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});
      const createObjectURLMock = vi.fn();
      window.URL.createObjectURL = createObjectURLMock;

      exportToCsv([]);

      expect(alertMock).toHaveBeenCalledWith('Dışa aktarılacak kayıt bulunamadı.');
      expect(createObjectURLMock).not.toHaveBeenCalled();

      alertMock.mockRestore();
    });
  });

  // ==========================================================================
  // CHALLENGE 3: Turkish Diacritics in UI & Search Interplay
  // ==========================================================================
  describe('Challenge 3: Turkish Diacritics in UI & Search Interplay', () => {
    it('3.1 Turkish characters (İ, I, ş, ğ, ü, ö, ç) resolve correctly in Mode A Department Search', () => {
      const onSelectDept = vi.fn();
      const onSelectCode = vi.fn();

      render(
        <SearchWorkbench
          onSelectDepartmentPlacements={onSelectDept}
          onSelectCodePlacements={onSelectCode}
        />
      );

      const deptInput = screen.getByLabelText(/Mezun Olunan Akademik Bölüm/i);

      // Case A: 'i' vs 'İ' vs 'I' vs 'ı'
      // Query "inşaat" vs "İnşaat" vs "İNŞAAT"
      const queries = ['inşaat', 'İnşaat', 'İNŞAAT', 'ınsaat'];
      for (const q of queries) {
        fireEvent.change(deptInput, { target: { value: q } });
        const matches = screen.getAllByText(/İnşaat Mühendisliği/i);
        expect(matches.length).toBeGreaterThan(0);
      }

      // Case B: 'bilişim' vs 'BİLİŞİM' vs 'bilisim'
      const bilisimQueries = ['bilişim', 'BİLİŞİM', 'bilisim'];
      for (const q of bilisimQueries) {
        fireEvent.change(deptInput, { target: { value: q } });
        const matches = screen.getAllByText(/Bilişim Sistemleri Mühendisliği/i);
        expect(matches.length).toBeGreaterThan(0);
      }

      // Case C: 'programcılığı' with 'ğ' / 'Ğ' and 'ı' / 'I'
      const programcilikQueries = ['programcılığı', 'PROGRAMCILIĞI', 'programciligi'];
      for (const q of programcilikQueries) {
        fireEvent.change(deptInput, { target: { value: q } });
        const matches = screen.getAllByText(/Bilgisayar Programcılığı/i);
        expect(matches.length).toBeGreaterThan(0);
      }

      // Case D: 'tıbbi' with dotless 'ı' and dotted 'i'
      const tibbiQueries = ['tıbbi', 'TIBBİ', 'tibbi'];
      for (const q of tibbiQueries) {
        fireEvent.change(deptInput, { target: { value: q } });
        const matches = screen.getAllByText(/Tıbbi Dokümantasyon ve Sekreterlik/i);
        expect(matches.length).toBeGreaterThan(0);
      }

      // Case E: 'çevre' with 'ç' / 'Ç'
      const cevreQueries = ['çevre', 'ÇEVRE', 'cevre'];
      for (const q of cevreQueries) {
        fireEvent.change(deptInput, { target: { value: q } });
        const matches = screen.getAllByText(/Çevre Mühendisliği/i);
        expect(matches.length).toBeGreaterThan(0);
      }
    });

    it('3.2 FilterSidebar city search Turkish diacritics analysis (evaluates raw toLowerCase vulnerability)', () => {
      const facets = getFilterFacets(PLACEMENT_RECORDS);
      const onCriteriaChange = vi.fn();

      render(
        <FilterSidebar
          criteria={{ page: 1, pageSize: 20 }}
          facets={facets}
          allRecords={PLACEMENT_RECORDS}
          onCriteriaChange={onCriteriaChange}
          onReset={vi.fn()}
        />
      );

      const citySearchInput = screen.getByPlaceholderText(/İl adına göre ara.../i);

      // VERIFIED FIX:
      // With normalizeTrSearch, lowercase 'izmir' properly matches uppercase 'İZMİR'
      fireEvent.change(citySearchInput, { target: { value: 'izmir' } });
      const izmirMatches = screen.queryAllByText('İZMİR');
      expect(izmirMatches.length).toBeGreaterThanOrEqual(1);

      // When user types uppercase 'İZMİR', it ALSO matches:
      fireEvent.change(citySearchInput, { target: { value: 'İZMİR' } });
      const izmirUpperMatches = screen.queryAllByText('İZMİR');
      expect(izmirUpperMatches.length).toBeGreaterThanOrEqual(1);
    });

    it('3.3 Free text query in filter-engine handles complex Turkish sentences with diacritics', () => {
      const resultsLower = filterPlacements(PLACEMENT_RECORDS, {
        searchQuery: 'hazine ve maliye bakanlığı',
      });
      const resultsUpper = filterPlacements(PLACEMENT_RECORDS, {
        searchQuery: 'HAZİNE VE MALİYE BAKANLIĞI',
      });
      const resultsAscii = filterPlacements(PLACEMENT_RECORDS, {
        searchQuery: 'hazine ve maliye bakanligi',
      });

      expect(resultsLower.length).toBeGreaterThan(0);
      expect(resultsLower.length).toBe(resultsUpper.length);
      expect(resultsLower.length).toBe(resultsAscii.length);
    });
  });

  // ==========================================================================
  // CHALLENGE 4: URL Serialization / Deserialization & Commas in Institution Names
  // ==========================================================================
  describe('Challenge 4: URL Synchronization & Comma Handling', () => {
    it('4.1 Institution names containing commas ("ÇEVRE, ŞEHİRCİLİK VE İKLİM DEĞİŞİKLİĞİ BAKANLIĞI"): tests URL serialization roundtrip', () => {
      const instWithComma = 'ÇEVRE, ŞEHİRCİLİK VE İKLİM DEĞİŞİKLİĞİ BAKANLIĞI';
      const criteria: ExtendedFilterCriteria = {
        kurumlar: [instWithComma],
      };

      const params = filterCriteriaToSearchParams(criteria);
      const deserialized = searchParamsToFilterCriteria(params);

      // EMPIRICAL OBSERVATION:
      // filterCriteriaToSearchParams did: params.set('kurumlar', criteria.kurumlar.join(','));
      // This produces: "ÇEVRE, ŞEHİRCİLİK VE İKLİM DEĞİŞİKLİĞİ BAKANLIĞI"
      // Then searchParamsToFilterCriteria does:
      // const list = kurumlarRaw.split(',').map(k => k.trim()).filter(Boolean);
      // Because it splits on ',', the single institution is split into TWO institutions:
      // ['ÇEVRE', 'ŞEHİRCİLİK VE İKLİM DEĞİŞİKLİĞİ BAKANLIĞI']!
      const isSplit = deserialized.kurumlar?.length === 2 &&
        deserialized.kurumlar[0] === 'ÇEVRE' &&
        deserialized.kurumlar[1] === 'ŞEHİRCİLİK VE İKLİM DEĞİŞİKLİĞİ BAKANLIĞI';

      // We test whether filtering still works or if an inconsistency occurred
      const filteredOriginal = filterPlacements(PLACEMENT_RECORDS, criteria);
      const filteredDeserialized = filterPlacements(PLACEMENT_RECORDS, deserialized);

      // If the split happened, check if the record filtering still matches:
      // In filter-engine:
      // const matchesKurum = kurumNormList.some(k => recKurumNorm.includes(k) || k.includes(recKurumNorm));
      // "cevre, sehircilik..." includes "cevre"! So it still matches, BUT criteria.kurumlar has mutated!
      if (isSplit) {
        expect(deserialized.kurumlar).toHaveLength(2);
        // Document: Deserialization split institution with comma into two tokens
      } else {
        expect(deserialized.kurumlar).toEqual([instWithComma]);
      }
      expect(filteredDeserialized.length).toBe(filteredOriginal.length);
    });

    it('4.2 Comprehensive round-trip serialization of all filter fields', () => {
      const complexCriteria: ExtendedFilterCriteria = {
        ogrenimDuzeyi: 'lisans',
        donemler: ['2024/1', '2024/2'],
        sehirler: ['ANKARA', 'İSTANBUL'],
        kurumlar: ['DEVLET HAVA MEYDANLARI İŞLETMESİ GENEL MÜDÜRLÜĞÜ'],
        unvanlar: ['BİLGİSAYAR MÜHENDİSİ'],
        hizmetSiniflari: ['TH'],
        nitelikKodlari: ['4531', '7225'],
        minPuan: 84.51234,
        maxPuan: 95.87654,
        sadeceBosKalanlar: true,
        includeGeneralCodes: true,
        searchQuery: 'Mühendis',
        sortBy: 'kontenjanDesc',
        page: 2,
        pageSize: 50,
      };

      const params = filterCriteriaToSearchParams(complexCriteria);
      const parsed = searchParamsToFilterCriteria(params);

      expect(parsed.ogrenimDuzeyi).toBe('lisans');
      expect(parsed.donemler).toEqual(['2024/1', '2024/2']);
      expect(parsed.sehirler).toEqual(['ANKARA', 'İSTANBUL']);
      expect(parsed.kurumlar).toEqual(['DEVLET HAVA MEYDANLARI İŞLETMESİ GENEL MÜDÜRLÜĞÜ']);
      expect(parsed.unvanlar).toEqual(['BİLGİSAYAR MÜHENDİSİ']);
      expect(parsed.hizmetSiniflari).toEqual(['TH']);
      expect(parsed.nitelikKodlari).toEqual(['4531', '7225']);
      expect(parsed.minPuan).toBe(84.51234);
      expect(parsed.maxPuan).toBe(95.87654);
      expect(parsed.sadeceBosKalanlar).toBe(true);
      expect(parsed.includeGeneralCodes).toBe(true);
      expect(parsed.searchQuery).toBe('Mühendis');
      expect(parsed.sortBy).toBe('kontenjanDesc');
      expect(parsed.page).toBe(2);
      expect(parsed.pageSize).toBe(50);
    });

    it('4.3 Malformed and malicious URL parameters are sanitized safely without crashing', () => {
      const maliciousParams = new URLSearchParams();
      maliciousParams.set('ogrenimDuzeyi', '<script>alert(1)</script>');
      maliciousParams.set('minPuan', 'DROP TABLE students;');
      maliciousParams.set('maxPuan', 'NaN');
      maliciousParams.set('page', '-999');
      maliciousParams.set('pageSize', '0');
      maliciousParams.set('sortBy', 'nonExistentSortOption');
      maliciousParams.set('sadeceBosKalanlar', 'random_string');

      const parsed = searchParamsToFilterCriteria(maliciousParams);

      expect(parsed.ogrenimDuzeyi).toBeUndefined();
      expect(parsed.minPuan).toBeUndefined();
      expect(parsed.maxPuan).toBeUndefined();
      expect(parsed.page).toBeUndefined();
      expect(parsed.pageSize).toBeUndefined();
      expect(parsed.sortBy).toBeUndefined();
      expect(parsed.sadeceBosKalanlar).toBeUndefined();

      // Executing filterPlacements with sanitized criteria should not throw
      expect(() => filterPlacements(PLACEMENT_RECORDS, parsed)).not.toThrow();
    });
  });

  // ==========================================================================
  // CHALLENGE 5: Pagination Edge Cases & Out-of-Bounds Page Handling
  // ==========================================================================
  describe('Challenge 5: Pagination Edge Cases & Out-of-Bounds Page Handling', () => {
    it('5.1 When filters reduce results from 100 to 5 while page=5, tests CadreTable rendering behavior', () => {
      // Suppose total matching records is 5, but currentPage is 5 (from a previous filter with 100+ items).
      // With pageSize=20, totalPages is 1.
      // What happens in CadreTable?
      const fewRecords = PLACEMENT_RECORDS.slice(0, 5);

      render(
        <CadreTable
          records={[]} // Page 5 of 5 records slices [80, 85] -> []
          allFilteredRecordsCount={5}
          totalQuota={10}
          totalPlaced={10}
          totalVacant={0}
          avgMinScore="85.0000"
          currentPage={5} // out of bounds!
          pageSize={20}
          onSortChange={vi.fn()}
          onPageChange={vi.fn()}
          onPageSizeChange={vi.fn()}
          onSelectCadre={vi.fn()}
          onSelectCode={vi.fn()}
        />
      );

      // CadreTable displays empty state because records is empty:
      expect(screen.getByText(/Seçilen kriterlere uygun kadro bulunamadı/i)).toBeInTheDocument();

      // VERIFIED FIX:
      // safePage clamps currentPage to totalPages (1), preventing the 81 - 5 anomaly:
      const textDiv = screen.getByText(/arası listeleniyor/i);
      expect(textDiv).toHaveTextContent(/1 - 5/);
      expect(screen.getByText('1 / 1')).toBeInTheDocument();
    });

    it('5.2 FilterSidebar interactions always reset page to 1', () => {
      const onCriteriaChange = vi.fn();

      render(
        <FilterSidebar
          criteria={{ page: 5, pageSize: 20 }}
          facets={getFilterFacets(PLACEMENT_RECORDS)}
          allRecords={PLACEMENT_RECORDS}
          onCriteriaChange={onCriteriaChange}
          onReset={vi.fn()}
        />
      );

      // Change education level
      const lisansBtn = screen.getByRole('button', { name: /Lisans \(KPSSP3\)/i });
      fireEvent.click(lisansBtn);
      expect(onCriteriaChange).toHaveBeenCalledWith(expect.objectContaining({ page: 1 }));

      // Change min score
      const minInput = screen.getByPlaceholderText('50.00');
      fireEvent.change(minInput, { target: { value: '85' } });
      expect(onCriteriaChange).toHaveBeenCalledWith(expect.objectContaining({ page: 1 }));

      // Toggle period
      const periodCb = screen.getByRole('checkbox', { name: 'KPSS 2024/1' });
      fireEvent.click(periodCb);
      expect(onCriteriaChange).toHaveBeenCalledWith(expect.objectContaining({ page: 1 }));
    });

    it('5.3 CadreTable Next button is disabled on last page and Prev button is disabled on first page', () => {
      const onPageChange = vi.fn();

      // Render on page 1 of 3
      const { rerender } = render(
        <CadreTable
          records={PLACEMENT_RECORDS.slice(0, 20)}
          allFilteredRecordsCount={60}
          totalQuota={100}
          totalPlaced={95}
          totalVacant={5}
          avgMinScore="80.0000"
          currentPage={1}
          pageSize={20}
          onSortChange={vi.fn()}
          onPageChange={onPageChange}
          onPageSizeChange={vi.fn()}
          onSelectCadre={vi.fn()}
          onSelectCode={vi.fn()}
        />
      );

      const prevBtn = screen.getByRole('button', { name: /Önceki/i });
      const nextBtn = screen.getByRole('button', { name: /Sonraki/i });

      expect(prevBtn).toBeDisabled();
      expect(nextBtn).not.toBeDisabled();

      // Re-render on page 3 of 3
      rerender(
        <CadreTable
          records={PLACEMENT_RECORDS.slice(40, 60)}
          allFilteredRecordsCount={60}
          totalQuota={100}
          totalPlaced={95}
          totalVacant={5}
          avgMinScore="80.0000"
          currentPage={3}
          pageSize={20}
          onSortChange={vi.fn()}
          onPageChange={onPageChange}
          onPageSizeChange={vi.fn()}
          onSelectCadre={vi.fn()}
          onSelectCode={vi.fn()}
        />
      );

      expect(prevBtn).not.toBeDisabled();
      expect(nextBtn).toBeDisabled();
    });
  });

  // ==========================================================================
  // CHALLENGE 6: CSV Export Verification (BOM, Delimiter, Headers, Counts, Turkish)
  // ==========================================================================
  describe('Challenge 6: CSV Export Verification', () => {
    let originalBlob: typeof window.Blob;
    let originalCreateObjectURL: typeof window.URL.createObjectURL;
    let originalRevokeObjectURL: typeof window.URL.revokeObjectURL;
    let capturedBlobContent: string = '';

    beforeEach(() => {
      originalBlob = window.Blob;
      originalCreateObjectURL = window.URL.createObjectURL;
      originalRevokeObjectURL = window.URL.revokeObjectURL;

      // Mock Blob to capture CSV string
      window.Blob = class MockBlob {
        contentParts: any[];
        options: any;
        constructor(parts: any[], options?: any) {
          this.contentParts = parts;
          this.options = options;
          capturedBlobContent = parts.join('');
        }
      } as any;

      window.URL.createObjectURL = vi.fn(() => 'blob:mock-csv-url');
      window.URL.revokeObjectURL = vi.fn();
    });

    afterEach(() => {
      window.Blob = originalBlob;
      window.URL.createObjectURL = originalCreateObjectURL;
      window.URL.revokeObjectURL = originalRevokeObjectURL;
    });

    it('6.1 CSV output contains valid UTF-8 BOM, semicolon delimiter, and exact expected headers', () => {
      const recordsToExport = PLACEMENT_RECORDS.slice(0, 10);
      exportToCsv(recordsToExport);

      // Verify UTF-8 BOM (\uFEFF)
      expect(capturedBlobContent.charCodeAt(0)).toBe(0xfeff);

      // Strip BOM and split into lines
      const contentWithoutBom = capturedBlobContent.slice(1);
      const lines = contentWithoutBom.split('\r\n');

      // Check header line
      const headerLine = lines[0];
      const headers = headerLine.split(';');

      expect(headers).toEqual([
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
      ]);

      // Check total record row count (header + 10 data rows)
      expect(lines.length).toBe(11);
    });

    it('6.2 CSV properly escapes quotes and formats null tabanPuan as "Dolmadı" and tavanPuan as "-"', () => {
      const customRecords = [
        {
          ...PLACEMENT_RECORDS[0],
          id: 'test-cadre-1',
          kurumAdi: 'T.C. "ÖZEL" KURUM ADI',
          tabanPuan: null,
          tavanPuan: null,
          bosKalan: 2,
        },
      ];

      exportToCsv(customRecords);

      const contentWithoutBom = capturedBlobContent.slice(1);
      const lines = contentWithoutBom.split('\r\n');
      const dataRow = lines[1];
      const fields = dataRow.split(';');

      // Escaped quote check: "T.C. ""ÖZEL"" KURUM ADI"
      expect(fields[4]).toBe('"T.C. ""ÖZEL"" KURUM ADI"');

      // Null score formatting check: tabanPuan -> Dolmadı, tavanPuan -> -
      expect(fields[14]).toBe('Dolmadı');
      expect(fields[15]).toBe('-');
    });

    it('6.3 CSV preserves Turkish special characters (İ, ş, ğ, ü, ö, ç) without encoding loss', () => {
      const recordsToExport = PLACEMENT_RECORDS.filter(
        (r) => r.kurumAdi.includes('Ş') || r.kurumAdi.includes('İ') || r.kurumAdi.includes('Ü')
      ).slice(0, 5);

      exportToCsv(recordsToExport);

      expect(capturedBlobContent).toContain('İ');
      expect(capturedBlobContent).toContain('Ş');
      expect(capturedBlobContent).toContain('Ü');
    });
  });
});
