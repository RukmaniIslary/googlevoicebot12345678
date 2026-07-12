// ─────────────────────────────────────────────
//  ATMOVERSE BOT — Menu / Callback Query Handler
// ─────────────────────────────────────────────

const path = require('path');
const fs = require('fs');
const { mainMenuKeyboard } = require('../buttons/mainMenu');
const { faqKeyboard, backKeyboard } = require('../buttons/subMenus');
const { getProducts, getProduct, getPayments } = require('../utils/store');

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

// ── GV product keys (require area code selection) ──
const GV_PRODUCTS = ['new_gv', 'old_gv'];

// ── Dynamic products keyboard ─────────────────
function buildProductsKeyboard() {
  const products = getProducts();
  const rows = Object.entries(products).map(([key, p]) => ([{
    text: `${p.emoji} ${p.name} — $${p.price} USD${p.inStock ? '' : ' ❌'}`,
    callback_data: `product_${key}`,
  }]));
  rows.push([{ text: '⬅ Back to Menu', callback_data: 'back_main' }]);
  return { inline_keyboard: rows };
}

// ── Dynamic pricing text ───────────────────────
function buildPricingText() {
  const products = getProducts();
  const lines = Object.values(products).map(p =>
    `${p.emoji} *${p.name}* — $${p.price} USD${p.inStock ? '' : ' ❌ Out of Stock'}`
  );
  return `💰 *Pricing List*\n\n${lines.join('\n')}\n\n_All prices are in USD._`;
}

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

// ── Quantity keyboard ─────────────────────────
function quantityKeyboard(productKey, areaCode) {
  const isGV = GV_PRODUCTS.includes(productKey);
  return {
    inline_keyboard: [
      [
        { text: '1️⃣', callback_data: `qty_${productKey}_${areaCode}_1` },
        { text: '2️⃣', callback_data: `qty_${productKey}_${areaCode}_2` },
        { text: '3️⃣', callback_data: `qty_${productKey}_${areaCode}_3` },
      ],
      [
        { text: '4️⃣', callback_data: `qty_${productKey}_${areaCode}_4` },
        { text: '5️⃣', callback_data: `qty_${productKey}_${areaCode}_5` },
      ],
      [{ text: '⬅ Back', callback_data: isGV ? `area_${productKey}` : `product_${productKey}` }],
      [{ text: '🏠 Main Menu', callback_data: 'back_main' }],
    ],
  };
}

