const config = require('./config');
const TushareService = require('./services/tushare');
const DeepSeekService = require('./services/deepseek');
const { buildPrompt } = require('./prompt/template');

function parseArgs() {
  const args = process.argv.slice(2);
  const payload = { tsCode: '', tradeDate: '' };

  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--ts-code') payload.tsCode = args[i + 1];
    if (args[i] === '--trade-date') payload.tradeDate = args[i + 1];
  }

  if (!payload.tsCode || !payload.tradeDate) {
    throw new Error('用法: npm start -- --ts-code 000001.SZ --trade-date 20250221');
  }

  return payload;
}

async function main() {
  const { tsCode, tradeDate } = parseArgs();

  const tushare = new TushareService(config.tushareToken);
  const deepseek = new DeepSeekService({
    apiKey: config.deepseekApiKey,
    baseUrl: config.deepseekBaseUrl,
    model: config.deepseekModel
  });

  const snapshot = await tushare.buildMarketSnapshot(tsCode, tradeDate);
  const prompt = buildPrompt(snapshot);
  const decision = await deepseek.getDecision(prompt);

  process.stdout.write(`${JSON.stringify(decision, null, 2)}\n`);
}

main().catch((err) => {
  console.error(`[ERROR] ${err.message}`);
  process.exit(1);
});
