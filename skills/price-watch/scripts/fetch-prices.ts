import fs from "fs";
import YahooFinance from "yahoo-finance2";

interface WatchList {
  stocks?: string[];
  crypto?: string[];
}

interface PriceData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  type: "stock" | "crypto";
}

const readWatchList = (filePath: string): WatchList => {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Watch list not found: ${filePath}`);
  }
  const data = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(data);
};

const fetchStockPrices = async (symbols: string[]): Promise<PriceData[]> => {
  const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });
  const results: PriceData[] = [];

  for (const symbol of symbols) {
    try {
      const quote = await yf.quote(symbol);

      results.push({
        symbol: quote.symbol,
        price: quote.regularMarketPrice ?? 0,
        change: quote.regularMarketChange ?? 0,
        changePercent: quote.regularMarketChangePercent ?? 0,
        type: "stock",
      });
    } catch (error) {
      console.error(`✗ ${symbol}: ${(error as Error).message}`);
    }
  }

  return results;
};

const fetchCryptoPrices = async (symbols: string[]): Promise<PriceData[]> => {
  const ids = symbols.map((s) => s.toLowerCase()).join(",");

  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`,
    );
    if (!response.ok) throw new Error("CoinGecko API error");

    const data = (await response.json()) as Record<string, { usd: number; usd_24h_change: number }>;

    return symbols
      .map((symbol) => {
        const id = symbol.toLowerCase();
        if (!data[id]) {
          console.error(`✗ ${symbol}: Not found on CoinGecko`);
          return null;
        }
        return {
          symbol: symbol.toUpperCase(),
          price: data[id].usd,
          change: 0,
          changePercent: data[id].usd_24h_change,
          type: "crypto" as const,
        };
      })
      .filter((item): item is PriceData => item !== null);
  } catch (error) {
    console.error(`Crypto API error: ${(error as Error).message}`);
    return [];
  }
};

const formatPrice = (data: PriceData): string => {
  const sign = data.changePercent >= 0 ? "+" : "";
  const changeStr = `${sign}${data.changePercent.toFixed(2)}%`;
  const priceStr =
    data.type === "crypto" ? `$${data.price.toFixed(2)}` : `$${data.price.toFixed(2)}`;

  return `${data.symbol.padEnd(6)} ${priceStr.padStart(12)} ${changeStr.padStart(8)}`;
};

const main = async () => {
  const watchListPath = process.argv[2] || "watch-list.json";

  try {
    const watchList = readWatchList(watchListPath);
    const allPrices: PriceData[] = [];

    if (watchList.stocks && watchList.stocks.length > 0) {
      console.log("\n📈 Stocks:");
      const stockPrices = await fetchStockPrices(watchList.stocks);
      allPrices.push(...stockPrices);
      stockPrices.forEach((p) => console.log(`  ${formatPrice(p)}`));
    }

    if (watchList.crypto && watchList.crypto.length > 0) {
      console.log("\n🪙 Crypto:");
      const cryptoPrices = await fetchCryptoPrices(watchList.crypto);
      allPrices.push(...cryptoPrices);
      cryptoPrices.forEach((p) => console.log(`  ${formatPrice(p)}`));
    }

    if (allPrices.length === 0) {
      console.log("No prices fetched. Check your watch list.");
      process.exit(1);
    }
  } catch (error) {
    console.error(`Error: ${(error as Error).message}`);
    process.exit(1);
  }
};

main();
