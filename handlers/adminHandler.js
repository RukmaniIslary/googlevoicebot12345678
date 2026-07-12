// ─────────────────────────────────────────────
//  ATMOVERSE BOT — Admin Panel Handler
// ─────────────────────────────────────────────

const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');
const { getProducts, getProduct, setProduct, deleteProduct, getPayments, setPayment } = require('../utils/store');

// Track pending admin inputs: { chatId: { action, data } }
const pendingInput = new Map();

// ── Auth check ────────────────────────────────
function isAdmin(chatId) {
  return String(chatId) === String(process.env.ADMIN_CHAT_ID);
}

// ── Main admin menu ───────────────────────────
const adminMenuKeyboard = {
  inline_keyboard: [
    [{ text: '📦 Manage Products', callback_data: 'adm_products' }],
    [{ text: '💳 Manage Payments', callback_data: 'adm_payments' }],
    [{ text: '❌ Close Panel', callback_data: 'adm_close' }],
  ],
};

function adminMenuText() {
  const products = getProducts();
  const lines = Object.entries(products).map(([key, p]) =>
    `${p.emoji} *${p.name}* — $${p.price} USD ${p.inStock ? '✅' : '❌ OUT OF STOCK'}`
  );
  return `🔐 *Admin Panel*\n\n*Current Products:*\n${lines.join('\n')}\n\n_Select an option below:_`;
}

// ── Products menu ─────────────────────────────
function productsMenuKeyboard() {
  const products = getProducts();
  const rows = Object.entries(products).map(([key, p]) => ([
    { text: `${p.emoji} ${p.name} — $${p.price} ${p.inStock ? '✅' : '❌'}`, callback_data: `adm_edit_${key}` },
  ]));
  rows.push([{ text: '➕ Add New Product', callback_data: 'adm_add_product' }]);
  rows.push([{ text: '⬅ Back', callback_data: 'adm_main' }]);
  return { inline_keyboard: rows };
}

// ── Edit product menu ─────────────────────────
function editProductKeyboard(key) {
  const p = getProduct(key);
  if (!p) return null;
  return {
    inline_keyboard: [
      [{ text: `✏️ Change Price (now $${p.price})`, callback_data: `adm_price_${key}` }],
      [{ text: p.inStock ? '❌ Mark Out of Stock' : '✅ Mark In Stock', callback_data: `adm_toggle_${key}` }],
      [{ text: '✏️ Edit Name', callback_data: `adm_name_${key}` }],
      [{ text: '🗑 Delete Product', callback_data: `adm_delete_${key}` }],
      [{ text: '⬅ Back', callback_data: 'adm_products' }],
    ],
  };
}

// ── Payments menu ─────────────────────────────
function paymentsMenuKeyboard() {
  const payments = getPayments();
  return {
    inline_keyboard: [
      [{ text: `🏦 UPI — ${payments.upi?.id || 'not set'}`, callback_data: 'adm_pay_upi' }],
      [{ text: '🪙 USDT TRC20 Address', callback_data: 'adm_pay_trc20' }],
      [{ text: '🪙 USDT BEP20 Address', callback_data: 'adm_pay_bep20' }],
      [{ text: `🟡 Binance Pay ID — ${payments.binance?.payId || 'not set'}`, callback_data: 'adm_pay_binance' }],
      [{ text: '🖼 Upload UPI QR', callback_data: 'adm_qr_upi' }],
      [{ text: '🖼 Upload TRC20 QR', callback_data: 'adm_qr_trc20' }],
      [{ text: '🖼 Upload BEP20 QR', callback_data: 'adm_qr_bep20' }],
      [{ text: '🖼 Upload Binance QR', callback_data: 'adm_qr_binance' }],
      [{ text: '⬅ Back', callback_data: 'adm_main' }],
    ],
  };
}

