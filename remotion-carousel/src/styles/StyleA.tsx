import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { SlideData, FONTS, BRAND, SLIDE_DURATION, withAlpha, splitWords, isKeyWord, rng } from '../theme';
import { Header, ProgressBar, KenBurnsImage, TelegramIcon, InstagramProfileMockup } from '../shared';

const BANANA  = '#CCFF00';
const MAGENTA = '#FF00FF';
const CYAN    = '#00FFFF';
const WHITE   = '#FFFFFF';

// ── Digital matrix rain (Japanese katakana-style columns) ──────────────────
function MatrixRain({ frame, slideNum }: { frame: number; slideNum: number }) {
  const r = rng(slideNum * 19 + 7);
  const cols = Array.from({ length: 16 }, (_, i) => ({
    x: (i / 16) * 1080 + r() * 30,
    speed: 0.4 + r() * 0.8,
    phase: r() * Math.PI * 2,
    chars: Array.from({ length: 14 }, () => Math.floor(r() * 96 + 32)),
  }));
  const t = frame / 30;
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', opacity: 0.13, zIndex: 1, pointerEvents: 'none' }}>
      {cols.map((col, ci) => {
        const offset = ((t * col.speed + col.phase) * 80) % 1800;
        return col.chars.map((code, ri) => (
          <div key={`${ci}-${ri}`} style={{
            position: 'absolute',
            left: col.x,
            top: offset + ri * 90 - 800,
            fontFamily: 'monospace',
            fontSize: 15,
            color: BANANA,
            opacity: Math.max(0, 1 - ri / 14),
            lineHeight: 1,
          }}>
            {String.fromCharCode(code)}
          </div>
        ));
      })}
    </div>
  );
}

// ── Neon Katana slash burst ────────────────────────────────────────────────
function KatanaSlash({ frame, slideNum }: { frame: number; slideNum: number }) {
  const r = rng(slideNum * 31);
  const active = frame < 8;
  if (!active) return null;
  const op = interpolate(frame, [0, 2, 6], [0, 0.9, 0], { extrapolateRight: 'clamp' });
  const angle = -28 + r() * 14;
  return (
    <>
      <div style={{
        position: 'absolute',
        left: '10%', right: '10%',
        top: '35%', height: 4,
        background: `linear-gradient(90deg, transparent, ${BANANA}, ${CYAN}, ${BANANA}, transparent)`,
        boxShadow: `0 0 18px 4px ${BANANA}, 0 0 50px 10px ${withAlpha(BANANA, 0.4)}`,
        opacity: op,
        transform: `rotate(${angle}deg)`,
        zIndex: 30,
      }} />
      <div style={{
        position: 'absolute',
        left: '20%', right: '20%',
        top: '37%', height: 2,
        background: `linear-gradient(90deg, transparent, ${MAGENTA}, transparent)`,
        opacity: op * 0.6,
        transform: `rotate(${angle + 2}deg)`,
        zIndex: 29,
      }} />
    </>
  );
}

// ── Horizontal scanline ────────────────────────────────────────────────────
function Scanline({ frame }: { frame: number }) {
  const y = 1350 - (frame * 11) % 1500;
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top: y, height: 2, background: BANANA, boxShadow: `0 0 24px 4px ${BANANA}`, opacity: 0.6, zIndex: 3 }} />
  );
}

// ── Neon grid ─────────────────────────────────────────────────────────────
function NeonGrid({ opacity = 0.12 }: { opacity?: number }) {
  return (
    <svg width={1080} height={1350} style={{ position: 'absolute', inset: 0, opacity, zIndex: 1 }}>
      {Array.from({ length: 22 }).map((_, i) => (
        <line key={`v${i}`} x1={i * 50} y1={0} x2={i * 50} y2={1350} stroke={BANANA} strokeWidth={0.4} />
      ))}
      {Array.from({ length: 28 }).map((_, i) => (
        <line key={`h${i}`} x1={0} y1={i * 50} x2={1080} y2={i * 50} stroke={BANANA} strokeWidth={0.4} />
      ))}
      {[0, 360, 720, 1080].map((x, i) => (
        <line key={`vb${i}`} x1={x} y1={0} x2={x} y2={1350} stroke={CYAN} strokeWidth={1.2} opacity={0.5} />
      ))}
      {[0, 450, 900, 1350].map((y, i) => (
        <line key={`hb${i}`} x1={0} y1={y} x2={1080} y2={y} stroke={CYAN} strokeWidth={1.2} opacity={0.5} />
      ))}
    </svg>
  );
}