// ── Payment keyboard ──────────────────────────
function paymentKeyboard(productKey, areaCode, qty) {
  const q = qty || 1;
  return {
    inline_keyboard: [
      [{ text: '🏦 UPI', callback_data: `pay_upi_${productKey}_${areaCode}_${q}` }],
      [
        { text: '🪙 USDT TRC20', callback_data: `pay_trc20_${productKey}_${areaCode}_${q}` },
        { text: '🪙 USDT BEP20', callback_data: `pay_bep20_${productKey}_${areaCode}_${q}` },
      ],
      [{ text: '⬅ Back', callback_data: `qty_back_${productKey}_${areaCode}` }],
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
    `_For delays, contact @Loikye._`,

  faq_replacement:
    `🔄 *Replacement Policy*\n\n` +
    `Free replacement if:\n` +
    `• Account stops working\n` +
    `• Doesn't match description\n\n` +
    `⚠️ Not covered if banned due to your activities.\n\n` +
    `Contact @Loikye within 24 hours.`,

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

// ── Build product detail text ─────────────────
function buildProductText(key, p) {
  const descLines = (p.description || '').split('\n').map(l => `• ${l}`).join('\n');
  const isGV = GV_PRODUCTS.includes(key);
  const footer = isGV ? `📍 *Select your preferred area code:*` : `🔢 *How many do you want?*`;
  const stockLine = p.inStock ? '' : `\n⚠️ *Currently Out of Stock*\n`;
  return (
    `${p.emoji} *${p.name}*\n\n` +
    `💰 Price: *$${p.price} USD*\n` +
    stockLine + `\n` +
    descLines + `\n\n` +
    footer
  );
}

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
    const p = getProduct(productKey);
    await edit(buildProductText(productKey, p), buildAreaCodeKeyboard(productKey));
    return;
  }

  // ── Code selected: code_<product>_<code> ─────
  if (data.startsWith('code_')) {
    const parts = data.split('_');
    const areaCode = parts[parts.length - 1];
    const productKey = parts.slice(1, -1).join('_');
    const p = getProduct(productKey);
    const codeInfo = AVAILABLE_CODES.find(c => c.code === areaCode);
    const location = codeInfo ? codeInfo.label.split('– ')[1] : areaCode;

    await edit(
      `✅ *Area Code Selected*\n\n` +
      `📍 *+1 (${areaCode})* — ${location}\n` +
      `📦 *Product:* ${p?.emoji || ''} ${p?.name || productKey}\n` +
      `💰 *Price:* $${p?.price || ''} USD\n\n` +
      `🔢 *How many do you want?*`,
      quantityKeyboard(productKey, areaCode)
    );
    return;
  }

  // ── Quantity back navigation: qty_back_<product>_<code> ──
  if (data.startsWith('qty_back_')) {
    const inner = data.replace('qty_back_', '');
    const parts = inner.split('_');
    const areaCode = parts[parts.length - 1];
    const productKey = parts.slice(0, -1).join('_');
    const p = getProduct(productKey);
    const isGV = GV_PRODUCTS.includes(productKey);

    if (isGV) {
      const codeInfo = AVAILABLE_CODES.find(c => c.code === areaCode);
      const location = codeInfo ? codeInfo.label.split('– ')[1] : areaCode;
      await edit(
        `✅ *Area Code Selected*\n\n` +
        `📍 *+1 (${areaCode})* — ${location}\n` +
        `📦 *Product:* ${p?.emoji || ''} ${p?.name || productKey}\n` +
        `💰 *Price:* $${p?.price || ''} USD\n\n` +
        `🔢 *How many do you want?*`,
        quantityKeyboard(productKey, areaCode)
      );
    } else {
      await edit(buildProductText(productKey, p), quantityKeyboard(productKey, '0'));
    }
    return;
  }

  // ── Quantity selected: qty_<product>_<code>_<qty> ────────
  if (data.startsWith('qty_')) {
    const parts = data.split('_');
    const qty = parseInt(parts[parts.length - 1], 10);
    const areaCode = parts[parts.length - 2];
    const productKey = parts.slice(1, -2).join('_');
    const p = getProduct(productKey);
    const codeInfo = AVAILABLE_CODES.find(c => c.code === areaCode);
    const location = codeInfo ? codeInfo.label.split('– ')[1] : (areaCode === '0' ? '' : areaCode);
    const total = p ? `$${(p.price * qty).toFixed(0)} USD` : '';
    const locationLine = location ? `📍 *Area Code:* +1 (${areaCode}) — ${location}\n` : '';

    await edit(
      `🔢 *Quantity Selected: ${qty}*\n\n` +
      `📦 *Product:* ${p?.emoji || ''} ${p?.name || productKey}\n` +
      locationLine +
      `💰 *Unit Price:* $${p?.price || ''} USD\n` +
      `🧾 *Total:* ${total}\n\n` +
      `💳 *Select your payment method:*`,
      paymentKeyboard(productKey, areaCode, qty)
    );
    return;
  }

  // ── Payment: pay_<method>_<product>_<code>_<qty> ──
  if (data.startsWith('pay_upi_') || data.startsWith('pay_trc20_') || data.startsWith('pay_bep20_')) {
    const parts = data.split('_');
    const method = parts[1];
    const qty = parseInt(parts[parts.length - 1], 10) || 1;
    const areaCode = parts[parts.length - 2];
    const productKey = parts.slice(2, -2).join('_');
    const p = getProduct(productKey);
    const payments = getPayments();
    const codeInfo = AVAILABLE_CODES.find(c => c.code === areaCode);
    const location = codeInfo ? codeInfo.label.split('– ')[1] : (areaCode === '0' ? '' : areaCode);
    const total = p ? `$${(p.price * qty).toFixed(0)} USD` : '';
    const locationLine = location ? `• Area Code: +1 (${areaCode}) — ${location}\n` : '';

    const orderSummary =
      `📦 *Order Summary*\n` +
      `• Product: ${p?.emoji || ''} ${p?.name || productKey}\n` +
      locationLine +
      `• Quantity: ${qty}\n` +
      `• Unit Price: $${p?.price || ''} USD\n` +
      `• *Total: ${total}*\n\n`;

    if (method === 'upi') {
      const upi = payments.upi || {};
      const upiDetails = upi.id
        ? `📱 *UPI ID:* \`${upi.id}\`${upi.name ? `\n👤 *Name:* ${upi.name}` : ''}\n\n✅ Works with Paytm, PhonePe, GPay, BHIM.`
        : `✅ Works with Paytm, PhonePe, GPay, BHIM.\n\n_Contact @Loikye for UPI details._`;
      await sendPayment(bot, chatId, messageId, upi.qrFile || 'upi-qr.jpeg',
        orderSummary + `🏦 *UPI Payment*\n\n` + upiDetails
      );
    } else if (method === 'trc20') {
      const addr = payments.trc20?.address || 'Contact @Loikye';
      await sendPayment(bot, chatId, messageId, payments.trc20?.qrFile || 'usdt-trc20-qr.jpeg',
        orderSummary +
        `🪙 *USDT TRC20 Payment*\n\n` +
        `\`${addr}\`\n\n` +
        `⚠️ *TRC20 network only.* Wrong network = lost funds.`
      );
    } else if (method === 'bep20') {
      const addr = payments.bep20?.address || 'Contact @Loikye';
      await sendPayment(bot, chatId, messageId, payments.bep20?.qrFile || 'usdt-bep20-qr.jpeg',
        orderSummary +
        `🪙 *USDT BEP20 Payment*\n\n` +
        `\`${addr}\`\n\n` +
        `⚠️ *BEP20 network only.* Wrong network = lost funds.`
      );
    }
    return;
  }

  // ── Dynamic product page: product_<key> ──────
  if (data.startsWith('product_')) {
    const productKey = data.replace('product_', '');
    const p = getProduct(productKey);
    if (!p) {
      await bot.answerCallbackQuery(query.id, { text: 'Product not found.', show_alert: true });
      return;
    }
    if (!p.inStock) {
      await bot.answerCallbackQuery(query.id, { text: '❌ This product is currently out of stock.', show_alert: true });
      return;
    }
    const isGV = GV_PRODUCTS.includes(productKey);
    const keyboard = isGV ? buildAreaCodeKeyboard(productKey) : quantityKeyboard(productKey, '0');
    await edit(buildProductText(productKey, p), keyboard);
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
        { parse_mode: 'Markdown', reply_markup: mainMenuKeyboard }
      );
      break;

    case 'menu_products':
      await edit(TEXTS.products, buildProductsKeyboard());
      break;

    case 'menu_pricing':
      await edit(buildPricingText(), {
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
      await edit(`💳 *Payment Methods*\n\nSelect a product first to pay:`, buildProductsKeyboard());
      break;

    case 'menu_order':
      await edit(`📦 *Place an Order*\n\nSelect a product to get started:`, buildProductsKeyboard());
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
          [{ text: '💬 Telegram: @Loikye', url: 'https://t.me/Loikye' }],
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
