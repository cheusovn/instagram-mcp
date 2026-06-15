#!/usr/bin/env node
/**
 * Render 10 individual slide MP4s + assemble full carousel
 *
 * Usage:
 *   node render-slides.mjs [compositionId] [--gpu] [--slides-only] [--heygen]
 *
 * Output:
 *   out/slides/slide_01.mp4 ... slide_10.mp4
 *   out/carousel_full.mp4
 */

import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const compositionId = process.argv[2] || process.env.COMPOSITION_ID || 'Style03-BrutalistNeon';
const useGpu = process.argv.includes('--gpu') || process.env.USE_GPU === '1';
const slidesOnly = process.argv.includes('--slides-only');
const withHeygen = process.argv.includes('--heygen');
const maxSlidesArg = process.argv.find(a => a.startsWith('--max-slides='));
const maxSlides = maxSlidesArg ? parseInt(maxSlidesArg.split('=')[1]) : (process.env.MAX_SLIDES ? parseInt(process.env.MAX_SLIDES) : 0);

const OUT_DIR = path.join(__dirname, '..', 'out', 'slides');
fs.mkdirSync(OUT_DIR, { recursive: true });
fs.mkdirSync(path.join(__dirname, '..', 'out'), { recursive: true });

const rootSlides = path.join(__dirname, '..', 'slides.json');
const srcSlides  = path.join(__dirname, 'src', 'slides.json');
const slidesPath = fs.existsSync(rootSlides) ? rootSlides : srcSlides;
const inputProps = JSON.parse(fs.readFileSync(slidesPath, 'utf-8'));
const allSlides = inputProps.slides;
const slides = maxSlides > 0 ? allSlides.slice(0, maxSlides) : allSlides;

console.log('═'.repeat(60));
console.log('  🎬 REMOTION — Slides Individual MP4 Renderer');
console.log(`  Композиция: ${compositionId}`);
console.log(`  Слайдов: ${slides.length}${maxSlides > 0 ? ` (тест: первые ${maxSlides})` : ''}`);
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

function buildHeygenScript(slide, slideNum, total) {
  return `=== HeyGen Script: Slide ${slideNum}/${total} ===\n\nAVATAR: Kristin_public_2_20240108\nVOICE: ru-RU-SvetlanaNeural\nDURATION: 4 seconds\n\n--- SCRIPT ---\n${slide.headline ? `${slide.headline}.` : ''}\n${slide.body ? slide.body : ''}\n${slideNum === total ? 'Больше информации — в Telegram. Ссылка в шапке.' : ''}\n`;
}

async function renderSlide(slideIndex) {
  const slideNum = slideIndex + 1;
  const padded = String(slideNum).padStart(2, '0');
  const outPath = path.join(OUT_DIR, `slide_${padded}.mp4`);

  const SLIDE_DURATION = 90;
  const TRANSITION = 9;
  const startFrame = slideIndex * SLIDE_DURATION - slideIndex * TRANSITION;
  const endFrame = startFrame + SLIDE_DURATION - 1;

  process.stdout.write(`  [${padded}] Рендерю кадры ${startFrame}–${endFrame}... `);

  // Pass ALL slides so slideNum/total display correctly; no durationInFrames override
  const composition = await selectComposition({
    serveUrl: bundleLocation,
    id: compositionId,
    inputProps,
  });

  await renderMedia({
    composition,           // uses real durationInFrames from calculateMetadata
    serveUrl: bundleLocation,
    codec: 'h264',
    outputLocation: outPath,
    inputProps,
    frameRange: [startFrame, endFrame],
    ...(useGpu ? { chromiumOptions } : {}),
    onProgress: ({ progress }) => process.stdout.write(`\r  [${padded}] ${Math.round(progress * 100)}%   `),
  });

  process.stdout.write(`\r  [${padded}] ✅ out/slides/slide_${padded}.mp4\n`);

  if (withHeygen) {
    const scriptPath = path.join(OUT_DIR, `slide_${padded}_heygen_prompt.txt`);
    fs.writeFileSync(scriptPath, buildHeygenScript(slide, slideNum, slides.length), 'utf-8');
  }

  return outPath;
}

async function assembleCarousel(slidePaths) {
  const { execSync } = await import('child_process');
  const listPath = path.join(__dirname, '..', 'out', '_concat_list.txt');
  const outPath = path.join(__dirname, '..', 'out', 'carousel_full.mp4');

  const listContent = slidePaths.map(p => `file '${p}'`).join('\n');
  fs.writeFileSync(listPath, listContent, 'utf-8');

  console.log('\n🔗 Собираю полный carousel...');
  try {
    execSync(`ffmpeg -y -f concat -safe 0 -i "${listPath}" -c copy "${outPath}"`, { stdio: 'pipe' });
    console.log('✅ Полный carousel: out/carousel_full.mp4');
  } catch {
    execSync(`ffmpeg -y -f concat -safe 0 -i "${listPath}" -c:v libx264 -preset fast -crf 18 "${outPath}"`, { stdio: 'inherit' });
  }

  fs.unlinkSync(listPath);
  return outPath;
}

const slidePaths = [];
for (let i = 0; i < slides.length; i++) {
  const p = await renderSlide(i);
  slidePaths.push(p);
}

console.log('\n');
if (!slidesOnly) await assembleCarousel(slidePaths);

console.log('\n' + '═'.repeat(60));
console.log('  ✅ ГОТОВО!');
console.log(`  📁 Слайды: out/slides/slide_01.mp4 … slide_${String(slides.length).padStart(2,'0')}.mp4`);
if (!slidesOnly) console.log('  🎬 Полный carousel: out/carousel_full.mp4');
console.log('═'.repeat(60));
