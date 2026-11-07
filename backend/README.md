# TAB Café sandbox payment POC

This is a separate Node.js backend with its own package/lockfile and port 8080.
The café frontend includes an integrated ordering page on port 8081.
It is a feasibility POC, not a production architecture decision.

Scope confirmed by Hassan: Safepay sandbox hosted checkout; synthetic MongoDB
catalogue; orders, verified webhooks, payment lookup and reconciliation. Haroon
has approved the priority. Refunds, inventory, subscriptions, notification vendors,
customer accounts, kitchen workflows and manual bank transfers are excluded.
Manual transfers would mean staff reviewing bank-transfer proof; a screenshot
would never by itself confirm payment.

## Setup

Requires Node.js 22.12+ with npm and a dedicated MongoDB Atlas test database.

```powershell
cd "D:\Development Workspace\tab-cafe\tab-experience-portal\backend"
npm ci
# A placeholder .env has already been created locally. On a fresh checkout:
# Copy-Item .env.example .env
# Fill backend/.env in your editor; never put secrets in frontend env files.
npm run seed
npm start
```

`npm run dev` enables Node's watcher. Start the frontend with `npm run dev` from
the project root; it defaults to port 8081. The backend binds to 127.0.0.1:8080.
Open http://localhost:8081/order for the integrated checkout. TanStack server
functions call the backend locally, so CORS and browser-visible API tokens are
not needed. PowerShell/Postman and the smoke script remain available.

Populate these placeholders in `.env` (ignored by Git):

| Variable | Meaning |
| --- | --- |
| `MONGODB_URI` | Atlas sandbox URI; URL-encode password characters; configure database user and your IP in Atlas |
| `MONGODB_DB` | Dedicated test DB, required to end in `_poc`; never use a production DB |
| `SAFEPAY_API_KEY` | Sandbox merchant API identifier (`sec_...`), sent as `merchant_api_key` |
| `SAFEPAY_SECRET_KEY` | Sandbox server API secret for `X-SFPY-MERCHANT-SECRET` |
| `SAFEPAY_WEBHOOK_SECRET` | Sandbox endpoint's shared HMAC secret; distinct from the API secret |
| `POC_API_TOKEN` | Random local token of at least 32 characters, used as Bearer authorization |
| `PUBLIC_BASE_URL` | Origin used for browser return/cancel, initially `http://localhost:8080`; use your public tunnel/proxy origin for externally reachable testing |
| `SAFEPAY_ENVIRONMENT` | Must be `sandbox`; production is rejected |
| `STOREFRONT_URL` | Browser return origin, default `http://localhost:8081`; set to your frontend's public origin if accessed through a tunnel |

The POC token is a local testing boundary, not customer authentication or roles.
All catalogue/order/checkout/reconciliation/event APIs require it. Health, browser
return/cancel and the signed webhook endpoint do not. Do not distribute the token
to a frontend or use real customer information.

Seed inserts 20 fixed-price menu copies labelled `TEST`, plus a PKR 100 synthetic
item. Names/prices come from the existing menu only at seed time. The ranged
Pistachio Latte price (340–490) is omitted because no variant price was specified.
Re-running seed preserves existing database prices. At order time, products and
prices are fetched from MongoDB, validated as synthetic/active/PKR, and snapshotted
into the order. Amounts use integer minor units: PKR 220 = 22000. The POC total is
the sum of line prices only; no tax, shipping, discounts or stock policy is modelled.

## Safepay dashboard and checkout

1. Use only the sandbox dashboard and sandbox credentials.
2. Forward a public tunnel/proxy to local port 8080 using your chosen tool.
   Sandbox HTTP callbacks must use public port 80, 8080 or 8888; HTTPS callbacks
   are also supported. Set `PUBLIC_BASE_URL` to the public origin and restart.
