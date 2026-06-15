import React from 'react';
import { registerRoot, Composition } from 'remotion';
import { Carousel, type CarouselProps } from './Carousel';
import { StyleCarousel, carouselDuration } from './StyleCarousel';
import { Style01 } from './styles/Style01';
import { Style02 } from './styles/Style02';
import { Style03 } from './styles/Style03';
import { Style04 } from './styles/Style04';
import { Style05 } from './styles/Style05';
import { Style06 } from './styles/Style06';
import { Style07 } from './styles/Style07';
import { StyleA } from './styles/StyleA';
import { StyleB } from './styles/StyleB';
import { StyleC } from './styles/StyleC';
import type { SlideInput } from './theme';

const defaultSlides: CarouselProps['slides'] = [
  {
    headline: 'Топ-10 нейросетей 2026',
    body: 'Запусти content-factory.yml чтобы сгенерировать карусель',
    emoji: '🚀',
    bgColor: 'linear-gradient(160deg, #020d00 0%, #0a2200 40%, #001a00 100%)',
    accentColor: '#39FF14',
  },
  {
    headline: 'Ссылка в шапке профиля',
    body: 'Больше информации — в моём Telegram-канале. Ссылка в шапке профиля.',
    emoji: '✈️',
    bgColor: 'linear-gradient(160deg,#0a0a1a,#1a0a2e 50%,#0d1a3a)',
    accentColor: '#2AABEE',
    isLast: true,
    telegram: true,
    profileHandle: '@nikolay_cheusov',
  },
];

const styleSlides: SlideInput[] = [
  { headline: 'Топ-5 нейросетей для видео в 2026', body: 'Sora, Runway, Kling — реальные кейсы с цифрами.', emoji: '🎬', bgColor: '#000', accentColor: '#2D7FFF', kicker: 'ШАГ 1' },
  { headline: 'Sora генерирует 1 мин видео за 3 мин', body: 'Цена: $0.15/сек. Уже используют 50k+ создателей.', emoji: '⚡', bgColor: '#000', accentColor: '#2D7FFF', kicker: 'ФАКТ' },
  { headline: 'Runway Gen-4 — 4K без артефактов', body: 'motion-brush управляет каждым объектом отдельно.', emoji: '🎥', bgColor: '#000', accentColor: '#2D7FFF', kicker: 'ТРЕНД' },
  { headline: 'Больше — в Telegram', body: 'Ссылка в шапке профиля ↓', emoji: '✈️', bgColor: '#000', accentColor: '#2AABEE', isLast: true, telegram: true, profileHandle: '@nikolay_cheusov' },
];

type SlidesOnly = { slides: SlideInput[] };

// Wrapper-компоненты: Slide захардкожен внутри, не сериализуется через JSON
// Это фикс React error #130 — компоненты теряются в inputProps IPC
const Style01Carousel: React.FC<SlidesOnly> = ({ slides }) => (
  <StyleCarousel slides={slides} Slide={Style01} bg="#0a0a1a" />
);
const Style02Carousel: React.FC<SlidesOnly> = ({ slides }) => (
  <StyleCarousel slides={slides} Slide={Style02} bg="#fff0f5" />
);
const Style03Carousel: React.FC<SlidesOnly> = ({ slides }) => (
  <StyleCarousel slides={slides} Slide={Style03} bg="#080018" />
);
const Style04Carousel: React.FC<SlidesOnly> = ({ slides }) => (
  <StyleCarousel slides={slides} Slide={Style04} bg="#0d1117" />
);
const Style05Carousel: React.FC<SlidesOnly> = ({ slides }) => (
  <StyleCarousel slides={slides} Slide={Style05} bg="#0a0a0a" />
);
const Style06Carousel: React.FC<SlidesOnly> = ({ slides }) => (
  <StyleCarousel slides={slides} Slide={Style06} bg="#111" />
);
const Style07Carousel: React.FC<SlidesOnly> = ({ slides }) => (
  <StyleCarousel slides={slides} Slide={Style07} bg="#f5f5f0" />
);
const StyleACarousel: React.FC<SlidesOnly> = ({ slides }) => (
  <StyleCarousel slides={slides} Slide={StyleA} bg="#000000" />
);
const StyleBCarousel: React.FC<SlidesOnly> = ({ slides }) => (
  <StyleCarousel slides={slides} Slide={StyleB} bg="#f0f4ff" />
);
const StyleCCarousel: React.FC<SlidesOnly> = ({ slides }) => (
  <StyleCarousel slides={slides} Slide={StyleC} bg="#0D0800" />
);

