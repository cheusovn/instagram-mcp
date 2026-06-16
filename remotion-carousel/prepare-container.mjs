#!/usr/bin/env node
/**
 * prepare-container.mjs
 * Загружает слайды на uguu.se → создаёт child containers → создаёт carousel container
 * НЕ публикует. Возвращает carousel container ID для очереди.
 *
 * Usage: node prepare-container.mjs <carousel-id>
 * Example: node prepare-container.mjs StyleC-01
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const m = line.match(/^([A-Z_]+)\s*=\s*(.+)$/);
    if (m) process.env[m[1]] = m[2].trim();
  }
}

const ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN;
const ACCOUNT_ID   = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
const API_VERSION  = process.env.INSTAGRAM_API_VERSION || 'v22.0';
const API_BASE     = `https://graph.facebook.com/${API_VERSION}`;

const carouselId = process.argv[2];
if (!carouselId) { console.error('Usage: node prepare-container.mjs <carousel-id>'); process.exit(1); }

const slidesDir = path.join(__dirname, '..', 'out', 'new-carousels', carouselId, 'slides');
if (!fs.existsSync(slidesDir)) { console.error('❌ Слайды не найдены: ' + slidesDir); process.exit(1); }

const captionPath = path.join(__dirname, `caption-${carouselId}.txt`);
const caption = fs.existsSync(captionPath) ? fs.readFileSync(captionPath, 'utf-8').trim() : carouselId + ' — @nikolay_cheusov\n\n#нейросети #ии2026';

const slideFiles = fs.readdirSync(slidesDir).filter(f => f.match(/^slide-\d+\.mp4$/)).sort().map(f => path.join(slidesDir, f));
console.log(`\n📦 Готовлю: ${carouselId} (${slideFiles.length} слайдов)\n`);

async function igPost(endpoint, body) {
  const params = new URLSearchParams({ ...body, access_token: ACCESS_TOKEN });
  const res = await fetch(`${API_BASE}/${endpoint}`, { method: 'POST', body: params });
  const json = await res.json();
  if (json.error) throw new Error(`Instagram API: ${json.error.message} (code ${json.error.code})`);
  return json;
}

async function igGet(endpoint, params) {
  const url = new URL(`${API_BASE}/${endpoint}`);
  url.searchParams.set('access_token', ACCESS_TOKEN);
  if (params) for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url.toString());
  const json = await res.json();
  if (json.error) throw new Error(`IG: ${json.error.message}`);
  return json;
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function waitForContainer(id) {
  for (let i = 0; i < 50; i++) {
    const data = await igGet(id, { fields: 'status_code' });
    const code = data.status_code;
    if (code === 'FINISHED') return;
    if (code === 'ERROR' || code === 'EXPIRED') throw new Error(`Container ${id}: ${code}`);
    process.stdout.write('.');
    await sleep(6000);
  }
  throw new Error(`Timeout ${id}`);
}

async function uploadToUguu(filePath) {
  const blob = new Blob([fs.readFileSync(filePath)], { type: 'video/mp4' });
  const form = new FormData();
  form.append('files[]', blob, path.basename(filePath));
  const res = await fetch('https://uguu.se/upload', { method: 'POST', body: form });
  if (!res.ok) throw new Error(`uguu.se HTTP ${res.status}`);
  const json = await res.json();
  if (!json.success) throw new Error('uguu.se: ' + JSON.stringify(json));
  return json.files[0].url;
}

// Шаг 1: Загрузка на uguu.se
console.log('☁️  Загружаю слайды на uguu.se...');
const urls = [];
for (let i = 0; i < slideFiles.length; i++) {
  process.stdout.write(`   [${i+1}/${slideFiles.length}] → `);
  const url = await uploadToUguu(slideFiles[i]);
  urls.push(url);
  console.log(url);
}

// Шаг 2: Создание child containers
console.log('\n📸 Создаю child containers...');
const childIds = [];
for (let i = 0; i < urls.length; i++) {
  process.stdout.write(`   [${i+1}/${urls.length}] → `);
  const resp = await igPost(`${ACCOUNT_ID}/media`, { is_carousel_item: 'true', video_url: urls[i], media_type: 'VIDEO' });
  childIds.push(resp.id);
  console.log(resp.id);
}

// Шаг 3: Ждём FINISHED
console.log('\n⏳ Жду обработки child containers...');
for (let i = 0; i < childIds.length; i++) {
  process.stdout.write(`   [${i+1}/${childIds.length}] ${childIds[i]} `);
  await waitForContainer(childIds[i]);
  console.log(' ✅');
}

// Шаг 4: Создание carousel container (БЕЗ публикации!)
console.log('\n🎠 Создаю carousel container...');
const carousel = await igPost(`${ACCOUNT_ID}/media`, { media_type: 'CAROUSEL', children: childIds.join(','), caption });
console.log(`   Container: ${carousel.id}`);

console.log('\n⏳ Жду FINISHED для carousel...');
process.stdout.write('   ');
await waitForContainer(carousel.id);
console.log(' ✅');

console.log(`\n✅ ГОТОВО! Carousel container ID: ${carousel.id}`);
console.log(`   Добавь в queue.json:`);
console.log(`   "id": "${carouselId}",`);
console.log(`   "carousel_container": "${carousel.id}",`);
console.log(`\n🚀 Публикация через Amvera/GitHub Actions в запланированное время.`);
