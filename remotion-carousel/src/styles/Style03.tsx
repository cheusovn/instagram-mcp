import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { SlideData, FONTS, BRAND, SLIDE_DURATION, withAlpha, splitWords, isKeyWord, rng } from '../theme';
import {
  Header,
  ProgressBar,
  KenBurnsImage,
  TelegramIcon,
  InstagramProfileMockup,
} from '../shared';

// ── СТИЛЬ 03 — NANO BANANA × BRUTALIST NEON ──────────────────────────────────
// Шрифт: Oswald (узкий, мощный, кириллица).
// Nano Banana Pro aesthetic: liquid-glass bento cards, cyberpunk color grading,
// heavy chromatic aberration, neon grid, animated energy particles,
// bento data modules, scanline sweep, glitch bursts, holographic shimmer.

const NEON = '#00F0FF';
const MAGENTA = '#FF2BD6';
const YELLOW = '#FFE600';
const GREEN_NEON = '#00FF9F';

// ── Хроматическая аберрация (RGB split на любом элементе) ──────────────────
function ChromaLayer({
  children, offsetPx = 4, style,
}: { children: React.ReactNode; offsetPx?: number; style?: React.CSSProperties }) {
  return (
    <div style={{ position: 'relative', ...style }}>
      <div style={{ position: 'absolute', top: 0, left: offsetPx, opacity: 0.5, mixBlendMode: 'screen', color: '#FF2020' }}>
        {children}
      </div>
      <div style={{ position: 'absolute', top: offsetPx, left: -offsetPx, opacity: 0.5, mixBlendMode: 'screen', color: '#2060FF' }}>
        {children}
      </div>
      <div style={{ position: 'relative' }}>{children}</div>
    </div>
  );
}

// ── Нео-сетка (более плотная, двойной слой) ────────────────────────────────
function NeonGrid({ accent, opacity = 0.18 }: { accent: string; opacity?: number }) {
  return (
    <svg width={1080} height={1350} style={{ position: 'absolute', inset: 0, opacity }}>
      {/* Тонкая сетка */}
      {Array.from({ length: 25 }).map((_, i) => (
        <line key={`v${i}`} x1={i * 45} y1={0} x2={i * 45} y2={1350} stroke={accent} strokeWidth={0.5} />
      ))}
      {Array.from({ length: 31 }).map((_, i) => (
        <line key={`h${i}`} x1={0} y1={i * 45} x2={1080} y2={i * 45} stroke={accent} strokeWidth={0.5} />
      ))}
      {/* Жирные акцентные */}
      {[0, 270, 540, 810, 1080].map((x, i) => (
        <line key={`vb${i}`} x1={x} y1={0} x2={x} y2={1350} stroke={accent} strokeWidth={2} opacity={0.8} />
      ))}
      {[0, 337, 675, 1012, 1350].map((y, i) => (
        <line key={`hb${i}`} x1={0} y1={y} x2={1080} y2={y} stroke={accent} strokeWidth={2} opacity={0.8} />
      ))}
      {/* Диагональные акценты */}
      <line x1={0} y1={0} x2={1080} y2={1350} stroke={MAGENTA} strokeWidth={0.5} opacity={0.3} />
      <line x1={1080} y1={0} x2={0} y2={1350} stroke={MAGENTA} strokeWidth={0.5} opacity={0.3} />
    </svg>
  );
}

// ── Scanline sweep (летит снизу вверх) ─────────────────────────────────────
function ScanlineSweep({ frame, accent }: { frame: number; accent: string }) {
  const y = 1350 - (frame * 9) % 1400;
  return (
    <>
      <div style={{ position: 'absolute', left: 0, right: 0, top: y, height: 3, background: accent, boxShadow: `0 0 24px 4px ${accent}`, opacity: 0.7, zIndex: 3 }} />
      <div style={{ position: 'absolute', left: 0, right: 0, top: y + 6, height: 60, background: `linear-gradient(to bottom, ${withAlpha(accent, 0.08)}, transparent)`, zIndex: 3 }} />
    </>
  );
}

