const dotenv = require('dotenv');

dotenv.config();

function getEnv (name, required = true) {
    const value = process.env[name];
    if (required && !value) {
        throw new Error(`缺少环境变量: ${name}`);
    }
    return value;
}

console.log(process.env)

module.exports = {
    tushareToken: process.env.TUSHARE_TOKEN,
    deepseekApiKey: process.env.DEEPSEEK_API_KEY,
    deepseekBaseUrl: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
    deepseekModel: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
    telegramBotToken: process.env.TELEGRAM_BOT_TOKEN,
    // telegramAllowedBotId: process.env.TELEGRAM_ALLOWED_BOT_ID,
    // telegramAllowedBotUsername: process.env.TELEGRAM_ALLOWED_BOT_USERNAME,
    telegramAllowedChatId: process.env.TELEGRAM_ALLOWED_CHAT_ID
};
