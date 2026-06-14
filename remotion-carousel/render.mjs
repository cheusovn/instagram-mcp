#!/usr/bin/env node
// Renders the Remotion carousel to MP4
// Usage: node render.mjs [output_path]

import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputPath = process.argv[2] || path.join(__dirname, 'out', 'carousel.mp4');

// Ensure output directory exists
fs.mkdirSync(path.dirname(outputPath), { recursive: true });

console.log('📦 Bundling Remotion project...');
const bundleLocation = await bundle({
  entryPoint: path.join(__dirname, 'src', 'index.tsx'),
  webpackOverride: (config) => config,
});

console.log('🎬 Selecting composition...');
const composition = await selectComposition({
  serveUrl: bundleLocation,
  id: 'Carousel',
});

console.log(`🎥 Rendering ${composition.durationInFrames} frames at ${composition.fps}fps...`);
await renderMedia({
  composition,
  serveUrl: bundleLocation,
  codec: 'h264',
  outputLocation: outputPath,
  onProgress: ({ progress }) => {
    process.stdout.write(`\r   Progress: ${Math.round(progress * 100)}%`);
  },
});

console.log(`\n✅ Video saved to: ${outputPath}`);
