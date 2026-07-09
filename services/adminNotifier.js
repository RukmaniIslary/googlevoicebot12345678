// ─────────────────────────────────────────────
//  ATMOVERSE BOT — Admin Notification Service
// ─────────────────────────────────────────────

const { TRIGGER_KEYWORDS } = require('../config/constants');
const logger = require('../utils/logger');

/**
 * Check if a message contains any trigger keywords (case-insensitive).
 */
function hasTriggerKeyword(text) {
  const lower = text.toLowerCase();
  return TRIGGER_KEYWORDS.some((kw) => lower.includes(kw));
}

/**
 * Send an alert to the admin chat when a user shows purchase intent.
 *
 * @param {Object} bot       - node-telegram-bot-api instance
 * @param {Object} from      - Telegram user object
 * @param {string} message   - The message text that triggered the alert
 */
async function notifyAdmin(bot, from, message) {
  const adminChatId = process.env.ADMIN_CHAT_ID;

  if (!adminChatId) {
    logger.warn('ADMIN_CHAT_ID not set — skipping admin notification');
    return;
  }

  const name = [from.first_name, from.last_name].filter(Boolean).join(' ') || 'N/A';
  const username = from.username ? `@${from.username}` : 'No username';
  const userId = from.id;

  const alertText =
    `🔔 *New Purchase Intent Alert!*\n\n` +
    `👤 *Name:* ${escapeMarkdown(name)}\n` +
    `🔗 *Username:* ${escapeMarkdown(username)}\n` +
    `🆔 *Telegram ID:* \`${userId}\`\n` +
    `💬 *Message:*\n_${escapeMarkdown(message)}_\n\n` +
    `👆 Tap the ID to open a chat with them.`;

  try {
    await bot.sendMessage(adminChatId, alertText, { parse_mode: 'Markdown' });
    logger.info(`Admin notified about user ${userId} (${username})`);
  } catch (err) {
    logger.error('Failed to send admin notification:', err.message);
  }
}

/**
 * Escape special Markdown v1 characters.
 */
function escapeMarkdown(text) {
  return String(text).replace(/([_*[\]()~`>#+\-=|{}.!])/g, '\\$1');
}

module.exports = { hasTriggerKeyword, notifyAdmin };
