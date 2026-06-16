#!/usr/bin/env node
/**
 * publish-from-queue.mjs
 * Запускается GitHub Actions / Amvera каждые 5 минут
 * Публикует посты из queue.json по расписанию
 *
 * Логика: для каждого поста у нас уже есть готовый carousel_container (FINISHED)
 * Просто вызываем media_publish в нужное время.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env if exists (для локального запуска)
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const m = line.match(/^([A-Z_]+)\s*=\s*(.+)$/);
    if (m) process.env[m[1]] = m[2].trim();
  }
}

const ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN;
const ACCOUNT_ID   = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
const API_VERSION  = process.env.INSTAGRAM_API_VERSION || 'v21.0';
const API_BASE     = `https://graph.instagram.com/${API_VERSION}`;

if (!ACCESS_TOKEN || !ACCOUNT_ID) {
  console.error('❌ Нет INSTAGRAM_ACCESS_TOKEN или INSTAGRAM_BUSINESS_ACCOUNT_ID');
  process.exit(1);
}

// Окно публикации: публиковать если scheduled_utc в пределах ±10 мин от сейчас
const WINDOW_SECONDS = 600;

const QUEUE_PATH = path.join(__dirname, 'queue.json');
if (!fs.existsSync(QUEUE_PATH)) {
  console.log('📋 queue.json не найден');
  process.exit(0);
}

const queue = JSON.parse(fs.readFileSync(QUEUE_PATH, 'utf-8'));
const nowTs = Math.floor(Date.now() / 1000);

console.log(`⏰ Проверяю очередь (${new Date(nowTs * 1000).toISOString()})`);
console.log(`   Всего постов: ${queue.length}`);

const duePosts = queue.filter(p =>
  !p.published &&
  p.carousel_container &&
  p.carousel_container !== 'PENDING' &&
  p.scheduled_utc <= nowTs + WINDOW_SECONDS &&
  p.scheduled_utc >= nowTs - WINDOW_SECONDS
);

if (duePosts.length === 0) {
  queue.forEach(p => {
    if (p.published) {
      console.log(`   ✅ ${p.id}: ОПУБЛИКОВАН`);
    } else if (p.carousel_container === 'PENDING') {
      console.log(`   ⚠️  ${p.id}: PENDING (не готов)`);
    } else {
      const diffMin = Math.round((p.scheduled_utc - nowTs) / 60);
      console.log(`   ⏳ ${p.id}: через ${diffMin} мин (${p.scheduled_msk})`);
    }
  });
  console.log('\nНет постов для публикации прямо сейчас.');
  process.exit(0);
}

async function igPost(endpoint, body) {
  const params = new URLSearchParams({ ...body, access_token: ACCESS_TOKEN });
  const res = await fetch(`${API_BASE}/${endpoint}`, { method: 'POST', body: params });
  const json = await res.json();
  if (json.error) throw new Error(`Instagram API: ${json.error.message} (code ${json.error.code})`);
  return json;
}

let anyPublished = false;

for (const post of duePosts) {
  console.log(`\n🚀 Публикую: ${post.id} (${post.scheduled_msk})`);
  console.log(`   Container: ${post.carousel_container}`);

  try {
    const pub = await igPost(`${ACCOUNT_ID}/media_publish`, {
      creation_id: post.carousel_container,
    });

    console.log(`\n🎉 ОПУБЛИКОВАНО! Media ID: ${pub.id}`);
    console.log(`   https://www.instagram.com/nikolay_cheusov`);

    post.published = true;
    post.published_at = new Date().toISOString();
    post.media_id = pub.id;
    anyPublished = true;

  } catch (e) {
    console.error(`❌ Ошибка: ${e.message}`);
    post.last_error = e.message;
    post.last_error_at = new Date().toISOString();
  }
}

// Сохраняем обновлённый queue.json
fs.writeFileSync(QUEUE_PATH, JSON.stringify(queue, null, 2));
console.log('\n✅ queue.json обновлён');

if (!anyPublished) {
  process.exit(1); // Сигнализируем CI об ошибке
}
