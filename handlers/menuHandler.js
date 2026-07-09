// ─────────────────────────────────────────────
//  ATMOVERSE BOT — Menu / Callback Query Handler
// ─────────────────────────────────────────────

const path = require('path');
const fs = require('fs');
const { mainMenuKeyboard } = require('../buttons/mainMenu');
const { productsKeyboard, faqKeyboard, backKeyboard } = require('../buttons/subMenus');

// ── Available area codes for GV ───────────────
const AVAILABLE_CODES = [
  { code: '201', label: '201 – New Jersey' },
  { code: '202', label: '202 – Washington, DC' },
  { code: '205', label: '205 – Alabama' },
  { code: '206', label: '206 – Seattle, WA' },
  { code: '209', label: '209 – California' },
  { code: '213', label: '213 – Los Angeles, CA' },
  { code: '214', label: '214 – Dallas, TX' },
  { code: '224', label: '224 – Illinois' },
  { code: '240', label: '240 – Maryland' },
  { code: '267', label: '267 – Philadelphia, PA' },
  { code: '305', label: '305 – Miami, FL' },
  { code: '310', label: '310 – Los Angeles, CA' },
  { code: '312', label: '312 – Chicago, IL' },
  { code: '347', label: '347 – New York, NY' },
  { code: '404', label: '404 – Atlanta, GA' },
  { code: '415', label: '415 – San Francisco, CA' },
  { code: '469', label: '469 – Texas' },
  { code: '510', label: '510 – Oakland, CA' },
  { code: '516', label: '516 – New York' },
  { code: '551', label: '551 – New Jersey' },
  { code: '602', label: '602 – Phoenix, AZ' },
  { code: '617', label: '617 – Boston, MA' },
  { code: '646', label: '646 – New York, NY' },
  { code: '702', label: '702 – Las Vegas, NV' },
  { code: '713', label: '713 – Houston, TX' },
  { code: '718', label: '718 – New York, NY' },
  { code: '786', label: '786 – Miami, FL' },
  { code: '818', label: '818 – Los Angeles, CA' },
  { code: '917', label: '917 – New York, NY' },
  { code: '929', label: '929 – New York, NY' },
];

// ── Build area code keyboard (2 per row) ─────
function buildAreaCodeKeyboard(productKey) {
  const rows = [];
  for (let i = 0; i < AVAILABLE_CODES.length; i += 2) {
    const row = [];
    row.push({
      text: `+1 (${AVAILABLE_CODES[i].code})`,
      callback_data: `code_${productKey}_${AVAILABLE_CODES[i].code}`,
    });
    if (AVAILABLE_CODES[i + 1]) {
      row.push({
        text: `+1 (${AVAILABLE_CODES[i + 1].code})`,
        callback_data: `code_${productKey}_${AVAILABLE_CODES[i + 1].code}`,
      });
    }
    rows.push(row);
  }
  rows.push([{ text: '⬅ Back to Products', callback_data: 'menu_products' }]);
  rows.push([{ text: '🏠 Main Menu', callback_data: 'back_main' }]);
  return { inline_keyboard: rows };
}

// ── Payment keyboard ──────────────────────────
function paymentKeyboard(productKey, areaCode) {
  return {
    inline_keyboard: [
      [{ text: '🏦 UPI', callback_data: `pay_upi_${productKey}_${areaCode}` }],
      [
        { text: '🪙 USDT TRC20', callback_data: `pay_trc20_${productKey}_${areaCode}` },
        { text: '🪙 USDT BEP20', callback_data: `pay_bep20_${productKey}_${areaCode}` },
      ],
      [{ text: '⬅ Back', callback_data: `area_${productKey}` }],
      [{ text: '🏠 Main Menu', callback_data: 'back_main' }],
    ],
  };
}

// ── After payment keyboard ────────────────────
const afterPayKeyboard = {
  inline_keyboard: [
    [{ text: '✅ Paid', callback_data: 'paid' }],
    [{ text: '❌ Cancel', callback_data: 'cancel_order' }],
  ],
};

// ── Send QR photo or text fallback ────────────
async function sendPayment(bot, chatId, messageId, qrFile, text) {
  const qrPath = path.join(__dirname, '..', 'assets', qrFile);
  try { await bot.deleteMessage(chatId, messageId); } catch (_) {}
  if (fs.existsSync(qrPath)) {
    await bot.sendPhoto(chatId, qrPath, {
      caption: text,
      parse_mode: 'Markdown',
      reply_markup: afterPayKeyboard,
    });
  } else {
    await bot.sendMessage(chatId, text, {
      parse_mode: 'Markdown',
      reply_markup: afterPayKeyboard,
    });
  }
}

// ── Product info ──────────────────────────────
const PRODUCTS = {
  new_gv: { name: 'New Google Voice', price: '$20 USD', emoji: '🇺🇸' },
  old_gv: { name: 'Old Google Voice', price: '$25 USD', emoji: '🇺🇸' },
  gmail:  { name: 'USA Gmail HQ',     price: '$5 USD',  emoji: '📧' },
};

