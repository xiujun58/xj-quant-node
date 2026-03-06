const config = require('./config');
const TushareService = require('./services/tushare');
const DeepSeekService = require('./services/deepseek');
const TelegramService = require('./services/telegram');
const { buildPrompt } = require('./prompt/template');

function normalizeTsCode(raw) {
  const text = String(raw || '').trim().toUpperCase();
  if (/^\d{6}\.(SZ|SH)$/.test(text)) return text;
  if (/^\d{6}$/.test(text)) {
    if (text.startsWith('6') || text.startsWith('9')) return `${text}.SH`;
    return `${text}.SZ`;
  }
  throw new Error('股票代码格式无效，请发送如 000001.SZ 或 000001');
}

function todayAsTradeDate() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}${mm}${dd}`;
}

function parseMessage(text) {
  const parts = String(text || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    throw new Error('请发送股票代码，例如：000001.SZ 或 000001.SZ 20250221');
  }

  const tsCode = normalizeTsCode(parts[0]);
  const tradeDate = parts[1] && /^\d{8}$/.test(parts[1]) ? parts[1] : todayAsTradeDate();
  return { tsCode, tradeDate };
}


function isAllowedSender(message) {
  const from = message.from || {};
  const allowId = config.telegramAllowedBotId;
  const allowUsername = (config.telegramAllowedBotUsername || '').replace('@', '').toLowerCase();

  if (!allowId && !allowUsername) {
    return true;
  }

  if (!from.is_bot) {
    return false;
  }

  if (allowId && String(from.id) !== String(allowId)) {
    return false;
  }

  if (allowUsername) {
    const senderUsername = String(from.username || '').toLowerCase();
    if (senderUsername !== allowUsername) {
      return false;
    }
  }

  return true;
}

function parseArgs() {
  const args = process.argv.slice(2);
  const payload = { mode: 'cli', tsCode: '', tradeDate: '' };

  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--mode') payload.mode = args[i + 1];
    if (args[i] === '--ts-code') payload.tsCode = args[i + 1];
    if (args[i] === '--trade-date') payload.tradeDate = args[i + 1];
  }

  return payload;
}

async function runDecision({ tsCode, tradeDate, tushare, deepseek }) {
  const snapshot = await tushare.buildMarketSnapshot(tsCode, tradeDate);
  const prompt = buildPrompt(snapshot);
  return deepseek.getDecision(prompt);
}

async function runCli({ tsCode, tradeDate }, services) {
  if (!tsCode || !tradeDate) {
    throw new Error('CLI用法: npm start -- --mode cli --ts-code 000001.SZ --trade-date 20250221');
  }

  const decision = await runDecision({ tsCode: normalizeTsCode(tsCode), tradeDate, ...services });
  process.stdout.write(`${JSON.stringify(decision, null, 2)}\n`);
}

async function runBot(services) {
  const telegram = new TelegramService(config.telegramBotToken);

  if (!config.telegramAllowedBotId && !config.telegramAllowedBotUsername) {
    throw new Error('bot模式要求设置 TELEGRAM_ALLOWED_BOT_ID 或 TELEGRAM_ALLOWED_BOT_USERNAME');
  }

  let offset = 0;

  process.stdout.write('[BOT] Telegram机器人已启动，等待消息...\n');

  while (true) {
    try {
      const updates = await telegram.getUpdates(offset);

      for (const update of updates) {
        offset = update.update_id + 1;
        const message = update.message;
        if (!message || !message.text) continue;

        const chatId = message.chat.id;
        const msgId = message.message_id;

        if (!isAllowedSender(message)) {
          continue;
        }

        try {
          const { tsCode, tradeDate } = parseMessage(message.text);
          await telegram.sendMessage(chatId, `收到请求：${tsCode} ${tradeDate}，正在分析...`, msgId);

          const decision = await runDecision({ tsCode, tradeDate, ...services });
          await telegram.sendMessage(chatId, JSON.stringify(decision, null, 2), msgId);
        } catch (err) {
          await telegram.sendMessage(chatId, `处理失败：${err.message}`, msgId);
        }
      }
    } catch (pollErr) {
      process.stderr.write(`[BOT] 轮询异常: ${pollErr.message}\n`);
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
  }
}

async function main() {
  const args = parseArgs();
  const tushare = new TushareService(config.tushareToken);
  const deepseek = new DeepSeekService({
    apiKey: config.deepseekApiKey,
    baseUrl: config.deepseekBaseUrl,
    model: config.deepseekModel
  });

  // if (args.mode === 'bot') {
    await runBot({ tushare, deepseek });
    return;
  // }

  await runCli(args, { tushare, deepseek });
}

main().catch((err) => {
  console.error(`[ERROR] ${err.message}`);
  process.exit(1);
});
