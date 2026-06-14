#!/usr/bin/env node
/**
 * 🚀 GO.MJS — Полный автопайплайн на твоём ПК с GPU
 *
 * Что делает:
 *   1. Рендерит 10 слайдов через Remotion с GPU
 *   2. Собирает carousel_full.mp4 через ffmpeg
 *   3. Загружает видео в GitHub Releases (получает публичный URL)
 *   4. Публикует в Instagram через Graph API
 *
 * Использование:
 *   node go.mjs                        # публикует post_01
 *   node go.mjs --post post_02         # другой пост
 *   node go.mjs --dry-run              # без публикации (только рендер)
 *
 * Переменные окружения (или создай файл .env):
 *   INSTAGRAM_ACCESS_TOKEN=...
 *   INSTAGRAM_BUSINESS_ACCOUNT_ID=...
 *   GITHUB_TOKEN=...   (Settings → Developer settings → Personal access tokens → repo scope)
 */

import { execSync, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── .env loader (простой, без зависимостей) ─────────────────────────────────
const envFile = path.join(__dirname, '.env');
if (fs.existsSync(envFile)) {
  fs.readFileSync(envFile, 'utf-8').split('\n').forEach(line => {
    const [k, ...v] = line.trim().split('=');
    if (k && !k.startsWith('#') && v.length) process.env[k] = v.join('=');
  });
}

// ── Args ─────────────────────────────────────────────────────────────────────
const postId      = process.argv[process.argv.indexOf('--post') + 1] || 'post_01';
const dryRun      = process.argv.includes('--dry-run');
const composition = process.env.COMPOSITION_ID || 'Style03_BrutalistNeon';

const IG_USER_ID    = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
const IG_TOKEN      = process.env.INSTAGRAM_ACCESS_TOKEN;
const GITHUB_TOKEN  = process.env.GITHUB_TOKEN;
const GITHUB_REPO   = 'cheusovn/instagram-mcp';

if (!dryRun && (!IG_USER_ID || !IG_TOKEN)) {
  console.error('❌ Нужны переменные: INSTAGRAM_BUSINESS_ACCOUNT_ID и INSTAGRAM_ACCESS_TOKEN');
  console.error('   Создай файл .env в корне проекта');
  process.exit(1);
}

const postFile = path.join(__dirname, 'content', 'posts', `${postId}.json`);
if (!fs.existsSync(postFile)) {
  console.error(`❌ Файл не найден: ${postFile}`);
  process.exit(1);
}

const post = JSON.parse(fs.readFileSync(postFile, 'utf-8'));
const OUT_VIDEO = path.join(__dirname, 'out', 'carousel_full.mp4');
const SLIDES_DIR = path.join(__dirname, 'out', 'slides');

// ── Helpers ──────────────────────────────────────────────────────────────────
function log(msg) { console.log(`\n${msg}`); }
function run(cmd, cwd = __dirname) {
  console.log(`  $ ${cmd}`);
  execSync(cmd, { cwd, stdio: 'inherit' });
}

function apiPost(url, body, extraHeaders = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const data = JSON.stringify(body);
    const req = https.request({
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data), ...extraHeaders },
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try {
          const j = JSON.parse(d);
          if (j.error) reject(new Error(`API ${j.error.code}: ${j.error.message}`));
          else resolve(j);
        } catch { reject(new Error(d.slice(0, 300))); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function apiGet(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    https.get({ hostname: parsed.hostname, path: parsed.pathname + parsed.search, headers }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch { reject(new Error(d.slice(0, 300))); } });
    }).on('error', reject);
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── STEP 1: Render ────────────────────────────────────────────────────────────
async function renderSlides() {
  log('═'.repeat(55));
  log('  🎬 ШАГ 1/4 — РЕНДЕР С GPU');
  log('═'.repeat(55));

  fs.mkdirSync(SLIDES_DIR, { recursive: true });
  fs.mkdirSync(path.join(__dirname, 'out'), { recursive: true });

  run('node render-slides.mjs --gpu --slides-only', path.join(__dirname, 'remotion-carousel'));

  log('  ✅ Слайды готовы:');
  fs.readdirSync(SLIDES_DIR).filter(f => f.endsWith('.mp4')).forEach(f =>
    console.log(`     ${f}`)
  );
}

// ── STEP 2: Assemble ──────────────────────────────────────────────────────────
async function assembleCarousel() {
  log('═'.repeat(55));
  log('  🔗 ШАГ 2/4 — СБОРКА CAROUSEL');
  log('═'.repeat(55));

  const slides = fs.readdirSync(SLIDES_DIR)
    .filter(f => f.match(/slide_\d+\.mp4$/))
    .sort()
    .map(f => path.join(SLIDES_DIR, f));

  if (!slides.length) throw new Error('Нет слайдов в out/slides/');

  const listPath = path.join(__dirname, 'out', '_concat.txt');
  fs.writeFileSync(listPath, slides.map(p => `file '${p}'`).join('\n'));

  try {
    run(`ffmpeg -y -f concat -safe 0 -i "${listPath}" -c copy "${OUT_VIDEO}"`);
  } catch {
    run(`ffmpeg -y -f concat -safe 0 -i "${listPath}" -c:v libx264 -preset fast -crf 18 -movflags +faststart "${OUT_VIDEO}"`);
  }

  fs.unlinkSync(listPath);
  const size = (fs.statSync(OUT_VIDEO).size / 1024 / 1024).toFixed(1);
  log(`  ✅ carousel_full.mp4 — ${size} MB`);
}

// ── STEP 3: Upload to GitHub Releases (публичный URL) ─────────────────────────
async function uploadToGitHub() {
  log('═'.repeat(55));
  log('  📦 ШАГ 3/4 — ЗАГРУЗКА В GITHUB RELEASES');
  log('═'.repeat(55));

  if (!GITHUB_TOKEN) {
    console.warn('  ⚠ GITHUB_TOKEN не задан — пропускаю загрузку');
    console.warn('    Загрузи видео вручную и запусти: node publish-instagram.mjs --post content/posts/' + postId + '.json --video <URL>');
    return null;
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const tag = `content-${postId}-${timestamp}`;
  const filename = `${postId}_${timestamp}.mp4`;

  // Создаём Release через API
  console.log('  Создаю GitHub Release...');
  const release = await apiPost(
    `https://api.github.com/repos/${GITHUB_REPO}/releases`,
    { tag_name: tag, name: `📱 ${postId} — ${new Date().toLocaleString('ru')}`, body: `Состав: ${composition}`, draft: false, prerelease: false },
    { Authorization: `token ${GITHUB_TOKEN}`, 'User-Agent': 'instagram-mcp' }
  );

  // Загружаем файл
  console.log(`  Загружаю ${filename}...`);
  const videoData = fs.readFileSync(OUT_VIDEO);
  const uploadUrl = `https://uploads.github.com/repos/${GITHUB_REPO}/releases/${release.id}/assets?name=${filename}`;

  const videoUrl = await new Promise((resolve, reject) => {
    const parsed = new URL(uploadUrl);
    const req = https.request({
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method: 'POST',
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        'Content-Type': 'video/mp4',
        'Content-Length': videoData.length,
        'User-Agent': 'instagram-mcp',
      },
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try {
          const j = JSON.parse(d);
          resolve(j.browser_download_url);
        } catch { reject(new Error(d.slice(0, 300))); }
      });
    });
    req.on('error', reject);
    req.write(videoData);
    req.end();
  });

  log(`  ✅ Видео загружено: ${videoUrl}`);
  return videoUrl;
}

