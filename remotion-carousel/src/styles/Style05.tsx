import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { SlideData, FONTS, BRAND, SLIDE_DURATION, withAlpha, splitWords, isKeyWord, rng } from '../theme';
import {
  Header,
  ProgressBar,
  TelegramIcon,
  InstagramProfileMockup,
} from '../shared';

// ── СТИЛЬ 05 — LIQUID GRADIENT BLOBS ─────────────────────────────────────────
// Шрифт: Montserrat Black (мощный, кириллица) + Rubik (тело).
// Фишка: живые жидкие градиентные блобы (органические morph-формы через
// border-radius animation), сочные насыщенные цвета, «капля» за текстом.

type Blob = { x: number; y: number; r: number; color: string; phase: number };

function BlobLayer({ frame, fps, accent }: { frame: number; fps: number; accent: string }) {
  const rand = rng(77);
  const blobs: Blob[] = Array.from({ length: 5 }, (_, i) => ({
    x: rand() * 100,
    y: rand() * 100,
    r: 30 + rand() * 25,
    color: [accent, '#FF4ECD', '#FFF03A', '#00FFA3', '#6B5FFF'][i % 5],
    phase: rand() * Math.PI * 2,
  }));

  const t = frame / fps;

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 0 }}>
      {blobs.map((b, i) => {
        const ox = Math.sin(t * 0.4 + b.phase) * 6;
        const oy = Math.cos(t * 0.35 + b.phase * 1.3) * 8;
        const scale = 1 + Math.sin(t * 0.6 + b.phase) * 0.08;
        const br1 = 58 + Math.sin(t * 0.5 + b.phase) * 18;
        const br2 = 42 + Math.cos(t * 0.4 + b.phase) * 15;
        const br3 = 66 + Math.sin(t * 0.7 + b.phase) * 20;
        const br4 = 38 + Math.cos(t * 0.55 + b.phase) * 12;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${b.x + ox}%`,
              top: `${b.y + oy}%`,
              width: `${b.r}vw`,
              height: `${b.r}vw`,
              transform: `translate(-50%,-50%) scale(${scale})`,
              background: b.color,
              borderRadius: `${br1}% ${br2}% ${br3}% ${br4}% / ${br3}% ${br1}% ${br2}% ${br4}%`,
              opacity: 0.55,
              filter: 'blur(54px)',
              mixBlendMode: 'screen',
            }}
          />
        );
      })}
    </div>
  );
}

function FloatingDot({ frame, fps, idx, accent }: { frame: number; fps: number; idx: number; accent: string }) {
  const r = rng(200 + idx);
  const x = r() * 80 + 10;
  const y = r() * 80 + 10;
  const size = 4 + r() * 8;
  const phase = r() * Math.PI * 2;
  const speed = 0.3 + r() * 0.4;
  const t = frame / fps;
  const ox = Math.sin(t * speed + phase) * 12;
  const oy = Math.cos(t * speed * 0.8 + phase) * 14;
  const colors = [accent, '#FF4ECD', '#FFF03A', '#00FFA3'];
  const color = colors[idx % colors.length];
  return (
    <div
      style={{
        position: 'absolute',
        left: `${x + ox}%`,
        top: `${y + oy}%`,
        width: size,
        height: size,
        borderRadius: '50%',
        background: color,
        opacity: 0.7,
        filter: `blur(${size > 9 ? 2 : 0}px)`,
      }}
    />
  );
}

export const Style05: React.FC<SlideData> = (props) => {
  const {
    headline,
    body,
    emoji,
    kicker,
    isLast,
    accentColor,
    slideNum,
    total,
    telegram,
    profileHandle,
  } = props;

  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const accent = accentColor || '#FF4ECD';
  const progress = slideNum / total;

  const enter = spring({ frame, fps, config: { damping: 22, stiffness: 130, mass: 0.8 }, durationInFrames: 24 });
  const fadeOut = interpolate(frame, [SLIDE_DURATION - 14, SLIDE_DURATION], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const emojiPop = spring({ frame: Math.max(0, frame - 8), fps, config: { damping: 14, stiffness: 260, mass: 0.6 }, durationInFrames: 22 });

  const words = splitWords(headline);

  if (isLast) {
    const scaleIn = spring({ frame: Math.max(0, frame - 4), fps, config: { damping: 20, stiffness: 120 }, durationInFrames: 28 });
    return (
      <AbsoluteFill style={{ background: 'linear-gradient(135deg,#12003A,#1E0060,#3A0080,#0A1A3A)', opacity: fadeOut }}>
        <BlobLayer frame={frame} fps={fps} accent="#8B5CFF" />
        <AbsoluteFill style={{ zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 60 }}>
          <div style={{ transform: `scale(${scaleIn})`, marginBottom: 28, filter: 'drop-shadow(0 0 24px #2AABEE88)' }}>
            <TelegramIcon size={88} />
          </div>
          <div style={{ fontFamily: FONTS.montserrat, fontSize: 38, fontWeight: 900, color: '#fff', textAlign: 'center', lineHeight: 1.2, marginBottom: 20, transform: `translateY(${(1 - scaleIn) * 30}px)`, opacity: scaleIn }}>
            Больше информации —<br />в моём Telegram-канале
          </div>
          <div style={{ fontFamily: FONTS.rubik, fontSize: 26, color: withAlpha('#fff', 0.75), textAlign: 'center', marginBottom: 36, opacity: scaleIn }}>
            Ссылка в шапке профиля ↓
          </div>
          <div style={{ transform: `scale(${scaleIn})`, opacity: scaleIn }}>
            <InstagramProfileMockup handle={profileHandle || BRAND} accent="#2AABEE" />
          </div>
        </AbsoluteFill>
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill style={{ background: 'linear-gradient(140deg,#0A0020,#1A0040,#0D0A30)', opacity: fadeOut }}>
      <BlobLayer frame={frame} fps={fps} accent={accent} />
      {Array.from({ length: 12 }, (_, i) => (
        <FloatingDot key={i} frame={frame} fps={fps} idx={i} accent={accent} />
      ))}

      <AbsoluteFill style={{ zIndex: 2, padding: '52px 52px 40px' }}>
        <Header brand={BRAND} accent={accent} slideNum={slideNum} total={total} />

        {kicker && (
          <div style={{ fontFamily: FONTS.montserrat, fontSize: 22, fontWeight: 900, color: accent, letterSpacing: 4, marginTop: 28, opacity: enter, textTransform: 'uppercase' }}>
            {kicker}
          </div>
        )}

        {/* Emoji orb */}
        <div style={{ marginTop: kicker ? 16 : 52, textAlign: 'center', fontSize: 96, lineHeight: 1, transform: `scale(${emojiPop})`, filter: `drop-shadow(0 0 28px ${withAlpha(accent, 0.7)})` }}>
          {emoji}
        </div>

        {/* Headline — word stagger */}
        <div style={{ marginTop: 28, minHeight: 220 }}>
          {words.map((w, i) => {
            const delay = i * 4;
            const wSpring = spring({ frame: Math.max(0, frame - delay), fps, config: { damping: 24, stiffness: 140, mass: 0.7 }, durationInFrames: 22 });
            const isKey = isKeyWord(w);
            return (
              <span
                key={i}
                style={{
                  display: 'inline-block',
                  fontFamily: FONTS.montserrat,
                  fontSize: 64,
                  fontWeight: 900,
                  color: isKey ? accent : '#fff',
                  lineHeight: 1.1,
                  marginRight: 14,
                  transform: `translateY(${(1 - wSpring) * 40}px)`,
                  opacity: wSpring,
                  letterSpacing: isKey ? 1 : 0,
                  filter: isKey ? `drop-shadow(0 0 14px ${withAlpha(accent, 0.8)})` : 'none',
                }}
              >
                {w}
              </span>
            );
          })}
        </div>

        {/* Body */}
        <div style={{
          marginTop: 28,
          fontFamily: FONTS.rubik,
          fontSize: 32,
          fontWeight: 400,
          color: withAlpha('#fff', 0.85),
          lineHeight: 1.55,
          transform: `translateX(${(1 - enter) * -30}px)`,
          opacity: enter,
          background: withAlpha('#000', 0.35),
          borderRadius: 18,
          padding: '18px 24px',
          backdropFilter: 'blur(8px)',
        }}>
          {body}
        </div>

        {/* Blob-drop accent */}
        <div style={{
          position: 'absolute',
          right: 48,
          bottom: 120,
          width: 160,
          height: 160,
          background: `radial-gradient(circle, ${accent}, transparent 70%)`,
          opacity: 0.35,
          filter: 'blur(20px)',
          borderRadius: '50%',
        }} />

        <ProgressBar progress={progress} accent={accent} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
