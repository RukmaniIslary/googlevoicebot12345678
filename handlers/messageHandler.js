// ─────────────────────────────────────────────
//  ATMOVERSE BOT — Incoming Message Handler
// ─────────────────────────────────────────────

const { mainMenuKeyboard } = require('../buttons/mainMenu');
const { backKeyboard } = require('../buttons/subMenus');
const { askNvidia } = require('../services/nvidiaService');
const { hasTriggerKeyword, notifyAdmin } = require('../services/adminNotifier');
const { addMessage, getHistory } = require('../utils/memory');
const { isAreaCode, lookupAreaCode } = require('../utils/areaCodeLookup');
const { TEXTS } = require('./menuHandler');
const logger = require('../utils/logger');

/**
 * Handle all plain text messages.
 * Priority:
 *   1. /start command → Welcome message
 *   2. 3-digit area code → Area code lookup
 *   3. Everything else → NVIDIA NIM AI response
 */
async function handleMessage(bot, msg) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const text = (msg.text || '').trim();

  if (!text) return;

  // Always show typing indicator first
  await bot.sendChatAction(chatId, 'typing');

  // ── 1. Start / Restart ──────────────────────
  if (text === '/start' || text.toLowerCase() === 'start') {
    const firstName = msg.from.first_name || 'there';

    await bot.sendMessage(chatId, TEXTS.welcome(firstName), {
      parse_mode: 'Markdown',
      reply_markup: mainMenuKeyboard,
    });

    logger.info(`User ${userId} started the bot`);
    return;
  }

  // ── 2. Area Code Lookup ─────────────────────
  if (isAreaCode(text)) {
    const result = lookupAreaCode(text);

    await bot.sendMessage(chatId, result, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '📦 Order Now', callback_data: 'menu_order' }],
          [{ text: '🏠 Main Menu', callback_data: 'back_main' }],
        ],
      },
    });

    logger.info(`User ${userId} looked up area code: ${text}`);
    return;
  }

  // ── 3. Admin Notification Check ─────────────
  if (hasTriggerKeyword(text)) {
    // Fire and forget — don't await to keep bot responsive
    notifyAdmin(bot, msg.from, text).catch((err) =>
      logger.error('Admin notification failed:', err.message)
    );
  }

  // ── 4. AI Chat via NVIDIA NIM ───────────────
  try {
    const history = getHistory(userId);
    const aiResponse = await askNvidia(history, text);

    // Store both sides of the conversation
    addMessage(userId, 'user', text);
    addMessage(userId, 'assistant', aiResponse);

    await bot.sendMessage(chatId, aiResponse, {
      parse_mode: 'Markdown',
      reply_markup: backKeyboard,
    });

    logger.info(`AI replied to user ${userId}`);
  } catch (err) {
    logger.error(`Error handling message from ${userId}:`, err.message);

    await bot.sendMessage(
      chatId,
      `⚠️ Something went wrong. Please try again or contact us directly:\n\n• Telegram: @atmoverse\n• WhatsApp: https://wa.me/19152481421`,
      { reply_markup: mainMenuKeyboard }
    );
  }
}

module.exports = { handleMessage };
