// const dotenv = require('dotenv');

// dotenv.config();

// function getEnv(name, required = true) {
//   const value = process.env[name];
//   if (required && !value) {
//     throw new Error(`缺少环境变量: ${name}`);
//   }
//   return value;
// }

// module.exports = {
//   tushareToken: getEnv('TUSHARE_TOKEN'),
//   deepseekApiKey: getEnv('DEEPSEEK_API_KEY'),
//   deepseekBaseUrl: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
//   deepseekModel: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
//   telegramBotToken: getEnv('TELEGRAM_BOT_TOKEN', false),
//   telegramAllowedBotId: process.env.TELEGRAM_ALLOWED_BOT_ID,
//   telegramAllowedBotUsername: process.env.TELEGRAM_ALLOWED_BOT_USERNAME
// };

module.exports = {
    tushareToken: "5cb81e2f3e7ffaaf33da77c4b451ea1466732846f79ac27dc86fd621",
    deepseekApiKey: "sk-1370abd114e8493caa1333369ce0ae82",
    deepseekBaseUrl: "https://api.deepseek.com",
    deepseekModel: "deepseek-chat",
    telegramBotToken: "8595166028:AAFM6aqqCmDVczA1RrqdaFhWvl-_UON-p4U",
    telegramAllowedBotId: "5908447022",
    telegramAllowedBotUsername: "@xj_get_rich_bot",
}
