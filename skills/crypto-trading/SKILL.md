---
name: crypto-trading
description: "Trading analysis and monitoring for stocks, ETFs, and crypto assets using technical analysis. Use when: (1) analyzing price charts and identifying trading opportunities, (2) setting up alerts for support/resistance/trend changes, (3) evaluating risk/reward on potential trades, (4) monitoring positions for trend breaks, or (5) learning technical analysis frameworks."
---

# Crypto Trading Skill

Build systematic trading analysis using Ben Cowen's technical analysis framework from "Into The Cryptoverse." This skill provides tactical analysis for identifying entry/exit opportunities, managing risk, and monitoring market structure.

## Core Workflow

### 1. Chart Analysis

Analyze the provided chart by identifying:

- **Current trend state** (uptrend, downtrend, consolidation)
- **Key support/resistance levels** (swing highs/lows, moving averages, broken structure)
- **Volume pattern** (accumulation, distribution, or spike)
- **Price action near MAs** (pullback opportunity, MA alignment, trend change)

### 2. Opportunity Assessment

Evaluate the setup against Ben Cowen criteria:

- **Trend state**: Trading with trend beats against-trend
- **Support/Resistance**: Is price at a defined level? How far away?
- **Volume confirmation**: Does the setup have volume backing?
- **Risk/Reward**: What's the stop loss? What's the target? Is ratio 2:1+?

### 3. Alert Generation

Set triggers for:

- Support/resistance levels broken or tested
- Key moving averages crossed
- Volume spikes (2x+ average)
- Trend reversals (MA death/golden crosses)
- Pullback completion (price bounces off MA during uptrend)

### 4. Position Monitoring

Track ongoing positions:

- Is the trade still valid? (Original thesis intact?)
- Has trend changed? (MA cross, broken structure?)
- What's the next target or exit level?
- Is risk management in place? (Stop loss, position size?)

## Analysis Steps

### Step 1: Identify Timeframe & Trend

When given a chart, first determine:

- **Timeframe**: Weekly (macro), daily (tactical), 4h (short-term)?
- **Primary trend**: Higher highs/lows, lower highs/lows, or consolidated?
- **MA alignment**: Are shorter MAs above longer MAs? Stacked = strong trend.

**Example**: XOP weekly chart shows:

- Price: $159.69
- Recent pullbacks (red candles) after rally (green candles)
- Price above moving averages (MAs) → uptrend likely intact
- Need to check if 20 MA still above 50/200 MA

### Step 2: Mark Key Levels

Identify:

- **Resistance**: Previous swing highs, July 2018 high ($181.80), psychological levels
- **Support**: Previous swing lows, moving averages, broken market structure support band (BMSB)
- **BMSB**: When price breaks below support, that broken level becomes resistance on retest
- **MAs**: Current position of 20, 50, 200 SMAs

**Example**: On XOP:

- Resistance: $181.80 (July 2018 high), recent swing high ~$180
- Support: ~$144.00 (longer-term level), recent swing low ~$155
- Current price just above BMSB (previous support now acting as resistance)

### Step 3: Assess Volume

Check:

- Is current volume above average? (Support/resistance break needs 2x+ volume)
- Is price consolidating on low volume? (Accumulation = breakout likely)
- Did volume spike? (Momentum entering market, trend may accelerate)

### Step 4: Set Entry/Exit Rules

Define the trade:

**For long entries** (during uptrend):

- Entry: Pullback to 20 MA + bounce, or breakout above resistance on volume
- Stop: Below the swing low or below 20 MA
- Target: Next resistance level or swing high

**For short entries** (during downtrend):

- Entry: Rally to 20 MA + rejection, or breakdown below support on volume
- Stop: Above the swing high or above 20 MA
- Target: Next support level or swing low

**Risk/Reward**: Calculate R:R = (Target - Entry) / (Entry - Stop). Minimum 2:1.

### Step 5: Generate Alerts

Set up monitoring for:

- [ ] Price breaks below support (confirm trend change)
- [ ] Price tests resistance (entry or target hit)
- [ ] 20 MA crosses 50 MA (trend shift signal)
- [ ] 50 MA crosses 200 MA (Golden/Death Cross = major reversal)
- [ ] Volume spike 2x+ average (breakout/breakdown likely)
- [ ] Price returns to support during uptrend (pullback buy opportunity)

## Reference Materials

### Market Structure Analysis

See [`references/market-structure-analysis.md`](references/market-structure-analysis.md) for:

- Market structure (HHHL, LHLL, broken market structure)
- Support/resistance theory and BMSB concept
- Moving average interpretation
- Volume confirmation rules
- Risk/reward analysis
- Common setups (pullback bounces, breakouts, breakdowns)

### Technical Indicators

See [`references/technical-indicators.md`](references/technical-indicators.md) for:

- SMA calculation and interpretation (20, 50, 200)
- RSI and divergence signals
- MACD and momentum confirmation
- Volume analysis and accumulation/distribution
- Fibonacci levels and breakout targets

## Scripts

### analyze_price.py

Analyze price data and generate technical alerts.

**Usage**:

```bash
python analyze_price.py XOP prices.json
```

**Input format** (prices.json):

```json
[
  {
    "date": "2026-04-18",
    "open": 160.0,
    "high": 161.5,
    "low": 158.0,
    "close": 159.69,
    "volume": 1000000
  },
  ...
]
```

**Output**: JSON report with:

- Current price, trend state, volume
- Moving averages (20, 50, 200)
- Support/resistance levels
- Trading alerts and opportunities

## Common Questions

**Q: How do I know when to buy in an uptrend?**  
A: Wait for a pullback to the 20 MA during an uptrend (price > 20 MA > 50 MA > 200 MA). When price bounces off the 20 MA with volume, that's a high-probability entry. Stop goes below the swing low; target is the previous swing high or resistance.

**Q: What does BMSB mean?**  
A: Broken Market Structure Support Band. When a previous support level is broken, it becomes resistance on retest. It's a critical level because traders place stops just above it and shorts just below it—both create buying pressure if price retests from below.

**Q: How important is volume?**  
A: Critical. A breakout without volume is weak and often fails. A 2x volume spike on a breakout = strong signal. Declining volume on a breakdown = weakness, watch for bounce.

**Q: When should I exit a winning trade?**  
A: Exit at resistance (next swing high, previous resistance level), when your initial thesis breaks (e.g., MA cross below), or when price overextends far from MAs (vulnerable to pullback). Don't be greedy—take profits at defined targets.

**Q: What's the best timeframe to trade?**  
A: Trade the weekly trend on the daily timeframe. Weekly identifies the macro structure and trend; daily lets you time entries/exits. Don't fight the weekly trend.

## Example: XOP Weekly Analysis

**Setup**:

- Price: $159.69 (just above BMSB)
- Trend: Recent pullbacks suggest profit-taking in uptrend
- MAs: Likely still aligned (need to confirm 20 > 50 > 200)
- Volume: Check if spike on recent candles

**Opportunity**:

- If 20 MA is above 50/200 MA → Uptrend still intact
- Price near BMSB ($150-155 area) = strong support
- If price bounces from BMSB on volume → Long setup (buy)
- Stop: Below swing low (~$155)
- Target: Previous resistance (~$180-181)
- Risk: $4-5; Reward: $20-25 → ~5:1 R:R (excellent)

**Alerts to Set**:

- [ ] Support at $155 breaks (watch for larger downtrend)
- [ ] Resistance at $180 tested (take profits or add)
- [ ] 50 MA crosses 20 MA down (trend warning)
