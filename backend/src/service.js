import { createHash, randomUUID } from 'node:crypto';
import { assert } from './errors.js';
import { verifyWebhook } from './safepay.js';

export function normalizeItems(body) {
  assert(body && Object.keys(body).length === 1 && Array.isArray(body.items) && body.items.length > 0 && body.items.length <= 20, 400, 'invalid_cart');
  const seen = new Set();
  return body.items.map(item => {
    assert(item && Object.keys(item).sort().join(',') === 'productId,quantity' && typeof item.productId === 'string' && /^[a-z0-9-]{1,80}$/.test(item.productId) && Number.isInteger(item.quantity) && item.quantity >= 1 && item.quantity <= 20 && !seen.has(item.productId), 400, 'invalid_cart_item');
    seen.add(item.productId);
    return { productId: item.productId, quantity: item.quantity };
  }).sort((a, b) => a.productId.localeCompare(b.productId));
}
const digest = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
export class Payments {
  constructor(store, provider, config) { this.store = store; this.provider = provider; this.config = config; }
  async createOrder(body, key) {
    assert(typeof key === 'string' && /^[a-zA-Z0-9_-]{16,100}$/.test(key), 400, 'valid_idempotency_key_required');
    const items = normalizeItems(body), requestHash = digest(items);
    const previous = await this.store.getByKey(key);
    if (previous) { assert(previous.requestHash === requestHash, 409, 'idempotency_key_conflict'); return previous; }
    const products = await this.store.catalogue();
    const lines = items.map(item => {
      const p = products.find(p => p._id === item.productId);
      assert(p && p.synthetic === true && p.currency === 'PKR' && Number.isSafeInteger(p.priceMinor) && p.priceMinor > 0, 400, 'product_unavailable');
      return { ...item, name: p.name, unitPriceMinor: p.priceMinor };
    });
    const totalMinor = lines.reduce((sum, line) => sum + line.unitPriceMinor * line.quantity, 0);
    assert(Number.isSafeInteger(totalMinor) && totalMinor > 0 && totalMinor <= 10000000, 400, 'invalid_order_total');
    const order = await this.store.insertOrder({ _id: randomUUID(), idempotencyKey: key, requestHash, lines, totalMinor, currency: 'PKR', synthetic: true, paymentStatus: 'unpaid', checkoutState: 'new', createdAt: new Date(), updatedAt: new Date() });
    assert(order?.requestHash === requestHash, 409, 'idempotency_key_conflict');
    return order;
  }
  async order(id) { const order = await this.store.getOrder(id); assert(order, 404, 'order_not_found'); return order; }
  async checkout(id) {
    let order = await this.order(id);
    assert(order.paymentStatus !== 'paid', 409, 'order_already_paid');
    if (!order.tracker) {
      order = await this.store.claimCheckout(id);
      assert(order, 409, 'checkout_in_progress_or_unknown_recover_do_not_retry');
      // Never auto-repeat this external POST after a timeout/restart: the tracker may exist.
      const tracker = await this.provider.create(order);
      order = await this.store.attachTracker(id, tracker);
      assert(order, 409, 'tracker_attach_conflict');
    }
    return { orderId: id, checkoutUrl: await this.provider.checkout(order.tracker), environment: 'sandbox' };
  }
  async recover(id, tracker) {
    const order = await this.order(id);
    assert(order.checkoutState === 'creating' && !order.tracker, 409, 'recovery_not_required');
    assert(typeof tracker === 'string' && /^track_[a-zA-Z0-9-]+$/.test(tracker), 400, 'invalid_tracker');
    const status = await this.provider.status(tracker);
    this.provider.validate(status, order);
    const attached = await this.store.attachTracker(id, tracker);
    assert(attached, 409, 'tracker_attach_conflict');
    return this.reconcile(id);
  }
  async reconcile(id) {
    const order = await this.order(id);
    assert(order.tracker, 409, 'no_tracker_recovery_required');
    const tracker = await this.provider.status(order.tracker);
    assert(tracker.token === order.tracker, 422, 'tracker_mismatch');
    this.provider.validate(tracker, order);
    // Unknown/authorization-only states remain unpaid. No invented provider timeout state.
    if (tracker.state === 'TRACKER_ENDED') await this.store.updatePayment(id, 'paid', tracker.state);
    return this.order(id);
  }
  async acceptWebhook(raw, signature) {
    assert(verifyWebhook(raw, signature, this.config.webhookSecret), 401, 'invalid_signature');
    let event; try { event = JSON.parse(raw.toString('utf8')); } catch { assert(false, 400, 'invalid_json'); }
    assert(event && !Array.isArray(event) && event.version === '2.0.0' && typeof event.token === 'string' && /^evt_[a-zA-Z0-9-]{1,100}$/.test(event.token) && typeof event.type === 'string' && event.data && typeof event.data === 'object' && !Array.isArray(event.data), 400, 'invalid_v2_event');
    assert(event.merchant_api_key === this.config.apiKey, 422, 'merchant_mismatch');
    const supported = ['payment.succeeded', 'payment.failed'].includes(event.type);
    if (supported) assert(typeof event.data.tracker === 'string' && /^track_[a-zA-Z0-9-]+$/.test(event.data.tracker), 400, 'invalid_tracker');
    // Durable inbox stores only required fields, never customer email or full payload.
    const record = { _id: event.token, hash: digest({ type: event.type, merchant: event.merchant_api_key, version: event.version, data: event.data }), type: event.type,
      tracker: event.data.tracker, orderId: event.data.metadata?.order_id,
      amount: event.data.amount, currency: event.data.currency, state: event.data.state,
      status: supported ? 'pending' : 'ignored', attempts: 0, nextAttemptAt: new Date(), receivedAt: new Date() };
    const saved = await this.store.insertEvent(record);
    assert(saved.hash === record.hash, 409, 'event_id_conflict');
    return { accepted: true, eventId: saved._id, duplicate: saved !== record };
  }
  async processEvent(event) {
    try {
      const order = event.orderId ? await this.store.getOrder(event.orderId) : null;
      // Metadata is mandatory for successful captures in this POC; never attach an arbitrary tracker.
      const found = order ?? await this.store.orders.findOne({ tracker: event.tracker });
      assert(found && found.tracker === event.tracker && (!event.orderId || found._id === event.orderId), 409, 'order_or_tracker_not_ready');
      if (event.type === 'payment.succeeded') {
        assert(event.amount === found.totalMinor && event.currency === found.currency && event.state === 'TRACKER_ENDED', 422, 'event_payment_mismatch');
        const tracker = await this.provider.status(found.tracker);
        this.provider.validate(tracker, found);
        assert(tracker.token === found.tracker && tracker.state === 'TRACKER_ENDED', 409, 'capture_not_confirmed');
      }
      await this.store.transaction(async session => {
        await this.store.updatePayment(found._id, event.type === 'payment.succeeded' ? 'paid' : 'failed', event.state, session);
        await this.store.eventDone(event._id, 'processed', session);
      });
    } catch (e) {
      if (e.status === 422) await this.store.eventDone(event._id, 'rejected', undefined, e.code);
      else await this.store.eventRetry(event._id, e.code || 'processing_failed');
    }
  }
  async drain() { for (const event of await this.store.dueEvents()) await this.processEvent(event); }
}
