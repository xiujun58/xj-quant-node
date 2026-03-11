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
- 过滤条件（至少配置一个）：
  - `TELEGRAM_ALLOWED_BOT_ID`（只接收指定 bot ID）
  - `TELEGRAM_ALLOWED_BOT_USERNAME`（只接收指定 bot 用户名）
  - `TELEGRAM_ALLOWED_CHAT_ID`（只接收指定 chat/channel/group）
- 可选：`DEEPSEEK_BASE_URL`、`DEEPSEEK_MODEL`

> 建议优先配置 `TELEGRAM_ALLOWED_CHAT_ID`，能避免因 Telegram bot-to-bot 限制导致收不到消息。


容错说明：
- 若 `daily_basic` / `stk_factor_pro` / `stk_factor` 因权限不足不可用，程序会自动降级：
  - `volume_ratio` 尝试用日线成交量近5日均值估算；
  - 均线尝试用最近日线收盘价计算 MA5/MA10/MA20；
  - 无法获取的技术指标以“数据不足/N/A”标记，但流程不会中断。

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
1. 支持 `message` 和 `channel_post` 更新类型。
2. 命中过滤条件才处理，未命中会在日志输出忽略原因（如 `sender_not_bot`、`chat_not_allowed`）。
3. 收到消息后先回复“正在分析”。
4. 自动拉取 Tushare 数据并调用 DeepSeek。
5. 将最终 JSON 决策结果回发到 Telegram 聊天。
6. 若错误（如代码格式或接口失败）会回发错误信息。

## 输出与错误

- CLI 模式：标准输出为最终 JSON 决策。
- Bot 模式：结果通过 Telegram 消息返回。
- 出错时会输出 `[ERROR] ...` 或 `[BOT] ...` 日志。
