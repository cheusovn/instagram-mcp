import React from 'react';
import { registerRoot, Composition } from 'remotion';
import { Carousel, type CarouselProps } from './Carousel';

// Placeholder — перезаписывается при рендере через inputProps
const defaultSlides: CarouselProps['slides'] = [
  {
    headline: 'Топ-10 нейросетей 2026',
    body: 'Запусти content-factory.yml чтобы сгенерировать карусель',
    emoji: '🚀',
    bgColor: 'linear-gradient(160deg, #020d00 0%, #0a2200 40%, #001a00 100%)',
    accentColor: '#39FF14',
  },
];

const Root: React.FC = () => (
  <Composition
    id="Carousel"
    component={Carousel}
    defaultProps={{ slides: defaultSlides }}
    calculateMetadata={({ props }) => ({
      durationInFrames: props.slides.length * 150 - (props.slides.length - 1) * 10,
      fps: 30,
      width: 1080,
      height: 1350, // 4:5 — максимум для Instagram Feed + Reels превью
    })}
  />
);

registerRoot(Root);