const Root: React.FC = () => (
  <>
    <Composition
      id="Carousel"
      component={Carousel}
      defaultProps={{ slides: defaultSlides }}
      calculateMetadata={({ props }) => ({
        durationInFrames: props.slides.length * 150 - (props.slides.length - 1) * 10,
        fps: 30, width: 1080, height: 1350,
      })}
    />
    <Composition
      id="Style01-Bebas3D"
      component={Style01Carousel}
      defaultProps={{ slides: styleSlides }}
      calculateMetadata={({ props }) => ({ durationInFrames: carouselDuration(props.slides.length), fps: 30, width: 1080, height: 1350 })}
    />
    <Composition
      id="Style02-CandyPop"
      component={Style02Carousel}
      defaultProps={{ slides: styleSlides }}
      calculateMetadata={({ props }) => ({ durationInFrames: carouselDuration(props.slides.length), fps: 30, width: 1080, height: 1350 })}
    />
    <Composition
      id="Style03-BrutalistNeon"
      component={Style03Carousel}
      defaultProps={{ slides: styleSlides }}
      calculateMetadata={({ props }) => ({ durationInFrames: carouselDuration(props.slides.length), fps: 30, width: 1080, height: 1350 })}
    />
    <Composition
      id="Style04-Glassmorphism"
      component={Style04Carousel}
      defaultProps={{ slides: styleSlides }}
      calculateMetadata={({ props }) => ({ durationInFrames: carouselDuration(props.slides.length), fps: 30, width: 1080, height: 1350 })}
    />
    <Composition
      id="Style05-LiquidBlobs"
      component={Style05Carousel}
      defaultProps={{ slides: styleSlides }}
      calculateMetadata={({ props }) => ({ durationInFrames: carouselDuration(props.slides.length), fps: 30, width: 1080, height: 1350 })}
    />
    <Composition
      id="Style06-RetroVHS"
      component={Style06Carousel}
      defaultProps={{ slides: styleSlides }}
      calculateMetadata={({ props }) => ({ durationInFrames: carouselDuration(props.slides.length), fps: 30, width: 1080, height: 1350 })}
    />
    <Composition
      id="Style07-SwissBold"
      component={Style07Carousel}
      defaultProps={{ slides: styleSlides }}
      calculateMetadata={({ props }) => ({ durationInFrames: carouselDuration(props.slides.length), fps: 30, width: 1080, height: 1350 })}
    />
    <Composition
      id="StyleA-NeonKatana"
      component={StyleACarousel}
      defaultProps={{ slides: styleSlides }}
      calculateMetadata={({ props }) => ({ durationInFrames: carouselDuration(props.slides.length), fps: 30, width: 1080, height: 1350 })}
    />
    <Composition
      id="StyleB-GlassMinimal"
      component={StyleBCarousel}
      defaultProps={{ slides: styleSlides }}
      calculateMetadata={({ props }) => ({ durationInFrames: carouselDuration(props.slides.length), fps: 30, width: 1080, height: 1350 })}
    />
    <Composition
      id="StyleC-GoldRush"
      component={StyleCCarousel}
      defaultProps={{ slides: styleSlides }}
      calculateMetadata={({ props }) => ({ durationInFrames: carouselDuration(props.slides.length), fps: 30, width: 1080, height: 1350 })}
    />
  </>
);

registerRoot(Root);