// ── Send admin panel ──────────────────────────
async function sendAdminPanel(bot, chatId, messageId = null) {
  const text = adminMenuText();
  if (messageId) {
    try {
      await bot.editMessageText(text, {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: 'Markdown',
        reply_markup: adminMenuKeyboard,
      });
    } catch (_) {
      await bot.sendMessage(chatId, text, { parse_mode: 'Markdown', reply_markup: adminMenuKeyboard });
    }
  } else {
    await bot.sendMessage(chatId, text, { parse_mode: 'Markdown', reply_markup: adminMenuKeyboard });
  }
}

// ── Handle /admin command ─────────────────────
async function handleAdminCommand(bot, msg) {
  const chatId = msg.chat.id;
  if (!isAdmin(chatId)) {
    await bot.sendMessage(chatId, '⛔ Access denied.');
    return;
  }
  pendingInput.delete(chatId);
  await sendAdminPanel(bot, chatId);
  logger.info(`Admin panel opened by ${chatId}`);
}

// ── Handle admin text input (awaiting responses) ──
async function handleAdminInput(bot, msg) {
  const chatId = msg.chat.id;
  if (!isAdmin(chatId)) return false;

  const pending = pendingInput.get(chatId);
  if (!pending) return false;

  const text = (msg.text || '').trim();
  const { action, data } = pending;
  pendingInput.delete(chatId);

  // ── Set price ──────────────────────────────
  if (action === 'set_price') {
    const price = parseFloat(text);
    if (isNaN(price) || price <= 0) {
      await bot.sendMessage(chatId, '❌ Invalid price. Please enter a positive number.');
      return true;
    }
    const product = getProduct(data.key);
    product.price = price;
    setProduct(data.key, product);
    await bot.sendMessage(chatId,
      `✅ Price updated!\n*${product.name}* is now *$${price} USD*`,
      { parse_mode: 'Markdown', reply_markup: editProductKeyboard(data.key) }
    );
    return true;
  }

  // ── Set product name ───────────────────────
  if (action === 'set_name') {
    const product = getProduct(data.key);
    product.name = text;
    setProduct(data.key, product);
    await bot.sendMessage(chatId,
      `✅ Name updated to *${text}*`,
      { parse_mode: 'Markdown', reply_markup: editProductKeyboard(data.key) }
    );
    return true;
  }

  // ── Add new product: step 1 (name) ─────────
  if (action === 'add_name') {
    pendingInput.set(chatId, { action: 'add_price', data: { name: text } });
    await bot.sendMessage(chatId, `📦 Product name: *${text}*\n\nNow enter the *price* in USD (numbers only):`, { parse_mode: 'Markdown' });
    return true;
  }

  // ── Add new product: step 2 (price) ────────
  if (action === 'add_price') {
    const price = parseFloat(text);
    if (isNaN(price) || price <= 0) {
      await bot.sendMessage(chatId, '❌ Invalid price. Enter a positive number:');
      pendingInput.set(chatId, { action: 'add_price', data });
      return true;
    }
    pendingInput.set(chatId, { action: 'add_emoji', data: { ...data, price } });
    await bot.sendMessage(chatId, `💰 Price: *$${price} USD*\n\nNow send the *emoji* for this product (e.g. 🇺🇸 or 📧):`, { parse_mode: 'Markdown' });
    return true;
  }

  // ── Add new product: step 3 (emoji) ────────
  if (action === 'add_emoji') {
    // Generate a key from the name
    const key = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
    const newProduct = {
      name: data.name,
      emoji: text,
      price: data.price,
      inStock: true,
      description: 'Full account access\nInstant delivery after payment\nReplacement available',
    };
    setProduct(key, newProduct);
    await bot.sendMessage(chatId,
      `✅ *Product Added!*\n\n${text} *${data.name}* — $${data.price} USD ✅`,
      { parse_mode: 'Markdown', reply_markup: productsMenuKeyboard() }
    );
    return true;
  }

  // ── Set UPI ID ─────────────────────────────
  if (action === 'set_upi_id') {
    setPayment('upi', { id: text });
    await bot.sendMessage(chatId,
      `✅ UPI ID updated to:\n\`${text}\``,
      { parse_mode: 'Markdown', reply_markup: paymentsMenuKeyboard() }
    );
    return true;
  }

  // ── Set UPI name ───────────────────────────
  if (action === 'set_upi_name') {
    setPayment('upi', { name: text });
    await bot.sendMessage(chatId,
      `✅ UPI Name updated to: *${text}*`,
      { parse_mode: 'Markdown', reply_markup: paymentsMenuKeyboard() }
    );
    return true;
  }

  // ── Set TRC20 address ──────────────────────
  if (action === 'set_trc20') {
    setPayment('trc20', { address: text });
    await bot.sendMessage(chatId,
      `✅ TRC20 address updated:\n\`${text}\``,
      { parse_mode: 'Markdown', reply_markup: paymentsMenuKeyboard() }
    );
    return true;
  }

  // ── Set BEP20 address ──────────────────────
  if (action === 'set_bep20') {
    setPayment('bep20', { address: text });
    await bot.sendMessage(chatId,
      `✅ BEP20 address updated:\n\`${text}\``,
      { parse_mode: 'Markdown', reply_markup: paymentsMenuKeyboard() }
    );
    return true;
  }

  // ── Set Binance Pay ID ─────────────────────
  if (action === 'set_binance') {
    setPayment('binance', { payId: text });
    await bot.sendMessage(chatId,
      `✅ Binance Pay ID updated to: \`${text}\``,
      { parse_mode: 'Markdown', reply_markup: paymentsMenuKeyboard() }
    );
    return true;
  }

  return false;
}

