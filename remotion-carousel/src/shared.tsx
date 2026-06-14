import React from 'react';
import { OffthreadVideo, Img, useCurrentFrame, interpolate, staticFile } from 'remotion';
import { FONTS, SLIDE_DURATION, withAlpha } from './theme';

// ── Источник медиа: staticFile для относительных путей, иначе как есть ─────────
export function resolveSrc(src: string): string {
  if (/^https?:\/\//.test(src) || src.startsWith('data:')) return src;
  try {
    return staticFile(src);
  } catch {
    return src;
  }
}

// ── Фоновое видео (HeyGen-клип) с лёгким зумом ────────────────────────────────
export const VideoBackground: React.FC<{ src: string; opacity?: number; muted?: boolean }> = ({
  src,
  opacity = 1,
  muted = true,
}) => {
  const frame = useCurrentFrame();
  const scale = interpolate(frame, [0, SLIDE_DURATION], [1.05, 1.18]);
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', opacity }}>
      <OffthreadVideo
        src={resolveSrc(src)}
        muted={muted}
        style={{ width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${scale})` }}
      />
    </div>
  );
};

// ── Картинка с эффектом Кена Бёрнса ──────────────────────────────────────────
export const KenBurnsImage: React.FC<{ src: string; style?: React.CSSProperties }> = ({ src, style }) => {
  const frame = useCurrentFrame();
  const scale = interpolate(frame, [0, SLIDE_DURATION], [1.0, 1.14]);
  const x = interpolate(frame, [0, SLIDE_DURATION], [-14, 14]);
  return (
    <div style={{ overflow: 'hidden', ...style }}>
      <Img
        src={resolveSrc(src)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: `scale(${scale}) translateX(${x}px)`,
        }}
      />
    </div>
  );
};

// ── Видео-карточка (вставка-окно), не во весь экран ──────────────────────────
export const VideoCard: React.FC<{ src: string; style?: React.CSSProperties; radius?: number }> = ({
  src,
  style,
  radius = 28,
}) => (
  <div style={{ overflow: 'hidden', borderRadius: radius, ...style }}>
    <OffthreadVideo
      src={resolveSrc(src)}
      muted
      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
    />
  </div>
);

// ── SVG-значок Telegram (#2AABEE) ────────────────────────────────────────────
export const TelegramIcon: React.FC<{ size?: number; glow?: boolean }> = ({ size = 120, glow = true }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 240 240"
    xmlns="http://www.w3.org/2000/svg"
    style={glow ? { filter: 'drop-shadow(0 0 24px rgba(42,171,238,0.7))' } : undefined}
  >
    <defs>
      <linearGradient id="tg-grad" x1="0.5" y1="0" x2="0.5" y2="1">
        <stop offset="0" stopColor="#2AABEE" />
        <stop offset="1" stopColor="#229ED9" />
      </linearGradient>
    </defs>
    <circle cx="120" cy="120" r="120" fill="url(#tg-grad)" />
    <path
      fill="#fff"
      d="M53.9 118.8c34.9-15.2 58.2-25.2 69.8-30.1 33.2-13.8 40.1-16.2 44.6-16.3 1 0 3.2.2 4.7 1.4 1.2 1 1.5 2.3 1.7 3.3.2 1 .4 3.1.2 4.8-1.8 19.2-9.7 65.7-13.7 87.2-1.7 9.1-5 12.2-8.2 12.5-7 .6-12.3-4.6-19-9-10.5-6.9-16.4-11.2-26.6-17.9-11.8-7.8-4.2-12.1 2.6-19.1 1.8-1.8 32.5-29.8 33.1-32.3.1-.3.1-1.5-.6-2.1-.7-.6-1.7-.4-2.5-.2-1.1.2-18 11.4-50.8 33.6-4.8 3.3-9.2 4.9-13.1 4.8-4.3-.1-12.6-2.4-18.8-4.5-7.5-2.4-13.5-3.7-13-7.9.3-2.1 3.3-4.3 9.1-6.6z"
    />
  </svg>
);

// ── Шапка с брендом и счётчиком слайдов ──────────────────────────────────────
export const Header: React.FC<{
  brand: string;
  slideNum: number;
  total: number;
  accent: string;
  font?: string;
  color?: string;
}> = ({ brand, slideNum, total, accent, font = FONTS.inter, color = 'rgba(255,255,255,0.5)' }) => (
  <div
    style={{
      position: 'absolute',
      top: 64,
      left: 68,
      right: 68,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      zIndex: 30,
    }}
  >
    <span style={{ color, fontSize: 28, fontFamily: font, letterSpacing: 0.5, fontWeight: 600 }}>{brand}</span>
    <span
      style={{
        color: accent,
        fontSize: 32,
        fontFamily: FONTS.bebas,
        letterSpacing: 4,
        textShadow: `0 0 16px ${withAlpha(accent, 0.5)}`,
      }}
    >
      {String(slideNum).padStart(2, '0')} / {String(total).padStart(2, '0')}
    </span>
  </div>
);

// ── Прогресс-бар внизу ────────────────────────────────────────────────────────
export const ProgressBar: React.FC<{ progress: number; accent: string; track?: string }> = ({
  progress,
  accent,
  track = 'rgba(255,255,255,0.12)',
}) => (
  <div
    style={{
      position: 'absolute',
      bottom: 56,
      left: 68,
      right: 68,
      height: 5,
      background: track,
      borderRadius: 3,
      zIndex: 30,
    }}
  >
    <div
      style={{
        height: '100%',
        width: `${progress * 100}%`,
        background: accent,
        borderRadius: 3,
        boxShadow: `0 0 12px ${accent}`,
      }}
    />
  </div>
);

// ── Мокап профиля Instagram (для CTA-слайда) ─────────────────────────────────
export const InstagramProfileMockup: React.FC<{ handle: string; accent: string; image?: string }> = ({
  handle,
  accent,
  image,
}) => (
  <div
    style={{
      width: 520,
      background: 'rgba(255,255,255,0.96)',
      borderRadius: 28,
      padding: '26px 28px',
      boxShadow: '0 24px 60px rgba(0,0,0,0.45)',
      display: 'flex',
      alignItems: 'center',
      gap: 22,
    }}
  >
    <div
      style={{
        width: 92,
        height: 92,
        borderRadius: '50%',
        flexShrink: 0,
        background: image
          ? undefined
          : `conic-gradient(from 30deg, #feda75, #d62976, #962fbf, #4f5bd5, #feda75)`,
        padding: 4,
        display: 'flex',
      }}
    >
      <div
        style={{
          flex: 1,
          borderRadius: '50%',
          background: '#fff',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 40,
        }}
      >
        {image ? (
          <Img src={resolveSrc(image)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          '👤'
        )}
      </div>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ color: '#111', fontSize: 34, fontWeight: 800, fontFamily: FONTS.inter }}>{handle}</span>
      <span style={{ color: accent, fontSize: 24, fontWeight: 700, fontFamily: FONTS.inter }}>
        Ссылка в шапке профиля ↓
      </span>
      <div style={{ display: 'flex', gap: 18, marginTop: 4 }}>
        <Stat n="124" label="постов" />
        <Stat n="38.5K" label="подписч." />
        <Stat n="312" label="подписки" />
      </div>
    </div>
  </div>
);

const Stat: React.FC<{ n: string; label: string }> = ({ n, label }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
    <span style={{ color: '#111', fontSize: 22, fontWeight: 800, fontFamily: FONTS.inter }}>{n}</span>
    <span style={{ color: '#777', fontSize: 16, fontFamily: FONTS.inter }}>{label}</span>
  </div>
);