// ── Floating neon orbs ─────────────────────────────────────────────────────
function NeonOrbs({ frame, fps, slideNum }: { frame: number; fps: number; slideNum: number }) {
  const r = rng(slideNum * 41);
  const orbs = Array.from({ length: 20 }, () => ({
    x: r() * 1080,
    y: r() * 1350,
    size: 2 + r() * 8,
    speed: 0.15 + r() * 0.6,
    phase: r() * Math.PI * 2,
    color: [BANANA, CYAN, MAGENTA, WHITE][Math.floor(r() * 4)],
  }));
  const t = frame / fps;
  return (
    <>
      {orbs.map((o, i) => {
        const ox = Math.sin(t * o.speed + o.phase) * 20;
        const oy = Math.cos(t * o.speed * 0.8 + o.phase) * 25;
        const pulse = 0.5 + 0.5 * Math.sin(t * o.speed * 2 + o.phase);
        return (
          <div key={i} style={{
            position: 'absolute',
            left: o.x + ox, top: o.y + oy,
            width: o.size, height: o.size,
            borderRadius: '50%',
            background: o.color,
            opacity: 0.35 + pulse * 0.3,
            boxShadow: `0 0 ${o.size * 4}px ${o.color}`,
            zIndex: 2,
          }} />
        );
      })}
    </>
  );
}

// ── RGB chroma split ───────────────────────────────────────────────────────
function Chroma({ children, px = 4 }: { children: React.ReactNode; px?: number }) {
  return (
    <div style={{ position: 'relative' }}>
      <div style={{ position: 'absolute', top: 0, left: px, opacity: 0.5, mixBlendMode: 'screen', color: '#FF2020', filter: 'blur(0.5px)' }}>{children}</div>
      <div style={{ position: 'absolute', top: px * 0.5, left: -px, opacity: 0.5, mixBlendMode: 'screen', color: '#0040FF', filter: 'blur(0.5px)' }}>{children}</div>
      <div style={{ position: 'relative' }}>{children}</div>
    </div>
  );
}

// ── Corner brackets ────────────────────────────────────────────────────────
function Corners({ frame }: { frame: number }) {
  const pulse = 0.65 + 0.35 * Math.sin(frame * 0.12);
  const corners: React.CSSProperties[] = [
    { top: 0, left: 0, borderTop: `3px solid ${BANANA}`, borderLeft: `3px solid ${BANANA}` },
    { top: 0, right: 0, borderTop: `3px solid ${MAGENTA}`, borderRight: `3px solid ${MAGENTA}` },
    { bottom: 0, left: 0, borderBottom: `3px solid ${MAGENTA}`, borderLeft: `3px solid ${MAGENTA}` },
    { bottom: 0, right: 0, borderBottom: `3px solid ${BANANA}`, borderRight: `3px solid ${BANANA}` },
  ];
  return (
    <>
      {corners.map((s, i) => (
        <div key={i} style={{ position: 'absolute', width: 40, height: 40, opacity: pulse, ...s }} />
      ))}
    </>
  );
}

// ── Entry flash ────────────────────────────────────────────────────────────
function EntryFlash({ frame }: { frame: number }) {
  if (frame > 12) return null;
  const op = interpolate(frame, [0, 2, 10], [0, 0.5, 0], { extrapolateRight: 'clamp' });
  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: `radial-gradient(ellipse at center, ${BANANA} 0%, transparent 70%)`,
      opacity: op, zIndex: 30, mixBlendMode: 'screen',
    }} />
  );
}

// ── Glass card ─────────────────────────────────────────────────────────────
function GlassCard({ children, accent = BANANA, neon = false, style }: {
  children: React.ReactNode; accent?: string; neon?: boolean; style?: React.CSSProperties;
}) {
  return (
    <div style={{
      background: 'rgba(0,0,0,0.55)',
      backdropFilter: 'blur(14px)',
      border: neon ? `1.5px solid ${accent}` : `1px solid ${withAlpha(accent, 0.25)}`,
      borderRadius: 10,
      boxShadow: neon
        ? `0 0 18px ${withAlpha(accent, 0.5)}, inset 0 0 16px ${withAlpha(accent, 0.06)}, 0 6px 28px rgba(0,0,0,0.6)`
        : `0 6px 24px rgba(0,0,0,0.5)`,
      ...style,
    }}>
      {children}
    </div>
  );
}

const BG = 'linear-gradient(135deg, #000000 0%, #0a0010 30%, #001200 60%, #000008 100%)';

