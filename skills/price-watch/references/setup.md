# Price Watch Setup

## Watch List Format

`watch-list.json` is a simple JSON file with two arrays:

```json
{
  "stocks": ["AAPL", "MSFT", "TSLA"],
  "crypto": ["bitcoin", "ethereum", "solana"]
}
```

### Stock Symbols

Use standard ticker symbols (NASDAQ/NYSE): `AAPL`, `GOOGL`, `SPY`, etc.

### Crypto Symbols

Use CoinGecko IDs (lowercase): `bitcoin`, `ethereum`, `solana`, `cardano`, `polkadot`, etc.

Find more at https://api.coingecko.com/api/v3/coins/list

## Running the Script

```bash
npx ts-node scripts/fetch-prices.ts
```

Or specify a custom watch list:

```bash
npx ts-node scripts/fetch-prices.ts /path/to/custom-list.json
```

## Output Format

```
📈 Stocks:
  AAPL   $185.42    +1.17%
  MSFT   $420.50    -0.82%

🪙 Crypto:
  BTC    $67,500.00 +5.23%
  ETH    $3,245.80  -2.15%
```

## APIs Used

- **Stocks**: Yahoo Finance (free, no auth)
- **Crypto**: CoinGecko (free, no auth)

Both are rate-limited but generous for personal use. No API keys needed.
