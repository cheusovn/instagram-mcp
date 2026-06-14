#!/usr/bin/env node
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// CLI: node render.mjs [output.mp4] [compositionId] [--gpu]
const outputPath = process.argv[2] || path.join(__dirname, '..', 'out', 'carousel.mp4');
const compositionId = process.argv[3] || process.env.COMPOSITION_ID || 'Carousel';
const useGpu = process.argv.includes('--gpu') || process.env.USE_GPU === '1';

fs.mkdirSync(path.dirname(outputPath), { recursive: true });

// Читаем слайды: сначала из корня проекта (генерирует workflow), потом src/
const rootSlides = path.join(__dirname, '..', 'slides.json');
const srcSlides = path.join(__dirname, 'src', 'slides.json');
const slidesPath = fs.existsSync(rootSlides) ? rootSlides : srcSlides;
const inputProps = JSON.parse(fs.readFileSync(slidesPath, 'utf-8'));
console.log(`📊 Слайдов: ${inputProps.slides.length}`);
console.log(`🎨 Композиция: ${compositionId}`);
if (useGpu) console.log('🚀 GPU-рендеринг: ВКЛЮЧЁН');

console.log('📦 Bundling...');
const bundleLocation = await bundle({
  entryPoint: path.join(__dirname, 'src', 'index.tsx'),
  webpackOverride: (config) => config,
});

console.log('🎬 Выбираю композицию...');
const composition = await selectComposition({
  serveUrl: bundleLocation,
  id: compositionId,
  inputProps,
});

const duration = (composition.durationInFrames / composition.fps).toFixed(1);
console.log(`🎥 Рендеринг: ${composition.durationInFrames} кадров (${duration}с)...`);

await renderMedia({
  composition,
  serveUrl: bundleLocation,
  codec: 'h264',
  outputLocation: outputPath,
  inputProps,
  // GPU-ускорение через chromium flags (используется при --gpu или USE_GPU=1)
  ...(useGpu ? {
    chromiumOptions: {
      args: [
        '--enable-gpu',
        '--enable-accelerated-2d-canvas',
        '--enable-accelerated-video-decode',
        '--ignore-gpu-blocklist',
        '--use-gl=egl',
        '--disable-software-rasterizer',
      ],
    },
  } : {}),
  onProgress: ({ progress }) => process.stdout.write(`\r   ${Math.round(progress * 100)}%`),
});

console.log(`\n✅ Готово: ${outputPath}`);
