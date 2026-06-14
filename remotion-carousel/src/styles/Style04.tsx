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

// ── СТИЛЬ 04 — GLASSMORPHISM ─────────────────────────────────────────────────
// Шрифт: Manrope (мягкий гротеск, кириллица).
// Фишка: матовое стекло (backdrop-blur), мягкий параллакс цветных орбов,
// блюр-карточки, нежные градиенты, плавные fade/slide.

const ORB_COLORS = ['#8B5CFF', '#FF6FAE', '#3FC9FF', '#5EE8B5', '#FFB13F'];

export const Style04: React.FC<SlideData> = (props) => {
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
  const accent = accentColor || '#8B5CFF';
  const isFirst = slideNum === 1;
  const progress = slideNum / total;

  const enter = spring({ frame, fps, config: { damping: 26, stiffness: 120, mass: 0.9 }, durationInFrames: 26 });
  const fadeOut = interpolate(frame, [SLIDE_DURATION - 14, SLIDE_DURATION], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const bg =
    bgColor ||
    'linear-gradient(160deg, #2a1e63 0%, #4a2a86 40%, #7e3fa0 75%, #b85a8a 100%)';

  // Большие мягкие орбы с параллаксом.
  const rand = rng(slideNum * 41 + 5);
  const orbs = Array.from({ length: 5 }, (_, i) => ({
    x: rand() * 1080,
    y: rand() * 1350,
    size: 260 + rand() * 320,
    color: ORB_COLORS[i % ORB_COLORS.length],
    amp: 30 + rand() * 60,
    speed: 0.2 + rand() * 0.4,
    phase: rand() * Math.PI * 2,
  }));

  const glass: React.CSSProperties = {
    background: 'rgba(255,255,255,0.10)',
    backdropFilter: 'blur(26px)',
    WebkitBackdropFilter: 'blur(26px)',
    border: '1px solid rgba(255,255,255,0.25)',
    boxShadow: '0 24px 60px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.4)',
  };

  return (
    <AbsoluteFill style={{ background: bg, fontFamily: FONTS.manrope, opacity: fadeOut, overflow: 'hidden' }}>
      {video && <VideoBackground src={video} opacity={0.45} />}

      {/* Параллакс-орбы */}
      {orbs.map((o, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: o.x + Math.sin((frame / fps) * o.speed * Math.PI * 2 + o.phase) * o.amp,
            top: o.y + Math.cos((frame / fps) * o.speed * Math.PI * 2 + o.phase) * o.amp,
            width: o.size,
            height: o.size,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${withAlpha(o.color, 0.85)}, transparent 70%)`,
            filter: 'blur(40px)',
            opacity: 0.7,
          }}
        />
      ))}

      <Header brand={BRAND} slideNum={slideNum} total={total} accent="#fff" color="rgba(255,255,255,0.75)" />

      {isLast ? (
        <CtaBlock glass={glass} accent={accent} headline={headline} body={body} telegram={telegram} profileHandle={profileHandle} />
      ) : (
        <AbsoluteFill style={{ flexDirection: 'column', justifyContent: 'center', padding: '0 68px', transform: `translateY(${(1 - enter) * 40}px)` }}>
          {/* Главная стеклянная карточка */}
          <div style={{ ...glass, borderRadius: 40, padding: '54px 50px', opacity: enter }}>
            {kicker && (
              <div
                style={{
                  display: 'inline-block',
                  fontSize: 28,
                  fontWeight: 700,
                  color: '#fff',
                  background: withAlpha(accent, 0.5),
                  padding: '8px 20px',
                  borderRadius: 999,
                  marginBottom: 24,
                  letterSpacing: 1,
                }}
              >
                {kicker}
              </div>
            )}

            {image && (
              <KenBurnsImage
                src={image}
                style={{
                  width: '100%',
                  height: 320,
                  borderRadius: 26,
                  marginBottom: 32,
                  border: '1px solid rgba(255,255,255,0.3)',
                }}
              />
            )}

            <div
              style={{
                fontSize: isFirst ? 150 : 110,
                lineHeight: 1,
                marginBottom: 26,
                transform: `scale(${spring({ frame, fps, from: 0.6, to: 1, config: { damping: 14 } })}) translateY(${
                  Math.sin((frame / fps) * Math.PI * 2 * 0.4) * 8
                }px)`,
                filter: 'drop-shadow(0 10px 26px rgba(0,0,0,0.3))',
              }}
            >
              {icon || emoji}
            </div>

            <h1
              style={{
                fontSize: isFirst ? 82 : 70,
                fontWeight: 800,
                lineHeight: 1.08,
                color: '#fff',
                margin: 0,
                letterSpacing: -1,
              }}
            >
              {splitWords(headline).map((w, i) => {
                const wp = interpolate(frame, [8 + i * 4, 24 + i * 4], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
                const key = isKeyWord(w);
                return (
                  <span
                    key={i}
                    style={{
                      display: 'inline-block',
                      marginRight: 18,
                      opacity: wp,
                      transform: `translateY(${(1 - wp) * 26}px)`,
                      color: key ? '#fff' : 'rgba(255,255,255,0.92)',
                      textShadow: key ? `0 0 30px ${withAlpha(accent, 0.9)}` : 'none',
                    }}
                  >
                    {w}
                  </span>
                );
              })}
            </h1>

            <p
              style={{
                fontSize: 38,
                fontWeight: 500,
                lineHeight: 1.5,
                color: 'rgba(255,255,255,0.85)',
                marginTop: 28,
                marginBottom: 0,
                opacity: interpolate(frame, [22, 40], [0, 1], { extrapolateRight: 'clamp' }),
              }}
            >
              {body}
            </p>
          </div>
        </AbsoluteFill>
      )}

      {!isLast && <ProgressBar progress={progress} accent="#fff" track="rgba(255,255,255,0.25)" />}
    </AbsoluteFill>
  );
};

const CtaBlock: React.FC<{
  glass: React.CSSProperties;
  accent: string;
  headline: string;
  body: string;
  telegram?: string;
  profileHandle?: string;
}> = ({ glass, accent, headline, body, telegram, profileHandle }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame, fps, from: 0.6, to: 1, config: { damping: 16, stiffness: 120 } });
  const float = Math.sin((frame / fps) * Math.PI * 2 * 0.4) * 12;
  return (
    <AbsoluteFill style={{ flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 68px' }}>
      <div style={{ ...glass, borderRadius: 44, padding: '56px 48px', display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: pop }}>
        <div style={{ transform: `translateY(${float}px)`, marginBottom: 30 }}>
          <TelegramIcon size={150} />
        </div>
        <h1 style={{ fontSize: 72, fontWeight: 800, color: '#fff', textAlign: 'center', margin: '0 0 22px' }}>{headline}</h1>
        <p
          style={{
            fontSize: 38,
            fontWeight: 500,
            color: 'rgba(255,255,255,0.85)',
            textAlign: 'center',
            margin: '0 0 36px',
            opacity: interpolate(frame, [14, 32], [0, 1], { extrapolateRight: 'clamp' }),
          }}
        >
          {body}
        </p>
        {profileHandle && <InstagramProfileMockup handle={profileHandle} accent={accent} />}
        <div
          style={{
            marginTop: 34,
            background: 'rgba(255,255,255,0.9)',
            color: accent,
            fontWeight: 800,
            fontSize: 38,
            padding: '22px 50px',
            borderRadius: 999,
            opacity: interpolate(frame, [26, 44], [0, 1], { extrapolateRight: 'clamp' }),
          }}
        >
          {telegram ? telegram : 'Открыть Telegram ↓'}
        </div>
      </div>
    </AbsoluteFill>
  );
};
