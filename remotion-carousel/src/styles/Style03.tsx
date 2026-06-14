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

const NEON    = '#00F0FF';
const MAGENTA = '#FF2BD6';
const YELLOW  = '#FFE600';
const GREEN_NEON = '#00FF9F';

// ── RGB-split chroma layer ──────────────────────────────────────────────────
function ChromaLayer({ children, offsetPx = 4, style }: { children: React.ReactNode; offsetPx?: number; style?: React.CSSProperties }) {
  return (
    <div style={{ position: 'relative', ...style }}>
      <div style={{ position: 'absolute', top: 0, left: offsetPx, opacity: 0.55, mixBlendMode: 'screen', color: '#FF2020', filter: 'blur(0.5px)' }}>{children}</div>
      <div style={{ position: 'absolute', top: offsetPx, left: -offsetPx, opacity: 0.55, mixBlendMode: 'screen', color: '#2060FF', filter: 'blur(0.5px)' }}>{children}</div>
      <div style={{ position: 'relative' }}>{children}</div>
    </div>
  );
}

// ── Full-frame RGB glitch: whole frame shifts in R/G/B channels ─────────────
function FrameChroma({ frame, slideNum }: { frame: number; slideNum: number }) {
  const r = rng(slideNum * 13 + frame);
  const burst = frame % 37 < 3 || frame % 61 < 2 || (frame > 8 && frame < 13);
  if (!burst) return null;
  const shift = 6 + r() * 10;
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 25, pointerEvents: 'none', mixBlendMode: 'screen' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,0,0,0.08)', transform: `translateX(${shift}px)` }} />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,255,0.08)', transform: `translateX(${-shift}px) translateY(${shift * 0.3}px)` }} />
    </div>
  );
}

// ── Horizontal slice glitch (digital corruption stripes) ───────────────────
function SliceGlitch({ frame, slideNum }: { frame: number; slideNum: number }) {
  const r = rng(slideNum * 77 + frame);
  const active = frame % 37 < 4 || (frame > 10 && frame < 15) || frame % 73 < 3;
  if (!active) return null;
  const slices = Array.from({ length: active ? 5 : 2 }, (_, i) => ({
    y: r() * 85 + 5,
    h: 1 + r() * (frame % 37 < 4 ? 18 : 7),
    shift: (r() - 0.5) * 60,
    color: [NEON, MAGENTA, YELLOW, '#fff'][Math.floor(r() * 4)],
    opacity: 0.3 + r() * 0.4,
  }));
  return (
    <>
      {slices.map((s, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: 0, right: 0,
          top: `${s.y}%`,
          height: s.h,
          background: s.color,
          opacity: s.opacity,
          transform: `translateX(${s.shift}px)`,
          zIndex: 22,
          mixBlendMode: 'screen',
        }} />
      ))}
    </>
  );
}

// ── VHS noise / static overlay ─────────────────────────────────────────────
function StaticNoise({ frame, slideNum }: { frame: number; slideNum: number }) {
  const r = rng(slideNum * 91 + frame * 3);
  // subtle always-on noise dots
  const dots = Array.from({ length: 18 }, (_, i) => ({
    x: r() * 100,
    y: r() * 100,
    s: 1 + r() * 2,
    op: 0.08 + r() * 0.12,
  }));
  return (
    <>
      {dots.map((d, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: `${d.x}%`, top: `${d.y}%`,
          width: d.s, height: d.s,
          background: '#fff',
          opacity: d.op,
          zIndex: 7,
          borderRadius: '50%',
        }} />
      ))}
    </>
  );
}

// ── Neon grid ─────────────────────────────────────────────────────────────
function NeonGrid({ accent, opacity = 0.18 }: { accent: string; opacity?: number }) {
  return (
    <svg width={1080} height={1350} style={{ position: 'absolute', inset: 0, opacity }}>
      {Array.from({ length: 25 }).map((_, i) => (
        <line key={`v${i}`} x1={i * 45} y1={0} x2={i * 45} y2={1350} stroke={accent} strokeWidth={0.5} />
      ))}
      {Array.from({ length: 31 }).map((_, i) => (
        <line key={`h${i}`} x1={0} y1={i * 45} x2={1080} y2={i * 45} stroke={accent} strokeWidth={0.5} />
      ))}
      {[0, 270, 540, 810, 1080].map((x, i) => (
        <line key={`vb${i}`} x1={x} y1={0} x2={x} y2={1350} stroke={accent} strokeWidth={1.5} opacity={0.7} />
      ))}
      {[0, 337, 675, 1012, 1350].map((y, i) => (
        <line key={`hb${i}`} x1={0} y1={y} x2={1080} y2={y} stroke={accent} strokeWidth={1.5} opacity={0.7} />
      ))}
      <line x1={0} y1={0} x2={1080} y2={1350} stroke={MAGENTA} strokeWidth={0.5} opacity={0.3} />
      <line x1={1080} y1={0} x2={0} y2={1350} stroke={MAGENTA} strokeWidth={0.5} opacity={0.3} />
    </svg>
  );
}

