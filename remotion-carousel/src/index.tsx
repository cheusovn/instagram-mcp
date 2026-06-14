import { registerRoot, Composition } from 'remotion';
import { Carousel } from './Carousel';
import slidesData from './slides.json';

const SLIDES_COUNT = slidesData.slides.length;
const FPS = 30;
const SLIDE_DURATION = 150;
const TRANSITION = 10;
const TOTAL_FRAMES = SLIDES_COUNT * SLIDE_DURATION - (SLIDES_COUNT - 1) * TRANSITION;

export const RemotionRoot: React.FC = () => (
  <Composition
    id="Carousel"
    component={Carousel}
    durationInFrames={TOTAL_FRAMES}
    fps={FPS}
    width={1080}
    height={1920}
    defaultProps={{ slides: slidesData.slides }}
  />
);

registerRoot(RemotionRoot);
