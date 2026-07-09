// ─────────────────────────────────────────────
//  ATMOVERSE BOT — NVIDIA NIM API Service
// ─────────────────────────────────────────────

const axios = require('axios');
const { SYSTEM_PROMPT } = require('../config/constants');
const logger = require('../utils/logger');

const client = axios.create({
  baseURL: process.env.NVIDIA_API_BASE_URL || 'https://integrate.api.nvidia.com/v1',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${process.env.NVIDIA_API_KEY}`,
  },
});

/**
 * Send a message to NVIDIA NIM and return the AI response text.
 *
 * @param {Array}  history  - Array of { role, content } objects (conversation memory)
 * @param {string} userMessage - The latest user message
 * @returns {Promise<string>} - The AI response
 */
async function askNvidia(history, userMessage) {
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...history,
    { role: 'user', content: userMessage },
  ];

  try {
    const response = await client.post('/chat/completions', {
      model: process.env.NVIDIA_MODEL || 'meta/llama-3.1-70b-instruct',
      messages,
      temperature: 0.6,
      top_p: 0.9,
      max_tokens: 512,
      stream: false,
    });

    const reply = response.data?.choices?.[0]?.message?.content;

    if (!reply) {
      logger.warn('NVIDIA NIM returned an empty response');
      return "I'm sorry, I didn't get a response. Please try again or contact @atmoverse on Telegram.";
    }

    return reply.trim();
  } catch (err) {
    const status = err.response?.status;
    const detail = err.response?.data?.detail || err.message;

    logger.error(`NVIDIA NIM error [${status}]:`, detail);

    if (status === 401) {
      return 'AI service authentication error. Please contact support at @atmoverse.';
    }
    if (status === 429) {
      return "I'm a little busy right now. Please try again in a moment or contact @atmoverse directly.";
    }

    return "I'm having trouble connecting to my AI service right now. Please contact us directly:\n\n• Telegram: @atmoverse\n• WhatsApp: https://wa.me/19152481421";
  }
}

module.exports = { askNvidia };
