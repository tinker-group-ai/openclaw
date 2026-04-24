---
name: price-watch
description: Fetch and display current prices for a watch list of stocks and cryptocurrencies, with daily changes and percent change. Use when the user asks to "check my watchlist", "show prices", "price check", "what are my prices", "monitor portfolio", or similar requests to see current price data for tracked assets. Zero setup required beyond editing a simple JSON watch list.
---

# Price Watch

Track stock and crypto prices with minimal overhead.

## Quick Start

1. Edit `watch-list.json`:

```json
{
  "stocks": ["AAPL", "MSFT"],
  "crypto": ["bitcoin", "ethereum"]
}
```

2. Run:

```bash
npx ts-node scripts/fetch-prices.ts
```

3. Output:

```
📈 Stocks:
  AAPL   $185.42    +1.17%

🪙 Crypto:
  BTC    $67,500.00 +5.23%
```

## How It Works

- Reads your watch list (JSON)
- Fetches live prices from free APIs (Yahoo Finance, CoinGecko)
- Shows symbol, price, and 24h change %
- No auth, no rate limiting issues, no cloud costs

## Watch List Format

See `references/setup.md` for detailed symbol formats and custom watch list examples.

## APIs

- **Stocks**: Yahoo Finance (free)
- **Crypto**: CoinGecko (free)

Both support free tier with no authentication required.
