import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { connectStore } from '../src/store.js';
import { Payments } from '../src/service.js';
import { Safepay } from '../src/safepay.js';
import { config, cart, key, event, signed, product } from './helpers.js';

test('Atlas persistence, unique indexes, concurrent checkout and transaction rollback (provider SIMULATED)', { skip: !process.env.TEST_MONGODB_URI, timeout: 45000 }, async () => {
  // Creates its own fresh DB. Never writes to MONGODB_DB or drops an existing user DB.
  const dbName = `tab_test_${randomUUID().replaceAll('-', '')}_poc`;
  let store;
  try {
    store = await connectStore({ mongoUri: process.env.TEST_MONGODB_URI, dbName });
    await store.products.insertOne(product);
    let creates = 0; const trackers = new Map();
    const provider = new Safepay(config);
    provider.create = async o => { creates++; const token = `track_${randomUUID()}`; trackers.set(token, { token, client: config.apiKey, environment: 'sandbox', state: 'TRACKER_ENDED', metadata: { order_id: o._id }, purchase_totals: { quote_amount: { currency: 'PKR', amount: o.totalMinor } } }); return token; };
    provider.checkout = async () => 'https://sandbox.api.getsafepay.com/embedded/';
    provider.status = async token => trackers.get(token);
    let service = new Payments(store, provider, config); const k = key();
    const orders = await Promise.all(Array.from({ length: 10 }, () => service.createOrder(cart, k)));
    assert.equal(new Set(orders.map(o => o._id)).size, 1);
    const id = orders[0]._id;
    const results = await Promise.allSettled(Array.from({ length: 10 }, () => service.checkout(id)));
    assert.equal(creates, 1); assert.ok(results.some(r => r.status === 'fulfilled'));
    const order = await service.order(id), e = event(order);
    await Promise.all(Array.from({ length: 5 }, () => service.acceptWebhook(...signed(e))));
    assert.equal(await store.events.countDocuments({ _id: e.token }), 1);
    await assert.rejects(store.transaction(async session => { await store.updatePayment(id, 'paid', 'TRACKER_ENDED', session); throw Error('SIMULATED_CRASH'); }), /SIMULATED_CRASH/);
    assert.equal((await service.order(id)).paymentStatus, 'pending');
    await store.close();
    store = await connectStore({ mongoUri: process.env.TEST_MONGODB_URI, dbName });
    service = new Payments(store, provider, config); await service.drain();
    assert.equal((await service.order(id)).paymentStatus, 'paid');
    assert.equal((await store.events.findOne({ _id: e.token })).status, 'processed');
    const another = await service.createOrder(cart, key());
    await assert.rejects(store.attachTracker(another._id, order.tracker), e => e.code === 11000);
  } finally {
    // Only the exact freshly-generated test DB above is removed.
    if (store) { await store.db.dropDatabase(); await store.close(); }
  }
});
