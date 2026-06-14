#!/usr/bin/env node
/**
 * Render 10 individual slide MP4s + assemble full carousel
 *
 * Usage:
 *   node render-slides.mjs [compositionId] [--gpu] [--slides-only] [--heygen]
 *
 * Output:
 *   out/slides/slide_01.mp4 ... slide_10.mp4   (individual, 4s each)
 *   out/carousel_full.mp4                       (assembled sequence)
 *   out/slides/slide_01_heygen_prompt.txt ...   (HeyGen script per slide)
 */

import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const compositionId = process.argv[2] || process.env.COMPOSITION_ID || 'Style03_BrutalistNeon';
const useGpu = process.argv.includes('--gpu') || process.env.USE_GPU === '1';
const slidesOnly = process.argv.includes('--slides-only');
const withHeygen = process.argv.includes('--heygen');

const OUT_DIR = path.join(__dirname, '..', 'out', 'slides');
fs.mkdirSync(OUT_DIR, { recursive: true });
fs.mkdirSync(path.join(__dirname, '..', 'out'), { recursive: true });

// Читаем slides.json
const rootSlides = path.join(__dirname, '..', 'slides.json');
const srcSlides  = path.join(__dirname, 'src', 'slides.json');
const slidesPath = fs.existsSync(rootSlides) ? rootSlides : srcSlides;
const inputProps = JSON.parse(fs.readFileSync(slidesPath, 'utf-8'));
const slides = inputProps.slides;

console.log('═'.repeat(60));
console.log('  🎬 REMOTION — 10 Slides Individual MP4 Renderer');
console.log(`  Композиция: ${compositionId}`);
console.log(`  Слайдов: ${slides.length}`);
console.log(`  GPU: ${useGpu ? 'ВКЛЮЧЁН' : 'выкл'}`);
console.log('═'.repeat(60));

const chromiumOptions = useGpu ? {
  args: [
    '--enable-gpu',
    '--enable-accelerated-2d-canvas',
    '--enable-accelerated-video-decode',
    '--ignore-gpu-blocklist',
    '--use-gl=egl',
    '--disable-software-rasterizer',
  ],
} : {};

console.log('\n📦 Bundling...');
const bundleLocation = await bundle({
  entryPoint: path.join(__dirname, 'src', 'index.tsx'),
  webpackOverride: (config) => config,
});
console.log('✅ Bundle готов\n');

// ── HeyGen prompt templates per slide ──────────────────────────────────────
function buildHeygenScript(slide, slideNum, total) {
  return `=== HeyGen Script: Slide ${slideNum}/${total} ===

AVATAR: Kristin_public_2_20240108
VOICE: ru-RU-SvetlanaNeural
DURATION: 4 seconds
BACKGROUND_COLOR: ${slide.bgColor || '#080018'}

--- SCRIPT (говорит аватар) ---
${slide.headline ? `${slide.headline}.` : ''}
${slide.body ? slide.body : ''}
${slideNum === total ? 'Больше информации — в моём Telegram-канале. Ссылка в шапке профиля.' : ''}

--- OVERLAY TEXT ---
Headline: ${slide.headline || ''}
Body: ${slide.body || ''}
${slide.kicker ? `Kicker: ${slide.kicker}` : ''}
${slide.emoji ? `Emoji: ${slide.emoji}` : ''}

--- COMPOSITION ---
Composition ID: ${compositionId}
Slide file: out/slides/slide_${String(slideNum).padStart(2, '0')}.mp4
`;
}