3. In sandbox Developers > Endpoints, register
   `http://YOUR-PUBLIC-HOST:8080/webhooks/safepay` (or your tunnel
   URL followed by `/webhooks/safepay`) and subscribe to **2.0.0**
   `payment.succeeded` and `payment.failed`. Copy its HMAC secret into `.env`.
4. In another terminal, run `npm run smoke`. It creates one synthetic order and
   prints a hosted sandbox checkout link. Use only Safepay's documented test
   instruments. Do not share/save the link publicly: it contains a temporary token.
5. Safepay returns through the backend to the frontend's receipt screen. It checks
   the saved order with the server, polling for about one minute and allowing manual
   refresh afterward. Return/cancel never confirms payment by itself.

Atlas/Safepay onboarding, actual account permissions, external tunnel/proxy reachability,
checkout behavior and actual provider event delivery still need your credentialed
sandbox run. No live payment has been made by this implementation.

## API

Except for the three public endpoint categories above, send
`Authorization: Bearer YOUR_POC_API_TOKEN`. JSON POSTs use `Content-Type:
application/json`. Never send an amount or price from the client.

| Method / path | Body / behavior |
| --- | --- |
| `GET /health` | Process is running; DB connection was established at startup, not a continuous readiness probe |
| `GET /products` | Synthetic active catalogue from MongoDB |
| `POST /orders` | `{"items":[{"productId":"espresso","quantity":1}]}` with `Idempotency-Key` (16–100 alphanumeric, `_` or `-` characters); returns order |
| `GET /orders/:id` | Order, line price snapshots and payment state |
| `POST /orders/:id/checkout` | No body needed; returns sandbox `checkoutUrl` |
| `POST /orders/:id/reconcile` | Fetch provider status and validate merchant, sandbox, tracker, order ID, amount and currency before confirming captured payment |
| `POST /orders/:id/recover` | `{"tracker":"track_..."}`; attach a tracker found in sandbox dashboard after ambiguous creation, after server verification |
| `GET /events/:eventId` | Sanitized durable event processing status, attempts and errors |
| `POST /webhooks/safepay` | Public; validates `X-SFPY-SIGNATURE` HMAC-SHA512 against exact raw body, expects v2 event schema |
| `GET /payment/return`, `GET /payment/cancel` | Redirect to configured `STOREFRONT_URL/order`; no payment changes |

Example PowerShell after replacing the token locally:

```powershell
$headers = @{ Authorization = 'Bearer YOUR_POC_API_TOKEN' }
Invoke-RestMethod http://127.0.0.1:8080/products -Headers $headers
$headers['Idempotency-Key'] = [guid]::NewGuid().ToString()
$order = Invoke-RestMethod http://127.0.0.1:8080/orders -Method Post -Headers $headers -ContentType application/json -Body '{"items":[{"productId":"espresso","quantity":1}]}'
$checkout = Invoke-RestMethod "http://127.0.0.1:8080/orders/$($order._id)/checkout" -Method Post -Headers $headers
$checkout.checkoutUrl
Invoke-RestMethod "http://127.0.0.1:8080/orders/$($order._id)/reconcile" -Method Post -Headers $headers
```

## Consistency and recovery

- A unique order idempotency key rejects reuse with a changed cart. Clients must
  reuse the same key for retries of the same purchase. Different keys intentionally
  represent separate purchases.
- Atomic checkout claim permits one external tracker-creation request. Later calls
  reuse that tracker and mint a fresh short-lived checkout token. Checkout URLs
  are never stored. A unique MongoDB index prevents sharing a tracker across orders.
- If tracker creation times out, or the process stops before storing its response,
  `checkoutState` remains `creating`. Do not make a new order or blindly repeat the
  external POST. Find the tracker by order metadata in the sandbox dashboard and
  use `/recover`. If no tracker can be found, resolve with Safepay before creating
  another session. This POC does not assume provider-side idempotency guarantees.
