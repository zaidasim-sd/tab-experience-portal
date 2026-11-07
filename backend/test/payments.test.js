import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { harness, config, cart, key, event, signed, pending } from './helpers.js';
import { Safepay, verifyWebhook } from '../src/safepay.js';
import { loadConfig } from '../src/config.js';
import { createApi } from '../src/http.js';

test('SIMULATION: server prices come from catalogue; client amount is rejected', async () => {
  const h = harness(); const order = await h.service.createOrder(cart, key()); assert.equal(order.totalMinor, 44000);
  await assert.rejects(h.service.createOrder({ ...cart, amount: 1 }, key()), { code: 'invalid_cart' });
  await assert.rejects(h.service.createOrder({ items: [{ productId: 'unknown', quantity: 1 }] }, key()), { code: 'product_unavailable' });
});
test('SIMULATION: repeated order key reuses order, changed cart conflicts', async () => {
  const h = harness(), k = key(); const first = await h.service.createOrder(cart, k);
  assert.equal((await h.service.createOrder(cart, k))._id, first._id);
  await assert.rejects(h.service.createOrder({ items: [{ productId: 'espresso', quantity: 1 }] }, k), { code: 'idempotency_key_conflict' });
});
test('SIMULATION: concurrent checkout submissions create one provider tracker', async () => {
  const h = harness(), order = await h.service.createOrder(cart, key());
  const results = await Promise.allSettled(Array.from({ length: 10 }, () => h.service.checkout(order._id)));
  assert.equal(h.creates(), 1); assert.ok(results.some(r => r.status === 'fulfilled'));
  await h.service.checkout(order._id); assert.equal(h.creates(), 1);
});
test('SIMULATION: success after page closes is confirmed without a browser return', async () => {
  const h = harness(), order = await pending(h); h.trackers.get(order.tracker).state = 'TRACKER_ENDED';
  const e = event(order); await h.service.acceptWebhook(...signed(e));
  assert.equal((await h.service.order(order._id)).paymentStatus, 'pending');
  await h.service.drain(); assert.equal((await h.service.order(order._id)).paymentStatus, 'paid');
  assert.equal(h.store.e.get(e.token).status, 'processed');
  await assert.rejects(h.service.checkout(order._id), { code: 'order_already_paid' });
});
test('SIMULATION: duplicate/delayed webhook is idempotent; failure cannot downgrade paid', async () => {
  const h = harness(), order = await pending(h); h.trackers.get(order.tracker).state = 'TRACKER_ENDED';
  const e = event(order); await h.service.acceptWebhook(...signed(e)); await h.service.drain();
  const duplicate = { ...e, delivery_attempts: 2 };
  assert.equal((await h.service.acceptWebhook(...signed(duplicate))).duplicate, true);
  await h.service.acceptWebhook(...signed(event(order, 'payment.failed'))); await h.service.drain();
  assert.equal((await h.service.order(order._id)).paymentStatus, 'paid'); assert.equal(h.store.e.size, 2);
});
test('SIMULATION: failed attempt can later succeed on same tracker', async () => {
  const h = harness(), order = await pending(h); await h.service.acceptWebhook(...signed(event(order, 'payment.failed'))); await h.service.drain();
  assert.equal((await h.service.order(order._id)).paymentStatus, 'failed');
  h.trackers.get(order.tracker).state = 'TRACKER_ENDED'; await h.service.acceptWebhook(...signed(event(order))); await h.service.drain();
  assert.equal((await h.service.order(order._id)).paymentStatus, 'paid');
});
test('SIMULATION: invalid signature, altered raw bytes, legacy inner-data signature rejected', async () => {
  const h = harness(), e = event(await pending(h)), [raw, signature] = signed(e);
  await assert.rejects(h.service.acceptWebhook(raw, 'bad'), { code: 'invalid_signature' });
  assert.equal(verifyWebhook(Buffer.concat([raw, Buffer.from(' ')]), signature, config.webhookSecret), false);
  const legacy = createHmac('sha512', config.webhookSecret).update(JSON.stringify(e.data)).digest('hex');
  await assert.rejects(h.service.acceptWebhook(raw, legacy), { code: 'invalid_signature' });
  assert.equal(h.store.e.size, 0);
  await assert.rejects(h.service.acceptWebhook(...signed(null)), { code: 'invalid_v2_event' });
});
test('SIMULATION: signed amount/currency mismatch is recorded and never marks paid', async () => {
  for (const change of [{ amount: 1 }, { currency: 'USD' }]) {
    const h = harness(), order = await pending(h), e = event(order); Object.assign(e.data, change);
    await h.service.acceptWebhook(...signed(e)); await h.service.drain();
    assert.equal((await h.service.order(order._id)).paymentStatus, 'pending'); assert.equal(h.store.e.get(e.token).status, 'rejected');
    assert.equal(h.store.e.get(e.token).lastError, 'event_payment_mismatch');
  }
});
test('SIMULATION: merchant, order, environment and tracker mismatches cannot mark paid', async () => {
  const h = harness(), order = await pending(h), e = event(order);
  e.merchant_api_key = 'another'; await assert.rejects(h.service.acceptWebhook(...signed(e)), { code: 'merchant_mismatch' });
  const tracker = h.trackers.get(order.tracker); tracker.state = 'TRACKER_ENDED';
  for (const patch of [{ client: 'another' }, { environment: 'production' }, { metadata: { order_id: 'another' } }, { token: 'track_another' }]) {
    const original = structuredClone(tracker); Object.assign(tracker, patch);
    await assert.rejects(h.service.reconcile(order._id)); Object.assign(tracker, original);
  }
  assert.equal((await h.service.order(order._id)).paymentStatus, 'pending');
});
test('SIMULATION: same event ID with changed content conflicts', async () => {
  const h = harness(), e = event(await pending(h)); await h.service.acceptWebhook(...signed(e)); e.data.amount = 1;
  await assert.rejects(h.service.acceptWebhook(...signed(e)), { code: 'event_id_conflict' });
});

