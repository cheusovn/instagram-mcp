import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { SlideData, FONTS, BRAND, SLIDE_DURATION, withAlpha, splitWords, isKeyWord } from '../theme';
import {
  Header,
  ProgressBar,
  TelegramIcon,
  InstagramProfileMockup,
} from '../shared';

// ── СТИЛЬ 07 — SWISS BOLD MINIMAL ────────────────────────────────────────────
// Шрифт: Golos Text Black (современный кириллический гротеск) + Golos Text Regular.
// Фишка: швейцарская типографика — жёсткая сетка, мощный контраст,
// одна акцентная полоса, минимум декора, максимум силы текста.
// Фон: почти белый или насыщенный акцентный цвет.

function AccentBar({ accent, animate }: { accent: string; animate: number }) {
  return (
    <div
      style={{
        height: 14,
        background: accent,
        width: `${animate * 100}%`,
        marginBottom: 32,
        borderRadius: 0,
      }}
    />
  );
}

function NumberBadge({ num, accent, enter }: { num: number; accent: string; enter: number }) {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 72,
        height: 72,
        background: accent,
        borderRadius: 0,
        fontFamily: FONTS.golos,
        fontSize: 36,
        fontWeight: 900,
        color: '#fff',
        marginBottom: 28,
        transform: `scale(${enter})`,
        flexShrink: 0,
      }}
    >
      {String(num).padStart(2, '0')}
    </div>
  );
}

export const Style07: React.FC<SlideData> = (props) => {
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
  const accent = accentColor || '#FF3B00';
  const progress = slideNum / total;

  const isDark = true; // dark BG variant
  const bg = isDark ? '#0A0A0A' : '#F5F5F5';
  const textColor = isDark ? '#FFFFFF' : '#0A0A0A';

  const enter = spring({ frame, fps, config: { damping: 30, stiffness: 140, mass: 0.8 }, durationInFrames: 22 });
  const barAnim = spring({ frame: Math.max(0, frame - 6), fps, config: { damping: 28, stiffness: 90, mass: 1 }, durationInFrames: 30 });
  const fadeOut = interpolate(frame, [SLIDE_DURATION - 14, SLIDE_DURATION], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const words = splitWords(headline);

  if (isLast) {
    const scaleIn = spring({ frame: Math.max(0, frame - 4), fps, config: { damping: 20, stiffness: 120 }, durationInFrames: 28 });
    return (
      <AbsoluteFill style={{ background: '#0A0A0A', opacity: fadeOut }}>
        <AbsoluteFill style={{ zIndex: 1 }}>
          {/* Big accent stripe */}
          <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: `${scaleIn * 18}%`, background: '#2AABEE' }} />

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', height: '100%', padding: '0 64px' }}>
            <div style={{ transform: `scale(${scaleIn})`, marginBottom: 24, filter: 'drop-shadow(0 0 16px rgba(42,171,238,0.5))' }}>
              <TelegramIcon size={76} />
            </div>
            <div style={{ fontFamily: FONTS.golos, fontSize: 52, fontWeight: 900, color: '#fff', lineHeight: 1.15, marginBottom: 16, opacity: scaleIn }}>
              Больше информации —
            </div>
            <div style={{ fontFamily: FONTS.golos, fontSize: 52, fontWeight: 900, color: '#2AABEE', lineHeight: 1.15, marginBottom: 28, opacity: scaleIn }}>
              в моём Telegram-канале
            </div>
            <div style={{ fontFamily: FONTS.golos, fontSize: 28, fontWeight: 400, color: withAlpha('#fff', 0.6), marginBottom: 44, opacity: scaleIn }}>
              Ссылка в шапке профиля ↓
            </div>
            <div style={{ transform: `scale(${scaleIn})`, opacity: scaleIn }}>
              <InstagramProfileMockup handle={profileHandle || BRAND} accent="#2AABEE" />
            </div>
          </div>
        </AbsoluteFill>
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill style={{ background: bg, opacity: fadeOut }}>
      <AbsoluteFill style={{ zIndex: 1, padding: '52px 64px 40px', display: 'flex', flexDirection: 'column' }}>

        <Header brand={BRAND} accent={accent} slideNum={slideNum} total={total} />

        {/* Accent bar — animated width */}
        <div style={{ marginTop: 28 }}>
          <AccentBar accent={accent} animate={barAnim} />
        </div>

        {/* Slide number badge */}
        <NumberBadge num={slideNum} accent={accent} enter={enter} />

        {kicker && (
          <div style={{ fontFamily: FONTS.mono, fontSize: 20, color: accent, letterSpacing: 5, textTransform: 'uppercase', marginBottom: 16, opacity: enter }}>
            {kicker}
          </div>
        )}

        {/* Emoji accent */}
        <div style={{ fontSize: 72, lineHeight: 1, marginBottom: 20, opacity: enter, transform: `scale(${enter})` }}>
          {emoji}
        </div>

        {/* Headline — staggered words, bold Swiss style */}
        <div style={{ flex: 1 }}>
          {words.map((w, i) => {
            const delay = i * 4;
            const wSpr = spring({ frame: Math.max(0, frame - delay), fps, config: { damping: 28, stiffness: 150, mass: 0.75 }, durationInFrames: 22 });
            const isKey = isKeyWord(w);
            return (
              <span
                key={i}
                style={{
                  display: 'inline-block',
                  fontFamily: FONTS.golos,
                  fontSize: 68,
                  fontWeight: 900,
                  color: isKey ? accent : textColor,
                  lineHeight: 1.1,
                  marginRight: 12,
                  transform: `translateY(${(1 - wSpr) * 36}px)`,
                  opacity: wSpr,
                  textTransform: 'uppercase',
                  letterSpacing: isKey ? 2 : 0,
                }}
              >
                {w}
              </span>
            );
          })}
        </div>

        {/* Body — simple clean */}
        <div style={{
          marginTop: 'auto',
          paddingTop: 24,
          fontFamily: FONTS.golos,
          fontSize: 30,
          fontWeight: 400,
          color: withAlpha(textColor, 0.75),
          lineHeight: 1.5,
          transform: `translateX(${(1 - enter) * -24}px)`,
          opacity: enter,
          borderTop: `2px solid ${withAlpha(accent, 0.3)}`,
          paddingBottom: 16,
        }}>
          {body}
        </div>

        <ProgressBar progress={progress} accent={accent} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
