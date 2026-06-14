import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { SlideData, FONTS, BRAND, SLIDE_DURATION, withAlpha, splitWords, isKeyWord, rng } from '../theme';
import {
  Header,
  ProgressBar,
  TelegramIcon,
  InstagramProfileMockup,
} from '../shared';

// ── СТИЛЬ 06 — RETRO VHS CHROMATIC ABERRATION ────────────────────────────────
// Шрифт: Russo One (мощный, кириллица) + JetBrains Mono (данные/цифры).
// Фишка: хроматическая аберрация (RGB-split), VHS-шум, scanlines,
// retro-glitch мигание, неоновые цвета на чёрном.

function Scanlines({ opacity }: { opacity: number }) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 10,
        pointerEvents: 'none',
        opacity: opacity * 0.18,
        background:
          'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.8) 3px, rgba(0,0,0,0.8) 4px)',
      }}
    />
  );
}

function VHSNoise({ frame }: { frame: number }) {
  const r = rng(frame % 7 + 1);
  const lines = Array.from({ length: 3 }, (_, i) => ({
    y: r() * 90 + 5,
    h: 1 + r() * 3,
    op: r() * 0.25,
  }));
  return (
    <>
      {lines.map((l, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: `${l.y}%`,
            height: l.h,
            background: 'rgba(255,255,255,0.9)',
            opacity: l.op,
            zIndex: 11,
            pointerEvents: 'none',
          }}
        />
      ))}
    </>
  );
}

function ChromaText({ text, color, fontSize, fontFamily, style }: { text: string; color: string; fontSize: number; fontFamily: string; style?: React.CSSProperties }) {
  const offset = 3;
  return (
    <div style={{ position: 'relative', display: 'inline-block', ...style }}>
      {/* Red channel */}
      <div style={{ position: 'absolute', top: 0, left: offset, fontFamily, fontSize, fontWeight: 900, color: '#FF2020', opacity: 0.65, whiteSpace: 'nowrap', mixBlendMode: 'screen' }}>
        {text}
      </div>
      {/* Blue channel */}
      <div style={{ position: 'absolute', top: offset, left: -offset, fontFamily, fontSize, fontWeight: 900, color: '#2060FF', opacity: 0.65, whiteSpace: 'nowrap', mixBlendMode: 'screen' }}>
        {text}
      </div>
      {/* Main */}
      <div style={{ position: 'relative', fontFamily, fontSize, fontWeight: 900, color, whiteSpace: 'nowrap' }}>
        {text}
      </div>
    </div>
  );
}

function GlitchBar({ frame, fps }: { frame: number; fps: number }) {
  const active = (frame % 37 < 3) || (frame % 53 < 2);
  if (!active) return null;
  const r = rng(frame);
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: `${r() * 70 + 15}%`,
        height: 2 + r() * 8,
        background: `rgba(${Math.floor(r() * 255)}, ${Math.floor(r() * 255)}, 255, 0.35)`,
        zIndex: 12,
        pointerEvents: 'none',
      }}
    />
  );
}

