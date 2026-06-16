/**
 * scheduler.mjs — запускается Amvera как постоянный процесс.
 * Каждые 5 минут проверяет очередь и публикует посты по расписанию.
 * queue.json читает и обновляет через GitHub API (без git).
 */

const INSTAGRAM_TOKEN  = process.env.INSTAGRAM_ACCESS_TOKEN;
const ACCOUNT_ID       = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
const GITHUB_TOKEN     = process.env.GITHUB_TOKEN;
const GITHUB_REPO      = process.env.GITHUB_REPO || 'cheusovn/instagram-mcp';
const QUEUE_PATH       = 'remotion-carousel/queue.json';
const API_BASE         = 'https://graph.instagram.com/v21.0';
const WINDOW_SEC       = 600; // ±10 минут

// ── GitHub API helpers ────────────────────────────────────────────────────────

async function ghGet(path) {
  const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${path}`, {
    headers: { Authorization: `token ${GITHUB_TOKEN}`, 'User-Agent': 'instagram-scheduler' },
  });
  if (!res.ok) throw new Error(`GitHub GET ${path}: ${res.status}`);
  return res.json();
}

async function ghPut(path, content, sha, message) {
  const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${path}`, {
    method: 'PUT',
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      'User-Agent': 'instagram-scheduler',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      content: Buffer.from(content).toString('base64'),
      sha,
    }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(`GitHub PUT: ${err.message}`);
  }
  return res.json();
}

// ── Instagram publish ─────────────────────────────────────────────────────────

// Проверяет, не опубликован ли контейнер уже (защита от дублей, если queue.json
// не успел обновиться). Возвращает status_code: PUBLISHED | IN_PROGRESS | ERROR | …
async function igContainerStatus(containerId) {
  const res = await fetch(`${API_BASE}/${containerId}?fields=status_code&access_token=${INSTAGRAM_TOKEN}`);
  const data = await res.json();
  if (data.error) throw new Error(`Instagram status: ${data.error.message}`);
  return data.status_code;
}

async function igPublish(containerId) {
  const params = new URLSearchParams({ creation_id: containerId, access_token: INSTAGRAM_TOKEN });
  const res = await fetch(`${API_BASE}/${ACCOUNT_ID}/media_publish`, { method: 'POST', body: params });
  const data = await res.json();
  if (data.error) throw new Error(`Instagram: ${data.error.message}`);
  return data.id;
}

// ── Основная проверка ─────────────────────────────────────────────────────────

async function checkAndPublish() {
  const msk = new Date(Date.now() + 3 * 3600 * 1000);
  const nowTs = Math.floor(Date.now() / 1000);
  console.log(`\n⏰ ${msk.toISOString().replace('T',' ').slice(0,16)} МСК — проверяю очередь...`);

  // Читаем queue.json из GitHub
  let file, queue;
  try {
    file  = await ghGet(QUEUE_PATH);
    queue = JSON.parse(Buffer.from(file.content, 'base64').toString());
  } catch (e) {
    console.error('❌ Не могу прочитать queue.json:', e.message);
    return;
  }

  const due = queue.filter(p =>
    !p.published &&
    p.carousel_container &&
    p.carousel_container !== 'PENDING' &&
    Math.abs(p.scheduled_utc - nowTs) <= WINDOW_SEC
  );

  if (due.length === 0) {
    const next = queue.filter(p => !p.published && p.scheduled_utc > nowTs)
      .sort((a, b) => a.scheduled_utc - b.scheduled_utc)[0];
    if (next) {
      const minLeft = Math.round((next.scheduled_utc - nowTs) / 60);
      console.log(`   Следующий: ${next.id} через ${minLeft} мин (${next.scheduled_msk})`);
    } else {
      console.log('   Очередь пуста.');
    }
    return;
  }

  let changed = false;
  for (const post of due) {
    console.log(`🚀 Публикую: ${post.id} (${post.scheduled_msk})`);
    try {
      // Идемпотентность: если контейнер уже опубликован (queue.json не успел
      // обновиться на прошлой проверке), не публикуем повторно — только фиксируем.
      const status = await igContainerStatus(post.carousel_container);
      if (status === 'PUBLISHED') {
        console.log(`↩️  ${post.id} уже опубликован в Instagram — помечаю в очереди без повтора`);
        post.published    = true;
        post.published_at = post.published_at || new Date().toISOString();
        post.already_published = true;
        changed = true;
        continue;
      }

      const mediaId = await igPublish(post.carousel_container);
      post.published    = true;
      post.published_at = new Date().toISOString();
      post.media_id     = mediaId;
      console.log(`✅ Опубликован! Media ID: ${mediaId}`);
      changed = true;
    } catch (e) {
      console.error(`❌ Ошибка: ${e.message}`);
      post.last_error    = e.message;
      post.last_error_at = new Date().toISOString();
      changed = true;
    }
  }

  if (changed) {
    try {
      await ghPut(
        QUEUE_PATH,
        JSON.stringify(queue, null, 2),
        file.sha,
        `auto: опубликован пост из очереди [skip ci]`
      );
      console.log('📝 queue.json обновлён в GitHub');
    } catch (e) {
      console.error('❌ Не могу сохранить queue.json:', e.message);
    }
  }
}

// ── Старт ─────────────────────────────────────────────────────────────────────

if (!INSTAGRAM_TOKEN || !ACCOUNT_ID || !GITHUB_TOKEN) {
  console.error('❌ Нужны переменные: INSTAGRAM_ACCESS_TOKEN, INSTAGRAM_BUSINESS_ACCOUNT_ID, GITHUB_TOKEN');
  process.exit(1);
}

console.log('🤖 Instagram Scheduler запущен');
console.log(`   Репо: ${GITHUB_REPO}`);
console.log(`   Окно публикации: ±${WINDOW_SEC / 60} мин`);

// Первый запуск сразу
checkAndPublish();

// Затем каждые 5 минут
setInterval(checkAndPublish, 5 * 60 * 1000);
