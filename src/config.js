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
  deepseekBaseUrl: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
  deepseekModel: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
  telegramBotToken: getEnv('TELEGRAM_BOT_TOKEN', false)
};
