// ─────────────────────────────────────────────
//  ATMOVERSE BOT — Persistent Store
//  Railway-compatible: persists via STORE_DATA
//  env variable so data survives redeployments.
// ─────────────────────────────────────────────

const fs = require('fs');
const path = require('path');
const logger = require('./logger');

const STORE_PATH = path.join(__dirname, '../data/store.json');

// Default store shape
const DEFAULT_STORE = {
  products: {
    new_gv: {
      name: 'New Google Voice',
      emoji: '🇺🇸',
      price: 20,
      inStock: true,
      description: 'Brand new, never-used number\nFull account access\nVerified & ready to use\nInstant delivery after payment\nReplacement available',
    },
    old_gv: {
      name: 'Old Google Voice',
      emoji: '🇺🇸',
      price: 25,
      inStock: true,
      description: 'Aged account with history\nHigher trust score\nFull account access\nInstant delivery after payment\nReplacement available',
    },
    gmail: {
      name: 'USA Gmail HQ',
      emoji: '📧',
      price: 5,
      inStock: true,
      description: 'High-quality USA Gmail\nFull account access\nPhone-verified\nInstant delivery after payment\nReplacement available',
    },
  },
  payments: {
    upi:     { id: '', name: '', qrFileId: null },
    trc20:   { address: 'TVHeNRpD6TffHEPvkmWEDUHiVSqwTApkKs', qrFileId: null },
    bep20:   { address: '0xf2db22a33bd64e734146229ba3c95813bdf28f7d', qrFileId: null },
    binance: { payId: '977038716', qrFileId: null },
  },
};

// In-memory store (loaded once at startup)
let _store = null;

/**
 * Load store: priority order —
 *   1. STORE_DATA env variable (Railway persistent storage)
 *   2. Local data/store.json file
 *   3. DEFAULT_STORE
 */
function loadStore() {
  // 1. Env variable (set by saveStore after every write)
  if (process.env.STORE_DATA) {
    try {
      _store = JSON.parse(process.env.STORE_DATA);
      logger.info('Store loaded from STORE_DATA env variable');
      return _store;
    } catch (e) {
      logger.warn('Failed to parse STORE_DATA env, falling back to file');
    }
  }

  // 2. Local JSON file
  if (fs.existsSync(STORE_PATH)) {
    try {
      _store = JSON.parse(fs.readFileSync(STORE_PATH, 'utf8'));
      logger.info('Store loaded from data/store.json');
      return _store;
    } catch (e) {
      logger.warn('Failed to parse store.json, using defaults');
    }
  }

  // 3. Defaults
  _store = JSON.parse(JSON.stringify(DEFAULT_STORE));
  logger.info('Store initialised with defaults');
  return _store;
}

/**
 * Save store:
 *   - Write to local JSON file (works locally / persistent volumes)
 *   - Update STORE_DATA env variable in memory so the running process
 *     always has the latest data
 *   - POST to Railway API to persist the env variable across restarts
 *     (requires RAILWAY_TOKEN + RAILWAY_SERVICE_ID env vars)
 */
async function saveStore() {
  const json = JSON.stringify(_store, null, 2);

  // Always write local file (useful for local dev)
  try {
    fs.writeFileSync(STORE_PATH, json, 'utf8');
  } catch (e) {
    logger.warn('Could not write store.json:', e.message);
  }

  // Update in-process env so future loadStore() calls get latest data
  process.env.STORE_DATA = json;

  // Persist to Railway via API if credentials are available
  const token = process.env.RAILWAY_TOKEN;
  const serviceId = process.env.RAILWAY_SERVICE_ID;
  const environmentId = process.env.RAILWAY_ENVIRONMENT_ID;

  if (token && serviceId && environmentId) {
    try {
      const axios = require('axios');
      // Railway GraphQL API — upsert a variable
      const mutation = `
        mutation variableUpsert($input: VariableUpsertInput!) {
          variableUpsert(input: $input)
        }
      `;
      await axios.post(
        'https://backboard.railway.app/graphql/v2',
        {
          query: mutation,
          variables: {
            input: {
              serviceId,
              environmentId,
              name: 'STORE_DATA',
              value: JSON.stringify(_store),
            },
          },
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          timeout: 8000,
        }
      );
      logger.info('Store persisted to Railway environment variable');
    } catch (e) {
      logger.warn('Railway API persist failed (data saved in-memory only):', e.message);
    }
  }
}

// ── Public helpers ────────────────────────────

function readStore() {
  if (!_store) loadStore();
  return _store;
}

function getProducts() {
  return readStore().products;
}

function getProduct(key) {
  return readStore().products[key] || null;
}

function setProduct(key, product) {
  readStore().products[key] = product;
  saveStore();
}

function deleteProduct(key) {
  delete readStore().products[key];
  saveStore();
}

function getPayments() {
  return readStore().payments;
}

function setPayment(method, data) {
  const store = readStore();
  store.payments[method] = { ...store.payments[method], ...data };
  saveStore();
}

// Initialise on require
loadStore();

module.exports = {
  readStore, saveStore,
  getProducts, getProduct, setProduct, deleteProduct,
  getPayments, setPayment,
};
