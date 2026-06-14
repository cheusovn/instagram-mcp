#!/usr/bin/env node
/**
 * Nano Banana × OpenRouter — Генератор AI-фонов для Style03
 *
 * Использование:
 *   OPENROUTER_API_KEY=sk-or-... node generate-backgrounds.mjs
 *   node generate-backgrounds.mjs --key sk-or-...
 *
 * Что делает:
 *   1. Генерирует N cyberpunk/neon фонов через flux-schnell (OpenRouter)
 *   2. Скачивает PNG файлы в remotion-carousel/public/bg/
 *   3. Обновляет src/slides.json — добавляет поле "image" в каждый слайд
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Конфиг ──────────────────────────────────────────────────────────────────
const API_KEY = process.env.OPENROUTER_API_KEY
  || process.argv.find(a => a.startsWith('--key='))?.split('=')[1]
  || (() => { console.error('❌ OPENROUTER_API_KEY не задан'); process.exit(1); })();

const MODEL = 'black-forest-labs/flux-schnell'; // быстро + дёшево
// Альтернатива: 'black-forest-labs/flux-1.1-pro' (лучше качество, дороже)

const OUT_DIR = path.join(__dirname, 'public', 'bg');
const SLIDES_PATH = path.join(__dirname, 'src', 'slides.json');

// ── Nano Banana Pro prompt bank (cyberpunk / neon / bento) ──────────────────
// Основаны на Nano Banana Pro промптах из awesome-nano-banana-pro-prompts
const PROMPTS = [
  // Слайд 1 — Hero: electric blue cyberpunk city
  'cyberpunk neon megacity at night, electric cyan and violet neon signs reflecting on wet streets, dark purple atmosphere, volumetric fog, cinematic 4K, ultra detailed, no text, no people, vertical portrait format',

  // Слайд 2 — Data: holographic grid
  'abstract holographic data grid floating in dark space, electric cyan neon lines forming geometric patterns, purple deep background, glowing data nodes, volumetric light beams, 4K cinematic, no text',

  // Слайд 3 — Energy: neon particles
  'abstract cyberpunk energy explosion, electric magenta and cyan plasma particles, dark space background, neon light trails, dynamic motion blur, cinematic 4K, no text, portrait',

  // Слайд 4 — Tech: liquid glass bento
  'premium liquid glass bento modules floating in dark purple space, apple glass transparency effect, cyan neon glow edges, subtle reflections, minimalist tech aesthetic, 4K, cinematic, no text',

  // Слайд 5 — Circuit: neon circuit board
  'macro cyberpunk circuit board, electric neon green and cyan traces glowing, dark background, purple atmospheric glow, ultra detailed, 4K cinematic quality, no text, portrait orientation',

  // Слайд 6 — Space: neural network
  'abstract AI neural network visualization, glowing neon nodes connected by electric cyan threads, dark space background, magenta accent lights, depth of field, cinematic 4K, no text',

  // Слайд 7 — Atmospheric: neon city rain
  'cyberpunk rain in neon city, electric blue and magenta reflections on wet ground, dark purple sky, bokeh neon lights, cinematic color grading, 4K ultra detailed, no text, portrait',

  // Слайд 8 — CTA: telegram blue abstract
  'abstract digital space with telegram blue electric glow, dark background, blue particle streams flowing, holographic shimmer, premium tech aesthetic, 4K cinematic, no text',
];

// ── Утилиты ──────────────────────────────────────────────────────────────────
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function fetchJson(url, options = {}) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const req = https.request({
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method || 'GET',
      headers: options.headers || {},
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { reject(new Error(`JSON parse error: ${data.slice(0, 200)}`)); }
      });
    });
    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

async function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const req = https.request({
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
    }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return downloadFile(res.headers.location, dest).then(resolve).catch(reject);
      }
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
      file.on('error', reject);
    });
    req.on('error', reject);
    req.end();
  });
}

// ── Генерация одного фона ───────────────────────────────────────────────────
async function generateBackground(prompt, index) {
  console.log(`\n  🎨 [${index + 1}/${PROMPTS.length}] Генерирую...`);
  console.log(`  Prompt: ${prompt.slice(0, 80)}...`);

  const resp = await fetchJson('https://openrouter.ai/api/v1/images/generations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://github.com/cheusovn/instagram-mcp',
      'X-Title': 'NanoBanana-Style03',
    },
    body: JSON.stringify({
      model: MODEL,
      prompt,
      width: 1080,
      height: 1350,
      n: 1,
    }),
  });

  const imageUrl = resp?.data?.[0]?.url || resp?.data?.[0]?.b64_json;
  if (!imageUrl) {
    console.error(`  ❌ Нет URL в ответе:`, JSON.stringify(resp).slice(0, 300));
    return null;
  }

  const filename = `slide_bg_${String(index + 1).padStart(2, '0')}.png`;
  const destPath = path.join(OUT_DIR, filename);

  if (imageUrl.startsWith('http')) {
    console.log(`  ⬇ Скачиваю: ${imageUrl.slice(0, 60)}...`);
    await downloadFile(imageUrl, destPath);
  } else {
    // base64
    const buf = Buffer.from(imageUrl, 'base64');
    fs.writeFileSync(destPath, buf);
  }

  console.log(`  ✅ Сохранено: public/bg/${filename}`);
  return `/bg/${filename}`; // путь для staticFile() в Remotion
}

// ── Обновление slides.json ──────────────────────────────────────────────────
function updateSlidesJson(imageRefs) {
  if (!fs.existsSync(SLIDES_PATH)) {
    console.log('⚠ slides.json не найден, создаю пример...');
    return;
  }

  const data = JSON.parse(fs.readFileSync(SLIDES_PATH, 'utf-8'));
  const slides = data.slides || [];

  let updated = 0;
  slides.forEach((slide, i) => {
    const imgRef = imageRefs[i];
    if (imgRef && !slide.isLast) {
      slide.image = imgRef;
      updated++;
    }
  });

  fs.writeFileSync(SLIDES_PATH, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`\n✅ slides.json обновлён: ${updated} слайдов получили AI-фон`);
}

// ── MAIN ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('═'.repeat(60));
  console.log('  🍌 NANO BANANA × OpenRouter — Background Generator');
  console.log('  Model: ' + MODEL);
  console.log('  Output: remotion-carousel/public/bg/');
  console.log('═'.repeat(60));

  // Создаём папку public/bg/
  fs.mkdirSync(OUT_DIR, { recursive: true });

  // Читаем slides.json чтобы знать сколько слайдов нужно
  let slideCount = PROMPTS.length;
  if (fs.existsSync(SLIDES_PATH)) {
    const data = JSON.parse(fs.readFileSync(SLIDES_PATH, 'utf-8'));
    const nonLast = (data.slides || []).filter(s => !s.isLast);
    slideCount = Math.min(nonLast.length, PROMPTS.length);
    console.log(`\n📊 Слайдов в slides.json: ${data.slides?.length || 0} (генерирую фоны для ${slideCount})`);
  }

  const imageRefs = [];
  for (let i = 0; i < slideCount; i++) {
    const ref = await generateBackground(PROMPTS[i], i);
    imageRefs.push(ref);
    if (i < slideCount - 1) await sleep(1000); // rate limit
  }

  updateSlidesJson(imageRefs);

  console.log('\n═'.repeat(60));
  console.log('  🎬 Готово! Теперь рендери:');
  console.log('  node render.mjs out/style03_nano.mp4 Style03_BrutalistNeon --gpu');
  console.log('═'.repeat(60));
}

main().catch(err => {
  console.error('❌ Ошибка:', err.message);
  process.exit(1);
});
