// ─────────────────────────────────────────────
//  ATMOVERSE BOT — Sub-Menu Inline Keyboards
// ─────────────────────────────────────────────

// ── Products Menu ─────────────────────────────
const productsKeyboard = {
  inline_keyboard: [
    [{ text: '🇺🇸 New Google Voice', callback_data: 'product_new_gv' }],
    [{ text: '🇺🇸 Old Google Voice', callback_data: 'product_old_gv' }],
    [{ text: '📧 USA Gmail HQ', callback_data: 'product_gmail' }],
    [{ text: '⬅ Back to Menu', callback_data: 'back_main' }],
  ],
};

// ── FAQ Menu ──────────────────────────────────
const faqKeyboard = {
  inline_keyboard: [
    [{ text: '⏱ Delivery Time', callback_data: 'faq_delivery' }],
    [{ text: '🔄 Replacement Policy', callback_data: 'faq_replacement' }],
    [{ text: '🔑 Account Access', callback_data: 'faq_access' }],
    [{ text: '✅ Verification', callback_data: 'faq_verification' }],
    [{ text: '⬅ Back to Menu', callback_data: 'back_main' }],
  ],
};

// ── Order Menu ────────────────────────────────
const orderKeyboard = {
  inline_keyboard: [
    [{ text: '💬 Open Telegram', url: 'https://t.me/atmoverse' }],
    [{ text: '📱 Open WhatsApp', url: 'https://wa.me/19152481421' }],
    [{ text: '⬅ Back to Menu', callback_data: 'back_main' }],
  ],
};

// ── Contact Menu ──────────────────────────────
const contactKeyboard = {
  inline_keyboard: [
    [{ text: '💬 Telegram: @atmoverse', url: 'https://t.me/atmoverse' }],
    [{ text: '📱 WhatsApp', url: 'https://wa.me/19152481421' }],
    [{ text: '⬅ Back to Menu', callback_data: 'back_main' }],
  ],
};

// ── Generic Back Button ───────────────────────
const backKeyboard = {
  inline_keyboard: [
    [{ text: '⬅ Back to Menu', callback_data: 'back_main' }],
  ],
};

module.exports = {
  productsKeyboard,
  faqKeyboard,
  orderKeyboard,
  contactKeyboard,
  backKeyboard,
};
