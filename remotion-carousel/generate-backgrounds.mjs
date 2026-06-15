#!/usr/bin/env node
/**
 * AI Background Generator — Gemini Flash Image via OpenRouter
 *
 * Использование:
 *   OPENROUTER_API_KEY=sk-or-... node generate-backgrounds.mjs
 *   node generate-backgrounds.mjs --style StyleA-NeonKatana
 *
 * Генерирует 2026-трендовые AI-фоны для каждого слайда.
 * Сохраняет в public/bg/<style>/ и обновляет slides.json
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const API_KEY = process.env.OPENROUTER_API_KEY
  || process.argv.find(a => a.startsWith('--key='))?.split('=')[1]
  || (() => { console.error('❌ Укажи OPENROUTER_API_KEY'); process.exit(1); })();

const STYLE_ARG = process.argv.find(a => a.startsWith('--style='))?.split('=')[1]
  || process.env.STYLE_ID
  || 'StyleA-NeonKatana';

const SLIDES_PATH = path.join(__dirname, 'src', 'slides.json');

// ─── 2026 TREND PROMPT BANKS ─────────────────────────────────────────────────
// Три стиля — каждый со своей эстетикой, но все сочетаются в ленте

const STYLE_PROMPTS = {

  // ── STYLE A: Neon Katana (основной, самый мощный) ──────────────────────
  // Эстетика: cyberpunk Japan 2026 + brutalist neon + liquid metal
  // Цвета: #CCFF00 (nano banana) + #FF00FF + #00FFFF
  'StyleA-NeonKatana': [
    'futuristic japanese cyberpunk street at night, neon yellow-green (#CCFF00) kanji signs, purple fog, wet black asphalt reflecting neon lights, cinematic anamorphic lens flare, no people, no text, ultra 4K, vertical 9:16 portrait',
    'abstract liquid neon explosion, electric lime green and magenta plasma tendrils on pure black background, volumetric light, 4K cinematic still, no text, portrait orientation, hyper detailed',
    'holographic data sphere floating in dark space, glowing nano banana yellow-green (#CCFF00) grid lines, deep purple void background, particles orbiting sphere, ultra 4K, no text',
    'brutalist neon architecture at night, massive concrete tower with electric lime green light strips, foggy purple sky, cinematic top-down angle, hyperrealistic, no text, portrait',
    'macro neon circuit board extreme close-up, glowing yellow-green traces on black PCB, purple background glow, bokeh depth of field, cinematic 4K, no people, no text',
    'cyberpunk liquid metal surface with neon reflections, lime and magenta neon lights reflected in mercury-like surface, abstract tech aesthetic, 4K cinematic, no text',
    'abstract AI neural network, glowing nano banana yellow nodes connected by electric threads on deep space background, magenta accent pulses, ultra 4K, no text',
    'neon katana slash effect, electric lime green energy blade cutting through dark space, plasma arc and particle burst, cinematic motion blur, 4K, no text, portrait',
    'cyberpunk megacity panorama from above, yellow-green neon grid streets below, purple storm clouds with lightning, cinematic establishing shot, ultra 4K, no text',
    'telegram messenger icon reimagined as holographic neon blue sphere floating in dark space, electric particles, premium tech aesthetic, 4K cinematic, no text',
  ],

  // ── STYLE B: Glass Minimal (контраст — светлый, премиум) ──────────────
  // Эстетика: apple vision pro + liquid glass + bento grid 2026
  // Цвета: белый + молочный + light blue accent
  'StyleB-GlassMinimal': [
    'premium apple-style liquid glass morphism, frosted glass panels floating in clean white space, subtle light blue shadows, ultra minimal, no text, portrait 9:16, photorealistic',
    'abstract clean white marble texture with subtle blue veins, premium material, soft natural light, ultra minimal aesthetic, 4K, no text, portrait orientation',
    'aerial view of pristine white sand beach with turquoise water, minimal composition, golden hour light, luxury aesthetic, no text, ultra 4K portrait',
    'premium liquid glass bento grid floating in soft cream background, subtle shadows, apple vision pro aesthetic 2026, ultra minimal, 4K, no text',
    'clean white frosted glass panels with ice blue neon edges, dark mode elements floating in white space, premium tech minimal aesthetic, 4K, no text',
    'abstract white and cream gradient with soft bokeh light orbs, minimal luxury, photorealistic, ultra 4K, no text, portrait',
    'premium white ceramic surface with subtle texture and blue light reflection, product photography aesthetic, ultra minimal, 4K, no text',
    'clean frosted glass sphere in white studio light, perfect reflection, apple product aesthetic 2026, ultra minimal, no text, 4K portrait',
    'minimal white infinity room with single blue light streak, futuristic clean aesthetic, photorealistic, no text, portrait 9:16',
    'premium white background with subtle gradient and soft blue particle glow, luxury brand aesthetic, ultra clean, 4K, no text',
  ],

  // ── STYLE C: Gold Rush (тёплый, деньги, мотивация) ───────────────────
  // Эстетика: luxury gold + dark brown + cinematic warmth
  // Цвета: #FFD700 + #FF6B00 + тёмный шоколад
  'StyleC-GoldRush': [
    'luxury gold and dark background, molten gold liquid dripping on dark surface, dramatic cinematic lighting, rich textures, no text, portrait 9:16, ultra 4K photorealistic',
    'premium dark chocolate and gold abstract, swirling gold leaf particles in dark atmosphere, luxury brand aesthetic, 4K cinematic, no text, portrait',
    'cinematic Dubai night skyline gold lights, warm amber bokeh, luxury city aesthetic, dramatic sky, ultra 4K, no text, portrait',
    'abstract golden particles explosion on dark brown background, luxury brand motion graphic, cinematic color grade, no text, 4K portrait',
    'macro gold bullion bars stack, dramatic side lighting, rich warm tones, luxury financial aesthetic, ultra 4K, no text, portrait orientation',
    'premium whisky in crystal glass with golden light refraction, dark background, luxury product photography, 4K, no text, portrait',
    'abstract golden circuit board traces glowing on dark background, luxury tech aesthetic, warm gold tones, 4K cinematic, no text',
    'cinematic sunrise over mountains, golden hour dramatic rays, luxury travel aesthetic, ultra 4K, no text, portrait 9:16',
    'luxury dark leather texture with gold embossed pattern, premium brand aesthetic, dramatic lighting, 4K, no text, portrait',
    'abstract golden glitter explosion on black background, luxury celebration aesthetic, bokeh gold particles, 4K cinematic, no text, portrait',
  ],
};

// ── Утилиты HTTP ─────────────────────────────────────────────────────────────
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function httpRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = https.request({
      hostname: u.hostname,
      path: u.pathname + u.search,
      method: options.method || 'GET',
      headers: options.headers || {},
    }, (res) => {
      // Handle redirects
      if ([301,302,307,308].includes(res.statusCode) && res.headers.location) {
        return httpRequest(res.headers.location, { method: 'GET' }).then(resolve).catch(reject);
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const buf = Buffer.concat(chunks);
        if (options.binary) return resolve(buf);
        try { resolve(JSON.parse(buf.toString())); }
        catch { resolve(buf.toString()); }
      });
    });
    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

// ── Генерация через OpenRouter Images API ─────────────────────────────────────
async function generateImage(prompt, index, total, outPath) {
  console.log(`\n  🎨 [${index+1}/${total}] Генерирую фон...`);
  console.log(`  Prompt: ${prompt.slice(0, 90)}...`);

  // Gemini image gen → fallback flux pro → fallback flux schnell
  const models = [
    'google/gemini-3.1-flash-image-preview',  // primary: gemini image generation
    'black-forest-labs/flux-1.1-pro',         // fallback: best flux quality
    'black-forest-labs/flux-schnell',         // fast fallback
  ];

  let lastErr;
  for (const model of models) {
    try {
      console.log(`  Model: ${model}`);
      const resp = await httpRequest('https://openrouter.ai/api/v1/images/generations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://github.com/cheusovn/instagram-mcp',
          'X-Title': 'NanoBanana-Styles',
        },
        body: JSON.stringify({ model, prompt, width: 1080, height: 1350, n: 1 }),
      });

      const item = resp?.data?.[0];
      if (!item) { lastErr = new Error(`No data: ${JSON.stringify(resp).slice(0,200)}`); continue; }

      if (item.b64_json) {
        fs.writeFileSync(outPath, Buffer.from(item.b64_json, 'base64'));
      } else if (item.url) {
        console.log(`  ⬇ Скачиваю...`);
        const imgBuf = await httpRequest(item.url, { binary: true });
        fs.writeFileSync(outPath, imgBuf);
      } else {
        lastErr = new Error('No url or b64_json'); continue;
      }

      console.log(`  ✅ Сохранено: ${path.basename(outPath)}`);
      return true;
    } catch(e) {
      console.warn(`  ⚠ ${model} failed: ${e.message}`);
      lastErr = e;
      await sleep(1000);
    }
  }

  console.error(`  ❌ Все модели упали: ${lastErr?.message}`);
  return false;
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
async function main() {
  const prompts = STYLE_PROMPTS[STYLE_ARG];
  if (!prompts) {
    console.error(`❌ Неизвестный стиль: ${STYLE_ARG}`);
    console.error(`Доступные: ${Object.keys(STYLE_PROMPTS).join(', ')}`);
    process.exit(1);
  }

  const outDir = path.join(__dirname, 'public', 'bg', STYLE_ARG);
  fs.mkdirSync(outDir, { recursive: true });

  console.log('═'.repeat(60));
  console.log(`  🖼  AI Background Generator 2026`);
  console.log(`  Style: ${STYLE_ARG}`);
  console.log(`  Output: public/bg/${STYLE_ARG}/`);
  console.log('═'.repeat(60));

  // Читаем slides.json чтобы знать сколько нужно слайдов
  let slideCount = prompts.length;
  if (fs.existsSync(SLIDES_PATH)) {
    const d = JSON.parse(fs.readFileSync(SLIDES_PATH, 'utf8'));
    slideCount = Math.min((d.slides||[]).length, prompts.length);
  }

  const refs = [];
  for (let i = 0; i < slideCount; i++) {
    const filename = `slide_${String(i+1).padStart(2,'0')}.jpg`;
    const outPath = path.join(outDir, filename);

    // Пропускаем если уже есть
    if (fs.existsSync(outPath)) {
      console.log(`  ⏭  [${i+1}] уже есть, пропускаю`);
      refs.push(`/bg/${STYLE_ARG}/${filename}`);
      continue;
    }

    const ok = await generateImage(prompts[i], i, slideCount, outPath);
    refs.push(ok ? `/bg/${STYLE_ARG}/${filename}` : null);
    if (i < slideCount - 1) await sleep(1200);
  }

  // Обновляем slides.json
  if (fs.existsSync(SLIDES_PATH)) {
    const d = JSON.parse(fs.readFileSync(SLIDES_PATH, 'utf8'));
    (d.slides||[]).forEach((s, i) => {
      if (refs[i] && !s.isLast) s.image = refs[i];
    });
    fs.writeFileSync(SLIDES_PATH, JSON.stringify(d, null, 2));
    console.log('\n✅ slides.json обновлён с AI-фонами');
  }

  console.log('\n' + '═'.repeat(60));
  console.log(`  ✅ Готово! ${refs.filter(Boolean).length}/${slideCount} фонов сгенерировано`);
  console.log('═'.repeat(60));
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });
