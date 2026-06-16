/**
 * BakedCarousel — рендеринг карусели из baked-изображений.
 * Слайды 1–9: JPG + pan анимация + accent lines.
 * Слайд 10 (CTA): программный — скрин профиля с закруглёнными краями + текст.
 */
import React from 'react';
import {
  AbsoluteFill,
  Series,
  Img,
  Audio,
  staticFile,
  interpolate,
  useCurrentFrame,
  registerRoot,
  Composition,
} from 'remotion';
import { loadFonts, SLIDE_DURATION, TRANSITION, FONTS } from './theme';

loadFonts();

// ── Аудио: трек по стилю ──────────────────────────────────────────────────────
function getAudioTrack(accentColor: string, bgColor: string): string | null {
  const isGold   = accentColor?.toLowerCase().includes('d4af');
  const isSilver = bgColor === '#141414';
  if (isGold)   return 'audio/style-c-luxury.mp3';
  if (isSilver) return 'audio/style-b-minimal.mp3';
  return 'audio/style-a-neon.mp3';
}

function audioFileExists(file: string): boolean {
  // Remotion staticFile проверяет наличие файла в public/
  // Возвращаем true только для известных файлов (будет проверено при рендере)
  return true;
}


type BakedSlideData = {
  bgImage?: string;
  bgColor?: string;
  accentColor: string;
  slideNum: number;
  total: number;
  baked?: boolean;
  cta?: boolean;
  body?: string;
  badge?: string;
  headline?: string;
  emoji?: string;
};

// ── Telegram icon SVG ──────────────────────────────────────────────────────────
const TelegramIcon: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <circle cx="24" cy="24" r="24" fill="#2AABEE"/>
    <path
      d="M10.5 23.5L36 13L31 37L22 29L16.5 33L15.5 26.5L10.5 23.5Z"
      fill="white"
    />
    <path d="M22 29L21 35.5L25.5 31L22 29Z" fill="#C8DAEA"/>
    <path d="M15.5 26.5L22 29L16.5 33L15.5 26.5Z" fill="#C8DAEA"/>
  </svg>
);

// ── Accent Lines (используется в обоих компонентах) ───────────────────────────
const AccentLines: React.FC<{ accentColor: string; opacity: number }> = ({ accentColor, opacity }) => (
  <>
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0, height: 3,
      background: accentColor,
      boxShadow: `0 0 18px ${accentColor}, 0 0 36px ${accentColor}88`,
      opacity, zIndex: 10,
    }} />
    <div style={{
      position: 'absolute', top: 0, left: 0, bottom: 0, width: 3,
      background: `linear-gradient(to bottom, ${accentColor}, ${accentColor}44)`,
      boxShadow: `0 0 18px ${accentColor}88`,
      opacity, zIndex: 10,
    }} />
  </>
);

// ── Progress bar ──────────────────────────────────────────────────────────────
const ProgressBar: React.FC<{ slideNum: number; total: number; accentColor: string }> = ({ slideNum, total, accentColor }) => (
  <div style={{
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 3,
    background: 'rgba(255,255,255,0.08)', zIndex: 10,
  }}>
    <div style={{
      height: '100%',
      width: `${(slideNum / total) * 100}%`,
      background: accentColor,
      boxShadow: `0 0 10px ${accentColor}`,
    }} />
  </div>
);

// ── Хелперы анимации ──────────────────────────────────────────────────────────
function eo(t: number) { return 1 - Math.pow(1 - Math.max(0, Math.min(1, t)), 3); } // easeOutCubic
function lp(from: number, to: number, t: number) { return from + (to - from) * t; }
function ap(frame: number, delay: number, dur: number) {
  return eo(Math.max(0, Math.min(1, (frame - delay) / dur)));
}

