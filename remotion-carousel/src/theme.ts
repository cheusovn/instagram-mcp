import { delayRender, continueRender } from 'remotion';

// ── Общая длительность слайда: РОВНО 4 секунды @30fps ─────────────────────────
export const SLIDE_DURATION = 90; // 3s — faster CI render
export const TRANSITION = 9; // нахлёст переходов между слайдами
export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1350; // 4:5

export const BRAND = '@nikolay_cheusov';

// ── Расширенная схема слайда (обратно совместима) ────────────────────────────
export type SlideData = {
  headline: string;
  body: string;
  emoji: string;
  bgColor: string;
  accentColor: string;
  isLast?: boolean;
  // новые опциональные поля
  kicker?: string; // надзаголовок / рубрика ("ШАГ 1", "FOMO")
  icon?: string; // доп. эмодзи-объект для декора
  image?: string; // URL/staticFile картинки (kenburns)
  video?: string; // URL/staticFile видео (HeyGen-клип) — фон или вставка-карточка
  telegram?: string; // ник/ссылка телеграм-канала (CTA-слайд)
  profileHandle?: string; // @ник для мокапа профиля Instagram (CTA-слайд)
  // служебные (проставляются Carousel-ом)
  slideNum: number;
  total: number;
};

export type SlideInput = Omit<SlideData, 'slideNum' | 'total'>;

// ── Загрузка Google Fonts (кириллица) с delayRender/continueRender ────────────
// Один общий загрузчик: грузим ВСЕ заголовочные шрифты для 7 стилей сразу,
// чтобы любая композиция рендерилась без FOUT.
let fontsRequested = false;

const GOOGLE_FONTS_HREF =
  'https://fonts.googleapis.com/css2?' +
  [
    'family=Bebas+Neue',
    'family=Anton',
    'family=Unbounded:wght@400;700;900',
    'family=Oswald:wght@400;600;700',
    'family=Manrope:wght@400;600;800',
    'family=Montserrat:wght@700;900',
    'family=Russo+One',
    'family=Golos+Text:wght@400;600;900',
    'family=Rubik:wght@400;700;900',
    'family=Inter:wght@400;500;600;700',
    'family=JetBrains+Mono:wght@400;700',
  ].join('&') +
  '&display=swap';

export function loadFonts() {
  if (fontsRequested || typeof document === 'undefined') return;
  fontsRequested = true;

  const handle = delayRender('Loading Google Fonts');

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = GOOGLE_FONTS_HREF;
  document.head.appendChild(link);

  // Грузим набор начертаний с поддержкой кириллицы (где она есть).
  Promise.all([
    document.fonts.load('400 72px "Bebas Neue"'),
    document.fonts.load('400 72px "Anton"'),
    document.fonts.load('900 72px "Unbounded"'),
    document.fonts.load('700 72px "Oswald"'),
    document.fonts.load('800 72px "Manrope"'),
    document.fonts.load('900 72px "Montserrat"'),
    document.fonts.load('400 72px "Russo One"'),
    document.fonts.load('900 72px "Golos Text"'),
    document.fonts.load('900 72px "Rubik"'),
    document.fonts.load('600 42px "Inter"'),
    document.fonts.load('700 42px "JetBrains Mono"'),
  ])
    .then(() => continueRender(handle))
    .catch(() => continueRender(handle));
}

// ── Семейства шрифтов по стилям ──────────────────────────────────────────────
export const FONTS = {
  bebas: "'Bebas Neue', 'Impact', sans-serif", // числа/латиница
  anton: "'Anton', 'Impact', sans-serif",
  oswaldHead: "'Oswald', 'Arial Narrow', sans-serif", // кириллица заголовков для Bebas-стиля
  unbounded: "'Unbounded', 'Montserrat', sans-serif",
  oswald: "'Oswald', sans-serif",
  manrope: "'Manrope', 'Inter', sans-serif",
  montserrat: "'Montserrat', 'Arial Black', sans-serif",
  russo: "'Russo One', 'Impact', sans-serif",
  golos: "'Golos Text', 'Inter', sans-serif",
  rubik: "'Rubik', sans-serif",
  inter: "'Inter', 'Arial', sans-serif",
  mono: "'JetBrains Mono', monospace",
};

// ── Детерминированный псевдослучайный генератор (seed) ────────────────────────
// НЕ используем Math.random — Remotion требует детерминизма.
export function rng(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// ── Преобразование hex+alpha (0..1) → #rrggbbaa ──────────────────────────────
export function withAlpha(hex: string, alpha: number): string {
  const a = Math.round(Math.max(0, Math.min(1, alpha)) * 255)
    .toString(16)
    .padStart(2, '0');
  // если уже rgba/gradient — вернём как есть с прозрачностью через rgba нельзя, fallback
  if (hex.startsWith('#') && (hex.length === 7 || hex.length === 4)) return hex + a;
  return hex;
}

// ── Разбивка заголовка на слова для stagger-анимаций ──────────────────────────
export function splitWords(text: string): string[] {
  return text.split(/\s+/).filter(Boolean);
}

// Выделяем ключевые слова (длиннее 4 символов или с цифрой) акцентным цветом —
// «субтитры» для просмотра без звука.
export function isKeyWord(word: string): boolean {
  const clean = word.replace(/[«»".,!?:—-]/g, '');
  return clean.length >= 5 || /\d/.test(clean) || /[A-Z]{2,}/.test(clean);
}