// ── Texts ─────────────────────────────────────
const TEXTS = {
  welcome: (firstName) =>
    `👋 *Welcome to Google Voice Vendor!*\n\n` +
    `We provide premium digital accounts with:\n` +
    `✅ Full Account Access\n` +
    `✅ Verified Accounts\n` +
    `✅ Instant Delivery\n` +
    `✅ Secure Transactions\n\n` +
    `How can we help you today?`,

  products: `🛒 *Our Products*\n\nChoose a product:`,

  product_new_gv:
    `🇺🇸 *Google Voice Account (New)*\n\n` +
    `💰 Price: *$20 USD*\n\n` +
    `• Brand new, never-used number\n` +
    `• Full account access\n` +
    `• Verified & ready to use\n` +
    `• Instant delivery after payment\n` +
    `• Replacement available\n\n` +
    `📍 *Select your preferred area code:*`,

  product_old_gv:
    `🇺🇸 *Google Voice Account (Old)*\n\n` +
    `💰 Price: *$25 USD*\n\n` +
    `• Aged account with history\n` +
    `• Higher trust score\n` +
    `• Full account access\n` +
    `• Instant delivery after payment\n` +
    `• Replacement available\n\n` +
    `📍 *Select your preferred area code:*`,

  product_gmail:
    `📧 *USA Gmail Account (HQ)*\n\n` +
    `💰 Price: *$5 USD*\n\n` +
    `• High-quality USA Gmail\n` +
    `• Full account access\n` +
    `• Phone-verified\n` +
    `• Instant delivery after payment\n` +
    `• Replacement available\n\n` +
    `💳 *Select your payment method:*`,

  pricing:
    `💰 *Pricing List*\n\n` +
    `┌──────────────────────────────┐\n` +
    `│ 🇺🇸 New Google Voice  $20 USD │\n` +
    `│ 🇺🇸 Old Google Voice  $25 USD │\n` +
    `│ 📧 USA Gmail HQ        $5 USD │\n` +
    `└──────────────────────────────┘\n\n` +
    `All prices are in USD.`,

  areacodes:
    `📍 *Available Area Codes*\n\n` +
    AVAILABLE_CODES.map(c => `+1 (${c.code}) — ${c.label.split('– ')[1]}`).join('\n') +
    `\n\n_Type any code to check availability._`,

  faq: `❓ *Frequently Asked Questions*\n\nSelect a topic:`,

  faq_delivery:
    `⏱ *Delivery Time*\n\n` +
    `All accounts delivered *instantly* after payment.\n\n` +
    `• Available 24/7\n` +
    `• No waiting, no delays\n\n` +
    `_For delays, contact @atmoverse._`,

  faq_replacement:
    `🔄 *Replacement Policy*\n\n` +
    `Free replacement if:\n` +
    `• Account stops working\n` +
    `• Doesn't match description\n\n` +
    `⚠️ Not covered if banned due to your activities.\n\n` +
    `Contact @atmoverse within 24 hours.`,

  faq_access:
    `🔑 *Account Access*\n\n` +
    `• ✅ Full login credentials\n` +
    `• ✅ Recovery options\n` +
    `• ✅ Complete account control`,

  faq_verification:
    `✅ *Verification*\n\n` +
    `• Phone-verified with real US numbers\n` +
    `• Manually tested before delivery\n` +
    `• Guaranteed working at delivery`,

  contact: `📞 *Contact Support*\n\nWe're available 24/7:`,
};

