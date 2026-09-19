import '@testing-library/jest-dom/vitest';
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Header from '@/components/Header';
import SearchWorkbench from '@/components/SearchWorkbench';
import FilterSidebar from '@/components/FilterSidebar';
import CadreTable from '@/components/CadreTable';
import CadreDetailDrawer from '@/components/CadreDetailDrawer';
import AnalyticsPanel from '@/components/AnalyticsPanel';
import HomePage from '@/app/page';
import { PLACEMENT_RECORDS } from '@/data/records';
import { getFilterFacets } from '@/lib/filter-engine';

describe('KPSS Portal UI Components & Interactions (Milestone 4)', () => {
  const sampleRecords = PLACEMENT_RECORDS.slice(0, 15);
  const sampleRecord = sampleRecords[0];
  const facets = getFilterFacets(sampleRecords);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 1. Header Component Tests
  describe('Header Component', () => {
    it('renders Republic crest, title, and institutional metrics chips', () => {
      const onViewChange = vi.fn();
      render(
        <Header
          totalRecordsCount={PLACEMENT_RECORDS.length}
          filteredRecords={sampleRecords}
          activeView="table"
          onViewChange={onViewChange}
        />
      );

      expect(screen.getByText(/Türkiye Cumhuriyeti/i)).toBeInTheDocument();
      expect(screen.getByText(/KPSS Merkezi Yerleştirme ve Nitelik Kodu Portalı/i)).toBeInTheDocument();
      expect(screen.getByText(/Aktif Kadro:/i)).toBeInTheDocument();
      expect(screen.getByText(PLACEMENT_RECORDS.length.toLocaleString('tr-TR'))).toBeInTheDocument();
      expect(screen.getByText(/2024\/1, 2024\/2, 2025\/1/i)).toBeInTheDocument();
      expect(screen.getByText(/Dev Server:/i)).toBeInTheDocument();
      expect(screen.getByText(/Çevrimiçi \(3000\)/i)).toBeInTheDocument();

      const h1 = screen.getByRole('heading', { level: 1 });
      expect(h1).toHaveTextContent('KPSS Merkezi Yerleştirme ve Nitelik Kodu Portalı');
    });

    it('toggles view between table and analytics', () => {
      const onViewChange = vi.fn();
      render(
        <Header
          totalRecordsCount={PLACEMENT_RECORDS.length}
          filteredRecords={sampleRecords}
          activeView="table"
          onViewChange={onViewChange}
        />
      );

      const analyticsBtn = screen.getByRole('button', { name: /Analiz & Grafikler/i });
      fireEvent.click(analyticsBtn);
      expect(onViewChange).toHaveBeenCalledWith('analytics');

      const tableBtn = screen.getByRole('button', { name: /Kadro Tablosu/i });
      fireEvent.click(tableBtn);
      expect(onViewChange).toHaveBeenCalledWith('table');
    });

    it('handles CSV export button click', () => {
      const originalCreate = window.URL.createObjectURL;
      const originalRevoke = window.URL.revokeObjectURL;
      window.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
      window.URL.revokeObjectURL = vi.fn();

      render(
        <Header
          totalRecordsCount={PLACEMENT_RECORDS.length}
          filteredRecords={sampleRecords}
          activeView="table"
          onViewChange={vi.fn()}
        />
      );

      const exportBtn = screen.getByRole('button', { name: /CSV Olarak İndir/i });
      fireEvent.click(exportBtn);

      expect(window.URL.createObjectURL).toHaveBeenCalled();

      window.URL.createObjectURL = originalCreate;
      window.URL.revokeObjectURL = originalRevoke;
    });
  });

  // 2. SearchWorkbench Component Tests
  describe('SearchWorkbench Component', () => {
    it('renders Mode A (Bölümden Koda) by default with quick picks and results', () => {
      const onSelectDept = vi.fn();
      const onSelectCode = vi.fn();

      render(
        <SearchWorkbench
          onSelectDepartmentPlacements={onSelectDept}
          onSelectCodePlacements={onSelectCode}
        />
      );

      expect(screen.getByText(/Mod A: Bölümden Koda/i)).toBeInTheDocument();
      expect(screen.getByText(/Mod B: Koddan Bölüme \/ Şarta/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Mezun Olunan Akademik Bölüm/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Bilgisayar Mühendisliği/i).length).toBeGreaterThan(0);

      // Click "Bu Bölümün Atamalarını ve Taban Puanlarını Listele"
      const listBtn = screen.getByRole('button', { name: /Bu Bölümün Atamalarını ve Taban Puanlarını Listele/i });
      fireEvent.click(listBtn);
      expect(onSelectDept).toHaveBeenCalled();
    });

    it('switches to Mode B (Koddan Bölüme / Şarta) and looks up qualification codes', () => {
      const onSelectDept = vi.fn();
      const onSelectCode = vi.fn();

      render(
        <SearchWorkbench
          onSelectDepartmentPlacements={onSelectDept}
          onSelectCodePlacements={onSelectCode}
        />
      );

      // Switch to Mode B
      const modeBButton = screen.getByRole('button', { name: /Mod B: Koddan Bölüme/i });
      fireEvent.click(modeBButton);

      expect(screen.getByLabelText(/4 Haneli ÖSYM Nitelik Kodu Giriniz/i)).toBeInTheDocument();

      // Type code 3001
      const input = screen.getByLabelText(/4 Haneli ÖSYM Nitelik Kodu Giriniz/i);
      fireEvent.change(input, { target: { value: '3001' } });

      expect(screen.getAllByText(/3001/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/Herhangi bir önlisans programından mezun olmak/i)).toBeInTheDocument();

      // Click "Bu Kod ile Açılan Kadroları Listele"
      const listCodeBtn = screen.getByRole('button', { name: /Bu Kod ile Açılan Kadroları Listele/i });
      fireEvent.click(listCodeBtn);
      expect(onSelectCode).toHaveBeenCalledWith('3001');
    });

    it('filters departments using text input and supports quick pick chips', () => {
      render(
        <SearchWorkbench
          onSelectDepartmentPlacements={vi.fn()}
          onSelectCodePlacements={vi.fn()}
        />
      );

      const searchInput = screen.getByLabelText(/Mezun Olunan Akademik Bölüm/i);
      fireEvent.change(searchInput, { target: { value: 'Adalet' } });

      expect(screen.getAllByText(/Adalet/i).length).toBeGreaterThan(0);

      // Click a quick pick chip
      const hemsirelikChip = screen.getByRole('button', { name: 'Hemşirelik' });
      fireEvent.click(hemsirelikChip);
      expect(screen.getAllByText(/Hemşirelik/i).length).toBeGreaterThan(0);
    });
  });

  // 3. FilterSidebar Component Tests
  describe('FilterSidebar Component', () => {
    it('renders education level filter buttons and handles selection', () => {
      const onCriteriaChange = vi.fn();
      const onReset = vi.fn();

      render(
        <FilterSidebar
          criteria={{ page: 1, pageSize: 20 }}
          facets={facets}
          allRecords={sampleRecords}
          onCriteriaChange={onCriteriaChange}
          onReset={onReset}
        />
      );

      const lisansBtn = screen.getByRole('button', { name: /Lisans \(KPSSP3\)/i });
      fireEvent.click(lisansBtn);
      expect(onCriteriaChange).toHaveBeenCalledWith(expect.objectContaining({
        ogrenimDuzeyi: 'lisans',
        page: 1,
      }));
    });

    it('handles period checkbox toggle', () => {
      const onCriteriaChange = vi.fn();

      render(
        <FilterSidebar
          criteria={{ page: 1, pageSize: 20 }}
          facets={facets}
          allRecords={sampleRecords}
          onCriteriaChange={onCriteriaChange}
          onReset={vi.fn()}
        />
      );

      const period2024_1 = screen.getByRole('checkbox', { name: 'KPSS 2024/1' });
      fireEvent.click(period2024_1);
      expect(onCriteriaChange).toHaveBeenCalledWith(expect.objectContaining({
        donemler: ['2024/1'],
        page: 1,
      }));
    });

    it('handles min and max score inputs and resets all filters', () => {
      const onCriteriaChange = vi.fn();
      const onReset = vi.fn();

      render(
        <FilterSidebar
          criteria={{ minPuan: 75, maxPuan: 95 }}
          facets={facets}
          allRecords={sampleRecords}
          onCriteriaChange={onCriteriaChange}
          onReset={onReset}
        />
      );

      const minInput = screen.getByPlaceholderText('50.00');
      fireEvent.change(minInput, { target: { value: '80' } });
      expect(onCriteriaChange).toHaveBeenCalledWith(expect.objectContaining({
        minPuan: 80,
      }));

      const resetBtn = screen.getByRole('button', { name: /Sıfırla/i });
      fireEvent.click(resetBtn);
      expect(onReset).toHaveBeenCalled();
    });

    it('filters cities using Turkish diacritic-resilient search (izmir matches İZMİR)', () => {
      render(
        <FilterSidebar
          criteria={{ page: 1, pageSize: 20 }}
          facets={{ ...facets, cities: ['İZMİR', 'İSTANBUL', 'ANKARA'] }}
          allRecords={sampleRecords}
          onCriteriaChange={vi.fn()}
          onReset={vi.fn()}
        />
      );

      const cityInput = screen.getByPlaceholderText(/İl adına göre ara.../i);
      fireEvent.change(cityInput, { target: { value: 'izmir' } });
      expect(screen.getByText('İZMİR')).toBeInTheDocument();
      expect(screen.queryByText('ANKARA')).not.toBeInTheDocument();
    });
  });

  // 4. CadreTable Component Tests
  describe('CadreTable Component', () => {
    it('renders dense tabular rows with tabular numerals and ÖSYM columns', () => {
      const onSelectCadre = vi.fn();
      const onSelectCode = vi.fn();

      render(
        <CadreTable
          records={sampleRecords}
          allFilteredRecordsCount={sampleRecords.length}
          totalQuota={100}
          totalPlaced={95}
          totalVacant={5}
          avgMinScore="83.4500"
          currentPage={1}
          pageSize={20}
          sortBy="tabanPuanAsc"
          onSortChange={vi.fn()}
          onPageChange={vi.fn()}
          onPageSizeChange={vi.fn()}
          onSelectCadre={onSelectCadre}
          onSelectCode={onSelectCode}
        />
      );

      expect(screen.getByText(sampleRecord.kadroKodu)).toBeInTheDocument();
      expect(screen.getAllByText(sampleRecord.kurumAdi).length).toBeGreaterThan(0);
      expect(screen.getAllByText(sampleRecord.kadroUnvani).length).toBeGreaterThan(0);

      // Click first code badge
      const firstCode = sampleRecord.nitelikKodlari[0];
      const codeBadges = screen.getAllByRole('button', { name: new RegExp(firstCode) });
      fireEvent.click(codeBadges[0]);
      expect(onSelectCode).toHaveBeenCalledWith(firstCode);

      // Click inspect button
      const inspectButtons = screen.getAllByTitle(/Kadro detayını ve resmi şartları incele/i);
      fireEvent.click(inspectButtons[0]);
      expect(onSelectCadre).toHaveBeenCalledWith(sampleRecord);
    });

    it('handles column header sorting clicks', () => {
      const onSortChange = vi.fn();

      render(
        <CadreTable
          records={sampleRecords}
          allFilteredRecordsCount={sampleRecords.length}
          totalQuota={100}
          totalPlaced={95}
          totalVacant={5}
          avgMinScore="83.4500"
          currentPage={1}
          pageSize={20}
          sortBy="tabanPuanAsc"
          onSortChange={onSortChange}
          onPageChange={vi.fn()}
          onPageSizeChange={vi.fn()}
          onSelectCadre={vi.fn()}
          onSelectCode={vi.fn()}
        />
      );

      const puanHeader = screen.getByRole('button', { name: /Taban Puan/i });
      fireEvent.click(puanHeader);
      expect(onSortChange).toHaveBeenCalledWith('tabanPuanDesc');

      const kurumHeader = screen.getByRole('button', { name: /Kurum Adı/i });
      fireEvent.click(kurumHeader);
      expect(onSortChange).toHaveBeenCalledWith('kurumAdiAsc');
    });

    it('handles pagination navigation', () => {
      const onPageChange = vi.fn();
      const onPageSizeChange = vi.fn();

      render(
        <CadreTable
          records={sampleRecords}
          allFilteredRecordsCount={100}
          totalQuota={200}
          totalPlaced={190}
          totalVacant={10}
          avgMinScore="82.0000"
          currentPage={2}
          pageSize={20}
          sortBy="tabanPuanAsc"
          onSortChange={vi.fn()}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          onSelectCadre={vi.fn()}
          onSelectCode={vi.fn()}
        />
      );

      const prevBtn = screen.getByRole('button', { name: /Önceki/i });
      fireEvent.click(prevBtn);
      expect(onPageChange).toHaveBeenCalledWith(1);

      const nextBtn = screen.getByRole('button', { name: /Sonraki/i });
      fireEvent.click(nextBtn);
      expect(onPageChange).toHaveBeenCalledWith(3);
    });

    it('clamps currentPage safely when result count drops below current page', () => {
      render(
        <CadreTable
          records={[]}
          allFilteredRecordsCount={5}
          totalQuota={10}
          totalPlaced={10}
          totalVacant={0}
          avgMinScore="80.0000"
          currentPage={5}
          pageSize={20}
          sortBy="tabanPuanAsc"
          onSortChange={vi.fn()}
          onPageChange={vi.fn()}
          onPageSizeChange={vi.fn()}
          onSelectCadre={vi.fn()}
          onSelectCode={vi.fn()}
        />
      );
      const textDiv = screen.getByText(/arası listeleniyor/i);
      expect(textDiv).toHaveTextContent(/Toplam 5 kadrodan/i);
      expect(textDiv).toHaveTextContent(/1 - 5/);
      expect(screen.getByText('1 / 1')).toBeInTheDocument();
    });
  });

  // 5. CadreDetailDrawer Component Tests
  describe('CadreDetailDrawer Component', () => {
    it('renders full legal criteria and cadre specs when cadre is provided', () => {
      const onClose = vi.fn();
      const onFilterByCode = vi.fn();

      render(
        <CadreDetailDrawer
          cadre={sampleRecord}
          onClose={onClose}
          onFilterByCode={onFilterByCode}
        />
      );

      expect(screen.getByText(sampleRecord.kadroKodu)).toBeInTheDocument();
      expect(screen.getByText(sampleRecord.kurumAdi)).toBeInTheDocument();
      expect(screen.getByText((content) => content.includes(sampleRecord.kadroUnvani))).toBeInTheDocument();
      expect(screen.getByText(/Yerleştirme ve Kontenjan Sayısal Verileri/i)).toBeInTheDocument();
      expect(screen.getByText(/Kadro ve Teşkilat Özellikleri/i)).toBeInTheDocument();
      expect(screen.getByText((content) => content.includes('Aranan ÖSYM Nitelik Kodları'))).toBeInTheDocument();

      // Close button test
      const closeBtn = screen.getByLabelText(/Detay panelini kapat/i);
      fireEvent.click(closeBtn);
      expect(onClose).toHaveBeenCalled();
    });

    it('closes on Escape key press', () => {
      const onClose = vi.fn();

      render(
        <CadreDetailDrawer
          cadre={sampleRecord}
          onClose={onClose}
        />
      );

      fireEvent.keyDown(window, { key: 'Escape' });
      expect(onClose).toHaveBeenCalled();
    });
  });

  // 6. AnalyticsPanel Component Tests
  describe('AnalyticsPanel Component', () => {
    it('renders period score trends and toggles between sub-tabs', () => {
      render(
        <AnalyticsPanel
          records={sampleRecords}
        />
      );

      expect(screen.getByText(/Merkezi Yerleştirme İstatistik ve Analiz Paneli/i)).toBeInTheDocument();
      expect(screen.getByText(/Dönemler Arası Taban Puan Değişim Seyri/i)).toBeInTheDocument();

      // Toggle to Quota Distribution sub-tab
      const quotaTab = screen.getByRole('button', { name: /Kontenjan Dağılımı/i });
      fireEvent.click(quotaTab);
      expect(screen.getByText(/Öğrenim Düzeylerine Göre Kontenjan ve Doluluk Analizi/i)).toBeInTheDocument();

      // Toggle to Extremes sub-tab
      const extremesTab = screen.getByRole('button', { name: /Uç Değerler \(Min \/ Max\)/i });
      fireEvent.click(extremesTab);
      expect(screen.getByText(/En Düşük ve En Yüksek Taban Puanla Kapatan Kadrolar/i)).toBeInTheDocument();

      // Toggle to Histogram sub-tab
      const histogramTab = screen.getByRole('button', { name: /Puan Histogramı/i });
      fireEvent.click(histogramTab);
      expect(screen.getByText(/Taban Puan Frekans Dağılım Histogramı/i)).toBeInTheDocument();
    });
  });

  // 7. Full Integration HomePage Test
  describe('HomePage End-to-End Component Flow', () => {
    it('renders full portal shell, workbench, table and allows filtering', () => {
      render(<HomePage />);

      expect(screen.getByText(/KPSS Merkezi Yerleştirme ve Nitelik Kodu Portalı/i)).toBeInTheDocument();
      expect(screen.getByText(/Akıllı Arama ve Çift Yönlü Nitelik Eşleştirme Tezgahı/i)).toBeInTheDocument();
      expect(screen.getByText(/Filtreleme Paneli/i)).toBeInTheDocument();

      // View toggle to analytics
      const analyticsBtn = screen.getByRole('button', { name: /Analiz & Grafikler/i });
      fireEvent.click(analyticsBtn);
      expect(screen.getByText(/Merkezi Yerleştirme İstatistik ve Analiz Paneli/i)).toBeInTheDocument();

      // Switch back to table
      const tableBtn = screen.getByRole('button', { name: /Kadro Tablosu/i });
      fireEvent.click(tableBtn);
      expect(screen.getByText(/Filtreleme Paneli/i)).toBeInTheDocument();
    });
  });
});
