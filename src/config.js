const dotenv = require('dotenv');

dotenv.config();

function mustGetEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`缺少环境变量: ${name}`);
  }
  return value;
}

module.exports = {
  tushareToken: mustGetEnv('TUSHARE_TOKEN'),
  deepseekApiKey: mustGetEnv('DEEPSEEK_API_KEY'),
  deepseekBaseUrl: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
  deepseekModel: process.env.DEEPSEEK_MODEL || 'deepseek-chat'
};
