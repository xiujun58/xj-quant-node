function fmtPrice(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return 'N/A';
  return Number(value).toFixed(2);
}

function fmtPct(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return 'N/A';
  return Number(value).toFixed(2);
}

function buildPrompt(snapshot) {
  return `# Role: A股顶级游资量化策略员 (专攻 10万->100万 复合增长)
# Strategy Philosophy: 
- 核心逻辑：专注“强趋势龙头”与“量价共振突破”。利用 A 股 T+1 特性，强调早盘确认性与尾盘确定性。
- 风险偏好：激进型。单票重仓，止损果断，追求复利断层式增长。
- 交易标的：${snapshot.stock_code}

# Market Context: 实时行情快照
- 价格行为：收盘价 ${fmtPrice(snapshot.close)} | 涨跌幅 ${fmtPct(snapshot.pct_chg)}%
- 活跃度：换手率 ${fmtPct(snapshot.turnover_ratio)}% | 量比 ${fmtPct(snapshot.volume_ratio)}
- 均线支撑：${snapshot.ma_state} | 乖离率 ${fmtPct(snapshot.bias)}%
- 技术指标：MACD ${snapshot.macd_signal} | RSI ${snapshot.rsi_signal} | KDJ ${snapshot.kdj_signal}
- 关键压力位：${fmtPrice(snapshot.key_pressure)} | 关键支撑位：${fmtPrice(snapshot.strong_support)}

# Task: 执行【A股主升浪】交易决策指令，并严格按照以下JSON格式输出决策结果。

## 分析思维链（请按以下步骤逐步推理，但最终只输出JSON）：
1. **市场情绪与地位判别**：
   - 板块效应：该股是否属于当前核心领涨板块？板块内是否有其他个股共振？
   - 多空博弈阶段：根据量价形态判断是“缩量回调确认”、“高位放量分歧”还是“平台放量突破”？
   - 压力支撑：上方压力位${fmtPrice(snapshot.key_pressure)}，下方支撑位${fmtPrice(snapshot.strong_support)}，当前价格距离哪个更近？

2. **盘中执行计划**：
   - 根据以上判断，选择最适合的操作类型：竞价抢筹、分时回踩买入、突破追涨、减仓观望。
   - 给出具体的买入/卖出价格区间（精确到分）。
   - 确定仓位比例：在强势市场必须≥60%，弱势市场必须空仓（0%）。

3. **T+1动态仓位管理**：
   - 次日加仓条件：例如跳空高开多少、放量突破什么价位？
   - T+0机会预判：若盘中出现剧烈波动，给出高抛低吸的价差空间。

4. **硬性风控与退出机制**：
   - 止损位：精确到小数点后两位（例如跌破MA10或关键支撑）。
   - 止盈位：第一目标位，达到后减仓50%锁定利润。
   - 极端情况：若遭遇跌停或放量大阴线，次日竞价清仓的触发条件。

## 输出格式（必须严格遵循以下JSON结构，不要添加额外文字，直接输出JSON对象）：
{
  "sentiment_analysis": {
    "stage": "",  // 缩量回调确认 / 高位放量分歧 / 平台放量突破
    "reason": ""
  },
  "execution_plan": {
    "action": "",      // 竞价抢筹 / 分时回踩买入 / 突破追涨 / 减仓观望
    "price_range": "", // 买入价格区间，减仓时填写卖出区间
    "position": "",    // 仓位比例，空仓时填0%
    "detail": ""
  },
  "position_management": {
    "add_condition": "",
    "t0_opportunity": ""
  },
  "risk_control": {
    "stop_loss": "",   // 精确止损价
    "take_profit": "", // 第一目标位
    "extreme": ""
  }
}

## 约束条件：
- 所有价格保留两位小数。
- 在强势市场环境下（如大盘上涨、板块普涨），必须给出60%以上的重仓建议；在弱势环境下，必须给出空仓警示（position=0%）。
- 必须考虑A股T+1制度。`;
}

module.exports = {
  buildPrompt
};
