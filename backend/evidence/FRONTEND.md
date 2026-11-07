# Frontend checkout verification — 7 November 2026

The original backend-only run is preserved in RESULTS.md. This follow-up adds the
real café storefront at `/order`, server-side access to the separate backend,
and browser returns from Safepay. No live-money charge was made.

| Scenario | Expected behavior | Actual result / status | Evidence | Limitation / next step |
| --- | --- | --- | --- | --- |
| Empty catalogue | Show an honest unavailable menu, no hardcoded purchasable fallback | PASS / Tested: empty-menu design displayed before seeding | Browser verification | Retry handles transient backend problems |
| Seed synthetic menu | Insert fixed-price menu test copies without overwriting DB prices | PASS / Tested: seed reported 21 products | Seed command output; scripts/seed.js | Ranged-price Pistachio Latte remains omitted |
| Database catalogue in frontend | Fetch active products and current database prices through server functions | PASS / Tested: catalogue displayed all 21 seeded products | Browser /order; database-backed API | Names lose the TEST prefix visually; persistent sandbox notice labels the entire flow |
| Category filter and cart | Filter coffee; adding Espresso updates receipt to PKR 220 | PASS / Tested | Browser interactions and order-mobile.jpg | No stock availability model |
| Order review | Persist order, compare server total, show saved reference before payment | PASS / Tested: synthetic Espresso order created for PKR 220 | Browser receipt; saved POC database order | This test order remains unpaid and can be resumed |
| Safepay hosted handoff | Create sandbox tracker and temporary checkout link; show exact order total | PASS / Tested with real Safepay sandbox: hosted page displayed Rs.220.00 | Browser observed Safepay Checkout, sandbox badge and correct amount | No email, card details or final payment submitted; tracker and checkout tokens deliberately omitted from evidence |
| Actual hosted cancel | Cancel Safepay and return to café without marking paid | PASS / Tested: provider cancel confirmation returned to /order?payment=cancel; receipt remained pending | Browser receipt | Browser cancel is not proof of provider payment state |
| Backend browser redirect | Use configured frontend origin; ignore untrusted redirect query | PASS / Tested: 303 to configured origin for return/cancel | New HTTP regression test in payments.test.js | Does not implement arbitrary user-provided return URLs |
| Current-order ownership | Current browser session is required; no arbitrary order ID parameter is accepted from browser | Implemented / Requires confirmation through broader adversarial testing | shop.server.ts uses signed, expiring HttpOnly SameSite cookie | POC session ownership, not customer accounts or production authentication |
| Secret isolation | API token remains on frontend server, never in browser bundle | Build scan performed during final verification | Production client bundle scan | Deployments must provide server env or backend/.env locally; never expose these values using VITE_ |
| Mobile receipt | Fit narrow viewport, accessible cart controls and current-order shortcut | PASS / Tested: 390px viewport/document width both 390px after overflow fix | order-mobile.jpg | Desktop checked at 1440px too |
| Real payment completion and success screen | Only backend-confirmed capture renders confirmation | Not tested with a completed provider payment | Backend success/state logic simulation tests remain available | User can complete sandbox checkout using provider test instruments |

The storefront uses existing Playfair Display, DM Sans, DM Mono, crimson/cream
tokens, café logo and menu descriptions, with a small original SVG cup illustration.
Prices remain database-authoritative. Cart selections persist locally; order access
uses the signed cookie. Draft orders can be edited before starting a tracker.
After checkout has started, the saved order is retained for safe reconciliation.

Run frontend with `npm run dev` (8081) and backend with `npm start` (8080).
Set `STOREFRONT_URL` if browsing through a different host; the signed order cookie
belongs to the frontend host used at checkout. Public webhooks still use the
backend/tunnel's `/webhooks/safepay`, not the frontend URL.