// ── Main handler ──────────────────────────────
async function handleCallbackQuery(bot, query) {
  const chatId = query.message.chat.id;
  const messageId = query.message.message_id;
  const data = query.data;

  await bot.answerCallbackQuery(query.id);

  const edit = (text, keyboard) =>
    bot.editMessageText(text, {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: 'Markdown',
      reply_markup: keyboard,
    });

  // ── Area code selection: area_<product> ──────
  if (data.startsWith('area_')) {
    const productKey = data.replace('area_', '');
    const textKey = `product_${productKey}`;
    await edit(TEXTS[textKey] || `📍 Select your area code:`, buildAreaCodeKeyboard(productKey));
    return;
  }

  // ── Code selected: code_<product>_<code> ─────
  if (data.startsWith('code_')) {
    const parts = data.split('_');
    const areaCode = parts[parts.length - 1];
    const productKey = parts.slice(1, -1).join('_');
    const product = PRODUCTS[productKey];
    const codeInfo = AVAILABLE_CODES.find(c => c.code === areaCode);
    const location = codeInfo ? codeInfo.label.split('– ')[1] : areaCode;

    await edit(
      `✅ *Area Code Selected*\n\n` +
      `📍 *+1 (${areaCode})* — ${location}\n` +
      `📦 *Product:* ${product?.emoji || ''} ${product?.name || productKey}\n` +
      `💰 *Price:* ${product?.price || ''}\n\n` +
      `💳 *Now select your payment method:*`,
      paymentKeyboard(productKey, areaCode)
    );
    return;
  }

  // ── Payment with product+code: pay_<method>_<product>_<code> ──
  if (data.startsWith('pay_upi_') || data.startsWith('pay_trc20_') || data.startsWith('pay_bep20_')) {
    const parts = data.split('_');
    const method = parts[1]; // upi / trc20 / bep20
    const areaCode = parts[parts.length - 1];
    const productKey = parts.slice(2, -1).join('_');
    const product = PRODUCTS[productKey];
    const codeInfo = AVAILABLE_CODES.find(c => c.code === areaCode);
    const location = codeInfo ? codeInfo.label.split('– ')[1] : areaCode;

    const orderSummary =
      `📦 *Order Summary*\n` +
      `• Product: ${product?.emoji || ''} ${product?.name || productKey}\n` +
      `• Area Code: +1 (${areaCode}) — ${location}\n` +
      `• Price: ${product?.price || ''}\n\n`;

    if (method === 'upi') {
      await sendPayment(bot, chatId, messageId, 'upi-qr.jpeg',
        orderSummary +
        `🏦 *UPI Payment*\n\n` +
        `📱 *UPI ID:* \`rajiv.bordoloi@ptaxis\`\n` +
        `👤 *Name:* Samarjit Bordoloi\n\n` +
        `✅ Works with Paytm, PhonePe, GPay, BHIM.`
      );
    } else if (method === 'trc20') {
      await sendPayment(bot, chatId, messageId, 'usdt-trc20-qr.jpeg',
        orderSummary +
        `🪙 *USDT TRC20 Payment*\n\n` +
        `\`TVHeNRpD6TffHEPvkmWEDUHiVSqwTApkKs\`\n\n` +
        `⚠️ *TRC20 network only.* Wrong network = lost funds.`
      );
    } else if (method === 'bep20') {
      await sendPayment(bot, chatId, messageId, 'usdt-bep20-qr.jpeg',
        orderSummary +
        `🪙 *USDT BEP20 Payment*\n\n` +
        `\`0xf2db22a33bd64e734146229ba3c95813bdf28f7d\`\n\n` +
        `⚠️ *BEP20 network only.* Wrong network = lost funds.`
      );
    }
    return;
  }

  // ── Standard menu cases ───────────────────────
  switch (data) {
    case 'back_main':
      await edit(`🏠 *Main Menu*\n\nHow can we help you today?`, mainMenuKeyboard);
      break;

    case 'paid':
      await bot.answerCallbackQuery(query.id, {
        text: '✅ Thank you! We will process your order shortly.',
        show_alert: true,
      });
      break;

    case 'cancel_order':
      try { await bot.deleteMessage(chatId, messageId); } catch (_) {}
      await bot.sendMessage(chatId,
        `❌ *Order Cancelled*\n\nNo problem! Come back anytime.`,
        {
          parse_mode: 'Markdown',
          reply_markup: mainMenuKeyboard,
        }
      );
      break;

    case 'menu_products':
      await edit(TEXTS.products, productsKeyboard);
      break;

    // Products → area code selection
    case 'product_new_gv':
      await edit(TEXTS.product_new_gv, buildAreaCodeKeyboard('new_gv'));
      break;

    case 'product_old_gv':
      await edit(TEXTS.product_old_gv, buildAreaCodeKeyboard('old_gv'));
      break;

    // Gmail has no area code — go straight to payment
    case 'product_gmail':
      await edit(TEXTS.product_gmail, {
        inline_keyboard: [
          [{ text: '🏦 UPI', callback_data: 'pay_upi_gmail_0' }],
          [
            { text: '🪙 USDT TRC20', callback_data: 'pay_trc20_gmail_0' },
            { text: '🪙 USDT BEP20', callback_data: 'pay_bep20_gmail_0' },
          ],
          [{ text: '⬅ Back to Products', callback_data: 'menu_products' }],
          [{ text: '🏠 Main Menu', callback_data: 'back_main' }],
        ],
      });
      break;

    case 'menu_pricing':
      await edit(TEXTS.pricing, {
        inline_keyboard: [
          [{ text: '🛒 Buy Now', callback_data: 'menu_products' }],
          [{ text: '⬅ Back to Menu', callback_data: 'back_main' }],
        ],
      });
      break;

    case 'menu_areacodes':
      await edit(TEXTS.areacodes, backKeyboard);
      break;

    case 'menu_payments':
      await edit(`💳 *Payment Methods*\n\nSelect a product first to pay:`, productsKeyboard);
      break;

    case 'menu_order':
      await edit(`📦 *Place an Order*\n\nSelect a product to get started:`, productsKeyboard);
      break;

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

    case 'menu_contact':
      await edit(TEXTS.contact, {
        inline_keyboard: [
          [{ text: '💬 Telegram: @atmoverse', url: 'https://t.me/atmoverse' }],
          [{ text: '📱 WhatsApp', url: 'https://wa.me/19152481421' }],
          [{ text: '⬅ Back to Menu', callback_data: 'back_main' }],
        ],
      });
      break;

    default:
      await bot.answerCallbackQuery(query.id, { text: 'Unknown action.', show_alert: false });
  }
}

module.exports = { handleCallbackQuery, TEXTS };