test('SIMULATION: missing status metadata is allowed only for an already-bound tracker', async () => {
  const h = harness(), order = await pending(h), tracker = h.trackers.get(order.tracker);
  tracker.state = 'TRACKER_ENDED'; tracker.metadata = {};
  assert.equal((await h.service.reconcile(order._id)).paymentStatus, 'paid');
  const unbound = { ...order }; delete unbound.tracker;
  assert.throws(() => h.provider.validate(tracker, unbound), { code: 'provider_order_mismatch' });
  assert.throws(() => h.provider.validate({ ...tracker, token: 'track_unrelated' }, order), { code: 'provider_order_mismatch' });
  assert.throws(() => h.provider.validate({ ...tracker, metadata: { order_id: 'wrong' } }, order), { code: 'provider_order_mismatch' });
});
test('SIMULATION: timeout is ambiguous, repeated checkout does not repeat tracker POST', async () => {
  const h = harness(), order = await h.service.createOrder(cart, key()); let calls = 0;
  h.provider.create = async () => { calls++; throw Error('simulated timeout'); };
  await assert.rejects(h.service.checkout(order._id)); await assert.rejects(h.service.checkout(order._id), { code: 'checkout_in_progress_or_unknown_recover_do_not_retry' });
  assert.equal(calls, 1); assert.equal((await h.service.order(order._id)).paymentStatus, 'unpaid');
});
test('SIMULATION: interrupted tracker attachment can be recovered with verified provider metadata', async () => {
  const h = harness(), order = await h.service.createOrder(cart, key()); await h.store.claimCheckout(order._id);
  const tracker = await h.provider.create(order); h.trackers.get(tracker).state = 'TRACKER_ENDED';
  const recovered = await h.service.recover(order._id, tracker); assert.equal(recovered.paymentStatus, 'paid');
});
test('SIMULATION: persisted inbox is retried after worker reconstruction/provider outage', async () => {
  const h = harness(), order = await pending(h), e = event(order); await h.service.acceptWebhook(...signed(e));
  const original = h.provider.status; h.provider.status = async () => { throw Error('simulated outage'); }; await h.service.drain();
  assert.equal(h.store.e.get(e.token).status, 'pending'); assert.equal(h.store.e.get(e.token).attempts, 1);
  h.provider.status = original; h.trackers.get(order.tracker).state = 'TRACKER_ENDED';
  const restored = new h.service.constructor(h.store, h.provider, config); await restored.drain(); assert.equal((await restored.order(order._id)).paymentStatus, 'paid');
});
test('SIMULATION: authorized-but-uncaptured provider status never marks paid', async () => {
  const h = harness(), order = await pending(h); h.trackers.get(order.tracker).state = 'TRACKER_AUTHORIZED';
  assert.equal((await h.service.reconcile(order._id)).paymentStatus, 'pending');
  h.trackers.get(order.tracker).state = 'TRACKER_ENDED'; assert.equal((await h.service.reconcile(order._id)).paymentStatus, 'paid');
});
test('SIMULATION: v3 transport uses sandbox, minor units, secret header and current checkout URL', async () => {
  const h = harness(), order = await h.service.createOrder(cart, key()), requests = [];
  const provider = new Safepay(config, async (url, options) => {
    requests.push({ url, options }); const result = url.includes('passport') ? 'test-tbt' : { tracker: { token: 'track_test', client: config.apiKey, environment: 'sandbox', metadata: { order_id: order._id }, purchase_totals: { quote_amount: { amount: order.totalMinor, currency: 'PKR' } } } };
    return new Response(JSON.stringify({ data: result }));
  });
  await provider.create(order); const url = new URL(await provider.checkout('track_test'));
  assert.equal(url.origin, 'https://sandbox.api.getsafepay.com'); assert.equal(url.pathname, '/embedded/'); assert.equal(url.searchParams.get('tbt'), 'test-tbt');
  assert.equal(url.searchParams.get('source'), 'hosted');
  assert.equal(url.searchParams.get('redirect_url'), `${config.publicBaseUrl}/payment/return`);
  assert.equal(url.searchParams.get('cancel_url'), `${config.publicBaseUrl}/payment/cancel`);
  assert.equal(JSON.parse(requests[0].options.body).amount, 44000); assert.equal(requests[0].options.headers['X-SFPY-MERCHANT-SECRET'], config.secretKey);
});
test('SIMULATION: provider transport failure is sanitized', async () => {
  const provider = new Safepay(config, async () => { throw Error('secret=should-not-leak'); });
  await assert.rejects(provider.status('track_test'), { code: 'safepay_unavailable_or_unknown_result' });
});
test('sandbox guard refuses production and placeholder credentials', () => {
  assert.throws(() => loadConfig({ SAFEPAY_ENVIRONMENT: 'production' }), /Only sandbox/);
  assert.throws(() => loadConfig({ SAFEPAY_ENVIRONMENT: 'sandbox', SAFEPAY_API_KEY: 'REPLACE_ME' }), /Populate/);
});
test('SIMULATION HTTP: cancel/return cannot mark paid, protected routes require token, invalid JSON rejected', async t => {
  const h = harness(), server = createApi(h.service, config, () => {});
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve)); t.after(() => new Promise(resolve => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;
  for (const path of ['/payment/return?paid=true', '/payment/cancel']) { const r = await fetch(base + path); assert.equal((await r.json()).paymentConfirmed, false); }
  assert.equal((await fetch(base + '/products')).status, 401);
  const headers = { authorization: `Bearer ${config.apiToken}`, 'content-type': 'application/json' };
  const r = await fetch(base + '/orders', { method: 'POST', headers, body: '{' }); assert.equal(r.status, 400);
  assert.equal((await fetch(base + '/products', { headers })).status, 200);
});

test('HTTP: payment returns redirect only to configured storefront, ignoring untrusted redirect parameters', async t => {
  const h = harness(), server = createApi(h.service, { ...config, storefrontUrl: 'http://localhost:8081' }, () => {});
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve)); t.after(() => new Promise(resolve => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;
  for (const kind of ['return', 'cancel']) {
    const response = await fetch(`${base}/payment/${kind}?redirect_url=https://untrusted.example&paid=true`, { redirect: 'manual' });
    assert.equal(response.status, 303);
    assert.equal(response.headers.get('location'), `http://localhost:8081/order?payment=${kind}`);
    assert.equal(h.store.o.size, 0);
  }
});
