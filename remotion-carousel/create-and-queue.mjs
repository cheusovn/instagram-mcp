#!/usr/bin/env node
/**
 * create-and-queue.mjs
 * Загружает слайды карусели в GitHub Releases → создаёт Instagram-контейнеры
 * → добавляет в queue.json с указанным временем.
 *
 * Использование:
 *   node create-and-queue.mjs StyleC-03 "09:35" "2026-06-17"
 *   node create-and-queue.mjs StyleA-04 "13:00" "2026-06-17"
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── .env ──────────────────────────────────────────────────────────────────────
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const m = line.match(/^([A-Z_]+)\s*=\s*(.+)$/);
    if (m) process.env[m[1]] = m[2].trim();
  }
}

const TOKEN     = process.env.INSTAGRAM_ACCESS_TOKEN;
const ACCOUNT   = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
const GH_TOKEN  = process.env.GITHUB_TOKEN;
const GH_REPO   = process.env.GITHUB_REPO || 'cheusovn/instagram-mcp';
const API_VER   = 'v21.0';
const API_BASE  = `https://graph.instagram.com/${API_VER}`;

if (!TOKEN || !ACCOUNT) {
  console.error('❌ Нужны: INSTAGRAM_ACCESS_TOKEN, INSTAGRAM_BUSINESS_ACCOUNT_ID');
  process.exit(1);
}

const carouselId = process.argv[2];
const timeArg    = process.argv[3] || '09:00';
const dateArg    = process.argv[4] || new Date().toISOString().slice(0,10);

if (!carouselId) {
  console.error('❌ Укажи ID карусели: node create-and-queue.mjs StyleC-03 "09:35" "2026-06-17"');
  process.exit(1);
}

const SLIDES_DIR = path.join(__dirname, '..', 'out', 'new-carousels', carouselId, 'slides');
if (!fs.existsSync(SLIDES_DIR)) {
  console.error(`❌ Папка не найдена: ${SLIDES_DIR}`);
  process.exit(1);
}

const slideFiles = fs.readdirSync(SLIDES_DIR)
  .filter(f => f.match(/^slide-\d+\.mp4$/))
  .sort()
  .map(f => path.join(SLIDES_DIR, f));

if (!slideFiles.length) {
  console.error('❌ Нет MP4 файлов в папке slides/');
  process.exit(1);
}

// Читаем JSON для caption
const jsonName = carouselId.replace(/^Style([A-C])-(\d+)$/, (_, l, n) => `style${l}-${n}`) + '.json';
const jsonPath = path.join(__dirname, 'src', 'data', jsonName);
let caption = '';
if (fs.existsSync(jsonPath)) {
  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  const first = data.slides?.[0];
  const topic = first?.headline || carouselId;
  caption = `${first?.emoji || '🤖'} ${topic}\n\n${first?.body || ''}\n\nЛистай карусель 👉\n\n#ИИ #нейросети #ИИ2026 #chatgpt #Microsoft`;
}

// Считаем scheduled_utc из даты и времени МСК
const [hh, mm] = timeArg.split(':').map(Number);
const [yyyy, mo, dd] = dateArg.split('-').map(Number);
const mskDate = new Date(Date.UTC(yyyy, mo-1, dd, hh-3, mm)); // МСК = UTC+3
const scheduled_utc = Math.floor(mskDate.getTime() / 1000);
const scheduled_msk = `${dateArg} ${timeArg} МСК`;

console.log(`\n🎬 Карусель:  ${carouselId}`);
console.log(`📅 Время:     ${scheduled_msk}`);
console.log(`🎞  Слайдов:   ${slideFiles.length}`);
console.log('');

// ── Helpers ───────────────────────────────────────────────────────────────────
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function httpsRequest(opts, body = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(opts, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(d) }); }
        catch { resolve({ status: res.statusCode, body: d }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

function igPost(endpoint, params) {
  const p = new URLSearchParams({ ...params, access_token: TOKEN });
  const data = p.toString();
  return httpsRequest({
    hostname: 'graph.instagram.com',
    path: `/${API_VER}/${endpoint}`,
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(data) },
  }, data).then(r => {
    if (r.body?.error) throw new Error(`IG API: ${r.body.error.message} (${r.body.error.code})`);
    return r.body;
  });
}

function igGet(id, fields) {
  const p = new URLSearchParams({ fields, access_token: TOKEN });
  return httpsRequest({
    hostname: 'graph.instagram.com',
    path: `/${API_VER}/${id}?${p}`,
    method: 'GET',
  }).then(r => r.body);
}

// ── uguu.se upload (FormData multipart, без авторизации) ─────────────────────
async function uploadToUguu(filePath, filename) {
  const buf = fs.readFileSync(filePath);
  const blob = new Blob([buf], { type: 'video/mp4' });
  const form = new FormData();
  form.append('files[]', blob, filename);
  const res = await fetch('https://uguu.se/upload', { method: 'POST', body: form });
  if (!res.ok) throw new Error(`uguu.se HTTP ${res.status}`);
  const j = await res.json();
  const url = j?.files?.[0]?.url || j?.[0]?.url;
  if (!url) throw new Error(`uguu.se no url: ${JSON.stringify(j).slice(0,200)}`);
  return url;
}

// ── MAIN ──────────────────────────────────────────────────────────────────────

// ШАГ 1: Загружаем слайды на transfer.sh
console.log('📦 ШАГ 1: Загружаю слайды на transfer.sh...');
const videoUrls = [];
for (let i = 0; i < slideFiles.length; i++) {
  const f = slideFiles[i];
  const filename = `${carouselId}-slide-${String(i+1).padStart(2,'0')}.mp4`;
  process.stdout.write(`  [${i+1}/${slideFiles.length}] ${path.basename(f)}... `);
  const url = await uploadToUguu(f, filename);
  videoUrls.push(url);
  console.log(url);
}

// ШАГ 2: Создаём контейнеры для каждого слайда
console.log('\n📱 ШАГ 2: Создаю видео-контейнеры Instagram...');
const childIds = [];
for (let i = 0; i < videoUrls.length; i++) {
  const url = videoUrls[i];
  const isLast = i === slideFiles.length - 1;
  process.stdout.write(`  [${i+1}/${videoUrls.length}] создаю контейнер... `);
  const container = await igPost(`${ACCOUNT}/media`, {
    media_type: 'VIDEO',
    video_url: url,
    is_carousel_item: 'true',
  });
  childIds.push(container.id);
  console.log(`ID: ${container.id}`);
}

// ШАГ 3: Ждём FINISHED статуса
console.log('\n⏳ ШАГ 3: Жду обработки видео на серверах Instagram...');
const startWait = Date.now();
const pendingIds = [...childIds];
while (pendingIds.length > 0 && (Date.now() - startWait) < 5 * 60 * 1000) {
  await sleep(15000);
  const remaining = [];
  for (const id of pendingIds) {
    const status = await igGet(id, 'status_code,status');
    if (status.status_code === 'FINISHED') {
      process.stdout.write(`  ✅ ${id} FINISHED\n`);
    } else if (status.status_code === 'ERROR') {
      console.error(`  ❌ ${id} ERROR: ${status.status}`);
    } else {
      remaining.push(id);
      process.stdout.write(`  ⏳ ${id}: ${status.status_code}\r`);
    }
  }
  pendingIds.length = 0;
  pendingIds.push(...remaining);
}

if (pendingIds.length > 0) {
  console.warn(`\n⚠ ${pendingIds.length} контейнеров ещё не FINISHED, добавляю всё равно`);
}

// ШАГ 4: Создаём carousel container
console.log('\n🎠 ШАГ 4: Создаю carousel container...');
const carousel = await igPost(`${ACCOUNT}/media`, {
  media_type: 'CAROUSEL',
  children: childIds.join(','),
  caption,
});
console.log(`  ✅ Carousel container ID: ${carousel.id}`);

// ШАГ 5: Добавляем в queue.json
const QUEUE_PATH = path.join(__dirname, 'queue.json');
const queue = JSON.parse(fs.readFileSync(QUEUE_PATH, 'utf-8'));

// Проверяем нет ли уже
const existing = queue.find(p => p.id === carouselId);
if (existing) {
  existing.carousel_container = carousel.id;
  existing.scheduled_utc = scheduled_utc;
  existing.scheduled_msk = scheduled_msk;
  existing.published = false;
  delete existing.published_at;
  delete existing.media_id;
  console.log(`\n✏️  Обновлён существующий запись для ${carouselId}`);
} else {
  queue.push({
    id: carouselId,
    carousel_container: carousel.id,
    scheduled_utc,
    scheduled_msk,
    published: false,
  });
  console.log(`\n➕ Добавлен новый пост: ${carouselId}`);
}

fs.writeFileSync(QUEUE_PATH, JSON.stringify(queue, null, 2));
console.log(`✅ queue.json обновлён`);
console.log(`\n📋 Итог:`);
console.log(`   ID:          ${carouselId}`);
console.log(`   Container:   ${carousel.id}`);
console.log(`   Публикация:  ${scheduled_msk}`);
console.log(`\n⚠ Не забудь сделать git push чтобы Amvera подхватила queue.json!`);