// ── MAIN EXPORT ────────────────────────────────────────────────────────────
export const StyleA: React.FC<SlideData> = (props) => {
  const { headline, body, emoji, kicker, image, isLast, accentColor, slideNum, total, telegram, profileHandle } = props;
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const accent = accentColor || BANANA;
  const progress = slideNum / total;

  const fadeOut = interpolate(frame, [SLIDE_DURATION - 12, SLIDE_DURATION], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const enter = spring({ frame, fps, config: { damping: 26, stiffness: 180, mass: 0.8 }, durationInFrames: 20 });
  const zoomPulse = 1 + 0.003 * Math.sin(frame * 0.21);

  // CTA slide
  if (isLast) {
    const scaleIn = spring({ frame: Math.max(0, frame - 4), fps, config: { damping: 18, stiffness: 130 }, durationInFrames: 28 });
    return (
      <AbsoluteFill style={{ background: BG, opacity: fadeOut, overflow: 'hidden', transform: `scale(${zoomPulse})` }}>
        <MatrixRain frame={frame} slideNum={slideNum} />
        <NeonGrid opacity={0.09} />
        <NeonOrbs frame={frame} fps={fps} slideNum={slideNum} />
        <Scanline frame={frame} />
        <Corners frame={frame} />
        <EntryFlash frame={frame} />
        <KatanaSlash frame={frame} slideNum={slideNum} />

        <AbsoluteFill style={{ zIndex: 5, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 55, gap: 22 }}>
          <GlassCard neon accent={CYAN} style={{ padding: 30, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, transform: `scale(${scaleIn})`, opacity: scaleIn, width: '100%' }}>
            <div style={{ filter: `drop-shadow(0 0 28px ${CYAN}) drop-shadow(0 0 60px ${CYAN})` }}>
              <TelegramIcon size={88} />
            </div>
            <Chroma px={5}>
              <div style={{ fontFamily: FONTS.oswald, fontWeight: 700, fontSize: 50, color: '#fff', textAlign: 'center', lineHeight: 1.15, textTransform: 'uppercase' }}>
                ВЕСЬ МОЙ ИИ-СТЕК —<br />
                <span style={{ color: BANANA, textShadow: `0 0 24px ${BANANA}, 0 0 60px ${BANANA}` }}>В МОЁМ TELEGRAM</span>
              </div>
            </Chroma>
            <div style={{ fontFamily: FONTS.mono, fontSize: 20, color: withAlpha('#fff', 0.5), textAlign: 'center', letterSpacing: 3 }}>
              ССЫЛКА В ШАПКЕ ПРОФИЛЯ ↓
            </div>
          </GlassCard>
          <div style={{ transform: `scale(${scaleIn})`, opacity: scaleIn, width: '100%' }}>
            <InstagramProfileMockup handle={profileHandle || BRAND} accent={BANANA} />
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
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', mixBlendMode: 'multiply' }} />
          <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 20% 30%, ${withAlpha(BANANA, 0.18)} 0%, transparent 55%)` }} />
        </div>
      )}

      <MatrixRain frame={frame} slideNum={slideNum} />
      <NeonGrid opacity={image ? 0.06 : 0.12} />
      <NeonOrbs frame={frame} fps={fps} slideNum={slideNum} />
      <Scanline frame={frame} />
      <Corners frame={frame} />
      <EntryFlash frame={frame} />
      <KatanaSlash frame={frame} slideNum={slideNum} />

      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 20% 20%, ${withAlpha(BANANA, 0.08)} 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, ${withAlpha(MAGENTA, 0.06)} 0%, transparent 45%)` }} />

      <AbsoluteFill style={{ zIndex: 5, padding: '44px 44px 36px', display: 'flex', flexDirection: 'column' }}>
        <Header brand={BRAND} slideNum={slideNum} total={total} accent={BANANA} />

        {/* Kicker */}
        <GlassCard neon accent={MAGENTA} style={{
          alignSelf: 'flex-start', padding: '5px 18px', marginTop: 16,
          opacity: enter, transform: `translateX(${(1 - enter) * -40}px)`,
        }}>
          <div style={{ fontFamily: FONTS.mono, fontSize: 15, letterSpacing: 4, color: MAGENTA, textTransform: 'uppercase', textShadow: `0 0 10px ${MAGENTA}` }}>
            {kicker || `SYS://NODE_${String(slideNum).padStart(2, '0')}`}
          </div>
        </GlassCard>

        {/* Emoji with banana glow */}
        <Chroma px={5}>
          <div style={{
            alignSelf: 'flex-start',
            fontSize: 78, lineHeight: 1, marginTop: 14,
            width: 112, height: 112,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: `3px solid ${BANANA}`,
            boxShadow: `0 0 28px ${BANANA}, 0 0 70px ${withAlpha(BANANA, 0.35)}, 5px 5px 0 ${MAGENTA}`,
            transform: `scale(${spring({ frame, fps, config: { damping: 14, stiffness: 200 } })}) rotate(${Math.sin(frame * 0.07) * 2}deg)`,
          }}>
            {emoji}
          </div>
        </Chroma>

        {/* Headline */}
        <div style={{ marginTop: 16, marginBottom: 8 }}>
          {words.map((w, i) => {
            const s = spring({ frame: Math.max(0, frame - i * 4), fps, config: { damping: 24, stiffness: 220, mass: 0.7 }, durationInFrames: 16 });
            return isKeyWord(w) ? (
              <span key={i} style={{ display: 'inline-block', marginRight: 10, transform: `translateY(${(1 - s) * 35}px)`, opacity: s }}>
                <Chroma px={4}>
                  <span style={{
                    display: 'inline-block',
                    fontFamily: FONTS.oswald, fontWeight: 700, fontSize: 68,
                    textTransform: 'uppercase',
                    color: '#000', background: BANANA,
                    padding: '0 8px',
                    boxShadow: `0 0 28px ${BANANA}, 5px 5px 0 ${MAGENTA}`,
                    lineHeight: 1.1,
                  }}>{w}</span>
                </Chroma>
              </span>
            ) : (
              <span key={i} style={{
                display: 'inline-block',
                fontFamily: FONTS.oswald, fontWeight: 700, fontSize: 68,
                textTransform: 'uppercase', color: '#fff', lineHeight: 1.1,
                marginRight: 10,
                transform: `translateY(${(1 - s) * 35}px)`, opacity: s,
                textShadow: `3px 0 ${MAGENTA}, -3px 0 ${withAlpha(CYAN, 0.7)}`,
              }}>{w}</span>
            );
          })}
        </div>

        {/* Body */}
        <GlassCard neon accent={BANANA} style={{
          padding: '12px 18px', marginTop: 8,
          transform: `translateX(${(1 - enter) * -28}px)`, opacity: enter,
        }}>
          <div style={{ fontFamily: FONTS.mono, fontSize: 25, color: withAlpha('#fff', 0.9), lineHeight: 1.6, borderLeft: `3px solid ${CYAN}`, paddingLeft: 12 }}>
            <span style={{ color: withAlpha(BANANA, 0.8) }}>▶ </span>{body}
          </div>
        </GlassCard>

        {/* Tags */}
        <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'nowrap' }}>
          <GlassCard neon accent={BANANA} style={{ padding: '7px 12px', transform: `scale(${spring({ frame: Math.max(0, frame - 18), fps, config: { damping: 22, stiffness: 200 } })})` }}>
            <div style={{ fontFamily: FONTS.mono, fontSize: 11, color: withAlpha(BANANA, 0.7), letterSpacing: 2, textTransform: 'uppercase' }}>СЛАЙД</div>
            <div style={{ fontFamily: FONTS.bebas, fontSize: 28, color: BANANA, textShadow: `0 0 12px ${BANANA}` }}>{slideNum}/{total}</div>
          </GlassCard>
          <GlassCard neon accent={MAGENTA} style={{ padding: '7px 12px', transform: `scale(${spring({ frame: Math.max(0, frame - 22), fps, config: { damping: 22, stiffness: 200 } })})` }}>
            <div style={{ fontFamily: FONTS.mono, fontSize: 11, color: withAlpha(MAGENTA, 0.7), letterSpacing: 2 }}>2026</div>
            <div style={{ fontFamily: FONTS.bebas, fontSize: 28, color: MAGENTA, textShadow: `0 0 12px ${MAGENTA}` }}>AI↑</div>
          </GlassCard>
          <GlassCard neon accent={CYAN} style={{ padding: '7px 12px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', transform: `scale(${spring({ frame: Math.max(0, frame - 26), fps, config: { damping: 22, stiffness: 200 } })})` }}>
            <div style={{ fontFamily: FONTS.mono, fontSize: 18, color: BANANA, textShadow: `0 0 10px ${BANANA}`, letterSpacing: 1 }}>@nikolay_cheusov</div>
          </GlassCard>
        </div>

        <ProgressBar progress={progress} accent={BANANA} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