// ── Слайды 2–9: уникальная анимация + фон для каждого ────────────────────────
const ContentSlide: React.FC<BakedSlideData> = ({ bgColor, accentColor, slideNum, total, headline, body, badge, emoji }) => {
  const frame = useCurrentFrame();
  const exitOp = interpolate(frame, [SLIDE_DURATION - 8, SLIDE_DURATION], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const audioTrack   = getAudioTrack(accentColor, bgColor || '');
  const isGold       = accentColor?.toLowerCase().includes('d4af') || accentColor?.toLowerCase().includes('d4b0');
  const isSilver     = bgColor === '#141414';
  const headlineFont = isSilver ? FONTS.montserrat : FONTS.unbounded;
  const bodyColor    = isGold ? '#c9a84c' : 'rgba(255,255,255,0.60)';
  const handleColor  = `${accentColor}99`;
  const counterStr   = `${String(slideNum).padStart(2, '0')} / ${String(total).padStart(2, '0')}`;
  const fontSize     = headline && headline.length > 36 ? 62 : headline && headline.length > 24 ? 72 : 84;
  const t            = frame / (SLIDE_DURATION - TRANSITION); // 0→1 за слайд

  // ── Уникальные переменные по номеру слайда ──────────────────────────────────
  const idx = (slideNum - 2) % 8;

  let emojiTx = 0, emojiTy = 0, emojiSc = 1, emojiOp = 1, emojiRot = 0, emojiBlur = 0;
  let badgeTx = 0, badgeTy = 0, badgeSc = 1, badgeOp = 1;
  let headTx = 0, headTy = 0, headSc = 1, headOp = 1, headRot = 0, headBlur = 0;
  let bodyTx = 0, bodyTy = 0, bodySc = 1, bodyOp = 1;
  let divW = 72;
  let masterOp = ap(frame, 0, 10) * exitOp;

  // Фон уникальный для каждого слайда
  let bgLayer: React.ReactNode = null;

  if (idx === 0) {
    // ── POWER ZOOM: всё взрывается из нуля из центра ──
    emojiSc = lp(0, 1, ap(frame, 0, 14));   emojiOp = ap(frame, 0, 10);
    badgeSc = lp(0, 1, ap(frame, 4, 14));   badgeOp = ap(frame, 4, 10);
    headSc  = lp(0, 1, ap(frame, 8, 18));   headOp  = ap(frame, 8, 14);
    bodySc  = lp(0, 1, ap(frame, 14, 18));  bodyOp  = ap(frame, 14, 14);
    divW = lp(0, 72, ap(frame, 16, 12));
    // Фон: взрывающийся центральный burst
    const burstOp = ap(frame, 0, 6) * (1 - ap(frame, 6, 30));
    bgLayer = (
      <div style={{ position:'absolute', inset:0, zIndex:0,
        background: `radial-gradient(ellipse at 50% 50%, ${accentColor}55 0%, ${accentColor}11 30%, transparent 60%)`,
        opacity: burstOp + 0.05, transform: `scale(${lp(0.3, 1.4, ap(frame, 0, 20))})` }} />
    );

  } else if (idx === 1) {
    // ── BLUR REVEAL: текст проявляется из тумана ──
    emojiBlur = lp(40, 0, ap(frame, 0, 24));  emojiOp = ap(frame, 0, 20);
    headBlur  = lp(30, 0, ap(frame, 6, 26));  headOp  = ap(frame, 6, 22);
    badgeOp   = ap(frame, 3, 20);
    bodyOp    = ap(frame, 12, 22);
    divW = lp(0, 72, ap(frame, 20, 14));
    // Фон: туман сверху рассеивается
    bgLayer = (
      <>
        <div style={{ position:'absolute', inset:0, zIndex:0, background: `linear-gradient(to bottom, ${accentColor}22 0%, transparent 50%)`, opacity: lp(1, 0.2, ap(frame, 0, 40)) }} />
        <div style={{ position:'absolute', top:0, left:0, right:0, height:'40%', zIndex:0, background: `radial-gradient(ellipse at 50% 0%, ${accentColor}30 0%, transparent 70%)` }} />
      </>
    );

  } else if (idx === 2) {
    // ── GRAVITY BOUNCE: падение сверху с упругим отскоком ──
    emojiTy = interpolate(frame, [0,14,20,25,28], [-320,20,-10,4,0], {extrapolateRight:'clamp'});  emojiOp = ap(frame,0,8);
    badgeTy = interpolate(frame, [5,19,25,30,33], [-300,18,-8,3,0],  {extrapolateRight:'clamp'});  badgeOp = ap(frame,5,8);
    headTy  = interpolate(frame, [10,24,30,35,38],[-260,14,-7,2,0],  {extrapolateRight:'clamp'});  headOp  = ap(frame,10,10);
    bodyTy  = interpolate(frame, [18,32,38,43,46],[-220,12,-5,2,0],  {extrapolateRight:'clamp'});  bodyOp  = ap(frame,18,10);
    divW = lp(0, 72, ap(frame, 26, 12));
    // Фон: сверху вниз glow как будто объект падает из света
    bgLayer = (
      <div style={{ position:'absolute', top:0, left:'10%', right:'10%', height:'35%', zIndex:0,
        background: `radial-gradient(ellipse at 50% 0%, ${accentColor}28 0%, transparent 70%)`,
        opacity: lp(0.8, 0.15, ap(frame, 0, 40)) }} />
    );

  } else if (idx === 3) {
    // ── FULL SPIN: эмодзи делает 2 оборота, badge слева, headline справа ──
    emojiRot = lp(-720, 0, ap(frame, 0, 22));  emojiSc = lp(0.1, 1, ap(frame, 0, 22));  emojiOp = ap(frame, 0, 18);
    badgeTx  = lp(-280, 0, ap(frame, 8, 18));  badgeOp = ap(frame, 8, 14);
    headTx   = lp(260, 0, ap(frame, 12, 20));  headOp  = ap(frame, 12, 16);
    bodyTy   = lp(80, 0, ap(frame, 18, 20));   bodyOp  = ap(frame, 18, 16);
    divW = lp(0, 72, ap(frame, 22, 12));
    // Фон: вращающийся glow
    bgLayer = (
      <div style={{ position:'absolute', inset:'-30%', zIndex:0,
        background: `conic-gradient(from ${t * 180}deg at 50% 50%, ${accentColor}22 0%, transparent 30%, ${accentColor}11 60%, transparent 100%)`,
        opacity: 0.7 }} />
    );

  } else if (idx === 4) {
    // ── ELASTIC PUNCH: элементы огромные → сжимаются с отскоком ──
    emojiSc = interpolate(frame, [0,10,16,22,26], [3.5,0.7,1.2,0.95,1.0], {extrapolateRight:'clamp'});  emojiOp = ap(frame,0,6);
    badgeSc = interpolate(frame, [4,14,20,26,30], [3.0,0.75,1.15,0.96,1.0], {extrapolateRight:'clamp'}); badgeOp = ap(frame,4,6);
    headSc  = interpolate(frame, [8,18,24,30,34], [2.5,0.8,1.1,0.97,1.0],  {extrapolateRight:'clamp'});  headOp  = ap(frame,8,8);
    bodySc  = interpolate(frame, [14,24,30,36,40],[2.0,0.85,1.08,0.98,1.0], {extrapolateRight:'clamp'}); bodyOp  = ap(frame,14,8);
    divW = lp(0, 72, ap(frame, 18, 10));
    // Фон: пульсирующий удар
    const impactOp = lp(0.6, 0, ap(frame, 0, 20));
    bgLayer = (
      <div style={{ position:'absolute', inset:0, zIndex:0,
        background: `radial-gradient(circle at 50% 50%, ${accentColor}66 0%, transparent 50%)`,
        opacity: impactOp, transform: `scale(${lp(0.5, 2, ap(frame, 0, 16))})` }} />
    );

  } else if (idx === 5) {
    // ── LIGHTNING SLASH: ультра-быстрый влёт справа (8 кадров) ──
    emojiTx = lp(400, 0, ap(frame, 0, 8));   emojiOp = ap(frame, 0, 6);
    badgeTx = lp(440, 0, ap(frame, 3, 8));   badgeOp = ap(frame, 3, 6);
    headTx  = lp(380, 0, ap(frame, 6, 10));  headOp  = ap(frame, 6, 8);
    bodyTx  = lp(320, 0, ap(frame, 10, 10)); bodyOp  = ap(frame, 10, 8);
    divW = lp(0, 72, ap(frame, 12, 8));
    // Фон: неоновая полоса-след справа
    const trailOp = lp(0.9, 0, ap(frame, 0, 20));
    bgLayer = (
      <>
        <div style={{ position:'absolute', top:0, bottom:0, right:0, width:'60%', zIndex:0,
          background: `linear-gradient(to left, ${accentColor}44, transparent)`, opacity: trailOp }} />
        <div style={{ position:'absolute', top:'45%', left:0, right:0, height:2, zIndex:0,
          background: `linear-gradient(to left, ${accentColor}, transparent)`,
          opacity: trailOp, boxShadow: `0 0 20px ${accentColor}` }} />
      </>
    );

  } else if (idx === 6) {
    // ── RISE + TILT: поднимается снизу с наклоном, медленно выпрямляется ──
    emojiTy  = lp(200, 0, ap(frame, 0, 28));   emojiRot  = lp(-25, 0, ap(frame, 0, 28));   emojiOp  = ap(frame, 0, 22);
    badgeTy  = lp(180, 0, ap(frame, 5, 28));   /* badgeRot unused */                        badgeOp  = ap(frame, 5, 22);
    headTy   = lp(150, 0, ap(frame, 10, 30));  headRot   = lp(-15, 0, ap(frame, 10, 30));  headOp   = ap(frame, 10, 24);
    bodyTy   = lp(120, 0, ap(frame, 18, 28));  bodyOp   = ap(frame, 18, 22);
    divW = lp(0, 72, ap(frame, 26, 12));
    // Фон: снизу вверх волна
    bgLayer = (
      <div style={{ position:'absolute', bottom:0, left:'5%', right:'5%', height:'55%', zIndex:0,
        background: `radial-gradient(ellipse at 50% 100%, ${accentColor}28 0%, transparent 65%)`,
        opacity: lp(0.9, 0.2, ap(frame, 0, 50)) }} />
    );

  } else {
    // idx === 7
    // ── CHAOS SPLIT: каждый элемент из своего угла одновременно ──
    emojiTx  = lp(-280, 0, ap(frame, 0, 16));  emojiTy  = lp(-180, 0, ap(frame, 0, 16));  emojiSc  = lp(0.5, 1, ap(frame, 0, 16));  emojiOp  = ap(frame, 0, 12);
    badgeTx  = lp(260, 0,  ap(frame, 2, 16));  badgeTy  = lp(-150, 0, ap(frame, 2, 16));  badgeSc  = lp(0.6, 1, ap(frame, 2, 16));  badgeOp  = ap(frame, 2, 12);
    headTx   = lp(-240, 0, ap(frame, 4, 18));  headTy   = lp(140, 0,  ap(frame, 4, 18));  headSc   = lp(0.7, 1, ap(frame, 4, 18));  headOp   = ap(frame, 4, 14);
    bodyTx   = lp(220, 0,  ap(frame, 8, 18));  bodyTy   = lp(120, 0,  ap(frame, 8, 18));  bodyOp   = ap(frame, 8, 14);
    divW = lp(0, 72, ap(frame, 16, 10));
    // Фон: 4 угловых glow
    bgLayer = (
      <>
        {[['0% 0%','50%'],['100% 0%','50%'],['0% 100%','50%'],['100% 100%','50%']].map(([pos, size], i) => (
          <div key={i} style={{ position:'absolute', inset:0, zIndex:0,
            background: `radial-gradient(circle at ${pos}, ${accentColor}20 0%, transparent ${size})`,
            opacity: lp(0, 1, ap(frame, i * 2, 14)) }} />
        ))}
      </>
    );
  }

  return (
    <AbsoluteFill style={{ background: bgColor || '#050505', overflow: 'hidden' }}>
      {audioTrack && <Audio src={staticFile(audioTrack)} volume={0.22} startFrom={slideNum * 18} />}

      {/* Уникальный фоновый эффект для этого слайда */}
      {bgLayer}

      {/* Базовый центральный glow */}
      <div style={{ position:'absolute', top:'25%', left:'5%', right:'5%', height:'50%', zIndex:0,
        background:`radial-gradient(ellipse at 40% 50%, ${accentColor}10 0%, transparent 65%)` }} />

      <div style={{ position:'absolute', inset:0, padding:'72px 68px 80px', display:'flex', flexDirection:'column', opacity: masterOp, zIndex:5 }}>

        {/* Шапка */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:60 }}>
          <span style={{ fontFamily:FONTS.manrope, fontSize:24, fontWeight:600, color:handleColor, letterSpacing:'0.05em' }}>
            @nikolay_cheusov
          </span>
          <span style={{ fontFamily:FONTS.manrope, fontSize:24, fontWeight:700, color:accentColor, letterSpacing:'0.08em' }}>
            {counterStr}
          </span>
        </div>

        <div style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'center', gap:32 }}>

          {emoji && (
            <div style={{ fontSize:100, lineHeight:1, transformOrigin:'left center',
              opacity: emojiOp,
              transform: `translate(${emojiTx}px,${emojiTy}px) scale(${emojiSc}) rotate(${emojiRot}deg)`,
              filter: emojiBlur > 0 ? `blur(${emojiBlur}px)` : undefined }}>
              {emoji}
            </div>
          )}

          {badge && (
            <div style={{ display:'flex', transformOrigin:'left center',
              opacity: badgeOp, transform:`translate(${badgeTx}px,${badgeTy}px) scale(${badgeSc})` }}>
              <div style={{ background:accentColor, color: isGold ? '#0a0806' : '#050505',
                fontFamily:FONTS.manrope, fontSize:22, fontWeight:800,
                letterSpacing:'0.14em', padding:'8px 28px', borderRadius:100, textTransform:'uppercase' as const }}>
                {badge}
              </div>
            </div>
          )}

          {headline && (
            <div style={{ fontFamily:headlineFont, fontSize, fontWeight:900, color:'#ffffff',
              lineHeight:1.1, letterSpacing: isSilver ? '-0.01em' : '-0.02em',
              opacity: headOp,
              transform:`translate(${headTx}px,${headTy}px) scale(${headSc}) rotate(${headRot}deg)`,
              filter: headBlur > 0 ? `blur(${headBlur}px)` : undefined,
              textShadow: isSilver ? '0 2px 24px rgba(200,200,200,0.15)' : `0 0 60px ${accentColor}44` }}>
              {headline}
            </div>
          )}

          <div style={{ width:divW, height:3, background:`linear-gradient(to right,${accentColor},${accentColor}44)`, borderRadius:2 }} />

          {body && (
            <div style={{ fontFamily:FONTS.manrope, fontSize:34, fontWeight:500, color:bodyColor,
              lineHeight:1.55, letterSpacing:'0.01em', maxWidth:'88%',
              opacity: bodyOp, transform:`translate(${bodyTx}px,${bodyTy}px) scale(${bodySc})` }}>
              {body}
            </div>
          )}
        </div>
      </div>

      <AccentLines accentColor={accentColor} opacity={masterOp} />
      <ProgressBar slideNum={slideNum} total={total} accentColor={accentColor} />
    </AbsoluteFill>
  );
};

