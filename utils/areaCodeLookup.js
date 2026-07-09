// ─────────────────────────────────────────────
//  ATMOVERSE BOT — Area Code Lookup Utility
// ─────────────────────────────────────────────

const areaCodes = require('../data/areaCodes.json');

/**
 * Check if a string looks like a US area code (3 digits).
 */
function isAreaCode(text) {
  return /^\d{3}$/.test(text.trim());
}

/**
 * Look up an area code and return a formatted response string.
 * Returns null if the input is not an area code format.
 */
function lookupAreaCode(text) {
  const code = text.trim();

  if (!isAreaCode(code)) return null;

  const entry = areaCodes[code];

  if (entry) {
    return (
      `✅ *Area Code ${code}* — Available\n\n` +
      `📍 *Location:* ${entry.city}, ${entry.state}\n\n` +
      `_This area code is available for your Google Voice number._`
    );
  } else {
    return (
      `❌ *Area Code ${code}*\n\n` +
      `Currently unavailable in our system.\n\n` +
      `_Please contact us to check if we can source this area code for you._`
    );
  }
}

module.exports = { isAreaCode, lookupAreaCode };
