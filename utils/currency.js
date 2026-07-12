// ─────────────────────────────────────────────
//  ATMOVERSE BOT — Currency Conversion Utility
// ─────────────────────────────────────────────

const axios = require('axios');
const logger = require('./logger');

// Simple cache to avoid hitting the API on every payment
let cachedRate = null;
let cacheTime = 0;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Fetch live USD → INR exchange rate.
 * Uses the free exchangerate-api (no key required for this endpoint).
 * Falls back to a hardcoded rate if the request fails.
 */
async function getUsdToInr() {
  const now = Date.now();
  if (cachedRate && now - cacheTime < CACHE_TTL_MS) {
    return cachedRate;
  }

  try {
    const res = await axios.get(
      'https://api.exchangerate-api.com/v4/latest/USD',
      { timeout: 5000 }
    );
    const rate = res.data?.rates?.INR;
    if (rate && rate > 0) {
      cachedRate = rate;
      cacheTime = now;
      return rate;
    }
  } catch (err) {
    logger.warn('Currency fetch failed, using fallback rate:', err.message);
  }

  // Fallback static rate if API is unreachable
  return cachedRate || 84;
}

/**
 * Convert USD amount to INR string, e.g. "₹1,680"
 */
async function usdToInrString(usdAmount) {
  const rate = await getUsdToInr();
  const inr = Math.round(usdAmount * rate);
  return `₹${inr.toLocaleString('en-IN')}`;
}

module.exports = { getUsdToInr, usdToInrString };
