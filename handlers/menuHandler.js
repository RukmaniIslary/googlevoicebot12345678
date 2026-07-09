// ─────────────────────────────────────────────
//  ATMOVERSE BOT — Menu / Callback Query Handler
// ─────────────────────────────────────────────

const path = require('path');
const fs = require('fs');
const { mainMenuKeyboard } = require('../buttons/mainMenu');
const {
  productsKeyboard,
  faqKeyboard,
  orderKeyboard,
  contactKeyboard,
  backKeyboard,
} = require('../buttons/subMenus');

// ── Text content for each menu ─────────────────

const TEXTS = {
  welcome: (firstName) =>
    `👋 Welcome to *ATMOVERSE*, ${firstName || 'there'}!\n\n` +
    `We provide premium digital accounts with:\n` +
    `✅ Full Account Access\n` +
    `✅ Verified Accounts\n` +
    `✅ Instant Delivery\n` +
    `✅ Secure Transactions\n\n` +
    `How can we help you today?`,

  products:
    `🛒 *Our Products*\n\n` +
    `Choose a product to learn more:`,

  product_new_gv:
    `🇺🇸 *Google Voice Account (New)*\n\n` +
    `💰 Price: *$20 USD*\n\n` +
    `📋 *Features:*\n` +
    `• Brand new, never-used number\n` +
    `• Full account access\n` +
    `• Verified & ready to use\n` +
    `• Instant delivery after payment\n` +
    `• Replacement available\n\n` +
    `📦 Ready to order? Contact us below!`,

  product_old_gv:
    `🇺🇸 *Google Voice Account (Old)*\n\n` +
    `💰 Price: *$25 USD*\n\n` +
    `📋 *Features:*\n` +
    `• Aged account with history\n` +
    `• Higher trust score\n` +
    `• Full account access\n` +
    `• Verified & ready to use\n` +
    `• Instant delivery after payment\n` +
    `• Replacement available\n\n` +
    `📦 Ready to order? Contact us below!`,

  product_gmail:
    `📧 *USA Gmail Account (HQ)*\n\n` +
    `💰 Price: *$5 USD*\n\n` +
    `📋 *Features:*\n` +
    `• High-quality USA Gmail account\n` +
    `• Full account access\n` +
    `• Phone-verified\n` +
    `• Instant delivery after payment\n` +
    `• Replacement available\n\n` +
    `📦 Ready to order? Contact us below!`,

  pricing:
    `💰 *Pricing List*\n\n` +
    `┌─────────────────────────────┐\n` +
    `│ 🇺🇸 New Google Voice  $20 USD │\n` +
    `│ 🇺🇸 Old Google Voice  $25 USD │\n` +
    `│ 📧 USA Gmail HQ       $5 USD  │\n` +
    `└─────────────────────────────┘\n\n` +
    `All prices are in USD. Payment is accepted via UPI, USDT, Bitcoin & Binance Pay.`,

  areacodes:
    `📍 *Area Code Lookup*\n\n` +
    `Type any 3-digit US area code and I'll check if it's available.\n\n` +
    `*Example:* Type \`347\` to check New York area code.\n\n` +
    `📝 Simply send the 3-digit number in the chat below.`,

  payments:
    `💳 *Payment Methods*\n\n` +
    `We accept the following payment methods.\n` +
    `Tap any method to get the payment details:\n\n` +
    `🏦 *UPI* — India UPI transfers\n` +
    `🪙 *USDT (TRC20)* — Tron network\n` +
    `🪙 *USDT (BEP20)* — BSC network`,

  pay_upi:
    `🏦 *UPI Payment Details*\n\n` +
    `Send payment to the UPI ID below:\n\n` +
    `┌─────────────────────────────┐\n` +
    `│  📱 UPI ID:                 │\n` +
    `│  \`rajiv.bordoloi@ptaxis\`    │\n` +
    `└─────────────────────────────┘\n\n` +
    `👤 *Name:* Samarjit Bordoloi\n\n` +
    `✅ Works with *Paytm, PhonePe, GPay, BHIM* & all UPI apps.\n\n` +
    `⚠️ After payment, send the screenshot to @atmoverse to confirm your order.`,

  pay_usdt_trc20:
    `🪙 *USDT (TRC20) Payment Details*\n\n` +
    `Send USDT on the *Tron (TRC20)* network to:\n\n` +
    `\`TVHeNRpD6TffHEPvkmWEDUHiVSqwTApkKs\`\n\n` +
    `⚠️ *Only send USDT via TRC20 network.*\n` +
    `Sending on the wrong network will result in loss of funds.\n\n` +
    `After payment, send the *Transaction Hash (TxID)* to @atmoverse to confirm your order.`,

  pay_usdt_bep20:
    `🪙 *USDT (BEP20) Payment Details*\n\n` +
    `Send USDT on the *BSC (BEP20)* network to:\n\n` +
    `\`0xf2db22a33bd64e734146229ba3c95813bdf28f7d\`\n\n` +
    `⚠️ *Only send USDT via BEP20 (BSC) network.*\n` +
    `Sending on the wrong network will result in loss of funds.\n\n` +
    `After payment, send the *Transaction Hash (TxID)* to @atmoverse to confirm your order.`,

  order:
    `📦 *Place an Order*\n\n` +
    `To place an order, contact us directly:\n\n` +
    `• Tell us which product you want\n` +
    `• Confirm your preferred payment method\n` +
    `• Receive your account instantly after payment ⚡\n\n` +
    `👇 Tap a button below to reach us:`,

  faq: `❓ *Frequently Asked Questions*\n\nSelect a topic:`,

  faq_delivery:
    `⏱ *Delivery Time*\n\n` +
    `All accounts are delivered *instantly* after payment confirmation.\n\n` +
    `• Payment confirmed → Account delivered in minutes\n` +
    `• Available 24/7\n` +
    `• No waiting, no delays\n\n` +
    `_For any delays, contact @atmoverse immediately._`,

  faq_replacement:
    `🔄 *Replacement Policy*\n\n` +
    `We offer *free replacement* if:\n\n` +
    `• The account stops working after purchase\n` +
    `• The account doesn't match the description\n` +
    `• There's a login issue on our end\n\n` +
    `⚠️ *Not covered:*\n` +
    `• Accounts banned due to your own activities\n` +
    `• Password changes made by you\n\n` +
    `Contact @atmoverse within 24 hours of purchase for replacements.`,

  faq_access:
    `🔑 *Account Access*\n\n` +
    `All accounts come with:\n\n` +
    `• ✅ Full login credentials (email + password)\n` +
    `• ✅ Recovery options where applicable\n` +
    `• ✅ Complete account control\n\n` +
    `You will receive everything needed to access and use the account immediately.`,

  faq_verification:
    `✅ *Account Verification*\n\n` +
    `All our accounts are:\n\n` +
    `• Phone-verified with real US numbers\n` +
    `• Manually checked before delivery\n` +
    `• Tested to ensure they are working\n\n` +
    `We guarantee all accounts are legitimate and functional at the time of delivery.`,

  contact:
    `📞 *Contact Support*\n\n` +
    `Our team is available 24/7 to assist you.\n\n` +
    `Reach us on your preferred platform:`,
};

