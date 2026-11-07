import { createHmac, randomUUID } from 'node:crypto';
import { Payments } from '../src/service.js';
import { Safepay } from '../src/safepay.js';

export const config = { apiKey: 'sec_test-merchant', secretKey: 'test-secret', webhookSecret: 'test-hmac', apiToken: 'test-token-'.repeat(5), publicBaseUrl: 'http://localhost:8080' };
export const cart = { items: [{ productId: 'espresso', quantity: 2 }] };
export const key = () => randomUUID();
export const product = { _id: 'espresso', name: 'TEST - Espresso', priceMinor: 22000, currency: 'PKR', active: true, synthetic: true };
// SIMULATION ONLY. This store is not evidence of Atlas transaction/concurrency behavior.
export class MemoryStore {
  constructor() { this.o = new Map(); this.e = new Map(); this.orders = { findOne: async filter => [...this.o.values()].find(o => o.tracker === filter.tracker) }; this.events = { findOne: async filter => this.e.get(filter._id) }; }
  async catalogue() { return [product]; }
  async getByKey(k) { return [...this.o.values()].find(o => o.idempotencyKey === k); }
  async getOrder(id) { const o = this.o.get(id); return o && structuredClone(o); }
  async insertOrder(o) { const existing = await this.getByKey(o.idempotencyKey); if (existing) return existing; this.o.set(o._id, o); return o; }
  async claimCheckout(id) { const o = this.o.get(id); if (o.checkoutState !== 'new') return null; o.checkoutState = 'creating'; return structuredClone(o); }
  async attachTracker(id, tracker) { const o = this.o.get(id); if (o.tracker) return null; if ([...this.o.values()].some(p => p.tracker === tracker)) throw Error('duplicate_tracker'); Object.assign(o, { tracker, checkoutState: 'ready', paymentStatus: 'pending' }); return structuredClone(o); }
  async updatePayment(id, paymentStatus, providerState) { const o = this.o.get(id); if (o.paymentStatus !== 'paid' || paymentStatus === 'paid') Object.assign(o, { paymentStatus, providerState }); }
  async insertEvent(e) { const old = this.e.get(e._id); if (old) return old; this.e.set(e._id, e); return e; }
  async dueEvents() { return [...this.e.values()].filter(e => e.status === 'pending'); }
  async eventDone(id, status, session, lastError) { Object.assign(this.e.get(id), { status, lastError }); }
  async eventRetry(id, code) { const e = this.e.get(id); e.attempts++; e.lastError = code; }
  async transaction(fn) { return fn(undefined); }
}
export function harness() {
  const store = new MemoryStore();
  let creates = 0;
  const trackers = new Map();
  const provider = new Safepay(config);
  provider.create = async order => { creates++; const token = `track_${randomUUID()}`; trackers.set(token, { token, state: 'TRACKER_STARTED', client: config.apiKey, environment: 'sandbox', metadata: { order_id: order._id }, purchase_totals: { quote_amount: { currency: 'PKR', amount: order.totalMinor } } }); return token; };
  provider.status = async tracker => structuredClone(trackers.get(tracker));
  provider.checkout = async tracker => `https://sandbox.api.getsafepay.com/embedded/?tracker=${tracker}`;
  const service = new Payments(store, provider, config);
  return { store, provider, service, trackers, creates: () => creates };
}
export function event(order, type = 'payment.succeeded') {
  return { token: `evt_${randomUUID()}`, version: '2.0.0', merchant_api_key: config.apiKey, type, data: { tracker: order.tracker, state: type === 'payment.succeeded' ? 'TRACKER_ENDED' : 'TRACKER_ENROLLED', amount: order.totalMinor, currency: order.currency, metadata: { order_id: order._id } } };
}
export function signed(event) { const raw = Buffer.from(JSON.stringify(event)); return [raw, createHmac('sha512', config.webhookSecret).update(raw).digest('hex')]; }
export async function pending(h) { const order = await h.service.createOrder(cart, key()); await h.service.checkout(order._id); return h.service.order(order._id); }
