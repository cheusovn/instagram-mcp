/**
 * Multi-Agent Instagram Carousel Factory
 * 5 агентов → совет из 3 моделей → Remotion рендер
 *
 * Использование:
 *   node multi-agent-factory.js "тема карусели"
 *   node multi-agent-factory.js "тема" --render      → сразу рендерит видео
 *   node multi-agent-factory.js "тема" --publish     → рендерит + публикует Reel
 */

import fetch from 'node-fetch';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '.env') });

const OR_KEY = process.env.OPENROUTER_API_KEY;
const OR_URL = 'https://openrouter.ai/api/v1/chat/completions';
const HEADERS = {
  Authorization: `Bearer ${OR_KEY}`,
  'Content-Type': 'application/json',
  'HTTP-Referer': 'https://github.com/cheusovn/instagram-mcp',
  'X-Title': 'Instagram Multi-Agent Factory',
};

// ── Читаем системные промпты агентов ─────────────────────────────────────────
function loadAgent(filename) {
  return fs.readFileSync(join(__dirname, 'agents', filename), 'utf-8');
}

const AGENTS = {
  trendScout: loadAgent('01-trend-scout.md'),
  contentStrategist: loadAgent('02-content-strategist.md'),
  copywriter: loadAgent('03-copywriter.md'),
  designDirector: loadAgent('04-design-director.md'),
  councilJudge: loadAgent('05-council-judge.md'),
};

// ── LLM вызов ─────────────────────────────────────────────────────────────────
async function callModel(model, systemPrompt, userMessage, temperature = 0.85) {
  const res = await fetch(OR_URL, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: typeof userMessage === 'string' ? userMessage : JSON.stringify(userMessage, null, 2) },
      ],
      temperature,
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error(`[${model}]: ${JSON.stringify(data.error)}`);
  return data.choices[0].message.content;
}

