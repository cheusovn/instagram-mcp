import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import {
  SlideData,
  FONTS,
  BRAND,
  SLIDE_DURATION,
  withAlpha,
  splitWords,
  isKeyWord,
  rng,
} from '../theme';
import {
  Header,
  ProgressBar,
  VideoBackground,
  KenBurnsImage,
  TelegramIcon,
  InstagramProfileMockup,
} from '../shared';

// ── СТИЛЬ 01 — BEBAS 3D EXTRUDE ──────────────────────────────────────────────
// Шрифт: Oswald (кириллица заголовков) + Bebas Neue (числа/латиница).
// Фишка: объёмные выдавленные заголовки (multi-layer text-shadow),
// electric-blue, кинематографичный параллакс, плавающие 3D-частицы.

const ELECTRIC = '#2D7FFF';

// Многослойная «выдавленность» текста.
function extrude3D(depth: number, color: string, glow: string): string {
  const layers: string[] = [];
  for (let i = 1; i <= depth; i++) {
    const t = i / depth;
    const shade = `rgba(${Math.round(8 + t * 10)},${Math.round(20 + t * 30)},${Math.round(60 + t * 60)},1)`;
    layers.push(`${i}px ${i}px 0 ${shade}`);
  }
  layers.push(`0 0 40px ${glow}`);
  layers.push(`${depth + 4}px ${depth + 6}px 30px rgba(0,0,0,0.6)`);
  return layers.join(', ');
}