// ── STEP 4: Publish to Instagram ──────────────────────────────────────────────
async function publishInstagram(videoUrl) {
  log('═'.repeat(55));
  log('  📱 ШАГ 4/4 — ПУБЛИКАЦИЯ В INSTAGRAM');
  log('═'.repeat(55));

  const caption = `${post.caption}\n\n${post.hashtags.join(' ')}`;

  // 4a. Создаём контейнер
  console.log('  Создаю медиа-контейнер...');
  const containerUrl = new URL(`https://graph.facebook.com/v21.0/${IG_USER_ID}/media`);
  containerUrl.searchParams.set('access_token', IG_TOKEN);

  const container = await apiPost(containerUrl.toString(), {
    media_type: 'REELS',
    video_url: videoUrl,
    caption,
    share_to_feed: true,
  });
  console.log(`  Container ID: ${container.id}`);

  // 4b. Ждём обработки
  console.log('  Ждём обработки на серверах Instagram...');
  for (let i = 0; i < 24; i++) {
    await sleep(10000);
    const statusUrl = new URL(`https://graph.facebook.com/v21.0/${container.id}`);
    statusUrl.searchParams.set('fields', 'status_code,status');
    statusUrl.searchParams.set('access_token', IG_TOKEN);
    const status = await apiGet(statusUrl.toString());
    process.stdout.write(`  [${i + 1}/24] ${status.status_code}\r`);
    if (status.status_code === 'FINISHED') { console.log(''); break; }
    if (status.status_code === 'ERROR') throw new Error(`Instagram processing error: ${status.status}`);
  }

  // 4c. Публикуем
  console.log('  Публикую...');
  const publishUrl = new URL(`https://graph.facebook.com/v21.0/${IG_USER_ID}/media_publish`);
  publishUrl.searchParams.set('access_token', IG_TOKEN);
  const result = await apiPost(publishUrl.toString(), { creation_id: container.id });

  // Лог
  const logPath = path.join(__dirname, 'content', 'published.json');
  const log2 = fs.existsSync(logPath) ? JSON.parse(fs.readFileSync(logPath)) : [];
  log2.push({ post_id: postId, instagram_post_id: result.id, published_at: new Date().toISOString(), video_url: videoUrl });
  fs.writeFileSync(logPath, JSON.stringify(log2, null, 2));

  log(`  ✅ ПОСТ ОПУБЛИКОВАН! ID: ${result.id}`);
  log(`  🔗 https://www.instagram.com/p/${result.id}/`);
  return result.id;
}

// ── MAIN ─────────────────────────────────────────────────────────────────────
console.log('');
console.log('╔' + '═'.repeat(53) + '╗');
console.log('║  🚀 GO — ПОЛНЫЙ АВТОПАЙПЛАЙН С GPU              ║');
console.log('║  Пост:       ' + postId.padEnd(39) + '║');
console.log('║  Composition: ' + composition.padEnd(38) + '║');
console.log('║  Dry run:    ' + String(dryRun).padEnd(39) + '║');
console.log('╚' + '═'.repeat(53) + '╝');

await renderSlides();
await assembleCarousel();

if (dryRun) {
  log('  🏁 DRY RUN — рендер завершён, публикация пропущена');
  log(`  Видео: out/carousel_full.mp4`);
  process.exit(0);
}

const videoUrl = await uploadToGitHub();
if (videoUrl) {
  await publishInstagram(videoUrl);
}

console.log('');
console.log('╔' + '═'.repeat(53) + '╗');
console.log('║  ✅ ВСЁ ГОТОВО! Пост опубликован в Instagram    ║');
console.log('║  @nikolay_cheusov                               ║');
console.log('╚' + '═'.repeat(53) + '╝');
console.log('');