function parseJSON(text) {
  const clean = text
    .replace(/^```json\s*/im, '').replace(/^```\s*/im, '').replace(/```\s*$/gm, '')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').trim();
  const start = clean.indexOf('{');
  const end = clean.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error(`Нет JSON в ответе: ${clean.slice(0, 200)}`);
  try {
    return JSON.parse(clean.slice(start, end + 1));
  } catch {
    return JSON.parse(clean.slice(start, end + 1).replace(/,\s*}/g, '}').replace(/,\s*]/g, ']'));
  }
}

function log(emoji, label, text = '') {
  console.log(`${emoji} ${label}${text ? ': ' + text : ''}`);
}

// ── STAGE 1: Trend Scout ──────────────────────────────────────────────────────
async function runTrendScout(topic) {
  log('🔍', 'Trend Scout', 'ищу актуальные тренды RU аудитории...');
  const prompt = `Тема карусели: "${topic}"

Сейчас ${new Date().toLocaleDateString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric' })}.

Найди что СЕЙЧАС актуально для российской аудитории в нише ИИ и нейросетей.
Верни JSON согласно формату в инструкции.`;

  const raw = await callModel('perplexity/sonar', AGENTS.trendScout, prompt);
  try { return parseJSON(raw); }
  catch {
    // Fallback если perplexity не вернул JSON
    return {
      hot_tools: ['Claude claude-sonnet-4-6', 'Sora', 'Midjourney v7'],
      hot_fears: ['потеряю работу', 'конкуренты обгонят', 'не успею разобраться'],
      hot_results: ['сэкономил 40 часов в месяц', 'автоматизировал 80% рутины'],
      hot_hashtags: ['#нейросети', '#ии', '#chatgpt', '#нейросетидляработы', '#aitools'],
      avoid: ['топ 10 нейросетей (баян)', 'ChatGPT изменит мир (заезжено)'],
      viral_format: 'карусель с конкретными цифрами + CTA-слово в комментарии',
      posting_time: '19:00-21:00 МСК',
      date_context: 'Активное развитие агентских ИИ, конкуренция Claude vs GPT-4o vs Gemini',
    };
  }
}

// ── STAGE 2: Content Strategist ───────────────────────────────────────────────
async function runContentStrategist(topic, trends) {
  log('🧠', 'Content Strategist', 'создаю психологическую структуру...');
  const prompt = `Тема: "${topic}"

Данные трендов:
${JSON.stringify(trends, null, 2)}

Разработай структуру карусели из 10 слайдов для @nikolay_cheusov.
Аудитория: русскоязычные 25-40 лет, интересуются ИИ и автоматизацией.
Верни JSON согласно формату в инструкции.`;

  return parseJSON(await callModel('google/gemini-2.5-flash-preview', AGENTS.contentStrategist, prompt));
}

// ── STAGE 3: Copywriter + Design Director (параллельно) ───────────────────────
async function runCopywriterAndDesign(topic, trends, strategy) {
  log('✍️ 🎨', 'Copywriter + Design Director', 'работают параллельно...');

  const copyPrompt = `Тема: "${topic}"

Стратегия:
${JSON.stringify(strategy, null, 2)}

Актуальные тренды: ${trends.hot_tools?.join(', ')}
Страхи аудитории: ${trends.hot_fears?.join(', ')}

Напиши тексты для 10 слайдов карусели @nikolay_cheusov.
Верни JSON согласно формату в инструкции.`;

  const designPrompt = `Тема: "${topic}"

Стратегия:
${JSON.stringify(strategy, null, 2)}

Выбери лучшую цветовую палитру и типографику для этой темы.
Учти: тема "${topic}" — какое настроение и цвет ей подходит?
Верни JSON согласно формату в инструкции.`;

  const [copyRaw, designRaw] = await Promise.all([
    callModel('anthropic/claude-sonnet-4-5', AGENTS.copywriter, copyPrompt),
    callModel('anthropic/claude-sonnet-4-5', AGENTS.designDirector, designPrompt),
  ]);

  return {
    copy: parseJSON(copyRaw),
    design: parseJSON(designRaw),
  };
}

// ── STAGE 4: LLM Council — 3 варианта + голосование + синтез ─────────────────
async function runCouncil(topic, trends, strategy, copy, design) {
  log('⚖️', 'LLM Council', 'генерируем 3 варианта карусели...');

  const context = `Тема: "${topic}"
Тренды: ${JSON.stringify(trends)}
Стратегия: ${JSON.stringify(strategy)}
Тексты от копирайтера: ${JSON.stringify(copy)}
Дизайн-решения: ${JSON.stringify(design)}`;

  const councilPrompt = (perspective) => `${context}

Твоя задача: создай ФИНАЛЬНЫЙ slides.json для карусели Instagram @nikolay_cheusov.
Перспектива: ${perspective}

ПАЛИТРА из Design Director: фон ${design?.palette?.bgColor || 'dark'}, акцент ${design?.palette?.accentColor || '#39FF14'}

Верни ТОЛЬКО JSON с массивом slides (10 слайдов) + caption + hashtags.
Каждый слайд: headline (макс 8 слов), body (макс 25 слов), emoji, bgColor, accentColor, isLast (только для слайда 10).
Все тексты НА РУССКОМ.`;

  // Параллельная генерация 3 версий
  const [vA, vB, vC] = await Promise.all([
    callModel('anthropic/claude-sonnet-4-5', AGENTS.councilJudge, councilPrompt('Фокус на ПСИХОЛОГИЧЕСКИХ крючках и страхах аудитории'), 0.9),
    callModel('google/gemini-2.5-flash-preview', AGENTS.councilJudge, councilPrompt('Фокус на АКТУАЛЬНОСТИ данных и конкретных цифрах'), 0.85),
    callModel('openai/gpt-4o-mini', AGENTS.councilJudge, councilPrompt('Фокус на СТРУКТУРЕ и ясности каждого слайда'), 0.8),
  ]);

  log('🗳️', 'Council Stage 2', 'анонимное голосование...');

  const votePrompt = `Три версии карусели на тему "${topic}":

=== ВЕРСИЯ A ===
${vA.slice(0, 2000)}

=== ВЕРСИЯ B ===
${vB.slice(0, 2000)}

=== ВЕРСИЯ C ===
${vC.slice(0, 2000)}

Оцени каждую версию по 5 критериям (1-10):
1. Стоп-скролл сила крючка (остановит палец?)
2. Вирусный потенциал (сохранят / перешлют?)
3. Соответствие психологии RU аудитории (звучит по-русски?)
4. Дизайнерская реализуемость (можно сделать красиво?)
5. Актуальность данных (не баяны?)

Укажи победителя. Верни JSON:
{
  "winner": "A",
  "scores": {"A": {...}, "B": {...}, "C": {...}},
  "best_hook_from": "A/B/C",
  "best_structure_from": "A/B/C",
  "synthesis_notes": "что взять из каждой версии"
}`;

  const voteRaw = await callModel('anthropic/claude-sonnet-4-5', '', votePrompt, 0.3);
  const vote = parseJSON(voteRaw);

  log('👑', 'Council Stage 3', `победитель: Версия ${vote.winner} → синтезирую финал...`);

  // Chairman синтезирует победителя
  const synthesisPrompt = `Создай финальный slides.json для карусели Instagram @nikolay_cheusov.

Тема: "${topic}"
Победившая версия: ${vote.winner}
Результаты голосования: ${JSON.stringify(vote.scores)}
Рекомендации: ${vote.synthesis_notes}

Версия ${vote.winner} (победитель):
${vote.winner === 'A' ? vA : vote.winner === 'B' ? vB : vC}

Дизайн: bgColor = ${design?.palette?.bgColor}, accentColor = ${design?.palette?.accentColor}

Верни ТОЛЬКО валидный JSON (без markdown):
{
  "slides": [...10 слайдов...],
  "caption": "полный caption",
  "hashtags": ["#хэштег"],
  "council_winner": "${vote.winner}",
  "predicted_reach": "X-Y тыс. просмотров"
}`;

  const finalRaw = await callModel('anthropic/claude-sonnet-4-5', AGENTS.councilJudge, synthesisPrompt, 0.7);
  const final = parseJSON(finalRaw);
  final._council_vote = vote;
  return final;
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2);
  const shouldRender = args.includes('--render') || args.includes('--publish');
  const shouldPublish = args.includes('--publish');
  const topic = args.filter(a => !a.startsWith('--'))[0]
    || 'Топ-10 нейросетей которые заменят целую команду в 2026';

  console.log('\n' + '═'.repeat(60));
  console.log('🚀 MULTI-AGENT INSTAGRAM FACTORY');
  console.log('📌 Тема:', topic);
  console.log('═'.repeat(60) + '\n');

  // Pipeline
  const trends = await runTrendScout(topic);
  log('✅', 'Тренды', `${trends.hot_tools?.length || 0} горячих инструментов, ${trends.hot_hashtags?.length || 0} хэштегов`);

  const strategy = await runContentStrategist(topic, trends);
  log('✅', 'Стратегия', `структура из ${strategy.slides_structure?.length || 10} слайдов`);

  const { copy, design } = await runCopywriterAndDesign(topic, trends, strategy);
  log('✅', 'Тексты готовы', `${copy.slides?.length || 10} слайдов`);
  log('✅', 'Дизайн выбран', `палитра: ${design?.palette?.name || 'dark'}, акцент: ${design?.palette?.accentColor || '#39FF14'}`);

  const result = await runCouncil(topic, trends, strategy, copy, design);
  log('✅', 'Council', `победитель ${result.council_winner}, прогноз: ${result.predicted_reach}`);

  // Сохраняем slides.json
  const slidesPath = join(__dirname, 'remotion-carousel', 'src', 'slides.json');
  const captionPath = join(__dirname, 'out', 'caption.txt');
  fs.mkdirSync(join(__dirname, 'out'), { recursive: true });
  fs.writeFileSync(slidesPath, JSON.stringify({ slides: result.slides }, null, 2), 'utf-8');
  fs.writeFileSync(captionPath, `${result.caption}\n\n${(result.hashtags || []).join(' ')}`, 'utf-8');

  console.log('\n' + '═'.repeat(60));
  console.log('✅ КОНТЕНТ ГОТОВ!');
  console.log(`📊 Слайдов: ${result.slides?.length}`);
  console.log(`🏆 Council Winner: Версия ${result.council_winner}`);
  console.log(`📈 Прогноз: ${result.predicted_reach}`);
  console.log(`💾 slides.json → ${slidesPath}`);
  console.log(`📝 caption.txt → ${captionPath}`);

  if (result.hashtags) {
    console.log(`\n🔥 Хэштеги: ${result.hashtags.join(' ')}`);
  }

  console.log('\n📋 CAPTION:');
  console.log(result.caption);

  if (shouldRender) {
    console.log('\n' + '═'.repeat(60));
    log('🎬', 'Remotion', 'запускаю рендер...');
    const { execSync } = await import('child_process');
    execSync(`node "${join(__dirname, 'remotion-carousel', 'render.mjs')}"`, { stdio: 'inherit' });
    console.log('✅ Видео: out/carousel.mp4');
  }

  if (shouldPublish) {
    // TODO: публикация через Instagram Graph API как Reel
    console.log('📤 Публикация Reel — будет добавлена в следующей версии');
  }

  console.log('═'.repeat(60) + '\n');
}

main().catch(err => {
  console.error('\n❌ ОШИБКА:', err.message);
  process.exit(1);
});
