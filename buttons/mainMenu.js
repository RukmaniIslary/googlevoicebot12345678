// ─────────────────────────────────────────────
//  ATMOVERSE BOT — Main Menu Inline Keyboard
// ─────────────────────────────────────────────

const mainMenuKeyboard = {
  inline_keyboard: [
    [
      { text: '🛒 Products', callback_data: 'menu_products' },
      { text: '💰 Pricing', callback_data: 'menu_pricing' },
    ],
    [
      { text: '📍 Area Codes', callback_data: 'menu_areacodes' },
      { text: '💳 Payments', callback_data: 'menu_payments' },
    ],
    [
      { text: '📦 Order Now', callback_data: 'menu_order' },
      { text: '❓ FAQ', callback_data: 'menu_faq' },
    ],
    [
      { text: '📞 Contact Support', callback_data: 'menu_contact' },
    ],
  ],
};

module.exports = { mainMenuKeyboard };
