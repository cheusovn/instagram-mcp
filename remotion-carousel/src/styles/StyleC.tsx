import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig, Img, staticFile } from 'remotion';
import { SlideData, FONTS, BRAND, SLIDE_DURATION, withAlpha, splitWords, isKeyWord, rng } from '../theme';
import { Header, ProgressBar, KenBurnsImage, TelegramIcon, InstagramProfileMockup } from '../shared';

const GOLD    = '#FFD700';
const ORANGE  = '#FF8C00';
const BRONZE  = '#CD7F32';
const CREAM   = '#FFF8E7';
const DARK    = '#1A0E00';
const DARK2   = '#0D0800';

// ── Gold dust particles ────────────────────────────────────────────────────
function GoldDust({ frame, fps, slideNum }: { frame: number; fps: number; slideNum: number }) {
  const r = rng(slideNum * 37 + 17);
  const particles = Array.from({ length: 55 }, () => ({
    x: r() * 1080,
    y: r() * 1350,
    size: 1 + r() * 4,
    speed: 0.08 + r() * 0.35,
    phase: r() * Math.PI * 2,
    drift: (r() - 0.5) * 20,
    color: [GOLD, ORANGE, CREAM, BRONZE][Math.floor(r() * 4)],
  }));
  const t = frame / fps;
  return (
    <>
      {particles.map((p, i) => {
        const oy = -((t * p.speed * 60 + p.phase * 50) % 1500);
        const ox = Math.sin(t * 0.3 + p.phase) * p.drift;
        const opacity = 0.3 + 0.4 * Math.sin(t * p.speed * 3 + p.phase);
        return (
          <div key={i} style={{
            position: 'absolute',
            left: p.x + ox, top: p.y + oy,
            width: p.size, height: p.size,
            borderRadius: '50%',
            background: p.color,
            opacity,
            boxShadow: `0 0 ${p.size * 3}px ${p.color}`,
            zIndex: 2,
          }} />
        );
      })}
    </>
  );
}

// ── Luxury shimmer sweep ────────────────────────────────────────────────────
function GoldShimmer({ frame }: { frame: number }) {
  const x = interpolate(frame, [0, SLIDE_DURATION], [-400, 1600]);
  return (
    <>
      <div style={{
        position: 'absolute', top: 0, bottom: 0, left: x, width: 200,
        background: `linear-gradient(90deg, transparent, ${withAlpha(GOLD, 0.06)}, ${withAlpha(CREAM, 0.09)}, ${withAlpha(GOLD, 0.06)}, transparent)`,
        transform: 'skewX(-18deg)',
        zIndex: 4,
      }} />
      <div style={{
        position: 'absolute', top: 0, bottom: 0, left: x - 350, width: 100,
        background: `linear-gradient(90deg, transparent, ${withAlpha(ORANGE, 0.04)}, transparent)`,
        transform: 'skewX(-14deg)',
        zIndex: 4,
      }} />
    </>
  );
}

// ── Art deco lines ────────────────────────────────────────────────────────
function ArtDeco({ opacity = 0.15 }: { opacity?: number }) {
  return (
    <svg width={1080} height={1350} style={{ position: 'absolute', inset: 0, opacity, zIndex: 1 }}>
      {/* Vertical lines */}
      <line x1={40} y1={0} x2={40} y2={1350} stroke={GOLD} strokeWidth={1} />
      <line x1={44} y1={0} x2={44} y2={1350} stroke={GOLD} strokeWidth={0.3} />
      <line x1={1036} y1={0} x2={1036} y2={1350} stroke={GOLD} strokeWidth={1} />
      <line x1={1040} y1={0} x2={1040} y2={1350} stroke={GOLD} strokeWidth={0.3} />
      {/* Horizontal lines */}
      <line x1={0} y1={80} x2={1080} y2={80} stroke={GOLD} strokeWidth={0.5} />
      <line x1={0} y1={84} x2={1080} y2={84} stroke={GOLD} strokeWidth={0.2} />
      <line x1={0} y1={1266} x2={1080} y2={1266} stroke={GOLD} strokeWidth={0.5} />
      <line x1={0} y1={1270} x2={1080} y2={1270} stroke={GOLD} strokeWidth={0.2} />
      {/* Diagonal accents */}
      <line x1={0} y1={0} x2={200} y2={200} stroke={GOLD} strokeWidth={0.5} opacity={0.5} />
      <line x1={1080} y1={0} x2={880} y2={200} stroke={GOLD} strokeWidth={0.5} opacity={0.5} />
      <line x1={0} y1={1350} x2={200} y2={1150} stroke={GOLD} strokeWidth={0.5} opacity={0.5} />
      <line x1={1080} y1={1350} x2={880} y2={1150} stroke={GOLD} strokeWidth={0.5} opacity={0.5} />
      {/* Center diamond */}
      <polygon points="540,600 590,650 540,700 490,650" fill="none" stroke={GOLD} strokeWidth={0.7} opacity={0.4} />
    </svg>
  );
}