- Signed v2 events are persisted before HTTP 200. A worker runs at startup and
  every 5 seconds; it retries transient failures 30 seconds later. Order and event
  completion updates use an Atlas transaction. If the process stops, pending events
  remain in MongoDB. Unknown event types are stored as ignored. Event IDs prevent
  duplicate application; changed contents under the same ID are rejected.
- Checkout links use `source=hosted`, the web integration mode that redirects
  after success. The legacy `custom` mode can leave the shopper on an embedded
  success screen. Links generated before this fix retain their old mode.
- V3 status responses may omit metadata. When they do, the exact tracker already
  persisted under the order's unique tracker index supplies the order binding.
  Merchant, sandbox, amount and currency still must match. Explicitly conflicting
  metadata is rejected; creation and recovery still require matching order metadata.
- Only `payment.succeeded` plus matching server-side `TRACKER_ENDED` confirms
  payment. `payment.failed` records a failed attempt, which may later succeed.
  Pending/authorized/unknown provider states never mark paid. A stale failure cannot
  downgrade paid. Amount/currency/merchant/order mismatches are rejected.
- Cancel returns, page closure and local timeouts are not evidence of failed or
  cancelled payment. Keep the tracker reconcilable so a late capture can be found.
  Cancellation/timeout callbacks are not invented where the provider does not
  document them. No fulfillment/order workflow is implemented beyond payment state.
- Run `npm run reconcile` to drain due events and reconcile up to 100 unpaid
  tracked orders per invocation. This is an explicit recovery command, not a hosted
  scheduler. Inspect `creating` orders and rejected/retrying events separately.
- The inbox omits customer details and raw webhook bodies. It stores the event ID,
  semantic digest, identifiers, amounts/state and processing result. HTTP errors
  log only request ID/status/code. Rejected events expose a reason via `/events`.

## Verification and evidence

```powershell
npm test
# Optional: populate TEST_MONGODB_URI with a dedicated disposable test replica set
npm run test:atlas
```

`npm test` runs provider/store simulations and HTTP tests without credentials. The
Atlas test skips without `TEST_MONGODB_URI`; when enabled it creates a fresh
`tab_test_<random>_poc` DB, exercises persistence/transactions/unique indexes, then
deletes only that test DB. Its Safepay provider remains simulated. It is not a
provider integration test. Do not point it at production infrastructure.

See `evidence/RESULTS.md` for results and outstanding work. After adding credentials,
record actual sandbox outcomes separately with redacted screenshots/logs. Never
publish API tokens, connection URIs, raw credentials or checkout tokens. Backup
restore, actual process-crash testing and production behavior are not evidenced.

## Official sources (checked 7 November 2026)

- [Safepay API reference](https://apidocs.getsafepay.com/): v3 setup/status and passport API; the page's linked Postman collection supplies request/response examples.
- [Current Node core SDK](https://github.com/getsafepay/node-core): checkout helpers and current resource contracts.
- [PHP order service](https://github.com/getsafepay/sfpy-php/blob/master/lib/Service/OrderService.php): v3 endpoints.
- [PHP checkout helper](https://github.com/getsafepay/sfpy-php/blob/master/lib/Checkout.php): tracker/TBT hosted checkout.
- [Webhook setup](https://safepay-docs.netlify.app/developers/webhooks/overview/): public endpoint and durable receipt guidance.
- [V2 event schemas](https://safepay-docs.netlify.app/developers/webhooks/webhook-types/): payment capture versus failure and authorization.
- [HMAC verification](https://safepay-docs.netlify.app/developers/webhooks/verify-hmac-signatures/): shared endpoint key and signature header.
- [PHP signature implementation](https://github.com/getsafepay/sfpy-php/blob/master/lib/WebhookSignature.php): raw-body HMAC-SHA512.

The older `@sfpy/node-sdk` uses v1 initialization and an inner-data webhook HMAC.
It is deliberately not mixed into this v3/v2 POC. The protocol is implemented with
Node's built-in fetch/crypto; only MongoDB is a runtime package dependency.
