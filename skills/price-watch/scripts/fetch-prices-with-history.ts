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
  change24h: number;
  change24hPercent: number;
  dayOpen: number;
  weekOpen: number;
  type: "stock" | "crypto";
  timestamp: number;
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
      // Get current quote
      const quote = await yf.quote(symbol);
      const currentPrice = quote.regularMarketPrice ?? 0;

      // Get historical data (last 8 days to get both day and week opens)
      const today = new Date();
      const eightDaysAgo = new Date(today.getTime() - 8 * 24 * 60 * 60 * 1000);

      const historical = await yf.historical(symbol, {
        period1: eightDaysAgo,
        period2: today,
        interval: "1d",
      });

      // Today's open (most recent)
      const todayData = historical[historical.length - 1];
      const dayOpen = todayData?.open ?? currentPrice;

      // Week ago open (7 days back)
      const weekAgoData = historical[historical.length - 6] || historical[0];
      const weekOpen = weekAgoData?.open ?? currentPrice;

      results.push({
        symbol: quote.symbol,
        price: currentPrice,
        change24h: quote.regularMarketChange ?? 0,
        change24hPercent: quote.regularMarketChangePercent ?? 0,
        dayOpen,
        weekOpen,
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
  const results: PriceData[] = [];

  for (const symbol of symbols) {
    try {
      const id = symbol.toLowerCase();

      // Get current price with 24h change
      const currentResponse = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd&include_24hr_change=true`,
      );
      if (!currentResponse.ok) throw new Error("CoinGecko current API error");

      const currentData = (await currentResponse.json()) as Record<
        string,
        { usd: number; usd_24h_change: number }
      >;
      if (!currentData[id]) throw new Error("Not found on CoinGecko");

      const currentPrice = currentData[id].usd;
      const change24hPercent = currentData[id].usd_24h_change;

      // Get historical data for day and week opens
      const today = new Date();
      const dateStr = today.toISOString().split("T")[0];
      const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];

      const historyResponse = await fetch(
        `https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=8&interval=daily`,
      );
      if (!historyResponse.ok) throw new Error("CoinGecko history API error");

      const historyData = (await historyResponse.json()) as {
        prices: [number, number][];
      };

      // Extract day open (most recent non-current price)
      const dayOpen =
        historyData.prices.length > 1
          ? historyData.prices[historyData.prices.length - 2][1]
          : currentPrice;

      // Extract week open (7 days back)
      const weekOpen =
        historyData.prices.length > 7
          ? historyData.prices[historyData.prices.length - 8][1]
          : historyData.prices[0][1];

      const change24h = currentPrice - dayOpen;

      results.push({
        symbol: symbol.toUpperCase(),
        price: currentPrice,
        change24h,
        change24hPercent,
        dayOpen,
        weekOpen,
        type: "crypto",
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error(`✗ ${symbol}: ${(error as Error).message}`);
    }
  }

  return results;
};

const formatPrice = (data: PriceData): string => {
  const priceStr =
    data.type === "crypto" ? `$${data.price.toFixed(2)}` : `$${data.price.toFixed(2)}`;

  // Day comparison
  const dayChange = data.price - data.dayOpen;
  const dayChangePercent = data.dayOpen > 0 ? (dayChange / data.dayOpen) * 100 : 0;
  const dayArrow = dayChange >= 0 ? "⬆️" : "⬇️";
  const dayPercent =
    dayChangePercent >= 0 ? `+${dayChangePercent.toFixed(2)}%` : `${dayChangePercent.toFixed(2)}%`;

  // Week comparison
  const weekChange = data.price - data.weekOpen;
  const weekChangePercent = data.weekOpen > 0 ? (weekChange / data.weekOpen) * 100 : 0;
  const weekArrow = weekChange >= 0 ? "⬆️" : "⬇️";
  const weekPercent =
    weekChangePercent >= 0
      ? `+${weekChangePercent.toFixed(2)}%`
      : `${weekChangePercent.toFixed(2)}%`;

  return `${data.symbol.padEnd(8)} ${priceStr.padStart(12)}
  Daily:   $${data.dayOpen.toFixed(2)} ${dayArrow} ${dayPercent}
  Weekly:  $${data.weekOpen.toFixed(2)} ${weekArrow} ${weekPercent}`;
};

const main = async () => {
  const watchListPath = process.argv[2] || "watch-list.json";

  try {
    const watchList = readWatchList(watchListPath);
    const allPrices: PriceData[] = [];

    console.log(`\n📊 Price Check with Day/Week Comparison\n`);

    if (watchList.stocks && watchList.stocks.length > 0) {
      console.log("📈 Stocks:");
      const stockPrices = await fetchStockPrices(watchList.stocks);
      allPrices.push(...stockPrices);
      stockPrices.forEach((p) => {
        console.log(`  ${formatPrice(p)}\n`);
      });
    }

    if (watchList.crypto && watchList.crypto.length > 0) {
      console.log("🪙 Crypto:");
      const cryptoPrices = await fetchCryptoPrices(watchList.crypto);
      allPrices.push(...cryptoPrices);
      cryptoPrices.forEach((p) => {
        console.log(`  ${formatPrice(p)}\n`);
      });
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
