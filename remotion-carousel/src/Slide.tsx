import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  delayRender,
  continueRender,
  staticFile,
} from 'remotion';

export type SlideData = {
  headline: string;
  body: string;
  emoji: string;
  bgColor: string;
  accentColor: string;
  isLast?: boolean;
  slideNum: number;
  total: number;
};

const BRAND = '@nikolay_cheusov';
const SLIDE_DURATION = 150;

// Загрузка шрифтов через Google Fonts (Cyrillic)
let fontsLoaded = false;
const fontHandle = delayRender('Loading Google Fonts');

function loadGoogleFonts() {
  if (fontsLoaded || typeof document === 'undefined') return;
  fontsLoaded = true;

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href =
    'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Montserrat:wght@700;900&family=Inter:wght@400;500;600&display=swap';
  document.head.appendChild(link);

  // Ждём загрузки обоих шрифтов (с поддержкой кириллицы)
  Promise.all([
    document.fonts.load('400 72px Bebas Neue'),
    document.fonts.load('900 72px Montserrat'),
    document.fonts.load('500 42px Inter'),
  ]).then(() => continueRender(fontHandle));
}

loadGoogleFonts();

const F = {
  // Bebas Neue — для чисел, счётчиков, латинских акцентов (огромные, кинематографичные)
  // Montserrat Black — для кириллических заголовков (жирный, современный)
  number: "'Bebas Neue', 'Impact', sans-serif",
  headline: "'Montserrat', 'Arial Black', Arial, sans-serif",
  body: "'Inter', 'Arial', sans-serif",
};

