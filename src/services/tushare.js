const axios = require('axios');

const TUSHARE_API = 'https://api.tushare.pro';

function toRecord(fields, row) {
  return fields.reduce((acc, field, idx) => {
    acc[field] = row[idx];
    return acc;
  }, {});
}

function isPermissionDenied(message) {
  return /没有接口访问权限|权限/.test(String(message || ''));
}

function mean(values) {
  if (!values || values.length === 0) return null;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
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

  async getDailyBars(tsCode, tradeDate, limit = 30) {
    return this.call(
      'daily',
      { ts_code: tsCode, end_date: tradeDate, limit },
      'ts_code,trade_date,close,pct_chg,high,low,vol'
    );
  }

  async getDailyBasic(tsCode, tradeDate, dailyBars) {
    try {
      const list = await this.call(
        'daily_basic',
        { ts_code: tsCode, trade_date: tradeDate },
        'ts_code,trade_date,turnover_rate,volume_ratio'
      );
      return list[0];
    } catch (err) {
      if (!isPermissionDenied(err.message)) {
        throw err;
      }

      const volList = dailyBars.map((b) => Number(b.vol || 0)).filter((v) => Number.isFinite(v) && v > 0);
      const latestVol = Number(dailyBars[0]?.vol || 0);
      const avgVol = mean(volList.slice(1, 6));

      return {
        turnover_rate: null,
        volume_ratio: avgVol && latestVol ? latestVol / avgVol : null,
        _fallback: 'daily_basic_no_permission'
      };
    }
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
    try {
      const list = await this.call(
        'stk_factor_pro',
        { ts_code: tsCode, start_date: tradeDate, end_date: tradeDate },
        'ts_code,trade_date,macd_dif,macd_dea,macd,rsi_6,kdj_k,kdj_d,kdj_j,bias1,bias2,bias3'
      );
      return list[0];
    } catch (err) {
      if (!isPermissionDenied(err.message)) {
        throw err;
      }

      return {
        macd_dif: null,
        macd_dea: null,
        rsi_6: null,
        kdj_k: null,
        kdj_d: null,
        bias1: null,
        bias2: null,
        bias3: null,
        _fallback: 'stk_factor_pro_no_permission'
      };
    }
  }

  async getMaReference(tsCode, tradeDate, dailyBars) {
    try {
      const list = await this.call(
        'stk_factor',
        { ts_code: tsCode, start_date: tradeDate, end_date: tradeDate },
        'ts_code,trade_date,ma5,ma10,ma20'
      );
      return list[0];
    } catch (err) {
      if (!isPermissionDenied(err.message)) {
        throw err;
      }

      const closes = dailyBars.map((b) => Number(b.close || 0)).filter((v) => Number.isFinite(v) && v > 0);
      return {
        ma5: mean(closes.slice(0, 5)),
        ma10: mean(closes.slice(0, 10)),
        ma20: mean(closes.slice(0, 20)),
        _fallback: 'stk_factor_no_permission'
      };
    }
  }

  getRecentBarRange(dailyBars) {
    const highs = dailyBars.map((b) => Number(b.high || 0)).filter((v) => Number.isFinite(v) && v > 0);
    const lows = dailyBars.map((b) => Number(b.low || 0)).filter((v) => Number.isFinite(v) && v > 0);

    return {
      keyPressure: highs.length ? Math.max(...highs) : null,
      strongSupport: lows.length ? Math.min(...lows) : null
    };
  }

  async buildMarketSnapshot(tsCode, tradeDate) {
    const dailyBars = await this.getDailyBars(tsCode, tradeDate, 30);
    const daily = dailyBars[0] || (await this.getDailyPrice(tsCode, tradeDate));

    const [basic, tech, ma] = await Promise.all([
      this.getDailyBasic(tsCode, tradeDate, dailyBars),
      this.getTechnicalFactors(tsCode, tradeDate),
      this.getMaReference(tsCode, tradeDate, dailyBars)
    ]);

    const range = this.getRecentBarRange(dailyBars.slice(0, 20));

    return {
      stock_code: tsCode,
      close: Number(daily.close),
      pct_chg: Number(daily.pct_chg),
      turnover_ratio: this.toNumberOrNull(basic.turnover_rate),
      volume_ratio: this.toNumberOrNull(basic.volume_ratio),
      ma_state: this.describeMaState(Number(daily.close), ma),
      bias: this.toNumberOrNull(tech.bias1 || tech.bias2 || tech.bias3),
      macd_signal: this.describeMacd(tech),
      rsi_signal: this.describeRsi(this.toNumberOrNull(tech.rsi_6)),
      kdj_signal: this.describeKdj(tech),
      key_pressure: range.keyPressure,
      strong_support: range.strongSupport
    };
  }

  toNumberOrNull(value) {
    if (value === null || value === undefined || value === '') return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }

  describeMaState(close, ma) {
    const m5 = this.toNumberOrNull(ma.ma5);
    const m10 = this.toNumberOrNull(ma.ma10);
    const m20 = this.toNumberOrNull(ma.ma20);
    const flags = [];

    if (m5 !== null && close >= m5) flags.push('站上MA5');
    if (m10 !== null && close >= m10) flags.push('站上MA10');
    if (m20 !== null && close >= m20) flags.push('站上MA20');

    return flags.length > 0 ? flags.join('/') : '均线数据有限，建议谨慎';
  }

  describeMacd(tech) {
    const dif = this.toNumberOrNull(tech.macd_dif);
    const dea = this.toNumberOrNull(tech.macd_dea);
    if (dif === null || dea === null) return 'MACD数据不足';
    return dif >= dea ? 'MACD金叉' : 'MACD死叉';
  }

  describeRsi(rsi6) {
    if (rsi6 === null) return 'RSI数据不足';
    if (rsi6 >= 70) return `RSI超买(${rsi6.toFixed(2)})`;
    if (rsi6 <= 30) return `RSI超卖(${rsi6.toFixed(2)})`;
    return `RSI中性(${rsi6.toFixed(2)})`;
  }

  describeKdj(tech) {
    const k = this.toNumberOrNull(tech.kdj_k);
    const d = this.toNumberOrNull(tech.kdj_d);
    if (k === null || d === null) return 'KDJ数据不足';
    return k >= d ? 'KDJ金叉' : 'KDJ死叉';
  }
}

module.exports = TushareService;
