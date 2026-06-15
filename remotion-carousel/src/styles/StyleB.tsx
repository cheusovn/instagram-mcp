import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { SlideData, FONTS, BRAND, SLIDE_DURATION, withAlpha, splitWords, isKeyWord, rng } from '../theme';
import { Header, ProgressBar, KenBurnsImage, TelegramIcon, InstagramProfileMockup } from '../shared';

const BLUE    = '#007AFF';
const INDIGO  = '#5856D6';
const MINT    = '#00C7BE';
const ICE     = '#E8F4FF';
const DARK    = '#1C1C2E';

// ── Floating glass orbs (light refraction) ────────────────────────────────
function GlassOrbs({ frame, fps, slideNum }: { frame: number; fps: number; slideNum: number }) {
  const r = rng(slideNum * 23 + 11);
  const orbs = Array.from({ length: 6 }, () => ({
    x: 100 + r() * 880,
    y: 100 + r() * 1150,
    size: 60 + r() * 200,
    speed: 0.05 + r() * 0.12,
    phase: r() * Math.PI * 2,
    color: [BLUE, INDIGO, MINT, '#ffffff'][Math.floor(r() * 4)],
  }));
  const t = frame / fps;
  return (
    <>
      {orbs.map((o, i) => {
        const ox = Math.sin(t * o.speed + o.phase) * 18;
        const oy = Math.cos(t * o.speed * 0.7 + o.phase) * 22;
        return (
          <div key={i} style={{
            position: 'absolute',
            left: o.x + ox, top: o.y + oy,
            width: o.size, height: o.size,
            borderRadius: '50%',
            background: `radial-gradient(circle at 35% 35%, ${withAlpha('#fff', 0.4)}, ${withAlpha(o.color, 0.08)} 60%, transparent)`,
            border: `1px solid ${withAlpha(o.color, 0.2)}`,
            backdropFilter: 'blur(4px)',
            boxShadow: `inset 0 0 40px ${withAlpha(o.color, 0.06)}, 0 8px 32px ${withAlpha(o.color, 0.08)}`,
            opacity: 0.7,
            zIndex: 1,
          }} />
        );
      })}
    </>
  );
}

// ── Bento grid wireframe ────────────────────────────────────────────────────
function BentoWire({ frame, slideNum }: { frame: number; slideNum: number }) {
  const r = rng(slideNum * 7);
  const enter = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: 'clamp' });
  const rects = [
    { x: 40, y: 80, w: 300, h: 220 },
    { x: 360, y: 80, w: 680, h: 100 },
    { x: 360, y: 200, w: 320, h: 100 },
    { x: 700, y: 200, w: 340, h: 100 },
    { x: 40, y: 320, w: 1000, h: 60 },
  ];
  return (
    <svg width={1080} height={1350} style={{ position: 'absolute', inset: 0, opacity: 0.06 * enter, zIndex: 1 }}>
      {rects.map((rect, i) => (
        <rect key={i} x={rect.x} y={rect.y} width={rect.w} height={rect.h}
          fill="none" stroke={BLUE} strokeWidth={1} rx={8} />
      ))}
      <line x1={540} y1={0} x2={540} y2={1350} stroke={BLUE} strokeWidth={0.5} />
      <line x1={0} y1={675} x2={1080} y2={675} stroke={BLUE} strokeWidth={0.5} />
    </svg>
  );
}

// ── Light streak ────────────────────────────────────────────────────────────
function LightStreak({ frame }: { frame: number }) {
  const x = interpolate(frame, [0, SLIDE_DURATION], [-300, 1400]);
  return (
    <div style={{
      position: 'absolute', top: 0, bottom: 0, left: x, width: 120,
      background: `linear-gradient(90deg, transparent, ${withAlpha(BLUE, 0.04)}, ${withAlpha('#fff', 0.07)}, ${withAlpha(BLUE, 0.04)}, transparent)`,
      transform: 'skewX(-12deg)',
      zIndex: 4,
    }} />
  );
}

// ── Premium glass card ─────────────────────────────────────────────────────
function GlassCard({ children, accent = BLUE, dark = false, style }: {
  children: React.ReactNode; accent?: string; dark?: boolean; style?: React.CSSProperties;
}) {
  return (
    <div style={{
      background: dark
        ? `rgba(28,28,46,0.92)`
        : `rgba(255,255,255,0.72)`,
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      border: `1px solid ${dark ? withAlpha(accent, 0.35) : withAlpha(accent, 0.2)}`,
      borderRadius: 18,
      boxShadow: dark
        ? `0 0 20px ${withAlpha(accent, 0.3)}, 0 8px 32px rgba(0,0,0,0.3)`
        : `0 4px 24px ${withAlpha(BLUE, 0.1)}, inset 0 1px 0 rgba(255,255,255,0.8), 0 1px 0 ${withAlpha(BLUE, 0.08)}`,
      ...style,
    }}>
      {children}
    </div>
  );
}