// ── Gold glow card ────────────────────────────────────────────────────────
function GoldCard({ children, glow = false, style }: {
  children: React.ReactNode; glow?: boolean; style?: React.CSSProperties;
}) {
  return (
    <div style={{
      background: glow
        ? `linear-gradient(135deg, ${withAlpha(GOLD, 0.15)} 0%, ${withAlpha(ORANGE, 0.08)} 50%, ${withAlpha(GOLD, 0.12)} 100%)`
        : `rgba(20,10,0,0.75)`,
      backdropFilter: 'blur(16px)',
      border: glow ? `1.5px solid ${GOLD}` : `1px solid ${withAlpha(GOLD, 0.3)}`,
      borderRadius: 12,
      boxShadow: glow
        ? `0 0 20px ${withAlpha(GOLD, 0.4)}, inset 0 1px 0 ${withAlpha(CREAM, 0.08)}, 0 8px 32px rgba(0,0,0,0.6)`
        : `0 6px 24px rgba(0,0,0,0.5), inset 0 1px 0 ${withAlpha(GOLD, 0.08)}`,
      ...style,
    }}>
      {children}
    </div>
  );
}

// ── Entry flash ────────────────────────────────────────────────────────────
function EntryFlash({ frame }: { frame: number }) {
  if (frame > 12) return null;
  const op = interpolate(frame, [0, 2, 10], [0, 0.45, 0], { extrapolateRight: 'clamp' });
  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: `radial-gradient(ellipse at center, ${GOLD} 0%, transparent 70%)`,
      opacity: op, zIndex: 30, mixBlendMode: 'screen',
    }} />
  );
}

