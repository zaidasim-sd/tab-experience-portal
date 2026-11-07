# Payment POC verification

Run date: 7 November 2026 (PKT). Runtime: Node.js 24.22.1 on Windows.
Command: `npm test` (equivalent executed with the workspace's portable npm/Node).
Evidence: `local-tests.tap`, `test/payments.test.js`, `test/atlas.test.js`.

**18 passed, 0 failed, 1 skipped.** Provider and database implementations in local
tests are simulations, except the real Node HTTP/crypto/configuration code. No
Safepay credentials or Atlas credentials were supplied or used. A simulation pass
is not evidence of a successful provider integration or Atlas behavior.

## Local results

All rows refer to named subtests in `local-tests.tap` and their implementation in
`test/payments.test.js`. Each test name states whether the provider/store is simulated.

| Scenario | Expected | Actual / status | Evidence | Limitation / next step |
| --- | --- | --- | --- | --- |
| Database catalogue pricing | Server calculates total; reject browser amount and unknown product | PKR 440 for 2 Espresso; invalid input rejected. PASS / Tested (simulation) | `server prices come from catalogue` | Memory catalogue; run Atlas seed/order check |
| Repeated order submission | Same key/cart gives one order; changed cart conflicts | Reused ID; conflict rejected. PASS / Tested (simulation) | `repeated order key` | Confirm unique index against Atlas |
| Concurrent checkout | Only one external tracker creation | 10 competing calls yielded one create; retry reused tracker. PASS / Tested (simulation) | `concurrent checkout submissions` | Run replica-set test for real atomic claim |
| Success after browser closes | Signed event + confirmed capture marks paid without redirect | Pending before worker, paid after worker; paid checkout blocked. PASS / Tested (simulation) | `success after page closes` | Perform actual sandbox payment and close browser |
| Duplicate/delayed callbacks | No duplicate application or paid downgrade | Duplicate recognized; delayed failure left paid. PASS / Tested (simulation) | `duplicate/delayed webhook` | Replay actual signed provider delivery |
| Failed attempt then success | Failure recorded, later capture accepted | Failed then paid. PASS / Tested (simulation) | `failed attempt can later succeed` | Use sandbox failure test instrument, then successful retry |
| Invalid signature | Reject malformed/altered/legacy signatures | All rejected, inbox unchanged. PASS / Tested (real crypto, simulated event) | `invalid signature, altered raw bytes` | Verify actual v2 delivery signing format with account |
| Amount/currency mismatch | Never mark paid; retain rejection evidence | Stayed pending; event rejected with reason. PASS / Tested (simulation) | `signed amount/currency mismatch` | Compare actual capture amount/minor-unit payload |
| Merchant/environment/order/tracker mismatch | Reject unrelated payment | All mismatches rejected, order pending. PASS / Tested (simulation) | `merchant, order, environment and tracker mismatches` | Confirm actual provider metadata round trip |
| Reused event ID with changed data | Reject conflicting delivery | Conflict returned. PASS / Tested (simulation) | `same event ID with changed content` | Verify stable event IDs across provider retries |
| Tracker creation timeout | Do not issue second potentially duplicate creation | One create attempt; subsequent checkout blocked as ambiguous. PASS / Tested (simulation) | `timeout is ambiguous` | Interrupt real sandbox network request; recover tracker |
| Interrupted tracker persistence | Recover only validated tracker | Recovered matching tracker and paid status. PASS / Tested (simulation) | `interrupted tracker attachment` | Exercise service process stop and dashboard recovery |
| Worker outage/reconstruction | Keep pending receipt and retry | Retained pending event, then processed after reconstruction. PASS / Tested (simulation) | `persisted inbox is retried` | Actual DB persistence/process restart not tested |
| Authorization versus capture / reconciliation | Authorization alone is unpaid; capture confirms | Pending on authorized, paid on ended. PASS / Tested (simulation) | `authorized-but-uncaptured` | Run actual status API using sandbox credentials |
| Provider request contract | Sandbox host, minor units, secret header, tracker/TBT checkout | Contract assertions passed. PASS / Tested (mock transport) | `v3 transport uses sandbox` | Provider-documented request shape; live response not tested |
| Provider transport failure | Return safe error without secrets | Sanitized 502 code. PASS / Tested (simulation) | `provider transport failure` | Test actual DNS/timeout/provider errors |
| Sandbox/config guard | Refuse production mode/placeholders | Rejected before connecting. PASS / Tested | `sandbox guard refuses` | Check populated sandbox configuration locally |
| HTTP cancel/return, authentication, malformed JSON | Redirects cannot confirm payment; protected API rejects missing token | False confirmation on both returns; 401 without token; malformed JSON 400. PASS / Tested (real local HTTP, simulated store) | `SIMULATION HTTP` | Actual hosted cancellation and callback sequence not tested |

## Provider-documented contracts

Official sources and checked date are linked in `../README.md`. The implementation
uses v3 setup/status, sandbox `/embedded/` with a passport TBT, v2 event payloads,
and raw-body HMAC-SHA512. `payment.succeeded` denotes capture; authorization alone
is insufficient. These contracts are **Provider-documented**, not integration-tested.
The old Node SDK's v1/inner-data-signature examples are incompatible with this flow.

## Blockers and remaining checks

| Check | Status / label | Evidence / next action |
| --- | --- | --- |
| MongoDB unique indexes, transaction rollback, reconnect durability | BLOCKED / Not tested; optional test skipped | Set `TEST_MONGODB_URI`, run `npm run test:atlas`; test uses a fresh disposable `_poc` DB and removes it afterwards. Safepay remains mocked. |
| Actual successful/failed hosted payment | BLOCKED / Not tested | Populate sandbox API/secret keys and Atlas URI; seed; start; run smoke and documented sandbox test instruments. |
| Actual cancelled or expired checkout | BLOCKED / Not tested | Perform hosted cancel/expiry; confirm return never marks paid; reconcile tracker for any late capture. No provider cancellation/timeout event type was invented. |
| Actual duplicate/delayed webhook and closed browser capture | BLOCKED / Not tested | Register public HTTPS endpoint for v2 events and collect redacted provider deliveries and order/event status evidence. |
| Account-specific metadata and signing behavior | Requires confirmation | Confirm v3 setup preserves `metadata.order_id`, and v2 event is signed over raw bytes. Mismatches fail closed. |
| Actual process kill/restart and interrupted external POST | Not tested | Run against dedicated Atlas sandbox; demonstrate persisted inbox/recovery. Local reconstruction test is only a simulation. |
| Restore from test backup | Not tested | Choose available Atlas test backup/export method and document restore validation; no backup was created or restored here. |
| Kitchen/order workflow permissions and transitions | Not tested / outside agreed current POC | Only payment states and a shared POC API token exist. Define roles/fulfillment transitions in a separately agreed POC. |
| Inventory, manual bank transfers, refunds | Outside agreed current POC | No inventory deductions, transfer proof approvals, or refund endpoints exist. |
| Provider-cost comparison | Outside current implementation request | No fees or commercial pricing have been inferred from the historical document. |

## Frontend regression checks

Existing frontend `npm run typecheck` and `npm run build` passed after backend
implementation. Backend dependencies are isolated. No application frontend source
was edited. Build emits existing upstream unused-import warnings without failing.
Generated route/Netlify files may be touched by the pre-existing build tooling;
there is no content diff in those generated files. Browser interaction/visual QA
of a new checkout UI is not applicable: this POC intentionally adds no UI.

## Completion boundary

Implemented and locally verified as above. Credentialed integration remains blocked
on configuration, not claimed complete. Share this folder and redacted evidence
with Haroon for review; no message has been sent to anyone by this task.