// ── BakedSlide: уникальная анимация-оверлей для каждого слайда ───────────────
const BakedSlide: React.FC<BakedSlideData> = ({ bgImage, bgColor, accentColor, slideNum, total }) => {
  const frame = useCurrentFrame();
  const audioTrack = getAudioTrack(accentColor, bgColor || '');

  const entryOp = slideNum === 1
    ? 1
    : interpolate(frame, [0, 10], [0, 1], { extrapolateRight: 'clamp' });
  const exitOp = interpolate(frame, [SLIDE_DURATION - 8, SLIDE_DURATION], [1, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const masterOp = entryOp * exitOp;
  const t = frame / (SLIDE_DURATION - TRANSITION);
  const pulse = Math.sin(t * Math.PI * 3) * 0.5 + 0.5;
  const idx = (slideNum - 1) % 10;

  // Уникальный оверлей для каждого слайда
  let overlay: React.ReactNode = null;

  if (idx === 0) {
    // SCAN LINE сверху вниз + угловые прицелы
    const sy = interpolate(frame, [0, 55], [-2, 102], { extrapolateRight: 'clamp' });
    const so = interpolate(frame, [0, 6, 48, 58], [0, 0.9, 0.9, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    overlay = <>
      <div style={{ position:'absolute', left:0, right:0, zIndex:4, top:`${sy}%`, height:2,
        background:`linear-gradient(to right,transparent,${accentColor},#fff,${accentColor},transparent)`,
        boxShadow:`0 0 20px 4px ${accentColor}`, opacity: so * masterOp }} />
      {[{top:40,left:40},{top:40,right:40},{bottom:40,left:40},{bottom:40,right:40}].map((p,i)=>(
        <div key={i} style={{ position:'absolute',...p, width:44, height:44, zIndex:5,
          borderTop: i<2?`2px solid ${accentColor}`:'none', borderBottom: i>=2?`2px solid ${accentColor}`:'none',
          borderLeft: i%2===0?`2px solid ${accentColor}`:'none', borderRight: i%2===1?`2px solid ${accentColor}`:'none',
          boxShadow:`0 0 10px ${accentColor}88`, opacity: masterOp*(0.5+pulse*0.5) }} />
      ))}
    </>;

  } else if (idx === 1) {
    // SCAN LINE слева направо
    const sx = interpolate(frame, [0, 60], [-2, 102], { extrapolateRight: 'clamp' });
    const so = interpolate(frame, [0, 6, 54, 64], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    overlay = <>
      <div style={{ position:'absolute', top:0, bottom:0, zIndex:4, left:`${sx}%`, width:2,
        background:`linear-gradient(to bottom,transparent,${accentColor},#fff,${accentColor},transparent)`,
        boxShadow:`0 0 20px 4px ${accentColor}`, opacity: so * masterOp }} />
      <div style={{ position:'absolute', inset:0, zIndex:3,
        background:`linear-gradient(to right,${accentColor}15 0%,transparent ${sx}%)`,
        opacity: masterOp }} />
    </>;

  } else if (idx === 2) {
    // ПУЛЬСИРУЮЩИЕ КОЛЬЦА из центра
    overlay = <>
      {[0, 15, 30].map((delay, i) => {
        const rp = Math.max(0, (frame - delay) % 45) / 45;
        const rs = interpolate(rp, [0, 1], [0.1, 1.6]);
        const ro = interpolate(rp, [0, 0.3, 0.8, 1], [0, 0.6, 0.3, 0]);
        return <div key={i} style={{ position:'absolute', inset:0, zIndex:4,
          border:`2px solid ${accentColor}`, borderRadius:'50%',
          transform:`scale(${rs})`, opacity: ro * masterOp }} />;
      })}
    </>;

  } else if (idx === 3) {
    // ДИАГОНАЛЬНЫЙ ЛУЧА — полоса под 45°
    const dp = interpolate(frame, [0, 50], [-150, 150], { extrapolateRight: 'clamp' });
    const dop = interpolate(frame, [0, 8, 44, 54], [0, 0.8, 0.8, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    overlay = <div style={{ position:'absolute', inset:0, zIndex:4, overflow:'hidden', opacity: dop * masterOp }}>
      <div style={{ position:'absolute', top:'50%', left:'50%', width:1600, height:3,
        background:`linear-gradient(to right,transparent 20%,${accentColor} 45%,#fff 50%,${accentColor} 55%,transparent 80%)`,
        boxShadow:`0 0 16px 4px ${accentColor}`,
        transform:`translate(${dp - 800}px,-50%) rotate(45deg)` }} />
    </div>;

  } else if (idx === 4) {
    // SPOTLIGHT — луч прожектора свипает слева направо по всей высоте
    const sx = interpolate(frame, [5, 65], [-10, 110], { extrapolateRight: 'clamp' });
    const sop = interpolate(frame, [0, 5, 60, 70], [0, 1, 1, 0], { extrapolateLeft:'clamp', extrapolateRight:'clamp' });
    overlay = <>
      <div style={{ position:'absolute', inset:0, zIndex:4, overflow:'hidden', opacity: sop * masterOp,
        background:`radial-gradient(ellipse 28% 100% at ${sx}% 50%, rgba(255,255,255,0.20) 0%, ${accentColor}18 40%, transparent 100%)` }} />
      <div style={{ position:'absolute', inset:0, zIndex:5, overflow:'hidden', opacity: sop * masterOp * 0.8,
        background:`radial-gradient(ellipse 7% 100% at ${sx}% 50%, ${accentColor}66 0%, transparent 100%)` }} />
    </>;

  } else if (idx === 5) {
    // CROSS BEAMS — горизонтальный + вертикальный луч одновременно
    const cop = interpolate(frame, [0, 8, 38, 55], [0, 1, 0.7, 0], { extrapolateLeft:'clamp', extrapolateRight:'clamp' });
    overlay = <div style={{ position:'absolute', inset:0, zIndex:4, opacity: cop * masterOp }}>
      <div style={{ position:'absolute', left:0, right:0, top:'50%', height:3,
        background:`linear-gradient(to right,transparent 5%,${accentColor} 30%,#fff 50%,${accentColor} 70%,transparent 95%)`,
        boxShadow:`0 0 24px 6px ${accentColor}`, transform:'translateY(-50%)' }} />
      <div style={{ position:'absolute', top:0, bottom:0, left:'50%', width:3,
        background:`linear-gradient(to bottom,transparent 5%,${accentColor} 30%,#fff 50%,${accentColor} 70%,transparent 95%)`,
        boxShadow:`0 0 24px 6px ${accentColor}`, transform:'translateX(-50%)' }} />
      <div style={{ position:'absolute', inset:0,
        background:`radial-gradient(ellipse 35% 35% at 50% 50%,${accentColor}22 0%,transparent 70%)` }} />
    </div>;

  } else if (idx === 6) {
    // ВЗРЫВ — расходящийся burst из центра
    const bScale = interpolate(frame, [0, 30], [0, 1.8], { extrapolateRight: 'clamp' });
    const bOp    = interpolate(frame, [0, 5, 25, 40], [0, 0.7, 0.3, 0], { extrapolateRight: 'clamp' });
    overlay = <div style={{ position:'absolute', inset:'-40%', zIndex:4,
      background:`radial-gradient(circle at 50% 50%,${accentColor}88 0%,${accentColor}22 30%,transparent 60%)`,
      transform:`scale(${bScale})`, opacity: bOp * masterOp }} />;

  } else if (idx === 7) {
    // SCAN LINE снизу вверх + пульс по краям
    const sy = interpolate(frame, [0, 55], [102, -2], { extrapolateRight: 'clamp' });
    const so = interpolate(frame, [0, 6, 48, 58], [0, 0.9, 0.9, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    overlay = <>
      <div style={{ position:'absolute', left:0, right:0, zIndex:4, top:`${sy}%`, height:2,
        background:`linear-gradient(to right,transparent,${accentColor},#fff,${accentColor},transparent)`,
        boxShadow:`0 0 20px 4px ${accentColor}`, opacity: so * masterOp }} />
      <div style={{ position:'absolute', inset:0, zIndex:3,
        background:`linear-gradient(to top,${accentColor}18 0%,transparent ${100-sy}%)`,
        opacity: masterOp }} />
    </>;

  } else if (idx === 8) {
    // ЦВЕТНЫЕ ЛИНИИ — неоновые горизонтальные линии появляются одна за другой
    overlay = <div style={{ position:'absolute', inset:0, zIndex:4, opacity: masterOp }}>
      {[15,30,50,65,80].map((topPct, i) => {
        const lineOp = interpolate(frame, [i*6, i*6+10, 60, 70], [0, 0.6, 0.4, 0], { extrapolateLeft:'clamp', extrapolateRight:'clamp' });
        return <div key={i} style={{ position:'absolute', left:0, right:0, top:`${topPct}%`, height:1,
          background:`linear-gradient(to right,transparent,${accentColor}${i%2===0?'88':'44'},transparent)`,
          opacity: lineOp }} />;
      })}
    </div>;

  } else {
    // idx === 9: VIGNETTE PULSE — пульсирующая виньетка по краям
    const vOp = 0.5 + pulse * 0.3;
    overlay = <div style={{ position:'absolute', inset:0, zIndex:4,
      background:`radial-gradient(ellipse at 50% 50%,transparent 25%,rgba(0,0,0,${vOp}) 100%)`,
      opacity: masterOp }} />;
  }

  return (
    <AbsoluteFill style={{ overflow: 'hidden', background: bgColor || '#050505' }}>
      {audioTrack && (
        <Audio src={staticFile(audioTrack)} volume={slideNum === 1 ? 0.35 : 0.25} startFrom={slideNum * 15} />
      )}

      {/* Статичная фотография */}
      {bgImage && (
        <AbsoluteFill style={{ opacity: masterOp }}>
          <Img src={staticFile(bgImage)}
            style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition:'center' }} />
        </AbsoluteFill>
      )}

      {/* Базовая виньетка */}
      <div style={{ position:'absolute', inset:0, zIndex:2,
        background:'radial-gradient(ellipse at 50% 45%,transparent 30%,rgba(0,0,0,0.65) 100%)',
        opacity: masterOp }} />

      {/* Уникальный оверлей слайда */}
      {overlay}

      <AccentLines accentColor={accentColor} opacity={masterOp} />
      <ProgressBar slideNum={slideNum} total={total} accentColor={accentColor} />
    </AbsoluteFill>
  );
};

// ── Слайд 10: программный CTA со скрином профиля ──────────────────────────────
const CtaSlide: React.FC<BakedSlideData> = ({ bgColor, accentColor, slideNum, total, body, badge }) => {
  const frame = useCurrentFrame();

  const entryOp = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: 'clamp' });
  const exitOp  = interpolate(frame, [SLIDE_DURATION - 8, SLIDE_DURATION], [1, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const masterOp = entryOp * exitOp;


  const bg = bgColor || '#050505';

  // Определяем стиль по accentColor
  const isGold = accentColor === '#d4af37';
  const headlineColor = isGold ? '#ffffff' : accentColor;
  const subColor = isGold ? accentColor : 'rgba(255,255,255,0.55)';
  const badgeBg = accentColor;
  const badgeText = isGold ? '#0a0806' : '#050505';
  const ctaTextColor = accentColor;

  // Glow под скрином
  const glowColor = `${accentColor}55`;

  const ctaText = body || 'Напиши слово в директ — открою доступ в Telegram';
  const badgeLabel = badge || 'ПОДПИСАТЬСЯ';

  return (
    <AbsoluteFill style={{ background: bg, overflow: 'hidden' }}>

      {/* Фоновое свечение по центру */}
      <div style={{
        position: 'absolute',
        top: '20%', left: '10%', right: '10%', height: '60%',
        background: `radial-gradient(ellipse at center, ${accentColor}18 0%, transparent 70%)`,
        zIndex: 0,
      }} />

      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'space-between',
        padding: '80px 64px 80px',
        opacity: masterOp,
        zIndex: 5,
      }}>

        {/* ── Верх: Badge + Handle + Subheadline ── */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
          {/* Badge */}
          <div style={{
            background: badgeBg,
            color: badgeText,
            fontFamily: FONTS.manrope,
            fontSize: 26,
            fontWeight: 800,
            letterSpacing: '0.15em',
            padding: '10px 36px',
            borderRadius: 100,
            textTransform: 'uppercase' as const,
          }}>
            {badgeLabel}
          </div>

          {/* Handle */}
          <div style={{
            fontFamily: FONTS.unbounded,
            fontSize: 58,
            fontWeight: 900,
            color: headlineColor,
            letterSpacing: '-0.01em',
            textAlign: 'center' as const,
            textShadow: `0 0 40px ${accentColor}88`,
            lineHeight: 1.1,
          }}>
            @nikolay_cheusov
          </div>

          {/* Subheadline */}
          <div style={{
            fontFamily: FONTS.manrope,
            fontSize: 30,
            fontWeight: 600,
            color: subColor,
            letterSpacing: '0.04em',
            textAlign: 'center' as const,
          }}>
            Нейросети&nbsp;|&nbsp;Гайды&nbsp;|&nbsp;ИИ Видео
          </div>
        </div>

        {/* ── Центр: Скрин профиля Instagram ── */}
        <div style={{
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          flex: 1, paddingTop: 40, paddingBottom: 40,
        }}>
          <div style={{
            position: 'relative',
          }}>
            {/* Glow за скрином */}
            <div style={{
              position: 'absolute', inset: -12,
              borderRadius: 48,
              background: glowColor,
              filter: 'blur(20px)',
            }} />
            <Img
              src={staticFile('references/instagram-profile.jpg')}
              style={{
                width: 580,
                borderRadius: 36,
                display: 'block',
                position: 'relative',
                boxShadow: `0 0 0 2px ${accentColor}66, 0 24px 60px rgba(0,0,0,0.7)`,
              }}
            />
          </div>
        </div>

        {/* ── Низ: Telegram CTA ── */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <TelegramIcon size={48} />
            <div style={{
              fontFamily: FONTS.manrope,
              fontSize: 28,
              fontWeight: 700,
              color: ctaTextColor,
              textAlign: 'center' as const,
              lineHeight: 1.35,
              maxWidth: 800,
              textShadow: `0 0 20px ${accentColor}66`,
            }}>
              {ctaText}
            </div>
          </div>
        </div>
      </div>

      <AccentLines accentColor={accentColor} opacity={masterOp} />
      <ProgressBar slideNum={slideNum} total={total} accentColor={accentColor} />
    </AbsoluteFill>
  );
};

// ── Главный компонент карусели ────────────────────────────────────────────────
type CarouselInput = {
  slides: BakedSlideData[];
};

export const BakedCarouselComp: React.FC<CarouselInput> = ({ slides }) => {
  const total = slides.length;
  return (
    <AbsoluteFill>
      <Series>
        {slides.map((slide, i) => {
          const isCta     = slide.cta === true || i === total - 1;
          const hasBgImg  = !!slide.bgImage;
          return (
            <Series.Sequence
              key={i}
              durationInFrames={SLIDE_DURATION}
              offset={i === 0 ? 0 : -TRANSITION}
            >
              {isCta ? (
                <CtaSlide {...slide} slideNum={i + 1} total={total} />
              ) : hasBgImg ? (
                <BakedSlide {...slide} slideNum={i + 1} total={total} />
              ) : (
                <ContentSlide {...slide} slideNum={i + 1} total={total} />
              )}
            </Series.Sequence>
          );
        })}
      </Series>
    </AbsoluteFill>
  );
};

export function bakedCarouselDuration(count: number): number {
  return count * SLIDE_DURATION - (count - 1) * TRANSITION;
}

// ── Root для отдельной точки входа ───────────────────────────────────────────
const defaultSlides: BakedSlideData[] = [
  { bgImage: 'bg/new/StyleB-01/slide-01.jpg', accentColor: '#b5ff2b', bgColor: '#141414', slideNum: 1, total: 10, baked: true },
];

const Root: React.FC = () => (
  <Composition
    id="BakedCarousel"
    component={BakedCarouselComp}
    defaultProps={{ slides: defaultSlides }}
    calculateMetadata={({ props }) => ({
      durationInFrames: bakedCarouselDuration(props.slides.length),
      fps: 30,
      width: 1080,
      height: 1350,
    })}
  />
);

registerRoot(Root);
