const axios = require('axios');

class TelegramService {
  constructor(botToken) {
    if (!botToken) {
      throw new Error('缺少 TELEGRAM_BOT_TOKEN，无法启动机器人模式');
    }

    this.client = axios.create({
      baseURL: `https://api.telegram.org/bot${botToken}`,
      timeout: 35000
    });
  }

  async getUpdates(offset) {
    const { data } = await this.client.get('/getUpdates', {
      params: {
        timeout: 30,
        offset,
        allowed_updates: ['message', 'channel_post']
      }
    });

    if (!data.ok) {
      throw new Error(`Telegram getUpdates 失败: ${data.description || 'unknown error'}`);
    }

    return data.result || [];
  }

  async sendMessage(chatId, text, replyToMessageId) {
    const payload = {
      chat_id: chatId,
      text
    };

    if (replyToMessageId) {
      payload.reply_to_message_id = replyToMessageId;
    }

    const { data } = await this.client.post('/sendMessage', payload);
    if (!data.ok) {
      throw new Error(`Telegram sendMessage 失败: ${data.description || 'unknown error'}`);
    }

    return data.result;
  }
}

module.exports = TelegramService;