// ── Handler function ───────────────────────────

/**
 * Handle all callback_query events from inline keyboard buttons.
 */
async function handleCallbackQuery(bot, query) {
  const chatId = query.message.chat.id;
  const messageId = query.message.message_id;
  const data = query.data;

  // Always acknowledge the callback to remove the loading spinner
  await bot.answerCallbackQuery(query.id);

  // Helper: edit the existing message
  const edit = (text, keyboard) =>
    bot.editMessageText(text, {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: 'Markdown',
      reply_markup: keyboard,
    });

  switch (data) {
    // ── Main Menu ──────────────────────────────
    case 'back_main':
      await edit(
        `🏠 *Main Menu*\n\nHow can we help you today?`,
        mainMenuKeyboard
      );
      break;

    // ── Products ──────────────────────────────
    case 'menu_products':
      await edit(TEXTS.products, productsKeyboard);
      break;

    case 'product_new_gv':
      await edit(TEXTS.product_new_gv, {
        inline_keyboard: [
          [{ text: '📦 Order This', callback_data: 'menu_order' }],
          [{ text: '⬅ Back to Products', callback_data: 'menu_products' }],
          [{ text: '🏠 Main Menu', callback_data: 'back_main' }],
        ],
      });
      break;

    case 'product_old_gv':
      await edit(TEXTS.product_old_gv, {
        inline_keyboard: [
          [{ text: '📦 Order This', callback_data: 'menu_order' }],
          [{ text: '⬅ Back to Products', callback_data: 'menu_products' }],
          [{ text: '🏠 Main Menu', callback_data: 'back_main' }],
        ],
      });
      break;

    case 'product_gmail':
      await edit(TEXTS.product_gmail, {
        inline_keyboard: [
          [{ text: '📦 Order This', callback_data: 'menu_order' }],
          [{ text: '⬅ Back to Products', callback_data: 'menu_products' }],
          [{ text: '🏠 Main Menu', callback_data: 'back_main' }],
        ],
      });
      break;

    // ── Pricing ───────────────────────────────
    case 'menu_pricing':
      await edit(TEXTS.pricing, backKeyboard);
      break;

    // ── Area Codes ────────────────────────────
    case 'menu_areacodes':
      await edit(TEXTS.areacodes, backKeyboard);
      break;

    // ── Payments ──────────────────────────────
    case 'menu_payments':
      await edit(TEXTS.payments, {
        inline_keyboard: [
          [{ text: '🏦 UPI', callback_data: 'pay_upi' }],
          [
            { text: '🪙 USDT TRC20', callback_data: 'pay_usdt_trc20' },
            { text: '🪙 USDT BEP20', callback_data: 'pay_usdt_bep20' },
          ],
          [{ text: '📦 Order Now', callback_data: 'menu_order' }],
          [{ text: '⬅ Back to Menu', callback_data: 'back_main' }],
        ],
      });
      break;

    // ── Payment Details ────────────────────────
    case 'pay_upi': {
      const qrPath = path.join(__dirname, '..', 'assets', 'upi-qr.jpeg');
      const backKeyboardUpi = {
        inline_keyboard: [
          [{ text: '📦 Order Now', callback_data: 'menu_order' }],
          [{ text: '⬅ Back to Payments', callback_data: 'menu_payments' }],
          [{ text: '🏠 Main Menu', callback_data: 'back_main' }],
        ],
      };

      // Delete the old message first, then send photo + caption
      try {
        await bot.deleteMessage(chatId, messageId);
      } catch (_) { /* ignore if already deleted */ }

      if (fs.existsSync(qrPath)) {
        await bot.sendPhoto(chatId, qrPath, {
          caption: TEXTS.pay_upi,
          parse_mode: 'Markdown',
          reply_markup: backKeyboardUpi,
        });
      } else {
        // Fallback: no QR file found, send text only
        await bot.sendMessage(chatId, TEXTS.pay_upi, {
          parse_mode: 'Markdown',
          reply_markup: backKeyboardUpi,
        });
      }
      break;
    }

    case 'pay_usdt_trc20': {
      const trc20QrPath = path.join(__dirname, '..', 'assets', 'usdt-trc20-qr.jpeg');
      const backKeyboardTrc20 = {
        inline_keyboard: [
          [{ text: '📦 Order Now', callback_data: 'menu_order' }],
          [{ text: '⬅ Back to Payments', callback_data: 'menu_payments' }],
          [{ text: '🏠 Main Menu', callback_data: 'back_main' }],
        ],
      };
      try { await bot.deleteMessage(chatId, messageId); } catch (_) {}
      if (fs.existsSync(trc20QrPath)) {
        await bot.sendPhoto(chatId, trc20QrPath, {
          caption: TEXTS.pay_usdt_trc20,
          parse_mode: 'Markdown',
          reply_markup: backKeyboardTrc20,
        });
      } else {
        await bot.sendMessage(chatId, TEXTS.pay_usdt_trc20, {
          parse_mode: 'Markdown',
          reply_markup: backKeyboardTrc20,
        });
      }
      break;
    }

    case 'pay_usdt_bep20': {
      const bep20QrPath = path.join(__dirname, '..', 'assets', 'usdt-bep20-qr.jpeg');
      const backKeyboardBep20 = {
        inline_keyboard: [
          [{ text: '📦 Order Now', callback_data: 'menu_order' }],
          [{ text: '⬅ Back to Payments', callback_data: 'menu_payments' }],
          [{ text: '🏠 Main Menu', callback_data: 'back_main' }],
        ],
      };
      try { await bot.deleteMessage(chatId, messageId); } catch (_) {}
      if (fs.existsSync(bep20QrPath)) {
        await bot.sendPhoto(chatId, bep20QrPath, {
          caption: TEXTS.pay_usdt_bep20,
          parse_mode: 'Markdown',
          reply_markup: backKeyboardBep20,
        });
      } else {
        await bot.sendMessage(chatId, TEXTS.pay_usdt_bep20, {
          parse_mode: 'Markdown',
          reply_markup: backKeyboardBep20,
        });
      }
      break;
    }

    // ── Order ─────────────────────────────────
    case 'menu_order':
      await edit(TEXTS.order, orderKeyboard);
      break;

    // ── FAQ ───────────────────────────────────
    case 'menu_faq':
      await edit(TEXTS.faq, faqKeyboard);
      break;

    case 'faq_delivery':
      await edit(TEXTS.faq_delivery, {
        inline_keyboard: [
          [{ text: '⬅ Back to FAQ', callback_data: 'menu_faq' }],
          [{ text: '🏠 Main Menu', callback_data: 'back_main' }],
        ],
      });
      break;

    case 'faq_replacement':
      await edit(TEXTS.faq_replacement, {
        inline_keyboard: [
          [{ text: '⬅ Back to FAQ', callback_data: 'menu_faq' }],
          [{ text: '🏠 Main Menu', callback_data: 'back_main' }],
        ],
      });
      break;

    case 'faq_access':
      await edit(TEXTS.faq_access, {
        inline_keyboard: [
          [{ text: '⬅ Back to FAQ', callback_data: 'menu_faq' }],
          [{ text: '🏠 Main Menu', callback_data: 'back_main' }],
        ],
      });
      break;

    case 'faq_verification':
      await edit(TEXTS.faq_verification, {
        inline_keyboard: [
          [{ text: '⬅ Back to FAQ', callback_data: 'menu_faq' }],
          [{ text: '🏠 Main Menu', callback_data: 'back_main' }],
        ],
      });
      break;

    // ── Contact ───────────────────────────────
    case 'menu_contact':
      await edit(TEXTS.contact, contactKeyboard);
      break;

    default:
      await bot.answerCallbackQuery(query.id, {
        text: 'Unknown action. Please try again.',
        show_alert: false,
      });
  }
}

module.exports = { handleCallbackQuery, TEXTS };
