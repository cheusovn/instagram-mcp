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

// Placeholder slides — перезаписываются при рендере через inputProps
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

const styleSlides = [
  { headline: 'Топ-5 нейросетей для видео в 2026', body: 'Sora, Runway, Kling — реальные кейсы с цифрами. Смотри следующий слайд 👇', emoji: '🎬', bgColor: '#000', accentColor: '#2D7FFF', kicker: 'ШАГ 1' },
  { headline: 'Sora генерирует 1 мин видео за 3 мин', body: 'В декабре 2025 OpenAI открыли API. Цена: $0.15/сек. Уже используют 50k+ создателей.', emoji: '⚡', bgColor: '#000', accentColor: '#2D7FFF', kicker: 'ФАКТ' },
  { headline: 'Runway Gen-4 — 4K без артефактов', body: 'Новый motion-brush управляет каждым объектом отдельно. Результат — кинематографичное качество.', emoji: '🎥', bgColor: '#000', accentColor: '#2D7FFF', kicker: 'ТРЕНД' },
  { headline: 'Больше информации — в моём Telegram-канале', body: 'Ссылка в шапке профиля ↓', emoji: '✈️', bgColor: '#000', accentColor: '#2AABEE', isLast: true, telegram: true, profileHandle: '@nikolay_cheusov' },
];

const N = styleSlides.length;

const Root: React.FC = () => (
  <>
    {/* Оригинальная карусель (обратная совместимость) */}
    <Composition
      id="Carousel"
      component={Carousel}
      defaultProps={{ slides: defaultSlides }}
      calculateMetadata={({ props }) => ({
        durationInFrames: props.slides.length * 150 - (props.slides.length - 1) * 10,
        fps: 30,
        width: 1080,
        height: 1350,
      })}
    />

    {/* Стиль 01 — Bebas 3D Extrude / Electric Blue */}
    <Composition
      id="Style01_Bebas3D"
      component={StyleCarousel}
      defaultProps={{ slides: styleSlides, Slide: Style01 }}
      calculateMetadata={({ props }) => ({
        durationInFrames: carouselDuration(props.slides.length),
        fps: 30,
        width: 1080,
        height: 1350,
      })}
    />

    {/* Стиль 02 — Unbounded Candy Pop */}
    <Composition
      id="Style02_CandyPop"
      component={StyleCarousel}
      defaultProps={{ slides: styleSlides, Slide: Style02 }}
      calculateMetadata={({ props }) => ({
        durationInFrames: carouselDuration(props.slides.length),
        fps: 30,
        width: 1080,
        height: 1350,
      })}
    />

    {/* Стиль 03 — Brutalist Neon Grid */}
    <Composition
      id="Style03_BrutalistNeon"
      component={StyleCarousel}
      defaultProps={{ slides: styleSlides, Slide: Style03 }}
      calculateMetadata={({ props }) => ({
        durationInFrames: carouselDuration(props.slides.length),
        fps: 30,
        width: 1080,
        height: 1350,
      })}
    />

    {/* Стиль 04 — Glassmorphism */}
    <Composition
      id="Style04_Glassmorphism"
      component={StyleCarousel}
      defaultProps={{ slides: styleSlides, Slide: Style04 }}
      calculateMetadata={({ props }) => ({
        durationInFrames: carouselDuration(props.slides.length),
        fps: 30,
        width: 1080,
        height: 1350,
      })}
    />

    {/* Стиль 05 — Liquid Gradient Blobs */}
    <Composition
      id="Style05_LiquidBlobs"
      component={StyleCarousel}
      defaultProps={{ slides: styleSlides, Slide: Style05 }}
      calculateMetadata={({ props }) => ({
        durationInFrames: carouselDuration(props.slides.length),
        fps: 30,
        width: 1080,
        height: 1350,
      })}
    />

    {/* Стиль 06 — Retro VHS Chromatic */}
    <Composition
      id="Style06_RetroVHS"
      component={StyleCarousel}
      defaultProps={{ slides: styleSlides, Slide: Style06 }}
      calculateMetadata={({ props }) => ({
        durationInFrames: carouselDuration(props.slides.length),
        fps: 30,
        width: 1080,
        height: 1350,
      })}
    />

    {/* Стиль 07 — Swiss Bold Minimal */}
    <Composition
      id="Style07_SwissBold"
      component={StyleCarousel}
      defaultProps={{ slides: styleSlides, Slide: Style07 }}
      calculateMetadata={({ props }) => ({
        durationInFrames: carouselDuration(props.slides.length),
        fps: 30,
        width: 1080,
        height: 1350,
      })}
    />
  </>
);

registerRoot(Root);
