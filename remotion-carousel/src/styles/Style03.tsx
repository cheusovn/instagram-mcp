import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { SlideData, FONTS, BRAND, SLIDE_DURATION, withAlpha, splitWords, isKeyWord, rng } from '../theme';
import {
  Header,
  ProgressBar,
  VideoBackground,
  KenBurnsImage,
  TelegramIcon,
  InstagramProfileMockup,
} from '../shared';

// ── СТИЛЬ 03 — BRUTALIST NEON GRID ───────────────────────────────────────────
// Шрифт: Oswald (узкий, жёсткий, кириллица).
// Фишка: жёсткие сетки/рамки, glitch-смещения, неон-маркеры, моно-метки,
// резкие cut-in анимации, насыщенный циан/мадженто на тёмно-фиолетовом.

const NEON = '#00F0FF';
const MAGENTA = '#FF2BD6';

export const Style03: React.FC<SlideData> = (props) => {
  const {
    headline,
    body,
    emoji,
    kicker,
    icon,
    image,
    video,
    isLast,
    bgColor,
    accentColor,
    slideNum,
    total,
    telegram,
    profileHandle,
  } = props;

  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const accent = accentColor || NEON;
  const isFirst = slideNum === 1;
  const progress = slideNum / total;

  const fadeOut = interpolate(frame, [SLIDE_DURATION - 10, SLIDE_DURATION], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Детерминированный «глитч» — короткие вспышки смещения.
  const grand = rng(slideNum * 53 + frame);
  const glitchActive = frame % 30 < 4 || (frame > 8 && frame < 14);
  const gx = glitchActive ? (grand() - 0.5) * 16 : 0;

  const bg = bgColor || 'linear-gradient(135deg, #1a0033 0%, #2d0a4e 50%, #12001f 100%)';

  return (
    <AbsoluteFill style={{ background: bg, fontFamily: FONTS.oswald, opacity: fadeOut, overflow: 'hidden' }}>
      {video && <VideoBackground src={video} opacity={0.4} />}

      {/* Брутальная сетка фона */}
      <svg width={1080} height={1350} style={{ position: 'absolute', inset: 0, opacity: 0.2 }}>
        {Array.from({ length: 13 }).map((_, i) => (
          <line key={`v${i}`} x1={i * 90} y1={0} x2={i * 90} y2={1350} stroke={accent} strokeWidth={1} />
        ))}
        {Array.from({ length: 16 }).map((_, i) => (
          <line key={`h${i}`} x1={0} y1={i * 90} x2={1080} y2={i * 90} stroke={accent} strokeWidth={1} />
        ))}
      </svg>

      {/* Сканлайн */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: ((frame * 6) % 1350) - 4,
          height: 4,
          background: withAlpha(accent, 0.5),
          boxShadow: `0 0 18px ${accent}`,
        }}
      />

      <Header brand={BRAND} slideNum={slideNum} total={total} accent={accent} font={FONTS.mono} />

      {isLast ? (
        <CtaBlock accent={accent} headline={headline} body={body} telegram={telegram} profileHandle={profileHandle} />
      ) : (
        <AbsoluteFill style={{ flexDirection: 'column', justifyContent: 'center', padding: '0 64px' }}>
          {/* Моно-метка */}
          <div
            style={{
              fontFamily: FONTS.mono,
              fontSize: 26,
              letterSpacing: 4,
              color: MAGENTA,
              marginBottom: 16,
              border: `2px solid ${MAGENTA}`,
              alignSelf: 'flex-start',
              padding: '6px 16px',
              opacity: interpolate(frame, [2, 10], [0, 1], { extrapolateRight: 'clamp' }),
              transform: `translateX(${gx}px)`,
            }}
          >
            {kicker || `// SLIDE_${String(slideNum).padStart(2, '0')}`}
          </div>

          {image && (
            <div
              style={{
                position: 'relative',
                width: 520,
                height: 340,
                marginBottom: 36,
                border: `4px solid ${accent}`,
                boxShadow: `8px 8px 0 ${MAGENTA}`,
                transform: `translateX(${gx * 0.5}px)`,
              }}
            >
              <KenBurnsImage src={image} style={{ width: '100%', height: '100%' }} />
            </div>
          )}

          {/* Эмодзи в неон-рамке */}
          <div
            style={{
              fontSize: isFirst ? 130 : 96,
              width: isFirst ? 200 : 150,
              height: isFirst ? 200 : 150,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: `4px solid ${accent}`,
              boxShadow: `0 0 26px ${accent}, inset 0 0 18px ${withAlpha(accent, 0.4)}`,
              marginBottom: 34,
              transform: `translateX(${gx}px) scale(${spring({ frame, fps, from: 0.5, to: 1, config: { damping: 12, stiffness: 200 } })})`,
            }}
          >
            {icon || emoji}
          </div>

          {/* Заголовок — резкий cut-in stagger + glitch */}
          <h1
            style={{
              fontSize: isFirst ? 92 : 78,
              fontWeight: 700,
              textTransform: 'uppercase',
              lineHeight: 1,
              color: '#fff',
              margin: 0,
              letterSpacing: -0.5,
            }}
          >
            {splitWords(headline).map((w, i) => {
              const shown = frame > 6 + i * 3;
              const key = isKeyWord(w);
              const wg = (frame - 6 - i * 3) < 3 ? (grand() - 0.5) * 10 : 0;
              return (
                <span
                  key={i}
                  style={{
                    display: 'inline-block',
                    marginRight: 18,
                    opacity: shown ? 1 : 0,
                    transform: `translateX(${wg}px)`,
                    color: key ? '#000' : '#fff',
                    background: key ? accent : 'transparent',
                    padding: key ? '0 12px' : 0,
                    boxShadow: key ? `0 0 22px ${accent}` : 'none',
                    textShadow: key ? 'none' : `2px 0 ${MAGENTA}, -2px 0 ${accent}`,
                  }}
                >
                  {w}
                </span>
              );
            })}
          </h1>

          <p
            style={{
              fontFamily: FONTS.mono,
              fontSize: 36,
              lineHeight: 1.5,
              color: 'rgba(255,255,255,0.78)',
              marginTop: 32,
              maxWidth: 860,
              borderLeft: `4px solid ${MAGENTA}`,
              paddingLeft: 24,
              opacity: interpolate(frame, [20, 38], [0, 1], { extrapolateRight: 'clamp' }),
            }}
          >
            {body}
          </p>
        </AbsoluteFill>
      )}

      {!isLast && <ProgressBar progress={progress} accent={accent} />}
    </AbsoluteFill>
  );
};