// ── Scanline sweep ─────────────────────────────────────────────────────────
function ScanlineSweep({ frame, accent }: { frame: number; accent: string }) {
  const y = 1350 - (frame * 9) % 1400;
  return (
    <>
      <div style={{ position: 'absolute', left: 0, right: 0, top: y, height: 3, background: accent, boxShadow: `0 0 28px 6px ${accent}`, opacity: 0.75, zIndex: 3 }} />
      <div style={{ position: 'absolute', left: 0, right: 0, top: y + 6, height: 80, background: `linear-gradient(to bottom, ${withAlpha(accent, 0.1)}, transparent)`, zIndex: 3 }} />
    </>
  );
}

// ── Energy particles with trails ────────────────────────────────────────────
function EnergyParticles({ frame, fps, slideNum, accent }: { frame: number; fps: number; slideNum: number; accent: string }) {
  const rand = rng(slideNum * 77 + 3);
  const particles = Array.from({ length: 40 }, (_, i) => ({
    x: rand() * 1080,
    y: rand() * 1350,
    size: 1.5 + rand() * 5,
    speed: 0.2 + rand() * 1.0,
    phase: rand() * Math.PI * 2,
    color: [accent, MAGENTA, YELLOW, GREEN_NEON, '#fff'][Math.floor(rand() * 5)],
    trail: rand() > 0.5,
  }));
  const t = frame / fps;
  return (
    <>
      {particles.map((p, i) => {
        const ox = Math.sin(t * p.speed + p.phase) * 16;
        const oy = Math.cos(t * p.speed * 0.7 + p.phase) * 22;
        const pulse = 0.5 + 0.5 * Math.sin(t * p.speed * 2 + p.phase);
        return (
          <div key={i} style={{
            position: 'absolute',
            left: p.x + ox,
            top: p.y + oy,
            width: p.size,
            height: p.trail ? p.size * 5 : p.size,
            borderRadius: p.trail ? p.size / 2 : '50%',
            background: p.color,
            opacity: (0.4 + pulse * 0.35),
            boxShadow: `0 0 ${p.size * 3}px ${p.color}`,
            transform: p.trail ? `rotate(${Math.atan2(oy, ox) * 57.3 + 90}deg)` : 'none',
          }} />
        );
      })}
    </>
  );
}

// ── Flash burst on slide entry (first 8 frames) ────────────────────────────
function EntryFlash({ frame, accent }: { frame: number; accent: string }) {
  if (frame > 10) return null;
  const op = interpolate(frame, [0, 2, 8], [0, 0.6, 0], { extrapolateRight: 'clamp' });
  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: `radial-gradient(ellipse at center, ${accent} 0%, transparent 70%)`,
      opacity: op,
      zIndex: 30,
      mixBlendMode: 'screen',
    }} />
  );
}

// ── Neon flicker on text ───────────────────────────────────────────────────
function useFlicker(frame: number, seed: number): number {
  const r = rng(seed + frame * 7);
  const flicker = frame % 23 === 0 || frame % 41 === 0;
  return flicker ? 0.3 + r() * 0.5 : 1;
}

// ── Zoom pulse (heartbeat on the whole composition) ────────────────────────
function useZoomPulse(frame: number): number {
  const t = frame / 30;
  const beat = 1 + 0.004 * Math.sin(t * Math.PI * 2);
  const glitch = (frame % 37 < 3 || frame % 61 < 2) ? 1 + 0.012 : 1;
  return beat * glitch;
}

// ── Liquid Glass Bento card ────────────────────────────────────────────────
function BentoCard({ children, accent, style, neonBorder = false }: {
  children: React.ReactNode; accent: string; style?: React.CSSProperties; neonBorder?: boolean;
}) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.055)',
      backdropFilter: 'blur(18px)',
      WebkitBackdropFilter: 'blur(18px)',
      border: neonBorder ? `2px solid ${accent}` : '1px solid rgba(255,255,255,0.1)',
      borderRadius: 14,
      boxShadow: neonBorder
        ? `0 0 22px ${withAlpha(accent, 0.45)}, inset 0 0 22px ${withAlpha(accent, 0.07)}, 0 8px 32px rgba(0,0,0,0.55)`
        : '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
      ...style,
    }}>
      {children}
    </div>
  );
}

