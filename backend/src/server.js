import { loadConfig } from './config.js';
import { connectStore } from './store.js';
import { Safepay } from './safepay.js';
import { Payments } from './service.js';
import { createApi } from './http.js';

try {
  const config = loadConfig();
  const store = await connectStore(config);
  const service = new Payments(store, new Safepay(config), config);
  const server = createApi(service, config);
  let running = false;
  const tick = async () => {
    if (running) return;
    running = true;
    try { await service.drain(); } catch { console.error('Webhook worker unavailable; persisted events will retry'); }
    finally { running = false; }
  };
  const worker = setInterval(tick, 5000);
  worker.unref();
  void tick();
  server.on('error', async () => { clearInterval(worker); await store.close(); console.error('Backend could not bind its localhost port'); process.exitCode = 1; });
  server.listen(config.port, '127.0.0.1', () => console.log(`Sandbox POC: http://127.0.0.1:${config.port}`));
  let closing = false;
  const stop = async () => {
    if (closing) return; closing = true; clearInterval(worker);
    server.close(async () => { while (running) await new Promise(resolve => setTimeout(resolve, 50)); await store.close(); });
  };
  process.on('SIGINT', stop); process.on('SIGTERM', stop);
} catch (e) {
  console.error(e.message?.startsWith('Populate ') || e.message === 'Only sandbox is supported' ? e.message : 'Backend startup failed. Check .env, Atlas access, and the POC database name; credentials are not logged.');
  process.exitCode = 1;
}