// ── Energy particles ────────────────────────────────────────────────────────
function EnergyParticles({ frame, fps, slideNum, accent }: { frame: number; fps: number; slideNum: number; accent: string }) {
  const rand = rng(slideNum * 77 + 3);
  const particles = Array.from({ length: 30 }, (_, i) => ({
    x: rand() * 1080,
    y: rand() * 1350,
    size: 2 + rand() * 6,
    speed: 0.3 + rand() * 0.8,
    phase: rand() * Math.PI * 2,
    color: [accent, MAGENTA, YELLOW, GREEN_NEON][Math.floor(rand() * 4)],
    trail: rand() > 0.6,
  }));
  const t = frame / fps;
  return (
    <>
      {particles.map((p, i) => {
        const ox = Math.sin(t * p.speed + p.phase) * 14;
        const oy = Math.cos(t * p.speed * 0.7 + p.phase) * 18;
        return (
          <div key={i} style={{
            position: 'absolute',
            left: p.x + ox,
            top: p.y + oy,
            width: p.size,
            height: p.trail ? p.size * 4 : p.size,
            borderRadius: p.trail ? p.size / 2 : '50%',
            background: p.color,
            opacity: 0.65,
            boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
            transform: p.trail ? `rotate(${Math.atan2(oy, ox) * 57.3 + 90}deg)` : 'none',
          }} />
        );
      })}
    </>
  );
}

// ── Glitch burst (вспышка смещения + цвет-split) ───────────────────────────
function GlitchBurst({ frame, slideNum }: { frame: number; slideNum: number }) {
  const rand = rng(slideNum * 53 + frame);
  const burst1 = frame % 37 < 3;
  const burst2 = frame % 61 < 2;
  const burst3 = (frame > 10 && frame < 14) || (frame > 55 && frame < 58);
  if (!burst1 && !burst2 && !burst3) return null;
  const lines = Array.from({ length: burst3 ? 5 : 2 }, (_, i) => ({
    y: rand() * 80 + 10,
    h: 2 + rand() * (burst3 ? 12 : 5),
    color: [NEON, MAGENTA, YELLOW][i % 3],
    offset: (rand() - 0.5) * 40,
  }));
  return (
    <>
      {lines.map((l, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: l.offset,
          right: -l.offset,
          top: `${l.y}%`,
          height: l.h,
          background: l.color,
          opacity: 0.4 + rand() * 0.3,
          zIndex: 20,
          mixBlendMode: 'screen',
        }} />
      ))}
    </>
  );
}

// ── Liquid Glass Bento Card (Nano Banana style) ────────────────────────────
function BentoCard({
  children, accent, style, neonBorder = false,
}: { children: React.ReactNode; accent: string; style?: React.CSSProperties; neonBorder?: boolean }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.06)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      border: neonBorder
        ? `2px solid ${accent}`
        : '1px solid rgba(255,255,255,0.12)',
      borderRadius: 12,
      boxShadow: neonBorder
        ? `0 0 20px ${withAlpha(accent, 0.4)}, inset 0 0 20px ${withAlpha(accent, 0.06)}, 0 8px 32px rgba(0,0,0,0.5)`
        : '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
      ...style,
    }}>
      {children}
    </div>
  );
}

// ── Holographic shimmer strip ───────────────────────────────────────────────
function HoloStrip({ frame }: { frame: number }) {
  const x = interpolate(frame, [0, SLIDE_DURATION], [-200, 1280]);
  return (
    <div style={{
      position: 'absolute',
      top: 0,
      bottom: 0,
      left: x,
      width: 120,
      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.04), rgba(0,240,255,0.06), rgba(255,43,214,0.04), transparent)',
      transform: 'skewX(-15deg)',
      zIndex: 4,
      pointerEvents: 'none',
    }} />
  );
}

// ── Corner markers (Nano Banana grid corner decoration) ────────────────────
function CornerMarkers({ accent }: { accent: string }) {
  const corners = [
    { top: 0, left: 0, borderTop: `3px solid ${accent}`, borderLeft: `3px solid ${accent}` },
    { top: 0, right: 0, borderTop: `3px solid ${MAGENTA}`, borderRight: `3px solid ${MAGENTA}` },
    { bottom: 0, left: 0, borderBottom: `3px solid ${MAGENTA}`, borderLeft: `3px solid ${MAGENTA}` },
    { bottom: 0, right: 0, borderBottom: `3px solid ${accent}`, borderRight: `3px solid ${accent}` },
  ];
  return (
    <>
      {corners.map((s, i) => (
        <div key={i} style={{ position: 'absolute', width: 30, height: 30, ...s }} />
      ))}
    </>
  );
}

// ── Data tag (маленький модуль с цифрой/статом) ────────────────────────────
function DataTag({ label, value, accent, delay, frame, fps }: { label: string; value: string; accent: string; delay: number; frame: number; fps: number }) {
  const s = spring({ frame: Math.max(0, frame - delay), fps, config: { damping: 22, stiffness: 200 }, durationInFrames: 18 });
  return (
    <BentoCard accent={accent} neonBorder style={{ padding: '10px 16px', transform: `scale(${s})`, opacity: s }}>
      <div style={{ fontFamily: FONTS.mono, fontSize: 12, color: withAlpha(accent, 0.8), letterSpacing: 2, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontFamily: FONTS.bebas, fontSize: 32, color: accent, lineHeight: 1, letterSpacing: 1, textShadow: `0 0 14px ${accent}` }}>{value}</div>
    </BentoCard>
  );
}

