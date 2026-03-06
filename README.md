# xj-quant-node

基于 Node.js 的 A 股主升浪决策脚本，流程如下：

1. 使用 Tushare 拉取模板变量（收盘价、涨跌幅、换手率、量比、均线状态、MACD/RSI/KDJ、关键压力/支撑位）。
2. 按你给定的“游资量化策略员”提示词模板拼装 Prompt。
3. 调用 DeepSeek API，强制返回 JSON 决策结果。

## 安装

```bash
npm install
cp .env.example .env
```

填写 `.env`：

- `TUSHARE_TOKEN`
- `DEEPSEEK_API_KEY`
- 可选：`DEEPSEEK_BASE_URL`、`DEEPSEEK_MODEL`

## 运行

```bash
npm start -- --ts-code 000001.SZ --trade-date 20250221
```

参数说明：
- `--ts-code`: 股票代码（Tushare 格式，如 `000001.SZ`）
- `--trade-date`: 交易日，格式 `YYYYMMDD`

程序输出：
- 标准输出为 DeepSeek 返回的最终 JSON 决策。
- 发生错误时返回非零退出码，并输出 `[ERROR] ...`。
