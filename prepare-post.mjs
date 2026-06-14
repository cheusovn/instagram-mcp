#!/usr/bin/env node
/**
 * Подготавливает слайды для рендера: копирует slides из content/posts/POST_ID.json
 * в remotion-carousel/src/slides.json
 * Запуск: node prepare-post.mjs post_02
 */

import fs from 'fs';

const postId = process.argv[2];
if (!postId) {
  console.error('Usage: node prepare-post.mjs post_02');
  process.exit(1);
}

const postFile = `content/posts/${postId}.json`;
if (!fs.existsSync(postFile)) {
  console.error(`❌ Файл не найден: ${postFile}`);
  process.exit(1);
}

const post = JSON.parse(fs.readFileSync(postFile, 'utf8'));

if (!post.slides || !Array.isArray(post.slides)) {
  console.error(`❌ В ${postFile} нет поля slides[]`);
  process.exit(1);
}

// Дополняем цвета если не указаны (Style03 BrutalistNeon defaults)
const slides = post.slides.map((s, i) => ({
  bgColor: '#000',
  accentColor: '#CCFF00',
  ...s,
}));

fs.writeFileSync(
  'remotion-carousel/src/slides.json',
  JSON.stringify({ slides }, null, 2),
  'utf8'
);

console.log(`✅ slides.json обновлён для ${postId} (${slides.length} слайдов)`);
slides.forEach((s, i) => console.log(`  [${i+1}] ${s.headline}`));
