import React from 'react';
import { AbsoluteFill, Series } from 'remotion';
import { SLIDE_DURATION, TRANSITION, SlideData, SlideInput, loadFonts } from './theme';

loadFonts();

export type SlideComponent = React.FC<SlideData>;

export type StyleCarouselProps = {
  slides: SlideInput[];
  Slide: SlideComponent;
  bg?: string;
};

// Универсальная карусель: принимает Slide-рендер конкретного стиля.
export const StyleCarousel: React.FC<StyleCarouselProps> = ({ slides, Slide, bg = '#000' }) => {
  const total = slides.length;
  return (
    <AbsoluteFill style={{ background: bg }}>
      <Series>
        {slides.map((slide, i) => (
          <Series.Sequence
            key={i}
            durationInFrames={SLIDE_DURATION}
            offset={i === 0 ? 0 : -TRANSITION}
          >
            <Slide {...slide} slideNum={i + 1} total={total} isLast={slide.isLast ?? i === total - 1} />
          </Series.Sequence>
        ))}
      </Series>
    </AbsoluteFill>
  );
};

// Длительность всей композиции с учётом нахлёстов.
export function carouselDuration(count: number): number {
  return count * SLIDE_DURATION - (count - 1) * TRANSITION;
}
