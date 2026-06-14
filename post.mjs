#!/usr/bin/env node
/**
 * post.mjs — одна кнопка для публикации в Instagram
 * Использование:
 *   node post.mjs             — авто-определяет следующий пост по расписанию
 *   node post.mjs --post post_02   — конкретный пост
 *   node post.mjs --list       — показать статус всех постов
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Конфиг ──────────────────────────────────────────────────────────────
const REPO = 'cheusovn/instagram-mcp';
const WORKFLOW_FILE = 'render-and-publish.yml';
const COMPOSITION = 'Style03_BrutalistNeon';
const BRANCH = 'main';

// Расписание постов (Москва)
const SCHEDULE = [
  { post: 'post_01', day: 1, hour: 9,  title: '10 нейросетей заменяют команду' },
  { post: 'post_02', day: 1, hour: 14, title: 'Зарабатываю 200к, работаю 3 часа' },
  { post: 'post_03', day: 1, hour: 20, title: 'ChatGPT не заменит тебя — заменит тот кто умеет' },
  { post: 'post_04', day: 2, hour: 9,  title: '5 способов заработать на ИИ прямо сейчас' },
  { post: 'post_05', day: 2, hour: 14, title: 'Кейс: фрилансер 20к → 120к за месяц через ChatGPT' },
  { post: 'post_06', day: 2, hour: 20, title: 'Промпт который экономит мне 4 часа каждый день' },
  { post: 'post_07', day: 3, hour: 9,  title: 'Мой ИИ-стек 2026: 7 инструментов каждый день' },
  { post: 'post_08', day: 3, hour: 14, title: 'Midjourney vs Flux vs Sora: что выбрать для заработка' },
  { post: 'post_09', day: 3, hour: 20, title: 'Как я сделал контент на неделю за 40 минут с ИИ' },
];

// ── Читаем опубликованные посты ──────────────────────────────────────────
function getPublished() {
  const publishedPath = path.join(__dirname, 'content', 'published.json');
  if (!fs.existsSync(publishedPath)) return [];
  try {
    return JSON.parse(fs.readFileSync(publishedPath, 'utf8'));
  } catch {
    return [];
  }
}

// ── Определяем следующий пост ────────────────────────────────────────────
function getNextPost() {
  const published = getPublished();
  const publishedIds = published.map(p => p.post_id);
  return SCHEDULE.find(s => !publishedIds.includes(s.post));
}

// ── Запускаем GitHub Actions через gh CLI ────────────────────────────────
function triggerWorkflow(postId) {
  const cmd = [
    'gh', 'workflow', 'run', WORKFLOW_FILE,
    '--repo', REPO,
    '--ref', BRANCH,
    '--field', `post_id=${postId}`,
    '--field', `composition=${COMPOSITION}`,
  ].join(' ');

  console.log(`\n▶ Запускаю: ${cmd}\n`);
  execSync(cmd, { stdio: 'inherit' });
}

// ── Ждём результат workflow ──────────────────────────────────────────────
async function waitForRun(postId) {
  console.log('\n⏳ Жду запуска workflow...');
  await sleep(8000);

  // Получаем последний запуск
  const runsJson = execSync(
    `gh run list --repo ${REPO} --workflow ${WORKFLOW_FILE} --limit 1 --json databaseId,status,conclusion,createdAt`,
    { encoding: 'utf8' }
  );
  const runs = JSON.parse(runsJson);
  if (!runs.length) { console.log('Не нашёл запуск'); return; }

  const run = runs[0];
  const runId = run.databaseId;
  console.log(`\n🔗 Run ID: ${runId}`);
  console.log(`   Прямая ссылка: https://github.com/${REPO}/actions/runs/${runId}`);
  console.log('\n📊 Слежу за прогрессом (обновление каждые 30 сек)...');
  console.log('   Ожидаемое время рендера: 15-30 минут');
  console.log('   Нажми Ctrl+C чтобы перестать ждать (workflow продолжится)\n');

  // Polling пока не завершится
  let dots = 0;
  while (true) {
    await sleep(30000);
    const statusJson = execSync(
      `gh run view ${runId} --repo ${REPO} --json status,conclusion`,
      { encoding: 'utf8' }
    );
    const { status, conclusion } = JSON.parse(statusJson);

    process.stdout.write(`\r   [${new Date().toLocaleTimeString('ru')}] ${status}${'.'.repeat(++dots % 4)}   `);

    if (status === 'completed') {
      console.log(`\n`);
      if (conclusion === 'success') {
        console.log('╔══════════════════════════════════════════╗');
        console.log('║  ✅ ПОСТ ОПУБЛИКОВАН В INSTAGRAM!        ║');
        console.log(`║  Пост: ${postId.padEnd(34)}║`);
        console.log('║  @nikolay_cheusov                        ║');
        console.log('╚══════════════════════════════════════════╝');
      } else {
        console.log('╔══════════════════════════════════════════╗');
        console.log(`║  ❌ ОШИБКА: ${String(conclusion).padEnd(29)}║`);
        console.log(`║  https://github.com/${REPO}/actions/runs/${runId}`);
        console.log('╚══════════════════════════════════════════╝');
        process.exit(1);
      }
      break;
    }
  }
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ── Список всех постов ───────────────────────────────────────────────────
function listPosts() {
  const published = getPublished();
  const publishedIds = new Set(published.map(p => p.post_id));

  console.log('\n📋 ПЛАН ПУБЛИКАЦИЙ — @nikolay_cheusov');
  console.log('═'.repeat(60));

  let currentDay = 0;
  for (const s of SCHEDULE) {
    if (s.day !== currentDay) {
      currentDay = s.day;
      console.log(`\n  ДЕНЬ ${s.day}`);
    }
    const status = publishedIds.has(s.post) ? '✅' : '⬜';
    const time = `${String(s.hour).padStart(2,'0')}:00`;
    console.log(`  ${status} ${time}  ${s.post}  ${s.title}`);
  }
  console.log('');
}

// ── Main ─────────────────────────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--list')) {
    listPosts();
    return;
  }

  // Определяем какой пост публиковать
  let postId;
  const postArg = args.find(a => a.startsWith('--post'));
  if (postArg) {
    postId = postArg.includes('=') ? postArg.split('=')[1] : args[args.indexOf(postArg) + 1];
  } else {
    const next = getNextPost();
    if (!next) {
      console.log('\n🎉 Все 9 постов уже опубликованы! Миссия выполнена.');
      listPosts();
      return;
    }
    postId = next.post;
    console.log(`\n🎯 Следующий по расписанию: ${postId}`);
    console.log(`   Тема: ${next.title}`);
  }

  // Проверяем что контент существует
  const contentPath = path.join(__dirname, 'content', 'posts', `${postId}.json`);
  if (!fs.existsSync(contentPath)) {
    console.error(`\n❌ Файл контента не найден: ${contentPath}`);
    console.error('   Сначала создай контент для этого поста.');
    process.exit(1);
  }

  console.log(`\n🚀 Публикую ${postId} (${COMPOSITION})...`);
  listPosts();

  // Проверяем gh CLI
  try {
    execSync('gh --version', { stdio: 'pipe' });
  } catch {
    console.error('\n❌ gh CLI не установлен. Установи: https://cli.github.com/');
    console.error('   После установки: gh auth login');
    process.exit(1);
  }

  triggerWorkflow(postId);
  await waitForRun(postId);
}

main().catch(e => {
  console.error('\n❌ Ошибка:', e.message);
  process.exit(1);
});
