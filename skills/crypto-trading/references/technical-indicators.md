# Technical Indicators Reference

Practical guide to key indicators used in Ben Cowen-style analysis.

## Moving Averages

### Simple Moving Average (SMA)

**Calculation**: Average of close prices over N periods  
**Key periods**: 20 (short-term), 50 (medium-term), 200 (long-term)

```
20 SMA: Avg of last 20 closes
50 SMA: Avg of last 50 closes
200 SMA: Avg of last 200 closes
```

**Interpretation**:

- Price above MA = Uptrend
- Price below MA = Downtrend
- MA alignment (20 > 50 > 200) = Strong uptrend
- MA reversal (50 crosses below 200) = Trend reversal signal

**Use in Trading**:

- Support/resistance during trend
- Pullback target in uptrends (buy near MA)
- Rally target in downtrends (sell near MA)
- Entry confirmation after breakouts

### Exponential Moving Average (EMA)

**Calculation**: More weight to recent prices  
**Advantage**: Faster response to price changes than SMA

**Use**: Same as SMA but slightly more responsive to recent price action

## Momentum Indicators

### Relative Strength Index (RSI)

**Calculation**: 100 - (100 / (1 + RS)), where RS = avg gain / avg loss over 14 periods  
**Range**: 0-100 (default period: 14)

```
RSI > 70 = Overbought (potential pullback/reversal)
RSI < 30 = Oversold (potential bounce/reversal)
RSI 40-60 = Neutral
```

**Divergence Signal** (High probability reversal):

- **Bearish Divergence**: Price makes new high but RSI doesn't → Uptrend likely to fail
- **Bullish Divergence**: Price makes new low but RSI doesn't → Downtrend likely to fail

### MACD (Moving Average Convergence Divergence)

**Calculation**:

- MACD Line = 12 EMA - 26 EMA
- Signal Line = 9 EMA of MACD
- Histogram = MACD - Signal Line

**Signals**:

- MACD crosses above Signal = Uptrend (Buy)
- MACD crosses below Signal = Downtrend (Sell)
- Histogram crossing from negative to positive = Momentum building
- Divergence = Trend weakening

## Volume Analysis

### Volume Confirmation

**Rule**: Major moves (breakouts, breakdowns) should have volume spike

```
Typical Volume = Average of last 20-30 days
Spike Volume = 1.5x - 3x typical volume
Strong Signal = Breakout + Volume spike (2x+)
Weak Signal = Breakout + Volume declining
```

### Accumulation vs. Distribution

- **Accumulation**: Price consolidating; volume low; preparing for breakout
- **Distribution**: Price consolidating; volume high/volatile; preparing for breakdown

## Support & Resistance Calculation

### Key Levels to Track

1. **Swing Highs**: Recent peaks (resistance)
2. **Swing Lows**: Recent troughs (support)
3. **Moving Averages**: 20, 50, 200 SMA
4. **Fibonacci Levels**: 0%, 23.6%, 38.2%, 50%, 61.8%, 100%
5. **Psychological Levels**: Round numbers ($100, $150, $200)
6. **Previous High/Low**: All-time or long-term price points

### Fibonacci Retracement (During Uptrend)

Used to find pullback targets:

```
Entry: Latest swing low
Exit: Latest swing high
Retracements: 23.6%, 38.2%, 50%, 61.8% of (High - Low)
```

Common pullback targets = 38.2% or 50% retracement

### Fibonacci Extension (Breakout Targets)

Used to find upside target after breakout:

```
Base: Swing high
Height: Swing high - Swing low
Extensions: 61.8%, 100%, 127.2%, 161.8% of height
```

## Weekly vs. Daily Timeframe

### Weekly Analysis

- **Best for**: Macro trend, major support/resistance, long-term entries
- **Indicators**: 20, 50, 200 SMA; swing highs/lows; major breakouts
- **Action**: Identifies primary trend direction and key levels

### Daily Analysis

- **Best for**: Fine-tuning entry/exit, shorter-term pullbacks, confirmation
- **Indicators**: 20 SMA; swing highs/lows; MACD; RSI; volume
- **Action**: Timing within the weekly trend

**Best Approach**: Trade the weekly trend on daily timescale (buy uptrend pullbacks to 20 MA, sell downtrend rallies to 20 MA)
