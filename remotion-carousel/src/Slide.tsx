import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
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

  // Вход всего слайда
  const enter = spring({ frame, fps, config: { damping: 20, stiffness: 180, mass: 0.6 }, durationInFrames: 22 });
  const slideUp = interpolate(frame, [0, 22], [70, 0], { extrapolateRight: 'clamp' });

  // Элементы по очереди
  const emojiScale = spring({ frame, fps, from: 0.3, to: 1, config: { damping: 10, stiffness: 160 }, durationInFrames: 30 });
  const lineProgress = interpolate(frame, [5, 28], [0, 1], { extrapolateRight: 'clamp' });
  const titleOpacity = interpolate(frame, [12, 28], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
  const titleY = interpolate(frame, [12, 28], [40, 0], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
  const bodyOpacity = interpolate(frame, [22, 40], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
  const bodyY = interpolate(frame, [22, 40], [25, 0], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });

  // Пульсирующий ореол свечения
  const glowPulse = 0.7 + 0.3 * Math.sin((frame / fps) * Math.PI * 2 * 0.6);

  // Уход из кадра
  const fadeOut = interpolate(
    frame,
    [SLIDE_DURATION - 14, SLIDE_DURATION],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const progress = slideNum / total;
  const isFirst = slideNum === 1;

  // ── Последний слайд (CTA) ────────────────────────────────────────────────────
  if (isLast) {
    return (
      <AbsoluteFill
        style={{
          background: 'linear-gradient(160deg, #020d00 0%, #041200 50%, #000800 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '80px 65px',
          opacity: fadeOut * enter,
          fontFamily: "'Arial Black', Arial, sans-serif",
        }}
      >
        {/* Фоновое свечение */}
        <div style={{
          position: 'absolute',
          width: 750,
          height: 750,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${accentColor}${Math.round(glowPulse * 0x1a).toString(16).padStart(2, '0')} 0%, transparent 70%)`,
          top: '45%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
        }} />

        {/* Брендинг */}
        <div style={{ position: 'absolute', top: 72, left: 70, color: 'rgba(255,255,255,0.4)', fontSize: 28, letterSpacing: 1 }}>
          {BRAND}
        </div>
        <div style={{ position: 'absolute', top: 72, right: 70, color: accentColor, fontSize: 28, fontWeight: 700, opacity: 0.8 }}>
          {slideNum}/{total}
        </div>

        {/* Иконка */}
        <div style={{ fontSize: 130, transform: `scale(${emojiScale})`, marginBottom: 48, filter: `drop-shadow(0 0 28px ${accentColor}88)` }}>
          {emoji}
        </div>

        {/* Заголовок */}
        <h1 style={{
          color: '#ffffff',
          fontSize: 66,
          fontWeight: 900,
          textAlign: 'center',
          lineHeight: 1.2,
          margin: '0 0 36px',
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
          textShadow: `0 0 40px ${accentColor}66`,
        }}>
          {headline}
        </h1>

        {/* Список из body (разделяем по \n) */}
        <div style={{ opacity: bodyOpacity, transform: `translateY(${bodyY}px)`, width: '100%' }}>
          {body.split('\n').filter(Boolean).map((line, i) => (
            <div key={i} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 18,
              marginBottom: 18,
              opacity: interpolate(frame, [22 + i * 6, 38 + i * 6], [0, 1], { extrapolateRight: 'clamp' }),
              transform: `translateX(${interpolate(frame, [22 + i * 6, 38 + i * 6], [-25, 0], { extrapolateRight: 'clamp' })}px)`,
            }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: accentColor, flexShrink: 0, boxShadow: `0 0 8px ${accentColor}` }} />
              <span style={{ color: '#d0ffd0', fontSize: 36, fontWeight: 500, lineHeight: 1.4 }}>
                {line.replace(/^[•\-*]\s*/, '')}
              </span>
            </div>
          ))}
        </div>

        {/* CTA кнопка */}
        <div style={{
          marginTop: 52,
          padding: '28px 56px',
          borderRadius: 20,
          background: `linear-gradient(90deg, ${accentColor}44, ${accentColor}22)`,
          border: `2px solid ${accentColor}88`,
          opacity: interpolate(frame, [30, 48], [0, 1], { extrapolateRight: 'clamp' }),
          boxShadow: `0 0 30px ${accentColor}33`,
        }}>
          <p style={{ color: '#ffffff', fontSize: 42, fontWeight: 800, textAlign: 'center', margin: 0, letterSpacing: 0.5 }}>
            Ссылка в шапке профиля ↑
          </p>
        </div>

        {/* Нижняя линия */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 6, background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)` }} />
      </AbsoluteFill>
    );
  }

  // ── Обычный / первый слайд ────────────────────────────────────────────────────
  return (
    <AbsoluteFill
      style={{
        background: bgColor,
        display: 'flex',
        flexDirection: 'column',
        padding: '80px 68px',
        opacity: fadeOut * enter,
        fontFamily: "'Arial Black', Arial, sans-serif",
        transform: `translateY(${(1 - enter) * 60}px)`,
      }}
    >
      {/* Фоновый ореол */}
      <div style={{
        position: 'absolute',
        width: 600,
        height: 600,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${accentColor}${Math.round(glowPulse * 0x14).toString(16).padStart(2, '0')} 0%, transparent 70%)`,
        top: '35%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
      }} />

      {/* Брендинг */}
      <div style={{ position: 'absolute', top: 72, left: 68, color: 'rgba(255,255,255,0.4)', fontSize: 28, letterSpacing: 1 }}>
        {BRAND}
      </div>

      {/* Счётчик */}
      <div style={{
        position: 'absolute',
        top: 72,
        right: 68,
        color: accentColor,
        fontSize: 30,
        fontWeight: 800,
        letterSpacing: 3,
        opacity: 0.85,
        textShadow: `0 0 10px ${accentColor}66`,
      }}>
        {slideNum < 10 ? `0${slideNum}` : slideNum} / {total < 10 ? `0${total}` : total}
      </div>

      {/* Верхняя линия прогресса */}
      <div style={{ height: 5, width: `${lineProgress * 100}%`, background: `linear-gradient(90deg, ${accentColor}, ${accentColor}44)`, borderRadius: 3, marginTop: 60, marginBottom: 56, boxShadow: `0 0 12px ${accentColor}88` }} />

      {/* Эмодзи */}
      <div style={{
        fontSize: isFirst ? 180 : 100,
        marginBottom: 44,
        transform: `scale(${emojiScale})`,
        transformOrigin: 'left center',
        filter: `drop-shadow(0 0 20px ${accentColor}66)`,
        lineHeight: 1,
      }}>
        {emoji}
      </div>

      {/* Заголовок */}
      <h1 style={{
        color: '#ffffff',
        fontSize: isFirst ? 76 : 68,
        fontWeight: 900,
        lineHeight: 1.15,
        margin: '0 0 36px',
        opacity: titleOpacity,
        transform: `translateY(${titleY}px)`,
        textShadow: `0 4px 24px rgba(0,0,0,0.5), 0 0 60px ${accentColor}22`,
        letterSpacing: -1,
        textTransform: isFirst ? 'uppercase' : 'none',
      }}>
        {headline}
      </h1>

      {/* Акцентный разделитель */}
      <div style={{
        width: 70,
        height: 4,
        background: accentColor,
        borderRadius: 2,
        marginBottom: 36,
        opacity: lineProgress,
        boxShadow: `0 0 14px ${accentColor}`,
      }} />

      {/* Текст */}
      <p style={{
        color: '#c8ffc8',
        fontSize: 40,
        fontWeight: 400,
        lineHeight: 1.6,
        margin: 0,
        fontFamily: 'Arial, sans-serif',
        opacity: bodyOpacity,
        transform: `translateY(${bodyY}px)`,
      }}>
        {body}
      </p>

      {/* Нижнее свечение */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 280,
        background: `linear-gradient(to top, ${accentColor}18, transparent)`,
        pointerEvents: 'none',
      }} />

      {/* Прогресс-бар */}
      <div style={{ position: 'absolute', bottom: 80, left: 68, right: 68, height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2 }}>
        <div style={{ height: '100%', width: `${progress * 100}%`, background: accentColor, borderRadius: 2, boxShadow: `0 0 10px ${accentColor}` }} />
      </div>

      {/* Нижняя линия */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 5, background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)` }} />
    </AbsoluteFill>
  );
};
