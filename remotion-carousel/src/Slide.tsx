import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig, spring } from 'remotion';

export type SlideData = {
  headline: string;
  body: string;
  emoji: string;
  isLast?: boolean;
  bgColor: string;
  accentColor: string;
  slideNum: number;
  total: number;
};

const FONTS = {
  headline: "'Inter', 'Helvetica Neue', Arial, sans-serif",
  body: "'Inter', 'Helvetica Neue', Arial, sans-serif",
};

export const Slide: React.FC<SlideData> = ({
  headline,
  body,
  emoji,
  isLast,
  bgColor,
  accentColor,
  slideNum,
  total,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fadeIn = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' });
  const slideUp = interpolate(frame, [0, 20], [60, 0], { extrapolateRight: 'clamp' });
  const emojiScale = spring({ frame, fps, from: 0.5, to: 1, durationInFrames: 20 });
  const lineProgress = interpolate(frame, [10, 30], [0, 1], { extrapolateRight: 'clamp' });

  if (isLast) {
    return (
      <AbsoluteFill
        style={{
          background: `linear-gradient(160deg, #0a0a1a 0%, #1a0a2e 50%, #0d1a3a 100%)`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '80px 60px',
          opacity: fadeIn,
          fontFamily: FONTS.headline,
        }}
      >
        <div style={{
          position: 'absolute',
          width: 600,
          height: 600,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${accentColor}22 0%, transparent 70%)`,
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }} />
        <div style={{ fontSize: 100, transform: `scale(${emojiScale})`, marginBottom: 40 }}>{emoji}</div>
        <h1 style={{
          color: '#ffffff',
          fontSize: 62,
          fontWeight: 900,
          textAlign: 'center',
          lineHeight: 1.15,
          margin: '0 0 32px',
          transform: `translateY(${slideUp}px)`,
          textShadow: `0 0 40px ${accentColor}88`,
        }}>{headline}</h1>
        {body.split('\n').filter(Boolean).map((line, i) => (
          <div key={i} style={{
            display: 'flex',
            alignItems: 'center',
            gap: 20,
            marginBottom: 20,
            opacity: interpolate(frame, [15 + i * 5, 30 + i * 5], [0, 1], { extrapolateRight: 'clamp' }),
            transform: `translateX(${interpolate(frame, [15 + i * 5, 30 + i * 5], [-30, 0], { extrapolateRight: 'clamp' })}px)`,
          }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: accentColor, flexShrink: 0 }} />
            <span style={{ color: '#e0e0ff', fontSize: 36, fontWeight: 500, lineHeight: 1.4 }}>
              {line.replace(/^[•\-*]\s*/, '')}
            </span>
          </div>
        ))}
        <div style={{
          marginTop: 60,
          padding: '30px 60px',
          borderRadius: 24,
          background: `linear-gradient(90deg, ${accentColor}33, ${accentColor}66)`,
          border: `2px solid ${accentColor}88`,
          opacity: interpolate(frame, [25, 40], [0, 1], { extrapolateRight: 'clamp' }),
        }}>
          <p style={{ color: '#ffffff', fontSize: 38, fontWeight: 700, textAlign: 'center', margin: 0 }}>
            → Ссылка в шапке профиля ↓
          </p>
        </div>
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill
      style={{
        background: bgColor,
        display: 'flex',
        flexDirection: 'column',
        padding: '80px 60px',
        opacity: fadeIn,
        fontFamily: FONTS.headline,
      }}
    >
      <div style={{
        height: 6,
        width: `${lineProgress * 100}%`,
        background: `linear-gradient(90deg, ${accentColor}, ${accentColor}44)`,
        borderRadius: 3,
        marginBottom: 60,
      }} />
      <div style={{
        color: accentColor,
        fontSize: 28,
        fontWeight: 700,
        letterSpacing: 4,
        marginBottom: 40,
        opacity: fadeIn,
        textTransform: 'uppercase',
      }}>
        {slideNum < 10 ? `0${slideNum}` : slideNum} / {total < 10 ? `0${total}` : total}
      </div>
      <div style={{ fontSize: 90, marginBottom: 40, transform: `scale(${emojiScale})`, transformOrigin: 'left center' }}>
        {emoji}
      </div>
      <h1 style={{
        color: '#ffffff',
        fontSize: 68,
        fontWeight: 900,
        lineHeight: 1.15,
        margin: '0 0 40px',
        transform: `translateY(${slideUp}px)`,
      }}>{headline}</h1>
      <div style={{ width: 80, height: 4, background: accentColor, borderRadius: 2, marginBottom: 40, opacity: lineProgress }} />
      <p style={{
        color: '#c8c8e8',
        fontSize: 40,
        fontWeight: 400,
        lineHeight: 1.6,
        margin: 0,
        opacity: interpolate(frame, [15, 30], [0, 1], { extrapolateRight: 'clamp' }),
        transform: `translateY(${interpolate(frame, [15, 30], [30, 0], { extrapolateRight: 'clamp' })}px)`,
      }}>{body}</p>
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 300,
        background: `linear-gradient(to top, ${accentColor}22, transparent)`,
      }} />
    </AbsoluteFill>
  );
};
