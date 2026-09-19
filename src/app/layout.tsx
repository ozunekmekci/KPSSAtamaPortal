import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'T.C. KPSS Atama ve Nitelik Kodu Portalı (2024 - 2026)',
  description: '2024-2026 KPSS B Grubu merkezi yerleştirme verileri, çift yönlü nitelik kodu ve bölüm eşleştirme, taban puan ve kontenjan analiz portalı.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" className="light" style={{ colorScheme: 'light' }}>
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
