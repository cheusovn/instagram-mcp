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

// ── СТИЛЬ 02 — UNBOUNDED POP ─────────────────────────────────────────────────
// Шрифт: Unbounded (родная кириллица, округлый, дисплейный).
// Фишка: candy-градиенты, прыгающая кинетика (overshoot spring),
// крупные плавающие эмодзи-объекты, конфетти-фигуры, пастельная сочность.

const CANDY = ['#FF5FA2', '#FFC93C', '#7C4DFF', '#19D3DA', '#FF8A3D'];

export const Style02: React.FC<SlideData> = (props) => {
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
  const accent = accentColor || CANDY[slideNum % CANDY.length];
  const isFirst = slideNum === 1;
  const progress = slideNum / total;

  const fadeOut = interpolate(frame, [SLIDE_DURATION - 10, SLIDE_DURATION], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const pop = spring({ frame, fps, from: 0.6, to: 1, config: { damping: 8, stiffness: 130, mass: 0.8 } });

  const bg =
    bgColor ||
    `linear-gradient(150deg, ${CANDY[slideNum % CANDY.length]} 0%, ${CANDY[(slideNum + 2) % CANDY.length]} 100%)`;

  // Конфетти-фигуры (детерминированные).
  const rand = rng(slideNum * 31 + 7);
  const shapes = Array.from({ length: 26 }, () => ({
    x: rand() * 1080,
    y: rand() * 1350,
    size: 18 + rand() * 46,
    type: Math.floor(rand() * 3),
    color: CANDY[Math.floor(rand() * CANDY.length)],
    speed: 0.4 + rand() * 1.4,
    spin: rand() * 360,
  }));

  return (
    <AbsoluteFill style={{ background: bg, fontFamily: FONTS.unbounded, opacity: fadeOut, overflow: 'hidden' }}>
      {video && <VideoBackground src={video} opacity={0.35} />}

      {/* Плавающие конфетти */}
      {shapes.map((s, i) => {
        const y = (s.y - frame * s.speed * 1.5 + 1500) % 1500 - 75;
        const wobble = Math.sin((frame / fps) * Math.PI * 2 * s.speed + i) * 30;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: s.x + wobble,
              top: y,
              width: s.size,
              height: s.size,
              background: withAlpha(s.color, 0.85),
              borderRadius: s.type === 0 ? '50%' : s.type === 1 ? 8 : 0,
              transform: `rotate(${s.spin + frame * s.speed * 3}deg)`,
              boxShadow: `0 4px 14px rgba(0,0,0,0.15)`,
            }}
          />
        );
      })}

      {/* Светящееся пятно за центром */}
      <div
        style={{
          position: 'absolute',
          width: 760,
          height: 760,
          left: '50%',
          top: '42%',
          transform: 'translate(-50%,-50%)',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${withAlpha('#ffffff', 0.35)}, transparent 70%)`,
        }}
      />

      <Header brand={BRAND} slideNum={slideNum} total={total} accent="#fff" color="rgba(255,255,255,0.8)" />

      {isLast ? (
        <CtaBlock accent={accent} headline={headline} body={body} telegram={telegram} profileHandle={profileHandle} />
      ) : (
        <AbsoluteFill style={{ flexDirection: 'column', justifyContent: 'center', padding: '0 72px' }}>
          {image && (
            <KenBurnsImage
              src={image}
              style={{
                width: 520,
                height: 360,
                borderRadius: 36,
                marginBottom: 40,
                border: '6px solid #fff',
                boxShadow: '0 24px 50px rgba(0,0,0,0.25)',
                transform: `scale(${pop}) rotate(${-3 + Math.sin(frame / 20) * 2}deg)`,
              }}
            />
          )}

          {kicker && (
            <div
              style={{
                alignSelf: 'flex-start',
                background: '#fff',
                color: accent,
                fontSize: 30,
                fontWeight: 700,
                padding: '12px 26px',
                borderRadius: 999,
                marginBottom: 26,
                transform: `scale(${pop})`,
                boxShadow: '0 8px 22px rgba(0,0,0,0.18)',
              }}
            >
              {kicker}
            </div>
          )}

          {/* Огромный прыгающий эмодзи */}
          <div
            style={{
              fontSize: isFirst ? 220 : 150,
              lineHeight: 1,
              marginBottom: 26,
              transform: `scale(${pop}) translateY(${Math.sin((frame / fps) * Math.PI * 2 * 0.8) * 18}px) rotate(${
                Math.sin(frame / 14) * 6
              }deg)`,
              filter: 'drop-shadow(0 16px 24px rgba(0,0,0,0.25))',
            }}
          >
            {icon || emoji}
          </div>

          {/* Заголовок — bounce stagger по словам */}
          <h1
            style={{
              fontSize: isFirst ? 86 : 72,
              fontWeight: 900,
              lineHeight: 1.05,
              color: '#fff',
              margin: 0,
              textShadow: '0 6px 0 rgba(0,0,0,0.18)',
            }}
          >
            {splitWords(headline).map((w, i) => {
              const wp = spring({
                frame: frame - 6 - i * 4,
                fps,
                from: 0,
                to: 1,
                config: { damping: 7, stiffness: 150, mass: 0.7 },
              });
              const key = isKeyWord(w);
              return (
                <span
                  key={i}
                  style={{
                    display: 'inline-block',
                    marginRight: 20,
                    transform: `translateY(${(1 - wp) * 70}px) scale(${0.6 + wp * 0.4})`,
                    opacity: Math.min(1, wp * 1.5),
                    color: key ? '#fff' : '#fff',
                    background: key ? 'rgba(0,0,0,0.16)' : 'transparent',
                    borderRadius: 14,
                    padding: key ? '0 14px' : 0,
                  }}
                >
                  {w}
                </span>
              );
            })}
          </h1>

          <p
            style={{
              fontFamily: FONTS.inter,
              fontSize: 40,
              fontWeight: 600,
              lineHeight: 1.5,
              color: 'rgba(255,255,255,0.95)',
              marginTop: 34,
              maxWidth: 860,
              opacity: interpolate(frame, [22, 40], [0, 1], { extrapolateRight: 'clamp' }),
              transform: `translateY(${interpolate(frame, [22, 40], [26, 0], { extrapolateRight: 'clamp' })}px)`,
            }}
          >
            {body}
          </p>
        </AbsoluteFill>
      )}

      {!isLast && <ProgressBar progress={progress} accent="#fff" track="rgba(255,255,255,0.3)" />}
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
  const pop = spring({ frame, fps, from: 0.5, to: 1, config: { damping: 7, stiffness: 130 } });
  const float = Math.sin((frame / fps) * Math.PI * 2 * 0.6) * 16;
  return (
    <AbsoluteFill style={{ flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 72px' }}>
      <div style={{ transform: `scale(${pop}) translateY(${float}px)`, marginBottom: 34 }}>
        <TelegramIcon size={160} />
      </div>
      <h1 style={{ fontSize: 76, fontWeight: 900, color: '#fff', textAlign: 'center', margin: '0 0 26px', textShadow: '0 6px 0 rgba(0,0,0,0.2)' }}>
        {headline}
      </h1>
      <p
        style={{
          fontFamily: FONTS.inter,
          fontSize: 40,
          fontWeight: 600,
          color: '#fff',
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
          background: '#fff',
          color: accent,
          fontFamily: FONTS.unbounded,
          fontSize: 38,
          fontWeight: 700,
          padding: '24px 54px',
          borderRadius: 999,
          boxShadow: '0 14px 36px rgba(0,0,0,0.25)',
          opacity: interpolate(frame, [28, 46], [0, 1], { extrapolateRight: 'clamp' }),
        }}
      >
        {telegram ? telegram : 'Жми на Telegram ↓'}
      </div>
    </AbsoluteFill>
  );
};
