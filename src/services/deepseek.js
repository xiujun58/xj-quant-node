const axios = require('axios');

class DeepSeekService {
  constructor({ apiKey, baseUrl, model }) {
    this.model = model;
    this.client = axios.create({
      baseURL: baseUrl,
      timeout: 30000,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
  }

  async getDecision(prompt) {
    const { data } = await this.client.post('/chat/completions', {
      model: this.model,
      temperature: 0.3,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: '你是严格输出JSON的A股游资量化策略员。禁止输出任何JSON以外文本。'
        },
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const content = data?.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('DeepSeek返回为空');
    }

    try {
      return JSON.parse(content);
    } catch (err) {
      throw new Error(`DeepSeek输出非JSON: ${content}`);
    }
  }
}

module.exports = DeepSeekService;