// ── Dot grid ────────────────────────────────────────────────────────────────
function DotGrid({ opacity = 0.06 }: { opacity?: number }) {
  return (
    <svg width={1080} height={1350} style={{ position: 'absolute', inset: 0, opacity, zIndex: 1 }}>
      {Array.from({ length: 54 }).map((_, row) =>
        Array.from({ length: 22 }).map((_, col) => (
          <circle key={`${row}-${col}`} cx={col * 50 + 15} cy={row * 25 + 15} r={1.2} fill={BLUE} />
        ))
      )}
    </svg>
  );
}

const BG = `linear-gradient(160deg, #f0f4ff 0%, #e8f4ff 35%, #f5f0ff 65%, #f0f8ff 100%)`;

// ── MAIN EXPORT ────────────────────────────────────────────────────────────
export const StyleB: React.FC<SlideData> = (props) => {
  const { headline, body, emoji, kicker, image, isLast, accentColor, slideNum, total, telegram, profileHandle } = props;
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const accent = accentColor || BLUE;
  const progress = slideNum / total;

  const fadeOut = interpolate(frame, [SLIDE_DURATION - 12, SLIDE_DURATION], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const enter = spring({ frame, fps, config: { damping: 28, stiffness: 160, mass: 0.9 }, durationInFrames: 22 });

  // CTA slide
  if (isLast) {
    const scaleIn = spring({ frame: Math.max(0, frame - 4), fps, config: { damping: 18, stiffness: 120 }, durationInFrames: 30 });
    return (
      <AbsoluteFill style={{ background: BG, opacity: fadeOut, overflow: 'hidden' }}>
        <DotGrid />
        <GlassOrbs frame={frame} fps={fps} slideNum={slideNum} />
        <BentoWire frame={frame} slideNum={slideNum} />
        <LightStreak frame={frame} />

        <AbsoluteFill style={{ zIndex: 5, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 55, gap: 22 }}>
          <GlassCard accent={BLUE} style={{ padding: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, transform: `scale(${scaleIn})`, opacity: scaleIn, width: '100%' }}>
            <div style={{ filter: `drop-shadow(0 0 20px ${BLUE}) drop-shadow(0 0 40px ${withAlpha(BLUE, 0.4)})` }}>
              <TelegramIcon size={84} />
            </div>
            <div style={{ fontFamily: FONTS.oswald, fontWeight: 700, fontSize: 48, color: DARK, textAlign: 'center', lineHeight: 1.2, textTransform: 'uppercase' }}>
              ВЕСЬ МОЙ ИИ-СТЕК —<br />
              <span style={{ color: BLUE }}>В МОЁМ TELEGRAM</span>
            </div>
            <div style={{ fontFamily: FONTS.mono, fontSize: 18, color: withAlpha(DARK, 0.45), textAlign: 'center', letterSpacing: 3 }}>
              ССЫЛКА В ШАПКЕ ПРОФИЛЯ ↓
            </div>
          </GlassCard>
          <div style={{ transform: `scale(${scaleIn})`, opacity: scaleIn, width: '100%' }}>
            <InstagramProfileMockup handle={profileHandle || BRAND} accent={BLUE} />
          </div>
        </AbsoluteFill>
      </AbsoluteFill>
    );
  }

  const words = splitWords(headline);

  return (
    <AbsoluteFill style={{ background: BG, opacity: fadeOut, overflow: 'hidden' }}>
      {image && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
          <KenBurnsImage src={image} style={{ width: '100%', height: '100%' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(240,244,255,0.7)', mixBlendMode: 'lighten' }} />
        </div>
      )}

      <DotGrid />
      <GlassOrbs frame={frame} fps={fps} slideNum={slideNum} />
      <BentoWire frame={frame} slideNum={slideNum} />
      <LightStreak frame={frame} />

      <AbsoluteFill style={{ zIndex: 5, padding: '44px 44px 36px', display: 'flex', flexDirection: 'column' }}>
        <Header brand={BRAND} slideNum={slideNum} total={total} accent={BLUE} />

        {/* Kicker */}
        <GlassCard dark accent={INDIGO} style={{
          alignSelf: 'flex-start', padding: '5px 18px', marginTop: 16,
          opacity: enter, transform: `translateX(${(1 - enter) * -40}px)`,
        }}>
          <div style={{ fontFamily: FONTS.mono, fontSize: 14, letterSpacing: 4, color: MINT, textTransform: 'uppercase' }}>
            {kicker || `MODULE_${String(slideNum).padStart(2, '0')}`}
          </div>
        </GlassCard>

        {/* Emoji */}
        <div style={{
          alignSelf: 'flex-start', marginTop: 16,
          fontSize: 76, lineHeight: 1,
          width: 108, height: 108,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: `rgba(255,255,255,0.85)`,
          border: `2px solid ${withAlpha(BLUE, 0.3)}`,
          borderRadius: 24,
          boxShadow: `0 8px 32px ${withAlpha(BLUE, 0.15)}, inset 0 1px 0 rgba(255,255,255,0.9)`,
          transform: `scale(${spring({ frame, fps, config: { damping: 18, stiffness: 180 } })}) rotate(${Math.sin(frame * 0.06) * 1.5}deg)`,
        }}>
          {emoji}
        </div>

        {/* Headline */}
        <div style={{ marginTop: 16, marginBottom: 8 }}>
          {words.map((w, i) => {
            const s = spring({ frame: Math.max(0, frame - i * 4), fps, config: { damping: 26, stiffness: 200, mass: 0.8 }, durationInFrames: 18 });
            return isKeyWord(w) ? (
              <span key={i} style={{ display: 'inline-block', marginRight: 10, transform: `translateY(${(1 - s) * 30}px)`, opacity: s }}>
                <span style={{
                  display: 'inline-block',
                  fontFamily: FONTS.oswald, fontWeight: 700, fontSize: 66,
                  textTransform: 'uppercase',
                  color: '#fff', background: BLUE,
                  padding: '0 10px', borderRadius: 6,
                  boxShadow: `0 4px 20px ${withAlpha(BLUE, 0.35)}`,
                  lineHeight: 1.1,
                }}>{w}</span>
              </span>
            ) : (
              <span key={i} style={{
                display: 'inline-block',
                fontFamily: FONTS.oswald, fontWeight: 700, fontSize: 66,
                textTransform: 'uppercase', color: DARK, lineHeight: 1.1,
                marginRight: 10,
                transform: `translateY(${(1 - s) * 30}px)`, opacity: s,
              }}>{w}</span>
            );
          })}
        </div>

        {/* Body */}
        <GlassCard accent={BLUE} style={{
          padding: '14px 20px', marginTop: 8,
          transform: `translateX(${(1 - enter) * -28}px)`, opacity: enter,
        }}>
          <div style={{ fontFamily: FONTS.mono, fontSize: 24, color: DARK, lineHeight: 1.6, borderLeft: `3px solid ${BLUE}`, paddingLeft: 12, opacity: 0.88 }}>
            {body}
          </div>
        </GlassCard>

        {/* Tags */}
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <GlassCard accent={BLUE} style={{ padding: '7px 14px', transform: `scale(${spring({ frame: Math.max(0, frame - 18), fps, config: { damping: 22, stiffness: 200 } })})` }}>
            <div style={{ fontFamily: FONTS.mono, fontSize: 10, color: withAlpha(BLUE, 0.6), letterSpacing: 2 }}>СЛАЙД</div>
            <div style={{ fontFamily: FONTS.bebas, fontSize: 28, color: DARK }}>{slideNum}/{total}</div>
          </GlassCard>
          <GlassCard dark accent={INDIGO} style={{ padding: '7px 14px', transform: `scale(${spring({ frame: Math.max(0, frame - 22), fps, config: { damping: 22, stiffness: 200 } })})` }}>
            <div style={{ fontFamily: FONTS.mono, fontSize: 10, color: withAlpha(MINT, 0.7), letterSpacing: 2 }}>ТРЕНД</div>
            <div style={{ fontFamily: FONTS.bebas, fontSize: 28, color: MINT }}>2026</div>
          </GlassCard>
          <GlassCard accent={BLUE} style={{ padding: '7px 14px', flex: 1, display: 'flex', alignItems: 'center', transform: `scale(${spring({ frame: Math.max(0, frame - 26), fps, config: { damping: 22, stiffness: 200 } })})` }}>
            <div style={{ fontFamily: FONTS.mono, fontSize: 17, color: BLUE }}>@nikolay_cheusov</div>
          </GlassCard>
        </div>

        <ProgressBar progress={progress} accent={BLUE} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
