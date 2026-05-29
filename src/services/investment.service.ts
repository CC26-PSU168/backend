import axios from 'axios';
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 300 }); // Cache for 5 minutes (reduced API calls)

// Fallback/last-known values for when APIs are rate-limited
let lastKnownPrices = {
  bitcoin: { price: 0, change24h: 0 },
  usd: { price: 0, change24h: 0 },
  gold: { price: 0, change24h: 0 },
};

export class InvestmentService {
  static async getPrices() {
    const cacheKey = 'investment_prices';
    const cachedData = cache.get(cacheKey);

    if (cachedData) {
      return cachedData;
    }

    // Fetch each API independently so one failure doesn't break everything
    let btcPrice = lastKnownPrices.bitcoin.price;
    let btcChange = lastKnownPrices.bitcoin.change24h;
    let usdPrice = lastKnownPrices.usd.price;
    let goldPriceIDR = lastKnownPrices.gold.price;

    // 1. Bitcoin Price (CoinGecko) — with retry on alternative endpoint
    try {
      const btcRes = await axios.get(
        'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=idr&include_24hr_change=true',
        { timeout: 10000 }
      );
      btcPrice = btcRes.data.bitcoin.idr;
      btcChange = btcRes.data.bitcoin.idr_24h_change;
    } catch (err: any) {
      console.warn('[Investment] CoinGecko failed:', err.response?.status || err.message);
      // Fallback: try alternative free API
      try {
        const fallbackRes = await axios.get(
          'https://api.coinlore.net/api/ticker/?id=90',
          { timeout: 10000 }
        );
        if (fallbackRes.data?.[0]) {
          const btcUSD = parseFloat(fallbackRes.data[0].price_usd);
          btcChange = parseFloat(fallbackRes.data[0].percent_change_24h);
          // Will convert to IDR after we get the USD rate below
          btcPrice = btcUSD; // temporary, will be converted below
        }
      } catch {
        console.warn('[Investment] Coinlore fallback also failed, using last known prices');
      }
    }

    // 2. USD/IDR (ExchangeRate-API free tier)
    try {
      const usdRes = await axios.get(
        'https://open.er-api.com/v6/latest/USD',
        { timeout: 10000 }
      );
      usdPrice = usdRes.data.rates.IDR;
    } catch (err: any) {
      console.warn('[Investment] ExchangeRate API failed:', err.response?.status || err.message);
      // Use a reasonable fallback if we have no prior data
      if (usdPrice === 0) usdPrice = 16500;
    }

    // If BTC was fetched in USD from fallback, convert to IDR now
    if (btcPrice > 0 && btcPrice < 1_000_000) {
      // Likely in USD (BTC in IDR would be billions), convert to IDR
      btcPrice = Math.round(btcPrice * usdPrice);
    }

    // 3. Gold price estimate (per gram in IDR)
    const goldPriceUSD = 2300; // ~1 troy oz
    goldPriceIDR = Math.round((goldPriceUSD * usdPrice) / 31.1035);

    const data = {
      bitcoin: {
        price: btcPrice,
        change24h: btcChange,
      },
      usd: {
        price: usdPrice,
        change24h: 0,
      },
      gold: {
        price: goldPriceIDR,
        change24h: 0.5,
      },
      lastUpdated: new Date().toISOString(),
    };

    // Save as last known prices for future fallback
    lastKnownPrices = {
      bitcoin: { price: btcPrice, change24h: btcChange },
      usd: { price: usdPrice, change24h: 0 },
      gold: { price: goldPriceIDR, change24h: 0.5 },
    };

    // Only cache if we got at least some real data
    if (btcPrice > 0 || usdPrice > 0) {
      cache.set(cacheKey, data);
    }

    return data;
  }
}