// ── Handle admin photo uploads (QR codes) ─────
async function handleAdminPhoto(bot, msg) {
  const chatId = msg.chat.id;
  if (!isAdmin(chatId)) return false;

  const pending = pendingInput.get(chatId);
  if (!pending || !pending.action.startsWith('upload_qr_')) return false;

  const method = pending.action.replace('upload_qr_', ''); // upi / trc20 / bep20
  pendingInput.delete(chatId);

  const photo = msg.photo[msg.photo.length - 1]; // largest size
  const fileId = photo.file_id;

  try {
    const fileInfo = await bot.getFile(fileId);
    const fileUrl = `https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/${fileInfo.file_path}`;

    const axios = require('axios');
    const assetsDir = path.join(__dirname, '../assets');

    const qrFileMap = { upi: 'upi-qr.jpeg', trc20: 'usdt-trc20-qr.jpeg', bep20: 'usdt-bep20-qr.jpeg', binance: 'binance-qr.jpeg' };
    const qrFile = qrFileMap[method];
    const dest = path.join(assetsDir, qrFile);

    const response = await axios.get(fileUrl, { responseType: 'arraybuffer' });
    fs.writeFileSync(dest, response.data);

    setPayment(method, { qrFile });

    await bot.sendMessage(chatId,
      `✅ *${method.toUpperCase()} QR code updated!*`,
      { parse_mode: 'Markdown', reply_markup: paymentsMenuKeyboard() }
    );
  } catch (err) {
    logger.error('QR upload error:', err.message);
    await bot.sendMessage(chatId, '❌ Failed to save QR image. Try again.');
  }
  return true;
}

