import React from 'react';
import { AbsoluteFill, Series, Audio, staticFile, useVideoConfig } from 'remotion';
import { SLIDE_DURATION, TRANSITION, SlideData, SlideInput, loadFonts } from './theme';

loadFonts();

export type SlideComponent = React.FC<SlideData>;

export type StyleCarouselProps = {
  slides: SlideInput[];
  Slide: SlideComponent;
  bg?: string;
  audioTrack?: string; // путь к треку в public/ (опционально)
};

// ── Синтетические звуки переходов через Web Audio API ──────────────────────
function SlideSound({ slideNum, frame }: { slideNum: number; frame: number }) {
  // Remotion не поддерживает Web Audio напрямую в рендере,
  // поэтому звуки добавляем через Audio-компоненты на конкретных кадрах
  return null;
}

// ── Универсальная карусель с аудио ──────────────────────────────────────────
export const StyleCarousel: React.FC<StyleCarouselProps> = ({
  slides,
  Slide,
  bg = '#000',
  audioTrack,
}) => {
  const total = slides.length;
  const { fps } = useVideoConfig();

  // Проверяем наличие трекового файла
  const hasBgMusic = audioTrack !== undefined;

  // Пути к звуковым эффектам (файлы в public/sfx/)
  // Если файлов нет — Audio gracefully ничего не делает
  const sfxGlitch = 'sfx/glitch_hit.mp3';
  const sfxSwipe  = 'sfx/swipe_neon.mp3';
  const sfxRiser  = 'sfx/riser_cyber.mp3';

  const totalDuration = slides.length * SLIDE_DURATION - (slides.length - 1) * TRANSITION;

  return (
    <AbsoluteFill style={{ background: bg }}>

      {/* ── Фоновая музыка (если передана) ── */}
      {hasBgMusic && (
        <Audio
          src={staticFile(audioTrack!)}
          volume={(f) => {
            // Нарастает в начале, фейдаут в конце
            if (f < 30) return f / 30 * 0.55;
            if (f > totalDuration - 30) return Math.max(0, (totalDuration - f) / 30 * 0.55);
            return 0.55;
          }}
          startFrom={0}
        />
      )}

      {/* ── Звуки переходов между слайдами ── */}
      {slides.map((_, i) => {
        if (i === 0) return null;
        // Кадр, на котором начинается следующий слайд
        const transitionFrame = i * SLIDE_DURATION - i * TRANSITION;
        return (
          <React.Fragment key={`sfx-${i}`}>
            {/* Swipe sound на переходе */}
            <Audio
              src={staticFile(sfxSwipe)}
              startFrom={transitionFrame}
              endAt={transitionFrame + 18}
              volume={0.7}
            />
          </React.Fragment>
        );
      })}

      {/* ── Riser в первые 2 секунды ── */}
      <Audio
        src={staticFile(sfxRiser)}
        startFrom={0}
        endAt={60}
        volume={0.5}
      />

      {/* ── Glitch hit на slide 1 entry flash ── */}
      <Audio
        src={staticFile(sfxGlitch)}
        startFrom={0}
        endAt={12}
        volume={0.6}
      />

      {/* ── Слайды ── */}
      <Series>
        {slides.map((slide, i) => (
          <Series.Sequence
            key={i}
            durationInFrames={SLIDE_DURATION}
            offset={i === 0 ? 0 : -TRANSITION}
          >
            <Slide
              {...slide}
              slideNum={i + 1}
              total={total}
              isLast={slide.isLast ?? i === total - 1}
            />
          </Series.Sequence>
        ))}
      </Series>
    </AbsoluteFill>
  );
};

export function carouselDuration(count: number): number {
  return count * SLIDE_DURATION - (count - 1) * TRANSITION;
}
