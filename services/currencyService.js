import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_KEY = process.env.EXCHANGE_API_KEY;
if (!API_KEY) {
    throw new Error('Missing EXCHANGE_API_KEY environment variable for currencyService');
}

let baseRates = {};
let lastFetch = 0;
const FETCH_INTERVAL = 1000 * 60 * 8;
const BASE_CURRENCY = 'Uah';

async function fetchRates() {
    try {
        const response = await axios.get('https://api.exchangerate.host/live', {
            params: {
                access_key: API_KEY,
                source: BASE_CURRENCY.toUpperCase(),
                currencies: 'USD,EUR'
            }
        });
        const ratesWeb = response.data.rates || {};
        const quotes = response.data.quotes || {};
        baseRates = {
            [BASE_CURRENCY]: 1,
            Usd: quotes[`${BASE_CURRENCY.toUpperCase()}USD`],
            Eur: quotes[`${BASE_CURRENCY.toUpperCase()}EUR`]
        };
        lastFetch = Date.now();
        console.log('Currency rates updated:', baseRates);
    } catch (error) {
        console.error('Failed to fetch currency rates:', error);
    }
}

fetchRates();
setInterval(fetchRates, FETCH_INTERVAL);

function getRates() {
    return baseRates;
}

async function getRate(fromCurrency, toCurrency) {
    if (Date.now() - lastFetch > FETCH_INTERVAL) {
        await fetchRates();
    }
    if (fromCurrency === toCurrency) return 1;
    const fromRate = baseRates[fromCurrency];
    const toRate = baseRates[toCurrency];
    if (fromRate === undefined || toRate === undefined) {
        return 1;
    }
    return toRate / fromRate;
}

export default {
    getRates,
    getRate
}; 