# Successful-payment return fix — 7 November 2026

- Original links used `source=custom`. Updated to `source=hosted` per the current
  [official Express Checkout guide](https://safepay-docs.netlify.app/build-your-integration/express-checkout/?platform=web).
- Tested a newly generated hosted link against the user's already-captured
  sandbox tracker. Browser automatically returned to
  `http://localhost:8081/order?payment=return`. No new tracker or payment was created.
- Backend `/payment/return` returned HTTP 303 to the configured frontend origin.
- The actual v3 status response for the completed payment omitted metadata.
  Reconciliation had rejected it with `provider_order_mismatch`. Validation now
  accepts omitted order metadata only when the returned tracker exactly matches
  the tracker already saved against the order. Merchant, sandbox, amount and
  currency remain required; conflicting metadata remains rejected. Creation and
  unbound recovery still require order metadata.
- Reconciled the already-completed sandbox order through the running backend:
  HTTP 200, `paymentStatus: paid`.
- Regression suite: 20 passed, 0 failed, 1 optional Atlas test skipped. See
  `return-regression.tap`. Checks cover hosted source, configured success/cancel
  URLs, metadata omission on bound versus unrelated trackers, and preservation of
  explicit metadata-mismatch rejection.
- Existing browser sessions retain their own signed order cookies. The return
  test browser's unrelated unpaid order was not marked paid by another tracker.
  The user should reopen `/order` in the same browser used for the paid order.
- Already-open `source=custom` links cannot be changed remotely. Return manually
  to the storefront to view the completed receipt; do not pay the same order again.

Labels: actual captured-status lookup and hosted automatic return **Tested**;
hosted integration parameter **Provider-documented**; metadata omission reproduced
against the real sandbox response **Tested**. No live-money transaction was made.
