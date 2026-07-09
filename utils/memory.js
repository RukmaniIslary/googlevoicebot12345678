// ─────────────────────────────────────────────
//  ATMOVERSE BOT — Conversation Memory Manager
// ─────────────────────────────────────────────

const { MAX_HISTORY } = require('../config/constants');

// In-memory store: { userId: [ { role, content }, ... ] }
const conversationStore = new Map();

/**
 * Add a message to a user's conversation history.
 * Trims to the last MAX_HISTORY messages automatically.
 */
function addMessage(userId, role, content) {
  if (!conversationStore.has(userId)) {
    conversationStore.set(userId, []);
  }
  const history = conversationStore.get(userId);
  history.push({ role, content });

  // Keep only the last MAX_HISTORY messages
  if (history.length > MAX_HISTORY) {
    history.splice(0, history.length - MAX_HISTORY);
  }
}

/**
 * Get the full conversation history for a user.
 */
function getHistory(userId) {
  return conversationStore.get(userId) || [];
}

/**
 * Clear a user's conversation history.
 */
function clearHistory(userId) {
  conversationStore.delete(userId);
}

/**
 * Get total number of active conversations.
 */
function getActiveUsers() {
  return conversationStore.size;
}

module.exports = { addMessage, getHistory, clearHistory, getActiveUsers };
