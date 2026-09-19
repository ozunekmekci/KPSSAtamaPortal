import { ImageResponse } from 'next/og';

export const alt = 'T.C. KPSS Atama ve Nitelik Kodu Portalı (2024 - 2026)';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '60px',
          background: '#f8fafc',
          border: '16px solid #b91c1c',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Top Emblem Row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '40px',
              background: '#b91c1c',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 900,
            }}
          >
            <span style={{ fontSize: '18px' }}>T.C.</span>
            <span style={{ fontSize: '22px' }}>KPSS</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span
              style={{
                fontSize: '18px',
                fontWeight: 700,
                color: '#b91c1c',
                textTransform: 'uppercase',
                letterSpacing: '1px',
              }}
            >
              Türkiye Cumhuriyeti Kamu Görevleri Merkezi Yerleştirme Portalı
            </span>
            <span style={{ fontSize: '14px', color: '#64748b' }}>
              Resmî ÖSYM Verileri ile 2024–2026 Tercih ve Analiz Rehberi
            </span>
          </div>
        </div>

        {/* Center Title */}
        <div style={{ display: 'flex', flexDirection: 'column', margin: '30px 0' }}>
          <h1
            style={{
              fontSize: '48px',
              fontWeight: 900,
              color: '#0f172a',
              lineHeight: 1.15,
              margin: '0 0 16px 0',
            }}
          >
            KPSS Atama, Taban Puan ve Nitelik Kodu Arama Portalı
          </h1>
          <p
            style={{
              fontSize: '24px',
              color: '#334155',
              lineHeight: 1.4,
              margin: 0,
            }}
          >
            Bölümünüzü seçerek ÖSYM nitelik kodlarını (4001, 3001, 2001) otomatik eşleştirin; 81 ilin merkezi atama kadrolarını ve taban puanlarını inceleyin.
          </p>
        </div>

        {/* Bottom Feature Badges */}
        <div style={{ display: 'flex', gap: '16px' }}>
          <div
            style={{
              background: 'white',
              border: '2px solid #e2e8f0',
              padding: '12px 20px',
              fontSize: '18px',
              fontWeight: 700,
              color: '#1e293b',
              display: 'flex',
            }}
          >
            Lisans (KPSSP3)
          </div>
          <div
            style={{
              background: 'white',
              border: '2px solid #e2e8f0',
              padding: '12px 20px',
              fontSize: '18px',
              fontWeight: 700,
              color: '#1e293b',
              display: 'flex',
            }}
          >
            Ön Lisans (KPSSP93)
          </div>
          <div
            style={{
              background: 'white',
              border: '2px solid #e2e8f0',
              padding: '12px 20px',
              fontSize: '18px',
              fontWeight: 700,
              color: '#1e293b',
              display: 'flex',
            }}
          >
            Ortaöğretim (KPSSP94)
          </div>
          <div
            style={{
              background: '#fef2f2',
              border: '2px solid #fecaca',
              padding: '12px 20px',
              fontSize: '18px',
              fontWeight: 700,
              color: '#991b1b',
              display: 'flex',
            }}
          >
            2024/1 • 2024/2 • 2025/1
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
