import axios from 'axios';
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 60 }); // Cache for 60 seconds

export class InvestmentService {
  static async getPrices() {
    const cacheKey = 'investment_prices';
    const cachedData = cache.get(cacheKey);

    if (cachedData) {
      return cachedData;
    }

    try {
      // 1. Bitcoin Price (CoinGecko)
      const btcRes = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=idr&include_24hr_change=true');
      const btcPrice = btcRes.data.bitcoin.idr;
      const btcChange = btcRes.data.bitcoin.idr_24h_change;

      // 2. USD/IDR (ExchangeRate-API free tier)
      const usdRes = await axios.get('https://open.er-api.com/v6/latest/USD');
      const usdPrice = usdRes.data.rates.IDR;

      // 3. Gold (Dummy for now, as free reliable scraping can be tricky without getting blocked, 
      // but we simulate a realistic IDR/gram price based on USD Gold roughly)
      const goldPriceUSD = 2300; // ~1 oz
      const goldPriceIDR = (goldPriceUSD * usdPrice) / 31.1035; // per gram
      
      const data = {
        bitcoin: {
          price: btcPrice,
          change24h: btcChange,
        },
        usd: {
          price: usdPrice,
          change24h: 0, // er-api free doesn't give historical daily easily
        },
        gold: {
          price: goldPriceIDR,
          change24h: 0.5, // Dummy positive change
        },
        lastUpdated: new Date().toISOString(),
      };

      cache.set(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Error fetching investment prices:', error);
      throw { statusCode: 500, message: 'Gagal mengambil data investasi' };
    }
  }
}