// ── Holographic shimmer strip ──────────────────────────────────────────────
function HoloStrip({ frame }: { frame: number }) {
  const x = interpolate(frame, [0, SLIDE_DURATION], [-200, 1280]);
  return (
    <div style={{
      position: 'absolute', top: 0, bottom: 0, left: x, width: 140,
      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.05), rgba(0,240,255,0.08), rgba(255,43,214,0.05), transparent)',
      transform: 'skewX(-15deg)',
      zIndex: 4, pointerEvents: 'none',
    }} />
  );
}

// ── Second fast shimmer (offset) ───────────────────────────────────────────
function HoloStrip2({ frame }: { frame: number }) {
  const x = interpolate(frame, [0, SLIDE_DURATION], [-300, 1400]);
  if (frame < 30) return null;
  return (
    <div style={{
      position: 'absolute', top: 0, bottom: 0, left: x - 400, width: 80,
      background: 'linear-gradient(90deg, transparent, rgba(255,230,0,0.04), rgba(0,255,159,0.05), transparent)',
      transform: 'skewX(-20deg)',
      zIndex: 4, pointerEvents: 'none',
    }} />
  );
}

// ── Corner markers ─────────────────────────────────────────────────────────
function CornerMarkers({ accent, frame }: { accent: string; frame: number }) {
  const pulse = 0.7 + 0.3 * Math.sin(frame * 0.15);
  const corners = [
    { top: 0, left: 0, borderTop: `3px solid ${accent}`, borderLeft: `3px solid ${accent}`, opacity: pulse },
    { top: 0, right: 0, borderTop: `3px solid ${MAGENTA}`, borderRight: `3px solid ${MAGENTA}`, opacity: pulse },
    { bottom: 0, left: 0, borderBottom: `3px solid ${MAGENTA}`, borderLeft: `3px solid ${MAGENTA}`, opacity: pulse },
    { bottom: 0, right: 0, borderBottom: `3px solid ${accent}`, borderRight: `3px solid ${accent}`, opacity: pulse },
  ];
  return (
    <>
      {corners.map((s, i) => (
        <div key={i} style={{ position: 'absolute', width: 36, height: 36, ...s }} />
      ))}
    </>
  );
}

// ── Data tag ───────────────────────────────────────────────────────────────
function DataTag({ label, value, accent, delay, frame, fps }: { label: string; value: string; accent: string; delay: number; frame: number; fps: number }) {
  const s = spring({ frame: Math.max(0, frame - delay), fps, config: { damping: 22, stiffness: 200 }, durationInFrames: 18 });
  return (
    <BentoCard accent={accent} neonBorder style={{ padding: '8px 14px', transform: `scale(${s})`, opacity: s }}>
      <div style={{ fontFamily: FONTS.mono, fontSize: 11, color: withAlpha(accent, 0.8), letterSpacing: 2, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontFamily: FONTS.bebas, fontSize: 30, color: accent, lineHeight: 1, letterSpacing: 1, textShadow: `0 0 14px ${accent}` }}>{value}</div>
    </BentoCard>
  );
}

