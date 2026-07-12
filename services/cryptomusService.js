// ─────────────────────────────────────────────
//  ATMOVERSE BOT — Cryptomus Payment Service
//  Docs: https://doc.cryptomus.com/merchant-api/payments/creating-invoice
// ─────────────────────────────────────────────

const axios = require('axios');
const crypto = require('crypto');
const logger = require('../utils/logger');

const BASE_URL = 'https://api.cryptomus.com/v1';

/**
 * Build the Cryptomus request signature.
 * sign = md5( base64(JSON.stringify(body)) + PAYMENT_API_KEY )
 */
function buildSign(body, apiKey) {
  const encoded = Buffer.from(JSON.stringify(body)).toString('base64');
  return crypto.createHash('md5').update(encoded + apiKey).digest('hex');
}

/**
 * Create a Cryptomus payment invoice.
 *
 * @param {number} amountUsd   - Total in USD
 * @param {string} orderId     - Unique order reference (e.g. "userId_timestamp")
 * @param {string} description - Short description shown on payment page
 * @returns {Promise<{ url: string, uuid: string }>}
 */
async function createInvoice(amountUsd, orderId, description) {
  const merchantId = process.env.CRYPTOMUS_MERCHANT_ID;
  const apiKey     = process.env.CRYPTOMUS_PAYMENT_KEY;

  if (!merchantId || !apiKey) {
    throw new Error('CRYPTOMUS_MERCHANT_ID or CRYPTOMUS_PAYMENT_KEY not set in environment.');
  }

  const body = {
    amount:       String(amountUsd),
    currency:     'USD',
    order_id:     orderId,
    name:         description,
    lifetime:     3600,        // invoice expires in 1 hour
    is_payment_multiple: false,
  };

  const sign = buildSign(body, apiKey);

  const response = await axios.post(
    `${BASE_URL}/payment`,
    body,
    {
      headers: {
        merchant:       merchantId,
        sign,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    }
  );

  const result = response.data?.result;
  if (!result?.url) {
    throw new Error(`Cryptomus error: ${JSON.stringify(response.data)}`);
  }

  return {
    url:  result.url,
    uuid: result.uuid,
  };
}

module.exports = { createInvoice };
