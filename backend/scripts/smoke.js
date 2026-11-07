import { randomUUID } from 'node:crypto';
import { loadConfig } from '../src/config.js';

// Run against the already-running POC. This creates a synthetic order, not a charge.
try {
  const config = loadConfig(), base = `http://127.0.0.1:${config.port}`;
  const request = async (path, body, headers = {}) => {
    const response = await fetch(base + path, { method: body === undefined ? 'GET' : 'POST', headers: { authorization: `Bearer ${config.apiToken}`, 'content-type': 'application/json', ...headers }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    const json = await response.json(); if (!response.ok) throw Error(json.error || 'request_failed'); return json;
  };
  const { products } = await request('/products');
  const product = products.find(p => p._id === 'synthetic-sandbox-item');
  if (!product) throw Error('Run npm run seed first');
  const idempotencyKey = randomUUID();
  const order = await request('/orders', { items: [{ productId: product._id, quantity: 1 }] }, { 'idempotency-key': idempotencyKey });
  console.log(`Synthetic order: ${order._id}; PKR ${(order.totalMinor / 100).toFixed(2)}; idempotency key: ${idempotencyKey}`);
  const { checkoutUrl } = await request(`/orders/${order._id}/checkout`, {});
  console.log('Open this SANDBOX link using test payment details only. It contains a temporary checkout token; do not publish it:');
  console.log(checkoutUrl);
  console.log(`After payment, GET /orders/${order._id} with your Bearer token or POST /orders/${order._id}/reconcile.`);
} catch (e) { console.error(`POC smoke check failed: ${e.message}`); process.exitCode = 1; }
