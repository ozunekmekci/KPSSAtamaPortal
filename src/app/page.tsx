import { PLACEMENT_RECORDS } from '@/data/records';
import { DEPARTMENTS } from '@/data/departments';
import { QUALIFICATION_CODES } from '@/data/qualifications';
import { SPECIAL_CONDITIONS } from '@/data/special-conditions';

export default function HomePage() {
  const totalCadres = PLACEMENT_RECORDS.length;
  const totalQuota = PLACEMENT_RECORDS.reduce((sum, r) => sum + r.kontenjan, 0);
  const totalPlaced = PLACEMENT_RECORDS.reduce((sum, r) => sum + r.yerlesen, 0);
  const totalVacant = PLACEMENT_RECORDS.reduce((sum, r) => sum + r.bosKalan, 0);

  const lisansRecords = PLACEMENT_RECORDS.filter((r) => r.ogrenimDuzeyi === 'lisans');
  const onlisansRecords = PLACEMENT_RECORDS.filter((r) => r.ogrenimDuzeyi === 'onlisans');
  const ortaogretimRecords = PLACEMENT_RECORDS.filter((r) => r.ogrenimDuzeyi === 'ortaogretim');

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header Bar */}
      <header className="border-b border-slate-200 pb-6 dark:border-slate-800">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              KPSS Merkezi Atama Portalı (2024 - 2026)
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Lisans (KPSSP3), Ön Lisans (KPSSP93) ve Ortaöğretim (KPSSP94) merkezi yerleştirme analiz ve çift yönlü eşleştirme sistemi.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-950 dark:text-emerald-300">
              Veri Altyapısı Aktif
            </span>
            <span className="text-xs text-slate-500 tabular-nums">
              Dönemler: 2024/1, 2024/2, 2025/1
            </span>
          </div>
        </div>
      </header>

      {/* Metrics Row (Impeccable Operate Mode: Concise, tabular-nums, no cardocalypse) */}
      <section className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
        <div className="rounded border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="text-xs text-slate-500 dark:text-slate-400">Toplam Kadro</div>
          <div className="mt-1 text-2xl font-semibold tabular-nums text-slate-900 dark:text-slate-100">
            {totalCadres}
          </div>
        </div>
        <div className="rounded border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="text-xs text-slate-500 dark:text-slate-400">Toplam Kontenjan</div>
          <div className="mt-1 text-2xl font-semibold tabular-nums text-slate-900 dark:text-slate-100">
            {totalQuota.toLocaleString('tr-TR')}
          </div>
        </div>
        <div className="rounded border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="text-xs text-slate-500 dark:text-slate-400">Yerleşen Aday</div>
          <div className="mt-1 text-2xl font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
            {totalPlaced.toLocaleString('tr-TR')}
          </div>
        </div>
        <div className="rounded border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="text-xs text-slate-500 dark:text-slate-400">Boş Kalan Kontenjan</div>
          <div className="mt-1 text-2xl font-semibold tabular-nums text-amber-600 dark:text-amber-400">
            {totalVacant}
          </div>
        </div>
        <div className="rounded border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="text-xs text-slate-500 dark:text-slate-400">Kayıtlı Bölüm</div>
          <div className="mt-1 text-2xl font-semibold tabular-nums text-slate-900 dark:text-slate-100">
            {DEPARTMENTS.length}
          </div>
        </div>
        <div className="rounded border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="text-xs text-slate-500 dark:text-slate-400">Nitelik & Şart Kodu</div>
          <div className="mt-1 text-2xl font-semibold tabular-nums text-slate-900 dark:text-slate-100">
            {QUALIFICATION_CODES.length + SPECIAL_CONDITIONS.length}
          </div>
        </div>
      </section>

      {/* Level Summary Breakdown */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Öğrenim Düzeylerine Göre Dağılım
        </h2>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <span className="font-medium text-slate-900 dark:text-slate-100">Lisans (KPSSP3)</span>
              <span className="rounded bg-sky-100 px-2 py-0.5 text-xs font-semibold text-sky-800 dark:bg-sky-900/50 dark:text-sky-300">
                4 Yıllık
              </span>
            </div>
            <div className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              <span className="font-semibold tabular-nums text-slate-900 dark:text-slate-100">{lisansRecords.length}</span> kadro,{' '}
              <span className="font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                {lisansRecords.reduce((s, r) => s + r.kontenjan, 0)}
              </span>{' '}
              kontenjan
            </div>
          </div>
          <div className="rounded border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <span className="font-medium text-slate-900 dark:text-slate-100">Ön Lisans (KPSSP93)</span>
              <span className="rounded bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300">
                2 Yıllık
              </span>
            </div>
            <div className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              <span className="font-semibold tabular-nums text-slate-900 dark:text-slate-100">{onlisansRecords.length}</span> kadro,{' '}
              <span className="font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                {onlisansRecords.reduce((s, r) => s + r.kontenjan, 0)}
              </span>{' '}
              kontenjan
            </div>
          </div>
          <div className="rounded border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <span className="font-medium text-slate-900 dark:text-slate-100">Ortaöğretim (KPSSP94)</span>
              <span className="rounded bg-teal-100 px-2 py-0.5 text-xs font-semibold text-teal-800 dark:bg-teal-900/50 dark:text-teal-300">
                Lise
              </span>
            </div>
            <div className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              <span className="font-semibold tabular-nums text-slate-900 dark:text-slate-100">{ortaogretimRecords.length}</span> kadro,{' '}
              <span className="font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                {ortaogretimRecords.reduce((s, r) => s + r.kontenjan, 0)}
              </span>{' '}
              kontenjan
            </div>
          </div>
        </div>
      </section>

      {/* Baseline Recent Cadre Sample Table */}
      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Örnek Merkezi Yerleştirme Kayıtları
          </h2>
          <span className="text-xs text-slate-500 tabular-nums">İlk 10 kayıt gösteriliyor</span>
        </div>
        <div className="mt-3 overflow-x-auto rounded border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm dark:divide-slate-800">
            <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-600 dark:bg-slate-800 dark:text-slate-400">
              <tr>
                <th className="px-3 py-2.5">Kadro Kodu</th>
                <th className="px-3 py-2.5">Dönem</th>
                <th className="px-3 py-2.5">Düzey</th>
                <th className="px-3 py-2.5">Kurum Adı</th>
                <th className="px-3 py-2.5">Unvan</th>
                <th className="px-3 py-2.5">İl</th>
                <th className="px-3 py-2.5 text-right">Kontenjan</th>
                <th className="px-3 py-2.5 text-right">Taban Puan</th>
                <th className="px-3 py-2.5">Nitelik Kodları</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {PLACEMENT_RECORDS.slice(0, 10).map((record) => (
                <tr key={record.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <td className="px-3 py-2 font-mono text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                    {record.kadroKodu}
                  </td>
                  <td className="px-3 py-2 text-xs font-medium tabular-nums">{record.donem}</td>
                  <td className="px-3 py-2 text-xs uppercase text-slate-600 dark:text-slate-400">
                    {record.ogrenimDuzeyi}
                  </td>
                  <td className="px-3 py-2 font-medium text-slate-900 dark:text-slate-100 truncate max-w-xs">
                    {record.kurumAdi}
                  </td>
                  <td className="px-3 py-2 text-slate-700 dark:text-slate-300">{record.kadroUnvani}</td>
                  <td className="px-3 py-2 text-slate-600 dark:text-slate-400">{record.sehir}</td>
                  <td className="px-3 py-2 text-right font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                    {record.kontenjan}
                  </td>
                  <td className="px-3 py-2 text-right font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                    {record.tabanPuan !== null ? record.tabanPuan.toFixed(5) : 'Dolmadı'}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-1">
                      {record.nitelikKodlari.map((k) => (
                        <span
                          key={k}
                          className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        >
                          {k}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
