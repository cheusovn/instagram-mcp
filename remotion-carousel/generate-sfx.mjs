#!/usr/bin/env node
/**
 * Генерирует звуковые эффекты через ffmpeg (без внешних файлов)
 * Создаёт: public/sfx/glitch_hit.mp3, swipe_neon.mp3, riser_cyber.mp3
 *
 * Запуск: node generate-sfx.mjs
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SFX_DIR = path.join(__dirname, 'public', 'sfx');
fs.mkdirSync(SFX_DIR, { recursive: true });

function ffmpeg(cmd) {
  try {
    execSync(`ffmpeg -y ${cmd}`, { stdio: 'pipe' });
  } catch (e) {
    console.error('ffmpeg error:', e.stderr?.toString().slice(0, 300));
  }
}

console.log('🎵 Генерирую SFX через ffmpeg...\n');

// ── 1. Glitch Hit (cyberpunk impact) — 0.4 сек
// Белый шум + частотная огибающая → резкий цифровой удар
console.log('  [1/3] glitch_hit.mp3 — cyberpunk digital hit...');
ffmpeg(`
  -f lavfi -i "aevalsrc=
    sin(2*PI*80*t)*exp(-t*15)*0.8 +
    sin(2*PI*160*t)*exp(-t*20)*0.5 +
    (random(0)-0.5)*exp(-t*8)*0.4
    :s=44100:d=0.4"
  -af "
    equalizer=f=80:width_type=o:width=2:g=8,
    equalizer=f=4000:width_type=o:width=2:g=6,
    highpass=f=40,
    volume=2.5,
    afade=t=out:st=0.25:d=0.15
  "
  -ar 44100 -ab 192k "${SFX_DIR}/glitch_hit.mp3"
`.replace(/\n\s*/g, ' ').trim());
console.log('  ✅ glitch_hit.mp3');

// ── 2. Swipe Neon (slide transition whoosh) — 0.3 сек
// Sweep по частотам вверх + лёгкий noise
console.log('  [2/3] swipe_neon.mp3 — neon whoosh transition...');
ffmpeg(`
  -f lavfi -i "aevalsrc=
    sin(2*PI*(200 + 800*t/0.3)*t)*exp(-t*10)*0.7 +
    sin(2*PI*(400 + 1600*t/0.3)*t)*exp(-t*12)*0.35 +
    (random(1)-0.5)*exp(-t*6)*0.15
    :s=44100:d=0.3"
  -af "
    equalizer=f=1000:width_type=o:width=2:g=5,
    equalizer=f=5000:width_type=o:width=2:g=4,
    volume=2.0,
    afade=t=in:st=0:d=0.03,
    afade=t=out:st=0.2:d=0.1
  "
  -ar 44100 -ab 192k "${SFX_DIR}/swipe_neon.mp3"
`.replace(/\n\s*/g, ' ').trim());
console.log('  ✅ swipe_neon.mp3');

// ── 3. Riser Cyber (ambient intro build) — 2 сек
// Нарастающий субнч + высокочастотный свип + атмосфера
console.log('  [3/3] riser_cyber.mp3 — cyberpunk intro riser...');
ffmpeg(`
  -f lavfi -i "aevalsrc=
    sin(2*PI*(30 + 50*t/2)*t)*t/2*0.5 +
    sin(2*PI*(60 + 200*t/2)*t)*(t/2)*0.35 +
    sin(2*PI*(1000 + 3000*t/2)*t)*exp(-t)*0.2 +
    (random(2)-0.5)*(t/2)*0.08
    :s=44100:d=2.0"
  -af "
    equalizer=f=50:width_type=o:width=2:g=6,
    equalizer=f=2000:width_type=o:width=2:g=4,
    highpass=f=30,
    volume=1.8,
    afade=t=in:st=0:d=0.5,
    afade=t=out:st=1.6:d=0.4
  "
  -ar 44100 -ab 192k "${SFX_DIR}/riser_cyber.mp3"
`.replace(/\n\s*/g, ' ').trim());
console.log('  ✅ riser_cyber.mp3');

console.log('\n═'.repeat(45));
console.log('  ✅ Все SFX готовы в public/sfx/');
console.log('  Используются автоматически при рендере');
console.log('═'.repeat(45));
