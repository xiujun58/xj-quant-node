const dotenv = require('dotenv');

dotenv.config();

function getEnv(name, required = true) {
  const value = process.env[name];
  if (required && !value) {
    throw new Error(`缺少环境变量: ${name}`);
  }
  return value;
}

module.exports = {
    tushareToken: getEnv('TUSHARE_TOKEN'),
    deepseekApiKey: getEnv('DEEPSEEK_API_KEY'),
    deepseekBaseUrl: getEnv('DEEPSEEK_BASE_URL'),
    deepseekModel: getEnv('DEEPSEEK_MODEL'),
    telegramBotToken: getEnv('TELEGRAM_BOT_TOKEN', false),
    telegramAllowedBotId: getEnv('TELEGRAM_ALLOWED_BOT_ID'),
    telegramAllowedBotUsername: getEnv('TELEGRAM_ALLOWED_BOT_USERNAME'),
};


