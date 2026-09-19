import type { Metadata, Viewport } from 'next';
import './globals.css';
import SeoStructuredData from '@/components/SeoStructuredData';
import CookieBanner from '@/components/CookieBanner';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://kpssportal.pages.dev';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#b91c1c',
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'KPSS Atama ve Nitelik Kodu Portalı | 2024–2026 Taban Puanlar',
    template: '%s | T.C. KPSS Atama Portalı',
  },
  description:
    '2024-2026 KPSS B Grubu merkezi yerleştirme kadroları, lisans (KPSSP3), önlisans (KPSSP93) ve ortaöğretim (KPSSP94) taban puanları, nitelik kodu arama ve bölüm eşleştirme rehberi.',
  keywords: [
    'KPSS',
    'KPSS Atama',
    'KPSS Taban Puanları',
    'Nitelik Kodu',
    'Nitelik Kodu Arama',
    '4001 Nitelik Kodu',
    '3001 Nitelik Kodu',
    '2001 Nitelik Kodu',
    'KPSS Merkezi Atama',
    'ÖSYM Kadro Dağılımı',
    'Lisans KPSS',
    'Ön Lisans KPSS',
    'Ortaöğretim KPSS',
    'KPSSP3',
    'KPSSP93',
    'KPSSP94',
    'KPSS Tercih Kılavuzu',
    'Bölüm Nitelik Kodları',
    'Memur Atamaları',
    '2024 KPSS',
    '2025 KPSS',
    '2026 KPSS',
  ],
  authors: [{ name: 'KPSS Atama Portalı Araştırma Masası' }],
  creator: 'KPSS Atama Portalı',
  publisher: 'T.C. Kamu Atama Rehberi',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'KPSS Atama ve Nitelik Kodu Portalı (2024 - 2026)',
    description:
      '2024-2026 KPSS merkezi atama kadrolarını, 81 il taban ve tavan puanlarını inceleyin. Bölümünüze özel nitelik kodlarını anında keşfedin.',
    url: siteUrl,
    siteName: 'KPSS Atama Portalı',
    locale: 'tr_TR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'KPSS Atama ve Nitelik Kodu Portalı (2024 - 2026)',
    description:
      'KPSS merkezi yerleştirme kadroları, nitelik kodu arama ve taban puan analiz motoru.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" className="light" style={{ colorScheme: 'light' }}>
      <head>
        <SeoStructuredData />
      </head>
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased font-sans">
        {children}
        <CookieBanner />
      </body>
    </html>
  );
}