export const Slide: React.FC<SlideData> = ({
  headline,
  body,
  emoji,
  isLast,
  bgColor,
  accentColor,
  slideNum,
  total,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const isFirst = slideNum === 1;
  const progress = slideNum / total;

  // ── Анимации ────────────────────────────────────────────────────────────────
  const enter = spring({ frame, fps, config: { damping: 22, stiffness: 200, mass: 0.6 }, durationInFrames: 20 });
  const emojiScale = spring({ frame, fps, from: 0.2, to: 1, config: { damping: 10, stiffness: 150 }, durationInFrames: 28 });
  const lineProgress = interpolate(frame, [4, 26], [0, 1], { extrapolateRight: 'clamp' });
  const titleOpacity = interpolate(frame, [10, 26], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
  const titleY = interpolate(frame, [10, 26], [44, 0], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
  const bodyOpacity = interpolate(frame, [20, 38], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
  const bodyY = interpolate(frame, [20, 38], [28, 0], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
  const fadeOut = interpolate(frame, [SLIDE_DURATION - 12, SLIDE_DURATION], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // Пульсирующий ореол (0.6 Гц)
  const glowAlpha = Math.round((0.12 + 0.06 * Math.sin((frame / fps) * Math.PI * 2 * 0.6)) * 255)
    .toString(16).padStart(2, '0');

  // ── Последний слайд (CTA) ────────────────────────────────────────────────────
  if (isLast) {
    return (
      <AbsoluteFill
        style={{
          background: bgColor,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '80px 68px',
          opacity: fadeOut * enter,
          fontFamily: F.headline,
        }}
      >
        {/* Фоновое свечение */}
        <div style={{
          position: 'absolute',
          width: 760, height: 760,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${accentColor}${glowAlpha} 0%, transparent 70%)`,
          top: '45%', left: '50%',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
        }} />

        {/* Шапка */}
        <Header brand={BRAND} slideNum={slideNum} total={total} accent={accentColor} />

        {/* Emoji */}
        <div style={{
          fontSize: 130, lineHeight: 1, marginBottom: 50,
          transform: `scale(${emojiScale})`,
          filter: `drop-shadow(0 0 30px ${accentColor}99)`,
        }}>{emoji}</div>

        {/* Заголовок */}
        <h1 style={{
          color: '#fff', fontSize: 66, fontWeight: 900,
          textAlign: 'center', lineHeight: 1.15, margin: '0 0 40px',
          opacity: titleOpacity, transform: `translateY(${titleY}px)`,
          textShadow: `0 0 50px ${accentColor}55`,
          letterSpacing: -1.5,
        }}>{headline}</h1>

        {/* Список из body */}
        <div style={{ opacity: bodyOpacity, transform: `translateY(${bodyY}px)`, width: '100%' }}>
          {body.split('\n').filter(Boolean).map((line, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 18, marginBottom: 20,
              opacity: interpolate(frame, [20 + i * 7, 36 + i * 7], [0, 1], { extrapolateRight: 'clamp' }),
              transform: `translateX(${interpolate(frame, [20 + i * 7, 36 + i * 7], [-30, 0], { extrapolateRight: 'clamp' })}px)`,
            }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: accentColor, flexShrink: 0, boxShadow: `0 0 10px ${accentColor}` }} />
              <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 36, fontFamily: F.body, fontWeight: 500, lineHeight: 1.4 }}>
                {line.replace(/^[•\-*]\s*/, '')}
              </span>
            </div>
          ))}
        </div>

        {/* CTA кнопка */}
        <div style={{
          marginTop: 56, padding: '30px 60px', borderRadius: 22,
          background: `linear-gradient(90deg, ${accentColor}44, ${accentColor}22)`,
          border: `2px solid ${accentColor}88`,
          opacity: interpolate(frame, [28, 46], [0, 1], { extrapolateRight: 'clamp' }),
          boxShadow: `0 0 30px ${accentColor}33`,
        }}>
          <p style={{ color: '#fff', fontSize: 42, fontWeight: 800, textAlign: 'center', margin: 0 }}>
            Ссылка в шапке профиля ↑
          </p>
        </div>

        <NeonLine accent={accentColor} />
      </AbsoluteFill>
    );
  }

  // ── Обычный слайд ─────────────────────────────────────────────────────────
  return (
    <AbsoluteFill
      style={{
        background: bgColor,
        display: 'flex',
        flexDirection: 'column',
        padding: isFirst ? '80px 68px 100px' : '80px 68px 120px',
        opacity: fadeOut * enter,
        fontFamily: F.headline,
        transform: `translateY(${(1 - enter) * 55}px)`,
      }}
    >
      {/* Фоновый ореол */}
      <div style={{
        position: 'absolute', width: 620, height: 620, borderRadius: '50%',
        background: `radial-gradient(circle, ${accentColor}${glowAlpha} 0%, transparent 70%)`,
        top: '35%', left: '50%',
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
      }} />

      {/* Шапка */}
      <Header brand={BRAND} slideNum={slideNum} total={total} accent={accentColor} />

      {/* Линия прогресса (тянется при входе) */}
      <div style={{
        height: 5, width: `${lineProgress * 100}%`,
        background: `linear-gradient(90deg, ${accentColor}, ${accentColor}44)`,
        borderRadius: 3, marginTop: 64, marginBottom: 52,
        boxShadow: `0 0 14px ${accentColor}88`,
      }} />

      {/* Emoji / большое число */}
      <div style={{
        fontSize: isFirst ? 170 : 100,
        lineHeight: 1, marginBottom: 48,
        transform: `scale(${emojiScale})`,
        transformOrigin: 'left center',
        filter: `drop-shadow(0 0 22px ${accentColor}77)`,
      }}>{emoji}</div>

      {/* Заголовок */}
      <h1 style={{
        color: '#fff',
        fontSize: isFirst ? 78 : 68,
        fontWeight: 900,
        lineHeight: 1.1,
        margin: '0 0 30px',
        opacity: titleOpacity,
        transform: `translateY(${titleY}px)`,
        textShadow: `0 4px 28px rgba(0,0,0,0.55), 0 0 70px ${accentColor}1a`,
        letterSpacing: -1.5,
        textTransform: isFirst ? 'uppercase' : 'none',
      }}>{headline}</h1>

      {/* Акцентная полоска */}
      <div style={{
        width: 64, height: 4, background: accentColor, borderRadius: 2,
        marginBottom: 34, opacity: lineProgress,
        boxShadow: `0 0 16px ${accentColor}`,
      }} />

      {/* Текст */}
      <p style={{
        color: 'rgba(255,255,255,0.80)',
        fontSize: 40, fontFamily: F.body, fontWeight: 500,
        lineHeight: 1.6, margin: 0,
        opacity: bodyOpacity, transform: `translateY(${bodyY}px)`,
      }}>{body}</p>

      {/* Нижнее свечение */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 260,
        background: `linear-gradient(to top, ${accentColor}18, transparent)`,
        pointerEvents: 'none',
      }} />

      {/* Прогресс-бар */}
      <ProgressBar progress={progress} accent={accentColor} />

      <NeonLine accent={accentColor} />
    </AbsoluteFill>
  );
};

// ── Переиспользуемые элементы ─────────────────────────────────────────────────

const Header: React.FC<{ brand: string; slideNum: number; total: number; accent: string }> = ({ brand, slideNum, total, accent }) => (
  <div style={{
    position: 'absolute', top: 72, left: 68, right: 68,
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  }}>
    <span style={{ color: 'rgba(255,255,255,0.38)', fontSize: 27, fontFamily: "'Inter', sans-serif", letterSpacing: 0.5 }}>
      {brand}
    </span>
    <span style={{
      color: accent, fontSize: 34, fontFamily: "'Bebas Neue', sans-serif",
      fontWeight: 400, letterSpacing: 5, opacity: 0.85,
      textShadow: `0 0 16px ${accent}66`,
    }}>
      {String(slideNum).padStart(2, '0')} / {String(total).padStart(2, '0')}
    </span>
  </div>
);

const ProgressBar: React.FC<{ progress: number; accent: string }> = ({ progress, accent }) => (
  <div style={{ position: 'absolute', bottom: 82, left: 68, right: 68, height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2 }}>
    <div style={{ height: '100%', width: `${progress * 100}%`, background: accent, borderRadius: 2, boxShadow: `0 0 12px ${accent}` }} />
  </div>
);

const NeonLine: React.FC<{ accent: string }> = ({ accent }) => (
  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 5, background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }} />
);
