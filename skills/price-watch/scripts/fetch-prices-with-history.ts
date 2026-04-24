import fs from "fs";
import path from "path";
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
  timestamp: number;
}

interface PriceSnapshot {
  timestamp: number;
  prices: Record<string, number>;
}

const readWatchList = (filePath: string): WatchList => {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Watch list not found: ${filePath}`);
  }
  const data = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(data);
};

const getSnapshotPath = (watchListPath: string): string => {
  const dir = path.dirname(watchListPath);
  const baseName = path.basename(watchListPath, ".json");
  return path.join(dir, `.${baseName}-snapshot.json`);
};

const readSnapshot = (filePath: string): PriceSnapshot | null => {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch {
    return null;
  }
};

const saveSnapshot = (filePath: string, prices: PriceData[]): void => {
  const snapshot: PriceSnapshot = {
    timestamp: Date.now(),
    prices: Object.fromEntries(prices.map((p) => [p.symbol, p.price])),
  };
  fs.writeFileSync(filePath, JSON.stringify(snapshot, null, 2));
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
        timestamp: Date.now(),
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
          timestamp: Date.now(),
        };
      })
      .filter((item): item is PriceData => item !== null);
  } catch (error) {
    console.error(`Crypto API error: ${(error as Error).message}`);
    return [];
  }
};

const formatPrice = (data: PriceData, previousPrice?: number): string => {
  const sign24h = data.changePercent >= 0 ? "+" : "";
  const change24h = `${sign24h}${data.changePercent.toFixed(2)}%`;
  const priceStr =
    data.type === "crypto" ? `$${data.price.toFixed(2)}` : `$${data.price.toFixed(2)}`;

  let deltaStr = "";
  if (previousPrice !== undefined && previousPrice > 0) {
    const priceDelta = data.price - previousPrice;
    const percentDelta = (priceDelta / previousPrice) * 100;
    const signDelta = priceDelta >= 0 ? "+" : "";
    deltaStr = ` │ ${signDelta}${priceDelta.toFixed(2)} (${signDelta}${percentDelta.toFixed(2)}%)`;
  }

  return `${data.symbol.padEnd(8)} ${priceStr.padStart(12)} │ 24h: ${change24h.padStart(8)}${deltaStr}`;
};

const main = async () => {
  const watchListPath = process.argv[2] || "watch-list.json";

  try {
    const watchList = readWatchList(watchListPath);
    const allPrices: PriceData[] = [];
    const snapshotPath = getSnapshotPath(watchListPath);
    const previousSnapshot = readSnapshot(snapshotPath);

    console.log(
      `\n📊 Price Check ${previousSnapshot ? `(vs ${new Date(previousSnapshot.timestamp).toLocaleTimeString()})` : "(first check)"}\n`,
    );

    if (watchList.stocks && watchList.stocks.length > 0) {
      console.log("📈 Stocks:");
      const stockPrices = await fetchStockPrices(watchList.stocks);
      allPrices.push(...stockPrices);
      stockPrices.forEach((p) => {
        const prevPrice = previousSnapshot?.prices[p.symbol];
        console.log(`  ${formatPrice(p, prevPrice)}`);
      });
    }

    if (watchList.crypto && watchList.crypto.length > 0) {
      console.log("\n🪙 Crypto:");
      const cryptoPrices = await fetchCryptoPrices(watchList.crypto);
      allPrices.push(...cryptoPrices);
      cryptoPrices.forEach((p) => {
        const prevPrice = previousSnapshot?.prices[p.symbol];
        console.log(`  ${formatPrice(p, prevPrice)}`);
      });
    }

    if (allPrices.length === 0) {
      console.log("No prices fetched. Check your watch list.");
      process.exit(1);
    }

    // Save current snapshot
    saveSnapshot(snapshotPath, allPrices);
  } catch (error) {
    console.error(`Error: ${(error as Error).message}`);
    process.exit(1);
  }
};

main();
