import { ImageResponse } from 'next/og';

export const size = {
  width: 32,
  height: 32,
};
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 14,
          background: '#b91c1c',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: 900,
          letterSpacing: '-0.5px',
          borderRadius: 6,
          border: '1px solid #7f1d1d',
          lineHeight: 1,
        }}
      >
        <span style={{ fontSize: 9, opacity: 0.9 }}>T.C.</span>
        <span style={{ fontSize: 11, fontWeight: 900 }}>KPSS</span>
      </div>
    ),
    {
      ...size,
    }
  );
}
