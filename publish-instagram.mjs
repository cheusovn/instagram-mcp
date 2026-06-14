#!/usr/bin/env node
/**
 * Instagram Auto-Publisher
 *
 * Публикует видео-карусель в Instagram Business через Graph API.
 *
 * Требования:
 *   - Instagram Business / Creator аккаунт
 *   - Facebook Page, связанная с аккаунтом
 *   - INSTAGRAM_USER_ID   — числовой ID Instagram-аккаунта
 *   - INSTAGRAM_TOKEN     — долгосрочный Page Access Token
 *   - VIDEO_URL           — публичный HTTPS URL mp4 (или передаётся через --video)
 *
 * Использование:
 *   node publish-instagram.mjs --post content/posts/post_01.json --video https://...
 *   INSTAGRAM_TOKEN=xxx node publish-instagram.mjs --post content/posts/post_01.json --video https://...
 */

import fs from 'fs';
import https from 'https';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Config ──────────────────────────────────────────────────────────────────
const IG_USER_ID = process.env.INSTAGRAM_USER_ID;
const ACCESS_TOKEN = process.env.INSTAGRAM_TOKEN;

const postFile = process.argv[process.argv.indexOf('--post') + 1];
const videoUrl = process.argv[process.argv.indexOf('--video') + 1]
  || process.env.VIDEO_URL;

if (!IG_USER_ID || !ACCESS_TOKEN) {
  console.error('❌ Нужны переменные: INSTAGRAM_USER_ID и INSTAGRAM_TOKEN');
  console.error('   Получи их: https://developers.facebook.com/docs/instagram-platform');
  process.exit(1);
}

if (!postFile || !fs.existsSync(postFile)) {
  console.error(`❌ Файл поста не найден: ${postFile}`);
  process.exit(1);
}

if (!videoUrl) {
  console.error('❌ Нужен публичный URL видео: --video https://...');
  process.exit(1);
}

const post = JSON.parse(fs.readFileSync(postFile, 'utf-8'));
const caption = `${post.caption}\n\n${post.hashtags.join(' ')}`;

// ── HTTP helper ──────────────────────────────────────────────────────────────
function apiRequest(url, method = 'POST', body = null) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const options = {
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method,
      headers: { 'Content-Type': 'application/json' },
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.error) reject(new Error(`API Error ${json.error.code}: ${json.error.message}`));
          else resolve(json);
        } catch { reject(new Error(`Parse error: ${data.slice(0, 200)}`)); }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── Step 1: Create media container ──────────────────────────────────────────
async function createContainer() {
  console.log('\n📦 Шаг 1/3 — Создаём медиа-контейнер...');
  const url = new URL(`https://graph.facebook.com/v21.0/${IG_USER_ID}/media`);
  url.searchParams.set('access_token', ACCESS_TOKEN);

  const result = await apiRequest(url.toString(), 'POST', {
    media_type: 'REELS',          // для видео используем REELS (поддерживает .mp4)
    video_url: videoUrl,
    caption,
    share_to_feed: true,          // публикуем в ленту + Reels
  });

  console.log(`  ✅ Container ID: ${result.id}`);
  return result.id;
}

// ── Step 2: Wait for processing ──────────────────────────────────────────────
async function waitForReady(containerId) {
  console.log('\n⏳ Шаг 2/3 — Ждём обработку видео на серверах Instagram...');
  const maxAttempts = 20;
  for (let i = 0; i < maxAttempts; i++) {
    await sleep(8000);
    const url = new URL(`https://graph.facebook.com/v21.0/${containerId}`);
    url.searchParams.set('fields', 'status_code,status');
    url.searchParams.set('access_token', ACCESS_TOKEN);
    const res = await apiRequest(url.toString(), 'GET');
    console.log(`  [${i + 1}/${maxAttempts}] Статус: ${res.status_code}`);
    if (res.status_code === 'FINISHED') return true;
    if (res.status_code === 'ERROR') throw new Error(`Instagram processing error: ${res.status}`);
  }
  throw new Error('Timeout: видео не обработалось за 160 секунд');
}

// ── Step 3: Publish ──────────────────────────────────────────────────────────
async function publish(containerId) {
  console.log('\n🚀 Шаг 3/3 — Публикуем в Instagram...');
  const url = new URL(`https://graph.facebook.com/v21.0/${IG_USER_ID}/media_publish`);
  url.searchParams.set('access_token', ACCESS_TOKEN);

  const result = await apiRequest(url.toString(), 'POST', {
    creation_id: containerId,
  });

  console.log(`  ✅ Опубликовано! Post ID: ${result.id}`);
  return result.id;
}

// ── MAIN ─────────────────────────────────────────────────────────────────────
console.log('═'.repeat(60));
console.log('  📱 INSTAGRAM AUTO-PUBLISHER');
console.log(`  Пост: ${postFile}`);
console.log(`  Видео: ${videoUrl.slice(0, 60)}...`);
console.log(`  Caption: ${caption.slice(0, 80)}...`);
console.log('═'.repeat(60));

try {
  const containerId = await createContainer();
  await waitForReady(containerId);
  const postId = await publish(containerId);

  // Сохраняем результат
  const logPath = path.join(__dirname, 'content', 'published.json');
  let log = [];
  if (fs.existsSync(logPath)) log = JSON.parse(fs.readFileSync(logPath, 'utf-8'));
  log.push({
    post_id: postId,
    post_file: postFile,
    video_url: videoUrl,
    published_at: new Date().toISOString(),
    caption_preview: caption.slice(0, 100),
  });
  fs.mkdirSync(path.dirname(logPath), { recursive: true });
  fs.writeFileSync(logPath, JSON.stringify(log, null, 2));

  console.log('\n═'.repeat(60));
  console.log('  ✅ ГОТОВО! Пост опубликован в Instagram');
  console.log(`  🔗 https://www.instagram.com/p/${postId}/`);
  console.log('═'.repeat(60));
} catch (err) {
  console.error('\n❌ Ошибка публикации:', err.message);
  process.exit(1);
}
