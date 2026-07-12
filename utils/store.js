// ─────────────────────────────────────────────
//  ATMOVERSE BOT — Persistent Store (JSON)
// ─────────────────────────────────────────────

const fs = require('fs');
const path = require('path');

const STORE_PATH = path.join(__dirname, '../data/store.json');

function readStore() {
  return JSON.parse(fs.readFileSync(STORE_PATH, 'utf8'));
}

function writeStore(data) {
  fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2), 'utf8');
}

function getProducts() {
  return readStore().products;
}

function getProduct(key) {
  return readStore().products[key] || null;
}

function setProduct(key, product) {
  const store = readStore();
  store.products[key] = product;
  writeStore(store);
}

function deleteProduct(key) {
  const store = readStore();
  delete store.products[key];
  writeStore(store);
}

function getPayments() {
  return readStore().payments;
}

function setPayment(method, data) {
  const store = readStore();
  store.payments[method] = { ...store.payments[method], ...data };
  writeStore(store);
}

module.exports = { readStore, writeStore, getProducts, getProduct, setProduct, deleteProduct, getPayments, setPayment };
