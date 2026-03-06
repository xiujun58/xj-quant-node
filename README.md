# xj-quant-node

基于 Node.js 的 A 股主升浪决策工具，支持两种交互方式：

1. CLI 调用（传入股票代码）
2. Telegram 机器人交互（在机器人聊天中发送股票代码）

执行逻辑：
- 使用 Tushare 拉取模板变量（收盘价、涨跌幅、换手率、量比、均线状态、MACD/RSI/KDJ、关键压力/支撑位）。
- 按策略模板拼装 Prompt。
- 调用 DeepSeek API，强制返回 JSON 决策结果。

## 安装

```bash
npm install
cp .env.example .env
```

填写 `.env`：

- `TUSHARE_TOKEN`
- `DEEPSEEK_API_KEY`
- `TELEGRAM_BOT_TOKEN`（机器人模式必填）
- `TELEGRAM_ALLOWED_BOT_ID` 或 `TELEGRAM_ALLOWED_BOT_USERNAME`（至少配置一个，用于限定仅接收指定机器人）
- 可选：`DEEPSEEK_BASE_URL`、`DEEPSEEK_MODEL`

## 方式1：CLI运行

```bash
npm start -- --mode cli --ts-code 000001.SZ --trade-date 20250221
```

参数说明：
- `--mode`: `cli` 或 `bot`（默认 `cli`）
- `--ts-code`: 股票代码（如 `000001.SZ` 或 `000001`）
- `--trade-date`: 交易日，格式 `YYYYMMDD`

## 方式2：Telegram机器人运行

```bash
npm run start:bot
```

机器人消息格式：
- 仅股票代码：`000001.SZ` 或 `000001`（默认使用当天日期）
- 股票代码 + 日期：`000001.SZ 20250221`

机器人行为：
1. 仅处理来自指定机器人（ID/用户名白名单）的消息，其余消息直接忽略。
2. 收到消息后先回复“正在分析”。
3. 自动拉取 Tushare 数据并调用 DeepSeek。
4. 将最终 JSON 决策结果回发到 Telegram 聊天。
5. 若错误（如代码格式或接口失败）会回发错误信息。

## 输出与错误

- CLI 模式：标准输出为最终 JSON 决策。
- Bot 模式：结果通过 Telegram 消息返回。
- 出错时会输出 `[ERROR] ...` 或 `[BOT] ...` 日志。