// ── MAIN COMPONENT ──────────────────────────────────────────────────────────
export const Style03: React.FC<SlideData> = (props) => {
  const {
    headline,
    body,
    emoji,
    kicker,
    image,
    isLast,
    accentColor,
    slideNum,
    total,
    telegram,
    profileHandle,
  } = props;

  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const accent = accentColor || NEON;
  const progress = slideNum / total;

  const fadeOut = interpolate(frame, [SLIDE_DURATION - 12, SLIDE_DURATION], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const rand = rng(slideNum * 53 + frame % 7);
  const glitchActive = frame % 37 < 3 || (frame > 8 && frame < 13) || frame % 61 < 2;
  const gx = glitchActive ? (rand() - 0.5) * 20 : 0;
  const gy = glitchActive ? (rand() - 0.5) * 4 : 0;

  const enter = spring({ frame, fps, config: { damping: 26, stiffness: 180, mass: 0.8 }, durationInFrames: 20 });

  const bg = 'linear-gradient(135deg, #080018 0%, #16003a 40%, #0a001c 70%, #000a20 100%)';

  // ── CTA SLIDE ─────────────────────────────────────────────────────────────
  if (isLast) {
    const scaleIn = spring({ frame: Math.max(0, frame - 4), fps, config: { damping: 18, stiffness: 130 }, durationInFrames: 28 });
    return (
      <AbsoluteFill style={{ background: bg, opacity: fadeOut, overflow: 'hidden' }}>
        <NeonGrid accent={accent} opacity={0.12} />
        <EnergyParticles frame={frame} fps={fps} slideNum={slideNum} accent={accent} />
        <ScanlineSweep frame={frame} accent={GREEN_NEON} />
        <GlitchBurst frame={frame} slideNum={slideNum} />
        <HoloStrip frame={frame} />

        <AbsoluteFill style={{ zIndex: 5, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 60, gap: 24 }}>
          <BentoCard accent="#2AABEE" neonBorder style={{ padding: 28, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, transform: `scale(${scaleIn})`, opacity: scaleIn, width: '100%' }}>
            <div style={{ filter: `drop-shadow(0 0 24px #2AABEE)` }}>
              <TelegramIcon size={80} />
            </div>
            <ChromaLayer offsetPx={3}>
              <div style={{ fontFamily: FONTS.oswald, fontWeight: 700, fontSize: 52, color: '#fff', textAlign: 'center', lineHeight: 1.15, textTransform: 'uppercase' }}>
                Больше информации —<br />
                <span style={{ color: '#2AABEE', textShadow: `0 0 20px #2AABEE` }}>в моём Telegram</span>
              </div>
            </ChromaLayer>
            <div style={{ fontFamily: FONTS.mono, fontSize: 24, color: withAlpha('#fff', 0.6), textAlign: 'center', letterSpacing: 3 }}>
              ССЫЛКА В ШАПКЕ ПРОФИЛЯ ↓
            </div>
          </BentoCard>

          <div style={{ transform: `scale(${scaleIn})`, opacity: scaleIn, width: '100%' }}>
            <InstagramProfileMockup handle={profileHandle || BRAND} accent="#2AABEE" />
          </div>
        </AbsoluteFill>
      </AbsoluteFill>
    );
  }

  const words = splitWords(headline);

  return (
    <AbsoluteFill style={{ background: bg, opacity: fadeOut, overflow: 'hidden', transform: `translate(${gx}px, ${gy}px)` }}>
      {/* Фон */}
      <NeonGrid accent={accent} opacity={0.15} />
      <EnergyParticles frame={frame} fps={fps} slideNum={slideNum} accent={accent} />
      <ScanlineSweep frame={frame} accent={accent} />
      <GlitchBurst frame={frame} slideNum={slideNum} />
      <HoloStrip frame={frame} />

      {/* Угловые маркеры */}
      <CornerMarkers accent={accent} />

      {/* Radial glow background */}
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 20% 30%, ${withAlpha(accent, 0.07)} 0%, transparent 60%), radial-gradient(ellipse at 80% 70%, ${withAlpha(MAGENTA, 0.06)} 0%, transparent 50%)` }} />

      {/* КОНТЕНТ */}
      <AbsoluteFill style={{ zIndex: 5, padding: '44px 44px 36px', display: 'flex', flexDirection: 'column' }}>

        <Header brand={BRAND} slideNum={slideNum} total={total} accent={accent} />

        {/* Моно-метка — bento card */}
        <BentoCard accent={MAGENTA} neonBorder style={{
          alignSelf: 'flex-start',
          padding: '6px 20px',
          marginTop: 20,
          opacity: enter,
          transform: `translateX(${(1 - enter) * -30}px)`,
        }}>
          <div style={{ fontFamily: FONTS.mono, fontSize: 18, letterSpacing: 4, color: MAGENTA, textTransform: 'uppercase', textShadow: `0 0 10px ${MAGENTA}` }}>
            {kicker || `SYS://SLIDE_${String(slideNum).padStart(2, '0')}`}
          </div>
        </BentoCard>

        {/* Emoji в нео-боксе с glow + chroma */}
        <ChromaLayer offsetPx={5} style={{ alignSelf: 'flex-start', marginTop: 20 }}>
          <div style={{
            fontSize: 90,
            lineHeight: 1,
            width: 130,
            height: 130,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: `3px solid ${accent}`,
            boxShadow: `0 0 30px ${accent}, inset 0 0 20px ${withAlpha(accent, 0.3)}, 6px 6px 0 ${MAGENTA}`,
            transform: `scale(${spring({ frame, fps, config: { damping: 14, stiffness: 200, mass: 0.8 } })})`,
          }}>
            {emoji}
          </div>
        </ChromaLayer>

        {/* Headline — stagger + chroma на ключевых словах */}
        <div style={{ marginTop: 20, marginBottom: 8 }}>
          {words.map((w, i) => {
            const delay = i * 4;
            const wSpr = spring({ frame: Math.max(0, frame - delay), fps, config: { damping: 24, stiffness: 220, mass: 0.7 }, durationInFrames: 16 });
            const isKey = isKeyWord(w);
            if (isKey) {
              return (
                <span key={i} style={{ display: 'inline-block', marginRight: 14, transform: `translateY(${(1 - wSpr) * 30}px)`, opacity: wSpr }}>
                  <ChromaLayer offsetPx={4}>
                    <span style={{
                      display: 'inline-block',
                      fontFamily: FONTS.oswald,
                      fontWeight: 700,
                      fontSize: 72,
                      textTransform: 'uppercase',
                      color: '#000',
                      background: accent,
                      padding: '0 10px',
                      boxShadow: `0 0 30px ${accent}, 4px 4px 0 ${MAGENTA}`,
                      lineHeight: 1.1,
                    }}>{w}</span>
                  </ChromaLayer>
                </span>
              );
            }
            return (
              <span key={i} style={{
                display: 'inline-block',
                fontFamily: FONTS.oswald,
                fontWeight: 700,
                fontSize: 72,
                textTransform: 'uppercase',
                color: '#fff',
                lineHeight: 1.1,
                marginRight: 14,
                transform: `translateY(${(1 - wSpr) * 30}px)`,
                opacity: wSpr,
                textShadow: `2px 0 ${MAGENTA}, -2px 0 ${withAlpha(accent, 0.6)}`,
              }}>{w}</span>
            );
          })}
        </div>

        {/* Body — Nano Banana liquid-glass bento card */}
        <BentoCard accent={accent} neonBorder style={{
          padding: '16px 22px',
          marginTop: 10,
          transform: `translateX(${(1 - enter) * -24}px)`,
          opacity: enter,
        }}>
          <div style={{ fontFamily: FONTS.mono, fontSize: 28, color: withAlpha('#fff', 0.9), lineHeight: 1.55, borderLeft: `3px solid ${MAGENTA}`, paddingLeft: 16 }}>
            <span style={{ color: withAlpha(accent, 0.7) }}>▶ </span>{body}
          </div>
        </BentoCard>

        {/* Bento data modules row — Nano Banana style */}
        <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'nowrap' }}>
          <DataTag label="СЛАЙД" value={`${slideNum}/${total}`} accent={accent} delay={18} frame={frame} fps={fps} />
          <DataTag label="2026" value="AI↑" accent={MAGENTA} delay={22} frame={frame} fps={fps} />
          <DataTag label="TG" value="⇩" accent={GREEN_NEON} delay={26} frame={frame} fps={fps} />
          <BentoCard accent={YELLOW} neonBorder style={{
            padding: '10px 16px',
            opacity: interpolate(frame, [30, 42], [0, 1], { extrapolateRight: 'clamp' }),
            transform: `scale(${spring({ frame: Math.max(0, frame - 26), fps, config: { damping: 22, stiffness: 200 }, durationInFrames: 18 })})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flex: 1,
          }}>
            <div style={{ fontFamily: FONTS.mono, fontSize: 22, color: YELLOW, textShadow: `0 0 10px ${YELLOW}`, letterSpacing: 1 }}>@nikolay_cheusov</div>
          </BentoCard>
        </div>

        <ProgressBar progress={progress} accent={accent} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
