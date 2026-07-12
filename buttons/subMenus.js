// ─────────────────────────────────────────────
//  ATMOVERSE BOT — Sub-Menu Inline Keyboards
// ─────────────────────────────────────────────

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

// ── Contact Menu ──────────────────────────────
const contactKeyboard = {
  inline_keyboard: [
    [{ text: '💬 Telegram: @Loikye', url: 'https://t.me/Loikye' }],
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
  faqKeyboard,
  contactKeyboard,
  backKeyboard,
};
