import { AbsoluteFill, Series, useVideoConfig } from 'remotion';
import { Slide, SlideData } from './Slide';

export type CarouselProps = {
  slides: Omit<SlideData, 'slideNum' | 'total'>[];
};

const SLIDE_DURATION = 150; // frames at 30fps = 5 seconds
const TRANSITION = 10;

export const Carousel: React.FC<CarouselProps> = ({ slides }) => {
  const total = slides.length;

  return (
    <AbsoluteFill style={{ background: '#0a0a1a' }}>
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
              isLast={i === total - 1}
            />
          </Series.Sequence>
        ))}
      </Series>
    </AbsoluteFill>
  );
};