export const Style01: React.FC<SlideData> = (props) => {
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
  const accent = accentColor || ELECTRIC;
  const isFirst = slideNum === 1;
  const progress = slideNum / total;

  const enter = spring({ frame, fps, config: { damping: 20, stiffness: 180, mass: 0.7 }, durationInFrames: 22 });
  const fadeOut = interpolate(frame, [SLIDE_DURATION - 12, SLIDE_DURATION], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const camPan = interpolate(frame, [0, SLIDE_DURATION], [-20, 20]);
  const depth = isFirst ? 14 : 10;

  const bg =
    bgColor ||
    'radial-gradient(circle at 30% 20%, #11337a 0%, #08184a 45%, #030a26 100%)';

  // Плавающие 3D-частицы (детерминированные).
  const rand = rng(slideNum * 97 + 13);
  const particles = Array.from({ length: 22 }, () => ({
    x: rand() * 1080,
    y: rand() * 1350,
    size: 4 + rand() * 16,
    speed: 0.3 + rand() * 1.2,
    depth: 0.3 + rand() * 1,
    rot: rand() * 360,
  }));

  return (
    <AbsoluteFill style={{ background: bg, fontFamily: FONTS.oswaldHead, opacity: fadeOut }}>
      {video && <VideoBackground src={video} opacity={0.4} />}

      {/* Перспективная сетка пола (кинематографично) */}
      <svg width={1080} height={1350} style={{ position: 'absolute', inset: 0, opacity: 0.18 }}>
        {Array.from({ length: 14 }).map((_, i) => (
          <line
            key={`h${i}`}
            x1={0}
            y1={780 + i * i * 5}
            x2={1080}
            y2={780 + i * i * 5}
            stroke={accent}
            strokeWidth={1}
          />
        ))}
        {Array.from({ length: 16 }).map((_, i) => {
          const cx = 540;
          const x = (i - 8) * 135;
          return <line key={`v${i}`} x1={cx + x} y1={780} x2={cx + x * 5} y2={1350} stroke={accent} strokeWidth={1} />;
        })}
      </svg>

      {/* Плавающие частицы */}
      {particles.map((p, i) => {
        const py = (p.y - frame * p.speed * 2 + 1500) % 1500 - 75;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: p.x + camPan * p.depth,
              top: py,
              width: p.size,
              height: p.size,
              borderRadius: 3,
              background: withAlpha(accent, 0.5),
              boxShadow: `0 0 ${p.size}px ${withAlpha(accent, 0.7)}`,
              transform: `rotate(${p.rot + frame * p.speed}deg)`,
              opacity: 0.5 * p.depth,
            }}
          />
        );
      })}

      <Header brand={BRAND} slideNum={slideNum} total={total} accent={accent} />

      {isLast ? (
        <CtaBlock
          headline={headline}
          body={body}
          accent={accent}
          telegram={telegram}
          profileHandle={profileHandle}
          depth={depth}
        />
      ) : (
        <AbsoluteFill
          style={{
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '0 70px',
            transform: `translateY(${(1 - enter) * 60}px)`,
          }}
        >
          {image && (
            <KenBurnsImage
              src={image}
              style={{
                width: 540,
                height: 360,
                borderRadius: 20,
                marginBottom: 40,
                border: `3px solid ${withAlpha(accent, 0.6)}`,
                boxShadow: `0 20px 60px rgba(0,0,0,0.6), 0 0 40px ${withAlpha(accent, 0.4)}`,
              }}
            />
          )}

          {kicker && (
            <div
              style={{
                fontFamily: FONTS.bebas,
                fontSize: 38,
                letterSpacing: 8,
                color: accent,
                marginBottom: 18,
                opacity: interpolate(frame, [6, 20], [0, 1], { extrapolateRight: 'clamp' }),
                textShadow: `0 0 20px ${accent}`,
              }}
            >
              {kicker}
            </div>
          )}

          {/* Большое emoji/число с параллаксом */}
          <div
            style={{
              fontSize: isFirst ? 180 : 120,
              lineHeight: 1,
              marginBottom: 30,
              transform: `translateX(${camPan * 1.4}px) scale(${spring({
                frame,
                fps,
                from: 0.4,
                to: 1,
                config: { damping: 9, stiffness: 140 },
              })})`,
              filter: `drop-shadow(0 14px 30px rgba(0,0,0,0.6)) drop-shadow(0 0 24px ${withAlpha(accent, 0.6)})`,
            }}
          >
            {icon || emoji}
          </div>

          {/* Заголовок — выдавленный, stagger по словам */}
          <h1
            style={{
              fontSize: isFirst ? 96 : 80,
              fontWeight: 700,
              lineHeight: 0.98,
              textTransform: 'uppercase',
              margin: 0,
              color: '#fff',
              letterSpacing: -1,
            }}
          >
            {splitWords(headline).map((w, i) => {
              const wp = spring({
                frame: frame - 8 - i * 4,
                fps,
                config: { damping: 14, stiffness: 160 },
                durationInFrames: 18,
              });
              const key = isKeyWord(w);
              return (
                <span
                  key={i}
                  style={{
                    display: 'inline-block',
                    marginRight: 22,
                    color: key ? accent : '#fff',
                    opacity: wp,
                    transform: `translateY(${(1 - wp) * 50}px) perspective(600px) rotateX(${(1 - wp) * 40}deg)`,
                    textShadow: extrude3D(depth, '#0a1f4a', withAlpha(accent, key ? 0.9 : 0.3)),
                  }}
                >
                  {w}
                </span>
              );
            })}
          </h1>

          <div
            style={{
              width: 90,
              height: 6,
              background: accent,
              margin: '34px 0',
              borderRadius: 3,
              boxShadow: `0 0 18px ${accent}`,
              transform: `scaleX(${interpolate(frame, [16, 34], [0, 1], { extrapolateRight: 'clamp' })})`,
              transformOrigin: 'left',
            }}
          />

          <p
            style={{
              fontFamily: FONTS.inter,
              fontSize: 40,
              fontWeight: 500,
              lineHeight: 1.5,
              color: 'rgba(255,255,255,0.82)',
              margin: 0,
              maxWidth: 880,
              opacity: interpolate(frame, [24, 42], [0, 1], { extrapolateRight: 'clamp' }),
              transform: `translateY(${interpolate(frame, [24, 42], [24, 0], { extrapolateRight: 'clamp' })}px)`,
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
  headline: string;
  body: string;
  accent: string;
  telegram?: string;
  profileHandle?: string;
  depth: number;
}> = ({ headline, body, accent, telegram, profileHandle, depth }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame, fps, from: 0.4, to: 1, config: { damping: 9, stiffness: 130 } });
  const float = Math.sin((frame / fps) * Math.PI * 2 * 0.5) * 14;

  return (
    <AbsoluteFill style={{ flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 70px' }}>
      <div style={{ transform: `scale(${pop}) translateY(${float}px)`, marginBottom: 36 }}>
        <TelegramIcon size={150} />
      </div>
      <h1
        style={{
          fontSize: 78,
          fontWeight: 700,
          textTransform: 'uppercase',
          textAlign: 'center',
          color: '#fff',
          lineHeight: 1,
          margin: '0 0 30px',
          textShadow: extrude3D(depth, '#0a1f4a', withAlpha(accent, 0.6)),
        }}
      >
        {headline}
      </h1>
      <p
        style={{
          fontFamily: FONTS.inter,
          fontSize: 40,
          textAlign: 'center',
          color: 'rgba(255,255,255,0.85)',
          margin: '0 0 44px',
          maxWidth: 820,
          opacity: interpolate(frame, [16, 34], [0, 1], { extrapolateRight: 'clamp' }),
        }}
      >
        {body}
      </p>
      {profileHandle && <InstagramProfileMockup handle={profileHandle} accent={accent} />}
      <div
        style={{
          marginTop: 40,
          padding: '26px 56px',
          borderRadius: 18,
          background: `linear-gradient(90deg, ${accent}, #1456cc)`,
          fontFamily: FONTS.inter,
          fontSize: 40,
          fontWeight: 800,
          color: '#fff',
          boxShadow: `0 12px 40px ${withAlpha(accent, 0.6)}`,
          opacity: interpolate(frame, [30, 48], [0, 1], { extrapolateRight: 'clamp' }),
        }}
      >
        {telegram ? `Telegram: ${telegram}` : 'Подпишись в Telegram ↓'}
      </div>
    </AbsoluteFill>
  );
};
