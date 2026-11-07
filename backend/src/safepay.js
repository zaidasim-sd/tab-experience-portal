import { createHmac, timingSafeEqual } from 'node:crypto';
import { ApiError, assert } from './errors.js';

// V3 API + v2 events. Do not mix with legacy @sfpy/node-sdk v1 examples.
const HOST = 'https://sandbox.api.getsafepay.com';
export function verifyWebhook(raw, signature, secret) {
  if (typeof signature !== 'string' || !/^[a-f0-9]{128}$/i.test(signature)) return false;
  const expected = createHmac('sha512', secret).update(raw).digest();
  return timingSafeEqual(expected, Buffer.from(signature, 'hex'));
}
export class Safepay {
  constructor(config, transport = fetch) { this.config = config; this.transport = transport; }
  async request(path, body) {
    try {
      const response = await this.transport(`${HOST}${path}`, {
        method: body === undefined ? 'GET' : 'POST',
        headers: { 'content-type': 'application/json', 'X-SFPY-MERCHANT-SECRET': this.config.secretKey },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
        signal: AbortSignal.timeout(8000),
        redirect: 'error',
      });
      if (!response.ok) throw new Error('provider_http_error');
      const json = await response.json();
      if (!json.data || json.status?.errors?.length) throw new Error('provider_error');
      return json.data;
    } catch { throw new ApiError(502, 'safepay_unavailable_or_unknown_result'); }
  }
  async create(order) {
    const result = await this.request('/order/payments/v3/', {
      merchant_api_key: this.config.apiKey, intent: 'CYBERSOURCE', mode: 'payment', entry_mode: 'flex',
      currency: order.currency, amount: order.totalMinor,
      metadata: { order_id: order._id, source: 'tab-cafe-poc' },
    });
    this.validate(result.tracker, order);
    return result.tracker.token;
  }
  async checkout(tracker) {
    const tbt = await this.request('/client/passport/v1/token', {});
    assert(typeof tbt === 'string' && tbt.length > 0, 502, 'invalid_checkout_token');
    const url = new URL('/embedded/', HOST);
    // Hosted checkout performs the browser redirect after capture. The legacy
    // "custom" source can leave v3 checkout on its embedded success screen.
    url.search = new URLSearchParams({ environment: 'sandbox', tracker, tbt, source: 'hosted',
      redirect_url: `${this.config.publicBaseUrl}/payment/return`, cancel_url: `${this.config.publicBaseUrl}/payment/cancel` }).toString();
    return url.toString();
  }
  async status(tracker) {
    const result = await this.request(`/order/payments/v3/${encodeURIComponent(tracker)}/status`);
    assert(result.tracker && typeof result.tracker.state === 'string', 502, 'invalid_provider_status');
    return result.tracker;
  }
  validate(tracker, order) {
    const quote = tracker?.purchase_totals?.quote_amount;
    assert(typeof tracker?.token === 'string' && /^track_[a-zA-Z0-9-]+$/.test(tracker.token), 422, 'invalid_tracker');
    assert(tracker.environment === 'sandbox' && tracker.client === this.config.apiKey, 422, 'merchant_or_environment_mismatch');
    assert(quote?.amount === order.totalMinor && quote?.currency === order.currency, 422, 'payment_amount_or_currency_mismatch');
    const metadata = tracker.metadata?.data ?? tracker.metadata;
    // V3 status responses can omit metadata after creation. In that case the
    // tracker already persisted under a unique index is the trusted binding.
    // Creation/recovery have no bound tracker and still require order metadata.
    const alreadyBound = order.tracker === tracker.token;
    assert(metadata?.order_id === order._id || (metadata?.order_id === undefined && alreadyBound), 422, 'provider_order_mismatch');
  }
}