// ── Рендер одного слайда ────────────────────────────────────────────────────
async function renderSlide(slideIndex) {
  const slide = slides[slideIndex];
  const slideNum = slideIndex + 1;
  const padded = String(slideNum).padStart(2, '0');
  const outPath = path.join(OUT_DIR, `slide_${padded}.mp4`);

  // Собираем inputProps только с одним слайдом, но slideNum/total оригинальные
  const singleSlideProps = {
    slides: slides.map((s, i) => ({
      ...s,
      // Делаем только текущий слайд видимым — остальные пустые
      headline: i === slideIndex ? s.headline : '',
      body: i === slideIndex ? s.body : '',
      emoji: i === slideIndex ? s.emoji : '',
    })),
  };

  // Альтернативно — рендерим весь carousel но обрезаем нужные кадры
  // Здесь рендерим один слайд через startFrame/endFrame
  const SLIDE_DURATION = 120; // 4s @30fps
  const TRANSITION = 12;
  const startFrame = slideIndex === 0
    ? 0
    : slideIndex * SLIDE_DURATION - slideIndex * TRANSITION;
  const endFrame = startFrame + SLIDE_DURATION;

  process.stdout.write(`  [${padded}] Рендерю кадры ${startFrame}–${endFrame}... `);

  const composition = await selectComposition({
    serveUrl: bundleLocation,
    id: compositionId,
    inputProps,
  });

  await renderMedia({
    composition: {
      ...composition,
      durationInFrames: SLIDE_DURATION,
    },
    serveUrl: bundleLocation,
    codec: 'h264',
    outputLocation: outPath,
    inputProps,
    frameRange: [startFrame, endFrame - 1],
    ...(useGpu ? { chromiumOptions } : {}),
    onProgress: ({ progress }) => process.stdout.write(`\r  [${padded}] ${Math.round(progress * 100)}%   `),
  });

  process.stdout.write(`\r  [${padded}] ✅ out/slides/slide_${padded}.mp4\n`);

  // Генерируем HeyGen script
  if (withHeygen) {
    const scriptPath = path.join(OUT_DIR, `slide_${padded}_heygen_prompt.txt`);
    fs.writeFileSync(scriptPath, buildHeygenScript(slide, slideNum, slides.length), 'utf-8');
  }

  return outPath;
}

// ── Рендер полного carousel через ffmpeg concat ────────────────────────────
async function assembleCarousel(slidePaths) {
  const { execSync } = await import('child_process');
  const listPath = path.join(__dirname, '..', 'out', '_concat_list.txt');
  const outPath = path.join(__dirname, '..', 'out', 'carousel_full.mp4');

  const listContent = slidePaths.map(p => `file '${p}'`).join('\n');
  fs.writeFileSync(listPath, listContent, 'utf-8');

  console.log('\n🔗 Собираю полный carousel...');
  try {
    execSync(
      `ffmpeg -y -f concat -safe 0 -i "${listPath}" -c copy "${outPath}"`,
      { stdio: 'pipe' }
    );
    console.log(`✅ Полный carousel: out/carousel_full.mp4`);
  } catch {
    // fallback: re-encode
    execSync(
      `ffmpeg -y -f concat -safe 0 -i "${listPath}" -c:v libx264 -preset fast -crf 18 "${outPath}"`,
      { stdio: 'inherit' }
    );
  }

  fs.unlinkSync(listPath);
  return outPath;
}

// ── MAIN ────────────────────────────────────────────────────────────────────
const slidePaths = [];

for (let i = 0; i < slides.length; i++) {
  const p = await renderSlide(i);
  slidePaths.push(p);
}

console.log('\n');

if (!slidesOnly) {
  await assembleCarousel(slidePaths);
}

if (withHeygen) {
  console.log('\n📋 HeyGen скрипты сохранены в out/slides/*_heygen_prompt.txt');
  console.log('   Загружай каждый MP4 в HeyGen и используй скрипт как голос аватара');
}

console.log('\n═'.repeat(60));
console.log('  ✅ ГОТОВО!');
console.log(`  📁 Отдельные слайды: out/slides/slide_01.mp4 … slide_${String(slides.length).padStart(2,'0')}.mp4`);
if (!slidesOnly) console.log('  🎬 Полный carousel: out/carousel_full.mp4');
console.log('═'.repeat(60));