export const Style06: React.FC<SlideData> = (props) => {
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
  const accent = accentColor || '#00FF9F';
  const progress = slideNum / total;

  const enter = spring({ frame, fps, config: { damping: 28, stiffness: 160, mass: 0.7 }, durationInFrames: 20 });
  const fadeOut = interpolate(frame, [SLIDE_DURATION - 12, SLIDE_DURATION], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const glitchOffset = (frame % 19 < 2) ? (rng(frame)() * 12 - 6) : 0;

  if (isLast) {
    const scaleIn = spring({ frame: Math.max(0, frame - 4), fps, config: { damping: 20, stiffness: 120 }, durationInFrames: 28 });
    return (
      <AbsoluteFill style={{ background: '#050505', opacity: fadeOut }}>
        <Scanlines opacity={1} />
        <VHSNoise frame={frame} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, rgba(0,255,159,0.08) 0%, transparent 70%)', zIndex: 0 }} />
        <AbsoluteFill style={{ zIndex: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 60 }}>
          <div style={{ transform: `scale(${scaleIn})`, marginBottom: 28, filter: 'drop-shadow(0 0 24px #2AABEE)' }}>
            <TelegramIcon size={88} />
          </div>
          <div style={{ fontFamily: FONTS.russo, fontSize: 36, color: '#fff', textAlign: 'center', lineHeight: 1.2, marginBottom: 20, opacity: scaleIn }}>
            Больше информации —<br />
            <span style={{ color: '#2AABEE' }}>в моём Telegram-канале</span>
          </div>
          <div style={{ fontFamily: FONTS.mono, fontSize: 24, color: withAlpha('#fff', 0.6), textAlign: 'center', marginBottom: 36, letterSpacing: 2, opacity: scaleIn }}>
            ССЫЛКА В ШАПКЕ ПРОФИЛЯ ↓
          </div>
          <div style={{ transform: `scale(${scaleIn})`, opacity: scaleIn }}>
            <InstagramProfileMockup handle={profileHandle || BRAND} accent="#2AABEE" />
          </div>
        </AbsoluteFill>
      </AbsoluteFill>
    );
  }

  const words = splitWords(headline);

  return (
    <AbsoluteFill style={{ background: '#050505', opacity: fadeOut }}>
      {/* CRT glow */}
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 50% 40%, ${withAlpha(accent, 0.06)} 0%, transparent 70%)`, zIndex: 0 }} />

      <Scanlines opacity={1} />
      <VHSNoise frame={frame} />
      <GlitchBar frame={frame} fps={fps} />

      <AbsoluteFill style={{ zIndex: 2, padding: '52px 52px 40px', transform: `translateX(${glitchOffset}px)` }}>
        <Header brand={BRAND} accent={accent} slideNum={slideNum} total={total} />

        {/* VHS TIMESTAMP */}
        <div style={{ marginTop: 20, fontFamily: FONTS.mono, fontSize: 20, color: withAlpha(accent, 0.7), letterSpacing: 2 }}>
          REC ● {String(Math.floor(frame / fps / 60)).padStart(2, '0')}:{String(Math.floor(frame / fps) % 60).padStart(2, '0')}:{String(frame % fps).padStart(2, '0')}
        </div>

        {kicker && (
          <div style={{ marginTop: 16, fontFamily: FONTS.mono, fontSize: 22, color: accent, letterSpacing: 4, opacity: enter, textTransform: 'uppercase', borderLeft: `3px solid ${accent}`, paddingLeft: 14 }}>
            {kicker}
          </div>
        )}

        {/* Emoji with chromatic glow */}
        <div style={{ marginTop: 32, fontSize: 80, lineHeight: 1, filter: `drop-shadow(0 0 20px ${accent}) drop-shadow(4px 0 0 #FF2020) drop-shadow(-4px 0 0 #2060FF)`, opacity: enter }}>
          {emoji}
        </div>

        {/* Headline */}
        <div style={{ marginTop: 24 }}>
          {words.map((w, i) => {
            const delay = i * 3;
            const wSpr = spring({ frame: Math.max(0, frame - delay), fps, config: { damping: 26, stiffness: 150, mass: 0.7 }, durationInFrames: 20 });
            const isKey = isKeyWord(w);
            if (isKey) {
              return (
                <span key={i} style={{ display: 'inline-block', marginRight: 12, transform: `translateY(${(1 - wSpr) * 30}px)`, opacity: wSpr }}>
                  <ChromaText text={w} color={accent} fontSize={62} fontFamily={FONTS.russo} />
                </span>
              );
            }
            return (
              <span
                key={i}
                style={{
                  display: 'inline-block',
                  fontFamily: FONTS.russo,
                  fontSize: 62,
                  color: '#fff',
                  lineHeight: 1.15,
                  marginRight: 12,
                  transform: `translateY(${(1 - wSpr) * 30}px)`,
                  opacity: wSpr,
                }}
              >
                {w}
              </span>
            );
          })}
        </div>

        {/* Body — mono terminal style */}
        <div style={{
          marginTop: 28,
          fontFamily: FONTS.mono,
          fontSize: 28,
          color: withAlpha('#fff', 0.8),
          lineHeight: 1.6,
          transform: `translateX(${(1 - enter) * -20}px)`,
          opacity: enter,
          background: withAlpha('#000', 0.5),
          borderLeft: `3px solid ${accent}`,
          padding: '16px 20px',
          borderRadius: 8,
        }}>
          <span style={{ color: withAlpha(accent, 0.6) }}>$ </span>{body}
        </div>

        <ProgressBar progress={progress} accent={accent} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
