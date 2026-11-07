import { loadConfig } from '../src/config.js';
import { connectStore } from '../src/store.js';
import { Safepay } from '../src/safepay.js';
import { Payments } from '../src/service.js';

let store;
try {
  const config = loadConfig(); store = await connectStore(config);
  const service = new Payments(store, new Safepay(config), config);
  await service.drain();
  for (const order of await store.pendingOrders()) {
    try { const result = await service.reconcile(order._id); console.log(JSON.stringify({ orderId: order._id, paymentStatus: result.paymentStatus })); }
    catch (e) { console.log(JSON.stringify({ orderId: order._id, error: e.code || 'reconciliation_failed' })); process.exitCode = 1; }
  }
} catch { console.error('Reconciliation failed. Check configuration and Atlas access.'); process.exitCode = 1; }
finally { await store?.close(); }