const CtaBlock: React.FC<{
  accent: string;
  headline: string;
  body: string;
  telegram?: string;
  profileHandle?: string;
}> = ({ accent, headline, body, telegram, profileHandle }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame, fps, from: 0.5, to: 1, config: { damping: 11, stiffness: 160 } });
  return (
    <AbsoluteFill style={{ flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 64px' }}>
      <div style={{ transform: `scale(${pop})`, marginBottom: 34, border: `4px solid ${accent}`, padding: 18, boxShadow: `0 0 30px ${accent}` }}>
        <TelegramIcon size={130} />
      </div>
      <h1
        style={{
          fontSize: 80,
          fontWeight: 700,
          textTransform: 'uppercase',
          color: '#fff',
          textAlign: 'center',
          margin: '0 0 26px',
          textShadow: `0 0 30px ${accent}`,
        }}
      >
        {headline}
      </h1>
      <p
        style={{
          fontFamily: FONTS.mono,
          fontSize: 36,
          color: 'rgba(255,255,255,0.85)',
          textAlign: 'center',
          margin: '0 0 40px',
          maxWidth: 820,
          opacity: interpolate(frame, [14, 32], [0, 1], { extrapolateRight: 'clamp' }),
        }}
      >
        {body}
      </p>
      {profileHandle && <InstagramProfileMockup handle={profileHandle} accent={accent} />}
      <div
        style={{
          marginTop: 38,
          background: accent,
          color: '#000',
          fontFamily: FONTS.oswald,
          fontWeight: 700,
          fontSize: 40,
          textTransform: 'uppercase',
          padding: '22px 52px',
          boxShadow: `8px 8px 0 ${MAGENTA}`,
          opacity: interpolate(frame, [28, 46], [0, 1], { extrapolateRight: 'clamp' }),
        }}
      >
        {telegram ? telegram : 'TELEGRAM ↓'}
      </div>
    </AbsoluteFill>
  );
};