// ── Handle admin callback queries ─────────────
async function handleAdminCallback(bot, query) {
  const chatId = query.message.chat.id;
  const messageId = query.message.message_id;
  const data = query.data;

  if (!isAdmin(chatId)) return false;
  if (!data.startsWith('adm_')) return false;

  await bot.answerCallbackQuery(query.id);

  const edit = (text, keyboard) =>
    bot.editMessageText(text, {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: 'Markdown',
      reply_markup: keyboard,
    });

  // ── Main panel ─────────────────────────────
  if (data === 'adm_main') {
    await edit(adminMenuText(), adminMenuKeyboard);
    return true;
  }

  // ── Close panel ────────────────────────────
  if (data === 'adm_close') {
    try { await bot.deleteMessage(chatId, messageId); } catch (_) {}
    return true;
  }

  // ── Products list ──────────────────────────
  if (data === 'adm_products') {
    await edit(`📦 *Products*\n\nSelect a product to edit, or add a new one:`, productsMenuKeyboard());
    return true;
  }

  // ── Edit product ───────────────────────────
  if (data.startsWith('adm_edit_')) {
    const key = data.replace('adm_edit_', '');
    const p = getProduct(key);
    if (!p) { await bot.answerCallbackQuery(query.id, { text: 'Product not found.' }); return true; }
    await edit(
      `✏️ *Editing: ${p.emoji} ${p.name}*\n\n💰 Price: $${p.price} USD\nStatus: ${p.inStock ? '✅ In Stock' : '❌ Out of Stock'}\n\nWhat would you like to change?`,
      editProductKeyboard(key)
    );
    return true;
  }

  // ── Change price ───────────────────────────
  if (data.startsWith('adm_price_')) {
    const key = data.replace('adm_price_', '');
    const p = getProduct(key);
    pendingInput.set(chatId, { action: 'set_price', data: { key } });
    await edit(
      `💰 *Change Price: ${p.emoji} ${p.name}*\n\nCurrent price: *$${p.price} USD*\n\nSend the new price (numbers only, e.g. \`25\`):`,
      { inline_keyboard: [[{ text: '❌ Cancel', callback_data: `adm_edit_${key}` }]] }
    );
    return true;
  }

  // ── Toggle stock ───────────────────────────
  if (data.startsWith('adm_toggle_')) {
    const key = data.replace('adm_toggle_', '');
    const p = getProduct(key);
    p.inStock = !p.inStock;
    setProduct(key, p);
    await edit(
      `✏️ *Editing: ${p.emoji} ${p.name}*\n\n💰 Price: $${p.price} USD\nStatus: ${p.inStock ? '✅ In Stock' : '❌ Out of Stock'}\n\nWhat would you like to change?`,
      editProductKeyboard(key)
    );
    return true;
  }

  // ── Edit name ──────────────────────────────
  if (data.startsWith('adm_name_')) {
    const key = data.replace('adm_name_', '');
    const p = getProduct(key);
    pendingInput.set(chatId, { action: 'set_name', data: { key } });
    await edit(
      `✏️ *Rename: ${p.name}*\n\nSend the new name:`,
      { inline_keyboard: [[{ text: '❌ Cancel', callback_data: `adm_edit_${key}` }]] }
    );
    return true;
  }

  // ── Delete product ─────────────────────────
  if (data.startsWith('adm_delete_')) {
    const key = data.replace('adm_delete_', '');
    const p = getProduct(key);
    await edit(
      `🗑 *Delete ${p.emoji} ${p.name}?*\n\nThis cannot be undone.`,
      {
        inline_keyboard: [
          [{ text: '✅ Yes, Delete', callback_data: `adm_confirmdelete_${key}` }],
          [{ text: '❌ Cancel', callback_data: `adm_edit_${key}` }],
        ],
      }
    );
    return true;
  }

  if (data.startsWith('adm_confirmdelete_')) {
    const key = data.replace('adm_confirmdelete_', '');
    const p = getProduct(key);
    deleteProduct(key);
    await edit(`✅ *${p.name}* deleted.`, productsMenuKeyboard());
    return true;
  }

  // ── Add new product ────────────────────────
  if (data === 'adm_add_product') {
    pendingInput.set(chatId, { action: 'add_name', data: {} });
    await edit(
      `➕ *Add New Product*\n\nStep 1/3 — Send the *product name*:`,
      { inline_keyboard: [[{ text: '❌ Cancel', callback_data: 'adm_products' }]] }
    );
    return true;
  }

  // ── Payments menu ──────────────────────────
  if (data === 'adm_payments') {
    const payments = getPayments();
    const trc20 = payments.trc20?.address || 'not set';
    const bep20 = payments.bep20?.address || 'not set';
    const upiId = payments.upi?.id || 'not set';
    const binanceId = payments.binance?.payId || 'not set';
    await edit(
      `💳 *Payment Settings*\n\n` +
      `🏦 *UPI ID:* \`${upiId}\`\n` +
      `🪙 *TRC20:* \`${trc20}\`\n` +
      `🪙 *BEP20:* \`${bep20}\`\n` +
      `🟡 *Binance Pay ID:* \`${binanceId}\`\n\n` +
      `Select what to update:`,
      paymentsMenuKeyboard()
    );
    return true;
  }

  // ── UPI update ─────────────────────────────
  if (data === 'adm_pay_upi') {
    pendingInput.set(chatId, { action: 'set_upi_id', data: {} });
    await edit(
      `🏦 *Update UPI ID*\n\nSend the new UPI ID:`,
      { inline_keyboard: [[{ text: '❌ Cancel', callback_data: 'adm_payments' }]] }
    );
    return true;
  }

  // ── TRC20 update ───────────────────────────
  if (data === 'adm_pay_trc20') {
    pendingInput.set(chatId, { action: 'set_trc20', data: {} });
    await edit(
      `🪙 *Update USDT TRC20 Address*\n\nSend the new wallet address:`,
      { inline_keyboard: [[{ text: '❌ Cancel', callback_data: 'adm_payments' }]] }
    );
    return true;
  }

  // ── BEP20 update ───────────────────────────
  if (data === 'adm_pay_bep20') {
    pendingInput.set(chatId, { action: 'set_bep20', data: {} });
    await edit(
      `🪙 *Update USDT BEP20 Address*\n\nSend the new wallet address:`,
      { inline_keyboard: [[{ text: '❌ Cancel', callback_data: 'adm_payments' }]] }
    );
    return true;
  }

  // ── Binance Pay ID update ──────────────────
  if (data === 'adm_pay_binance') {
    pendingInput.set(chatId, { action: 'set_binance', data: {} });
    await edit(
      `🟡 *Update Binance Pay ID*\n\nSend the new Binance Pay ID:`,
      { inline_keyboard: [[{ text: '❌ Cancel', callback_data: 'adm_payments' }]] }
    );
    return true;
  }

  // ── QR upload prompts ──────────────────────
  if (data === 'adm_qr_upi') {
    pendingInput.set(chatId, { action: 'upload_qr_upi', data: {} });
    await edit(
      `🖼 *Upload UPI QR Code*\n\nSend the QR image as a *photo*:`,
      { inline_keyboard: [[{ text: '❌ Cancel', callback_data: 'adm_payments' }]] }
    );
    return true;
  }

  if (data === 'adm_qr_trc20') {
    pendingInput.set(chatId, { action: 'upload_qr_trc20', data: {} });
    await edit(
      `🖼 *Upload TRC20 QR Code*\n\nSend the QR image as a *photo*:`,
      { inline_keyboard: [[{ text: '❌ Cancel', callback_data: 'adm_payments' }]] }
    );
    return true;
  }

  if (data === 'adm_qr_bep20') {
    pendingInput.set(chatId, { action: 'upload_qr_bep20', data: {} });
    await edit(
      `🖼 *Upload BEP20 QR Code*\n\nSend the QR image as a *photo*:`,
      { inline_keyboard: [[{ text: '❌ Cancel', callback_data: 'adm_payments' }]] }
    );
    return true;
  }

  if (data === 'adm_qr_binance') {
    pendingInput.set(chatId, { action: 'upload_qr_binance', data: {} });
    await edit(
      `🖼 *Upload Binance Pay QR Code*\n\nSend the QR image as a *photo*:`,
      { inline_keyboard: [[{ text: '❌ Cancel', callback_data: 'adm_payments' }]] }
    );
    return true;
  }

  return false;
}

module.exports = { handleAdminCommand, handleAdminInput, handleAdminPhoto, handleAdminCallback };