// ── Avatar circle (for slides with avatar = true) ─────────────────────────
function AvatarBadge({ frame, fps }: { frame: number; fps: number }) {
  const s = spring({ frame: Math.max(0, frame - 10), fps, config: { damping: 18, stiffness: 140 }, durationInFrames: 24 });
  const pulse = 0.8 + 0.2 * Math.sin(frame * 0.1);
  return (
    <div style={{
      position: 'absolute', top: 110, right: 44,
      width: 110, height: 110,
      borderRadius: '50%',
      border: `3px solid ${GOLD}`,
      boxShadow: `0 0 24px ${withAlpha(GOLD, 0.6 * pulse)}, 0 0 50px ${withAlpha(GOLD, 0.25 * pulse)}`,
      overflow: 'hidden',
      transform: `scale(${s})`,
      opacity: s,
      zIndex: 8,
      background: `linear-gradient(135deg, ${withAlpha(GOLD, 0.2)}, ${withAlpha(ORANGE, 0.15)})`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {/* Tries to load avatar; shows initials fallback */}
      <div style={{ fontFamily: FONTS.oswald, fontSize: 38, color: GOLD, fontWeight: 700 }}>Н</div>
    </div>
  );
}

const BG = `linear-gradient(160deg, ${DARK2} 0%, #1A0800 25%, #0D0500 50%, #1A0E00 75%, ${DARK2} 100%)`;

// ── MAIN EXPORT ────────────────────────────────────────────────────────────
export const StyleC: React.FC<SlideData> = (props) => {
  const { headline, body, emoji, kicker, image, isLast, accentColor, slideNum, total, telegram, profileHandle } = props;
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const accent = accentColor || GOLD;
  const progress = slideNum / total;

  const fadeOut = interpolate(frame, [SLIDE_DURATION - 12, SLIDE_DURATION], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const enter = spring({ frame, fps, config: { damping: 26, stiffness: 160, mass: 0.9 }, durationInFrames: 22 });
  const zoomPulse = 1 + 0.003 * Math.sin(frame * 0.18);

  // CTA slide
  if (isLast) {
    const scaleIn = spring({ frame: Math.max(0, frame - 4), fps, config: { damping: 18, stiffness: 120 }, durationInFrames: 30 });
    return (
      <AbsoluteFill style={{ background: BG, opacity: fadeOut, overflow: 'hidden', transform: `scale(${zoomPulse})` }}>
        <ArtDeco opacity={0.12} />
        <GoldDust frame={frame} fps={fps} slideNum={slideNum} />
        <GoldShimmer frame={frame} />
        <EntryFlash frame={frame} />

        <AbsoluteFill style={{ zIndex: 5, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 55, gap: 22 }}>
          <GoldCard glow style={{ padding: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, transform: `scale(${scaleIn})`, opacity: scaleIn, width: '100%' }}>
            <div style={{ filter: `drop-shadow(0 0 24px ${GOLD}) drop-shadow(0 0 50px ${withAlpha(GOLD, 0.4)})` }}>
              <TelegramIcon size={84} />
            </div>
            <div style={{ fontFamily: FONTS.oswald, fontWeight: 700, fontSize: 48, color: CREAM, textAlign: 'center', lineHeight: 1.2, textTransform: 'uppercase' }}>
              ВЕСЬ МОЙ ИИ-СТЕК —<br />
              <span style={{ color: GOLD, textShadow: `0 0 20px ${GOLD}, 0 0 50px ${withAlpha(GOLD, 0.5)}` }}>В МОЁМ TELEGRAM</span>
            </div>
            <div style={{ fontFamily: FONTS.mono, fontSize: 18, color: withAlpha(CREAM, 0.45), textAlign: 'center', letterSpacing: 3 }}>
              ССЫЛКА В ШАПКЕ ПРОФИЛЯ ↓
            </div>
          </GoldCard>
          <div style={{ transform: `scale(${scaleIn})`, opacity: scaleIn, width: '100%' }}>
            <InstagramProfileMockup handle={profileHandle || BRAND} accent={GOLD} />
          </div>
        </AbsoluteFill>
      </AbsoluteFill>
    );
  }

  const words = splitWords(headline);

  return (
    <AbsoluteFill style={{ background: BG, opacity: fadeOut, overflow: 'hidden', transform: `scale(${zoomPulse})` }}>
      {image && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
          <KenBurnsImage src={image} style={{ width: '100%', height: '100%' }} />
          <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(160deg, rgba(26,8,0,0.7), rgba(13,5,0,0.65))`, mixBlendMode: 'multiply' }} />
          <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 20% 30%, ${withAlpha(GOLD, 0.15)} 0%, transparent 55%)` }} />
        </div>
      )}

      <ArtDeco opacity={image ? 0.08 : 0.15} />
      <GoldDust frame={frame} fps={fps} slideNum={slideNum} />
      <GoldShimmer frame={frame} />
      <EntryFlash frame={frame} />

      {/* Avatar badge (shows on slides 1-3 as personal branding) */}
      {slideNum <= 3 && <AvatarBadge frame={frame} fps={fps} />}

      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 25% 25%, ${withAlpha(GOLD, 0.07)} 0%, transparent 50%), radial-gradient(ellipse at 75% 75%, ${withAlpha(ORANGE, 0.05)} 0%, transparent 45%)` }} />

      <AbsoluteFill style={{ zIndex: 5, padding: '44px 44px 36px', display: 'flex', flexDirection: 'column' }}>
        <Header brand={BRAND} slideNum={slideNum} total={total} accent={GOLD} />

        {/* Kicker */}
        <GoldCard glow style={{
          alignSelf: 'flex-start', padding: '5px 18px', marginTop: 16,
          opacity: enter, transform: `translateX(${(1 - enter) * -40}px)`,
        }}>
          <div style={{ fontFamily: FONTS.mono, fontSize: 14, letterSpacing: 4, color: GOLD, textTransform: 'uppercase', textShadow: `0 0 10px ${GOLD}` }}>
            {kicker || `GOLD_${String(slideNum).padStart(2, '0')}`}
          </div>
        </GoldCard>

        {/* Emoji with gold frame */}
        <div style={{
          alignSelf: 'flex-start', marginTop: 16,
          fontSize: 76, lineHeight: 1,
          width: 108, height: 108,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: `3px solid ${GOLD}`,
          boxShadow: `0 0 26px ${withAlpha(GOLD, 0.6)}, 0 0 60px ${withAlpha(GOLD, 0.25)}, 4px 4px 0 ${ORANGE}`,
          background: `linear-gradient(135deg, ${withAlpha(GOLD, 0.12)}, ${withAlpha(ORANGE, 0.06)})`,
          transform: `scale(${spring({ frame, fps, config: { damping: 16, stiffness: 180 } })}) rotate(${Math.sin(frame * 0.06) * 1.5}deg)`,
        }}>
          {emoji}
        </div>

        {/* Headline */}
        <div style={{ marginTop: 16, marginBottom: 8 }}>
          {words.map((w, i) => {
            const s = spring({ frame: Math.max(0, frame - i * 4), fps, config: { damping: 25, stiffness: 210, mass: 0.8 }, durationInFrames: 18 });
            return isKeyWord(w) ? (
              <span key={i} style={{ display: 'inline-block', marginRight: 10, transform: `translateY(${(1 - s) * 32}px)`, opacity: s }}>
                <span style={{
                  display: 'inline-block',
                  fontFamily: FONTS.oswald, fontWeight: 700, fontSize: 68,
                  textTransform: 'uppercase',
                  color: DARK, background: `linear-gradient(135deg, ${GOLD}, ${ORANGE})`,
                  padding: '0 10px',
                  boxShadow: `0 0 28px ${withAlpha(GOLD, 0.5)}, 4px 4px 0 ${BRONZE}`,
                  lineHeight: 1.1,
                }}>{w}</span>
              </span>
            ) : (
              <span key={i} style={{
                display: 'inline-block',
                fontFamily: FONTS.oswald, fontWeight: 700, fontSize: 68,
                textTransform: 'uppercase', color: CREAM, lineHeight: 1.1,
                marginRight: 10,
                transform: `translateY(${(1 - s) * 32}px)`, opacity: s,
                textShadow: `2px 0 ${BRONZE}, 0 0 20px ${withAlpha(GOLD, 0.2)}`,
              }}>{w}</span>
            );
          })}
        </div>

        {/* Body */}
        <GoldCard style={{
          padding: '13px 18px', marginTop: 8,
          transform: `translateX(${(1 - enter) * -28}px)`, opacity: enter,
        }}>
          <div style={{ fontFamily: FONTS.mono, fontSize: 25, color: withAlpha(CREAM, 0.88), lineHeight: 1.6, borderLeft: `3px solid ${GOLD}`, paddingLeft: 12 }}>
            <span style={{ color: withAlpha(GOLD, 0.7) }}>◆ </span>{body}
          </div>
        </GoldCard>

        {/* Tags */}
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <GoldCard glow style={{ padding: '7px 12px', transform: `scale(${spring({ frame: Math.max(0, frame - 18), fps, config: { damping: 22, stiffness: 200 } })})` }}>
            <div style={{ fontFamily: FONTS.mono, fontSize: 10, color: withAlpha(GOLD, 0.6), letterSpacing: 2 }}>СЛАЙД</div>
            <div style={{ fontFamily: FONTS.bebas, fontSize: 28, color: GOLD, textShadow: `0 0 10px ${GOLD}` }}>{slideNum}/{total}</div>
          </GoldCard>
          <GoldCard style={{ padding: '7px 12px', transform: `scale(${spring({ frame: Math.max(0, frame - 22), fps, config: { damping: 22, stiffness: 200 } })})` }}>
            <div style={{ fontFamily: FONTS.mono, fontSize: 10, color: withAlpha(ORANGE, 0.7), letterSpacing: 2 }}>КАПИТАЛ</div>
            <div style={{ fontFamily: FONTS.bebas, fontSize: 28, color: ORANGE }}>200K+</div>
          </GoldCard>
          <GoldCard glow style={{ padding: '7px 12px', flex: 1, display: 'flex', alignItems: 'center', transform: `scale(${spring({ frame: Math.max(0, frame - 26), fps, config: { damping: 22, stiffness: 200 } })})` }}>
            <div style={{ fontFamily: FONTS.mono, fontSize: 17, color: GOLD, textShadow: `0 0 8px ${withAlpha(GOLD, 0.5)}` }}>@nikolay_cheusov</div>
          </GoldCard>
        </div>

        <ProgressBar progress={progress} accent={GOLD} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
