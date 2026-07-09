// ─────────────────────────────────────────────
//  ATMOVERSE Telegram AI Customer Support Bot
//  Production-ready | Node.js + NVIDIA NIM
// ─────────────────────────────────────────────

require('dotenv').config();

const express = require('express');
const TelegramBot = require('node-telegram-bot-api');

const { handleMessage } = require('./handlers/messageHandler');
const { handleCallbackQuery } = require('./handlers/menuHandler');
const logger = require('./utils/logger');

// ── Validate required env vars ─────────────────
const REQUIRED_ENV = ['BOT_TOKEN', 'NVIDIA_API_KEY', 'ADMIN_CHAT_ID'];
const missing = REQUIRED_ENV.filter((key) => !process.env[key]);

if (missing.length > 0) {
  logger.error(`Missing required environment variables: ${missing.join(', ')}`);
  logger.error('Please copy .env.example to .env and fill in the values.');
  process.exit(1);
}

// ── Initialise Telegram Bot (polling) ──────────
const bot = new TelegramBot(process.env.BOT_TOKEN, {
  polling: {
    interval: 300,
    autoStart: true,
    params: {
      timeout: 10,
    },
  },
});

logger.info('ATMOVERSE Bot starting up...');

// ── Register event listeners ────────────────────

// Plain text messages
bot.on('message', async (msg) => {
  try {
    // Only handle text messages (ignore stickers, photos, etc.)
    if (msg.text) {
      await handleMessage(bot, msg);
    }
  } catch (err) {
    logger.error('Unhandled error in message handler:', err);
  }
});

// Inline keyboard button presses
bot.on('callback_query', async (query) => {
  try {
    await handleCallbackQuery(bot, query);
  } catch (err) {
    logger.error('Unhandled error in callback_query handler:', err);
    // Try to answer the query to prevent the spinner from hanging
    try {
      await bot.answerCallbackQuery(query.id, {
        text: '⚠️ An error occurred. Please try again.',
        show_alert: false,
      });
    } catch (_) {
      // ignore secondary error
    }
  }
});

// Polling error handling
bot.on('polling_error', (err) => {
  logger.error('Polling error:', err.code, err.message);
});

bot.on('error', (err) => {
  logger.error('Bot error:', err.message);
});

// ── Express health-check server ────────────────
//  Required for Railway to detect the service is running
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Health check endpoint
app.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'ATMOVERSE Telegram Bot',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.get('/health', (_req, res) => {
  res.json({ status: 'healthy' });
});

app.listen(PORT, () => {
  logger.info(`Express health-check server running on port ${PORT}`);
  logger.info('ATMOVERSE Bot is live and polling for messages ✅');
});

// ── Graceful shutdown ──────────────────────────
const shutdown = async (signal) => {
  logger.info(`Received ${signal} — shutting down gracefully...`);
  bot.stopPolling();
  process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Catch unhandled promise rejections
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Promise Rejection:', reason);
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});