// ── MAIN COMPONENT ─────────────────────────────────────────────────────────
export const Style03: React.FC<SlideData> = (props) => {
  const { headline, body, emoji, kicker, image, isLast, accentColor, slideNum, total, telegram, profileHandle } = props;
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const accent = accentColor || NEON;
  const progress = slideNum / total;

  const fadeOut = interpolate(frame, [SLIDE_DURATION - 12, SLIDE_DURATION], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const zoom = useZoomPulse(frame);
  const flicker = useFlicker(frame, slideNum * 31);

  const r = rng(slideNum * 53 + frame % 7);
  const glitchActive = frame % 37 < 3 || (frame > 8 && frame < 13) || frame % 61 < 2;
  const gx = glitchActive ? (r() - 0.5) * 24 : 0;
  const gy = glitchActive ? (r() - 0.5) * 6 : 0;

  const enter = spring({ frame, fps, config: { damping: 26, stiffness: 180, mass: 0.8 }, durationInFrames: 20 });
  const bg = 'linear-gradient(135deg, #080018 0%, #16003a 40%, #0a001c 70%, #000a20 100%)';

  // ── CTA SLIDE ─────────────────────────────────────────────────────────────
  if (isLast) {
    const scaleIn = spring({ frame: Math.max(0, frame - 4), fps, config: { damping: 18, stiffness: 130 }, durationInFrames: 28 });
    return (
      <AbsoluteFill style={{ background: bg, opacity: fadeOut, overflow: 'hidden', transform: `scale(${zoom})` }}>
        <NeonGrid accent="#2AABEE" opacity={0.1} />
        <EnergyParticles frame={frame} fps={fps} slideNum={slideNum} accent="#2AABEE" />
        <ScanlineSweep frame={frame} accent={GREEN_NEON} />
        <SliceGlitch frame={frame} slideNum={slideNum} />
        <FrameChroma frame={frame} slideNum={slideNum} />
        <HoloStrip frame={frame} />
        <HoloStrip2 frame={frame} />
        <StaticNoise frame={frame} slideNum={slideNum} />
        <EntryFlash frame={frame} accent="#2AABEE" />
        <CornerMarkers accent="#2AABEE" frame={frame} />

        <AbsoluteFill style={{ zIndex: 5, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 60, gap: 24, transform: `translate(${gx}px, ${gy}px)` }}>
          <BentoCard accent="#2AABEE" neonBorder style={{ padding: 28, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, transform: `scale(${scaleIn})`, opacity: scaleIn * flicker, width: '100%' }}>
            <div style={{ filter: `drop-shadow(0 0 28px #2AABEE) drop-shadow(0 0 60px #2AABEE)` }}>
              <TelegramIcon size={88} />
            </div>
            <ChromaLayer offsetPx={4}>
              <div style={{ fontFamily: FONTS.oswald, fontWeight: 700, fontSize: 52, color: '#fff', textAlign: 'center', lineHeight: 1.15, textTransform: 'uppercase' }}>
                ВЕСЬ МОЙ ИИ-СТЕК —<br />
                <span style={{ color: '#2AABEE', textShadow: `0 0 24px #2AABEE, 0 0 60px #2AABEE` }}>В МОЁМ TELEGRAM</span>
              </div>
            </ChromaLayer>
            <div style={{ fontFamily: FONTS.mono, fontSize: 22, color: withAlpha('#fff', 0.55), textAlign: 'center', letterSpacing: 3 }}>
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
    <AbsoluteFill style={{ background: bg, opacity: fadeOut, overflow: 'hidden', transform: `scale(${zoom}) translate(${gx}px, ${gy}px)` }}>
      {/* AI bg */}
      {image && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
          <KenBurnsImage src={image} style={{ width: '100%', height: '100%' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(8,0,24,0.6) 0%, rgba(22,0,58,0.5) 40%, rgba(10,0,28,0.65) 100%)', mixBlendMode: 'multiply' }} />
          <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 20% 30%, ${withAlpha(accent, 0.14)} 0%, transparent 55%), radial-gradient(ellipse at 80% 70%, ${withAlpha(MAGENTA, 0.11)} 0%, transparent 50%)` }} />
        </div>
      )}

      {/* FX layers */}
      <NeonGrid accent={accent} opacity={image ? 0.07 : 0.14} />
      <EnergyParticles frame={frame} fps={fps} slideNum={slideNum} accent={accent} />
      <ScanlineSweep frame={frame} accent={accent} />
      <SliceGlitch frame={frame} slideNum={slideNum} />
      <FrameChroma frame={frame} slideNum={slideNum} />
      <HoloStrip frame={frame} />
      <HoloStrip2 frame={frame} />
      <StaticNoise frame={frame} slideNum={slideNum} />
      <EntryFlash frame={frame} accent={accent} />
      <CornerMarkers accent={accent} frame={frame} />

      {/* Radial glow */}
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 15% 25%, ${withAlpha(accent, 0.09)} 0%, transparent 60%), radial-gradient(ellipse at 85% 75%, ${withAlpha(MAGENTA, 0.07)} 0%, transparent 50%)` }} />

      {/* CONTENT */}
      <AbsoluteFill style={{ zIndex: 5, padding: '44px 44px 36px', display: 'flex', flexDirection: 'column' }}>
        <Header brand={BRAND} slideNum={slideNum} total={total} accent={accent} />

        {/* Kicker */}
        <BentoCard accent={MAGENTA} neonBorder style={{
          alignSelf: 'flex-start', padding: '6px 20px', marginTop: 18,
          opacity: enter, transform: `translateX(${(1 - enter) * -40}px)`,
        }}>
          <div style={{ fontFamily: FONTS.mono, fontSize: 17, letterSpacing: 4, color: MAGENTA, textTransform: 'uppercase', textShadow: `0 0 12px ${MAGENTA}, 0 0 30px ${MAGENTA}` }}>
            {kicker || `SYS://SLIDE_${String(slideNum).padStart(2, '0')}`}
          </div>
        </BentoCard>

        {/* Emoji */}
        <ChromaLayer offsetPx={6} style={{ alignSelf: 'flex-start', marginTop: 16 }}>
          <div style={{
            fontSize: 82, lineHeight: 1,
            width: 120, height: 120,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: `3px solid ${accent}`,
            boxShadow: `0 0 30px ${accent}, 0 0 60px ${withAlpha(accent, 0.4)}, inset 0 0 20px ${withAlpha(accent, 0.25)}, 6px 6px 0 ${MAGENTA}`,
            transform: `scale(${spring({ frame, fps, config: { damping: 14, stiffness: 200, mass: 0.8 } })}) rotate(${Math.sin(frame * 0.08) * 2}deg)`,
            filter: `drop-shadow(0 0 12px ${accent})`,
          }}>
            {emoji}
          </div>
        </ChromaLayer>

        {/* Headline with stagger + chroma + flicker */}
        <div style={{ marginTop: 18, marginBottom: 8 }}>
          {words.map((w, i) => {
            const delay = i * 4;
            const wSpr = spring({ frame: Math.max(0, frame - delay), fps, config: { damping: 24, stiffness: 220, mass: 0.7 }, durationInFrames: 16 });
            const isKey = isKeyWord(w);
            const wFlicker = (frame % 23 === 0 && i === 0) ? 0.4 : 1;
            if (isKey) {
              return (
                <span key={i} style={{ display: 'inline-block', marginRight: 12, transform: `translateY(${(1 - wSpr) * 35}px) skewX(${(1 - wSpr) * -8}deg)`, opacity: wSpr * wFlicker }}>
                  <ChromaLayer offsetPx={5}>
                    <span style={{
                      display: 'inline-block',
                      fontFamily: FONTS.oswald, fontWeight: 700, fontSize: 70,
                      textTransform: 'uppercase',
                      color: '#000', background: accent,
                      padding: '0 10px',
                      boxShadow: `0 0 30px ${accent}, 0 0 60px ${withAlpha(accent, 0.5)}, 5px 5px 0 ${MAGENTA}`,
                      lineHeight: 1.1,
                      filter: `drop-shadow(0 0 8px ${accent})`,
                    }}>{w}</span>
                  </ChromaLayer>
                </span>
              );
            }
            return (
              <span key={i} style={{
                display: 'inline-block',
                fontFamily: FONTS.oswald, fontWeight: 700, fontSize: 70,
                textTransform: 'uppercase',
                color: '#fff', lineHeight: 1.1,
                marginRight: 12,
                transform: `translateY(${(1 - wSpr) * 35}px) skewX(${(1 - wSpr) * -8}deg)`,
                opacity: wSpr * wFlicker,
                textShadow: `3px 0 ${MAGENTA}, -3px 0 ${withAlpha(accent, 0.7)}, 0 0 30px rgba(255,255,255,0.15)`,
              }}>{w}</span>
            );
          })}
        </div>

        {/* Body bento card */}
        <BentoCard accent={accent} neonBorder style={{
          padding: '14px 20px', marginTop: 8,
          transform: `translateX(${(1 - enter) * -28}px)`, opacity: enter,
        }}>
          <div style={{ fontFamily: FONTS.mono, fontSize: 26, color: withAlpha('#fff', 0.92), lineHeight: 1.6, borderLeft: `3px solid ${MAGENTA}`, paddingLeft: 14 }}>
            <span style={{ color: withAlpha(accent, 0.75) }}>▶ </span>{body}
          </div>
        </BentoCard>

        {/* Data tags row */}
        <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'nowrap' }}>
          <DataTag label="СЛАЙД" value={`${slideNum}/${total}`} accent={accent} delay={18} frame={frame} fps={fps} />
          <DataTag label="2026" value="AI↑" accent={MAGENTA} delay={22} frame={frame} fps={fps} />
          <DataTag label="TG" value="⇩" accent={GREEN_NEON} delay={26} frame={frame} fps={fps} />
          <BentoCard accent={YELLOW} neonBorder style={{
            padding: '8px 14px',
            opacity: interpolate(frame, [30, 42], [0, 1], { extrapolateRight: 'clamp' }),
            transform: `scale(${spring({ frame: Math.max(0, frame - 26), fps, config: { damping: 22, stiffness: 200 }, durationInFrames: 18 })})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1,
          }}>
            <div style={{ fontFamily: FONTS.mono, fontSize: 20, color: YELLOW, textShadow: `0 0 12px ${YELLOW}, 0 0 30px ${YELLOW}`, letterSpacing: 1 }}>@nikolay_cheusov</div>
          </BentoCard>
        </div>

        <ProgressBar progress={progress} accent={accent} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
