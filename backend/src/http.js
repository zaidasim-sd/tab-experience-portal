import { createServer } from 'node:http';
import { timingSafeEqual, randomUUID } from 'node:crypto';
import { ApiError, assert } from './errors.js';

async function readBody(req) {
  const chunks = []; let length = 0;
  for await (const chunk of req) { length += chunk.length; assert(length <= 65536, 413, 'body_too_large'); chunks.push(chunk); }
  return Buffer.concat(chunks);
}
function authorized(value, token) {
  const expected = Buffer.from(`Bearer ${token}`), actual = Buffer.from(value || '');
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
export function createApi(service, config, log = console.log) {
  return createServer({ requestTimeout: 15000, headersTimeout: 10000 }, async (req, res) => {
    const requestId = randomUUID();
    res.setHeader('cache-control', 'no-store');
    res.setHeader('x-content-type-options', 'nosniff');
    res.setHeader('x-request-id', requestId);
    res.setHeader('content-type', 'application/json; charset=utf-8');
    const send = (status, data) => { res.writeHead(status); res.end(JSON.stringify(data)); };
    try {
      const path = new URL(req.url, 'http://localhost').pathname;
      if (req.method === 'GET' && path === '/health') return send(200, { status: 'ok', environment: 'sandbox' });
      if (req.method === 'GET' && ['/payment/return', '/payment/cancel'].includes(path)) {
        if (config.storefrontUrl) {
          res.writeHead(303, { location: `${config.storefrontUrl}/order?payment=${path.endsWith('cancel') ? 'cancel' : 'return'}` });
          return res.end();
        }
        return send(200, { message: path.endsWith('cancel') ? 'Checkout closed or cancelled. This does not prove that payment was cancelled.' : 'Returned from checkout. Payment must be verified server-side.', paymentConfirmed: false });
      }
      if (req.method === 'POST' && path === '/webhooks/safepay') {
        assert(req.headers['content-type']?.split(';')[0].trim() === 'application/json', 415, 'json_required');
        return send(200, await service.acceptWebhook(await readBody(req), req.headers['x-sfpy-signature']));
      }
      assert(authorized(req.headers.authorization, config.apiToken), 401, 'unauthorized');
      if (req.method === 'GET' && path === '/products') return send(200, { products: await service.store.catalogue() });
      const eventMatch = path.match(/^\/events\/(evt_[a-zA-Z0-9-]{1,100})$/);
      if (req.method === 'GET' && eventMatch) {
        const event = await service.store.events.findOne({ _id: eventMatch[1] });
        assert(event, 404, 'event_not_found');
        return send(200, event);
      }
      const match = path.match(/^\/orders\/([a-f0-9-]{36})(?:\/(checkout|reconcile|recover))?$/);
      if (req.method === 'GET' && match && !match[2]) return send(200, await service.order(match[1]));
      if (req.method === 'POST') {
        if (path === '/orders' || match?.[2] === 'recover') {
          assert(req.headers['content-type']?.split(';')[0].trim() === 'application/json', 415, 'json_required');
          let body; try { body = JSON.parse((await readBody(req)).toString('utf8')); } catch (e) { if (e instanceof ApiError) throw e; throw new ApiError(400, 'invalid_json'); }
          if (path === '/orders') return send(200, await service.createOrder(body, req.headers['idempotency-key']));
          assert(body && Object.keys(body).join(',') === 'tracker', 400, 'tracker_only_required');
          return send(200, await service.recover(match[1], body.tracker));
        }
        if (match?.[2] === 'checkout') return send(200, await service.checkout(match[1]));
        if (match?.[2] === 'reconcile') return send(200, await service.reconcile(match[1]));
      }
      send(404, { error: 'not_found' });
    } catch (e) {
      const status = e instanceof ApiError ? e.status : 503;
      const code = e instanceof ApiError ? e.code : 'service_unavailable';
      log(JSON.stringify({ requestId, status, code }));
      // Do not expose database connection strings, provider responses, credentials or checkout URLs.
      if (!res.headersSent) send(status, { error: code, requestId });
      else res.end();
    }
  });
}
