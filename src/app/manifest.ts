import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'T.C. KPSS Atama ve Nitelik Kodu Portalı',
    short_name: 'KPSS Portal',
    description: '2024-2026 KPSS B Grubu merkezi yerleştirme verileri, çift yönlü nitelik kodu ve bölüm eşleştirme rehberi.',
    start_url: '/',
    display: 'standalone',
    background_color: '#f8fafc',
    theme_color: '#b91c1c',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  };
}
