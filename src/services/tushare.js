const axios = require('axios');

const TUSHARE_API = 'https://api.tushare.pro';

function toRecord(fields, row) {
  return fields.reduce((acc, field, idx) => {
    acc[field] = row[idx];
    return acc;
  }, {});
}

class TushareService {
  constructor(token) {
    this.token = token;
    this.client = axios.create({
      baseURL: TUSHARE_API,
      timeout: 15000
    });
  }

  async call(apiName, params, fields = '') {
    const { data } = await this.client.post('', {
      api_name: apiName,
      token: this.token,
      params,
      fields
    });

    if (data.code !== 0) {
      throw new Error(`Tushare接口错误(${apiName}): ${data.msg || 'unknown error'}`);
    }

    const payload = data.data;
    if (!payload || !payload.items || payload.items.length === 0) {
      throw new Error(`Tushare接口无数据(${apiName})`);
    }

    return payload.items.map((item) => toRecord(payload.fields, item));
  }

  async getDailyBasic(tsCode, tradeDate) {
    const list = await this.call(
      'daily_basic',
      { ts_code: tsCode, trade_date: tradeDate },
      'ts_code,trade_date,turnover_rate,volume_ratio'
    );
    return list[0];
  }

  async getDailyPrice(tsCode, tradeDate) {
    const list = await this.call(
      'daily',
      { ts_code: tsCode, trade_date: tradeDate },
      'ts_code,trade_date,close,pct_chg'
    );
    return list[0];
  }

  async getTechnicalFactors(tsCode, tradeDate) {
    const list = await this.call(
      'stk_factor_pro',
      { ts_code: tsCode, start_date: tradeDate, end_date: tradeDate },
      'ts_code,trade_date,macd_dif,macd_dea,macd,rsi_6,kdj_k,kdj_d,kdj_j,bias1,bias2,bias3'
    );
    return list[0];
  }

  async getMaReference(tsCode, tradeDate) {
    const list = await this.call(
      'stk_factor',
      { ts_code: tsCode, start_date: tradeDate, end_date: tradeDate },
      'ts_code,trade_date,ma5,ma10,ma20'
    );
    return list[0];
  }

  async getRecentBarRange(tsCode, tradeDate) {
    const bars = await this.call(
      'daily',
      { ts_code: tsCode, end_date: tradeDate, limit: 20 },
      'trade_date,high,low'
    );

    const highs = bars.map((b) => Number(b.high));
    const lows = bars.map((b) => Number(b.low));

    return {
      keyPressure: Math.max(...highs),
      strongSupport: Math.min(...lows)
    };
  }

  async buildMarketSnapshot(tsCode, tradeDate) {
    const [daily, basic, tech, ma, range] = await Promise.all([
      this.getDailyPrice(tsCode, tradeDate),
      this.getDailyBasic(tsCode, tradeDate),
      this.getTechnicalFactors(tsCode, tradeDate),
      this.getMaReference(tsCode, tradeDate),
      this.getRecentBarRange(tsCode, tradeDate)
    ]);

    return {
      stock_code: tsCode,
      close: Number(daily.close),
      pct_chg: Number(daily.pct_chg),
      turnover_ratio: Number(basic.turnover_rate),
      volume_ratio: Number(basic.volume_ratio),
      ma_state: this.describeMaState(Number(daily.close), ma),
      bias: Number(tech.bias1 || tech.bias2 || tech.bias3 || 0),
      macd_signal: this.describeMacd(tech),
      rsi_signal: this.describeRsi(Number(tech.rsi_6)),
      kdj_signal: this.describeKdj(tech),
      key_pressure: range.keyPressure,
      strong_support: range.strongSupport
    };
  }

  describeMaState(close, ma) {
    const m5 = Number(ma.ma5 || 0);
    const m10 = Number(ma.ma10 || 0);
    const m20 = Number(ma.ma20 || 0);
    const flags = [];
    if (close >= m5) flags.push('站上MA5');
    if (close >= m10) flags.push('站上MA10');
    if (close >= m20) flags.push('站上MA20');
    return flags.length > 0 ? flags.join('/') : '跌破主要均线';
  }

  describeMacd(tech) {
    const dif = Number(tech.macd_dif || 0);
    const dea = Number(tech.macd_dea || 0);
    return dif >= dea ? 'MACD金叉' : 'MACD死叉';
  }

  describeRsi(rsi6) {
    if (rsi6 >= 70) return `RSI超买(${rsi6.toFixed(2)})`;
    if (rsi6 <= 30) return `RSI超卖(${rsi6.toFixed(2)})`;
    return `RSI中性(${rsi6.toFixed(2)})`;
  }

  describeKdj(tech) {
    const k = Number(tech.kdj_k || 0);
    const d = Number(tech.kdj_d || 0);
    return k >= d ? 'KDJ金叉' : 'KDJ死叉';
  }
}

module.exports = TushareService;
