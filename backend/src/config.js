export function loadConfig(env = process.env) {
  if (env.SAFEPAY_ENVIRONMENT !== 'sandbox') throw new Error('Only sandbox is supported');
  const required = ['SAFEPAY_API_KEY', 'SAFEPAY_SECRET_KEY', 'SAFEPAY_WEBHOOK_SECRET', 'MONGODB_URI', 'MONGODB_DB', 'POC_API_TOKEN', 'PUBLIC_BASE_URL'];
  for (const key of required) {
    if (!env[key] || /REPLACE|YOUR_|<|>/i.test(env[key])) throw new Error(`Populate ${key} in backend/.env`);
  }
  if (!/^[a-zA-Z0-9_-]+_poc$/.test(env.MONGODB_DB)) throw new Error('Database name must end in _poc');
  if (!/^mongodb(?:\+srv)?:\/\//.test(env.MONGODB_URI)) throw new Error('Invalid MongoDB URI');
  if (env.POC_API_TOKEN.length < 32) throw new Error('POC_API_TOKEN must have at least 32 characters');
  const publicUrl = new URL(env.PUBLIC_BASE_URL);
  if (!['http:', 'https:'].includes(publicUrl.protocol)) throw new Error('PUBLIC_BASE_URL must use HTTP or HTTPS');
  if (publicUrl.username || publicUrl.password || publicUrl.search || publicUrl.hash || publicUrl.pathname !== '/') throw new Error('PUBLIC_BASE_URL must be an origin only');
  const port = Number(env.PORT || 8080);
  const storefront = new URL(env.STOREFRONT_URL || 'http://localhost:8081');
  if (!['http:', 'https:'].includes(storefront.protocol) || storefront.username || storefront.password || storefront.pathname !== '/' || storefront.search || storefront.hash) throw new Error('Invalid STOREFRONT_URL');
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid PORT');
  return { port, publicBaseUrl: publicUrl.origin, storefrontUrl: storefront.origin, apiKey: env.SAFEPAY_API_KEY, secretKey: env.SAFEPAY_SECRET_KEY, webhookSecret: env.SAFEPAY_WEBHOOK_SECRET, mongoUri: env.MONGODB_URI, dbName: env.MONGODB_DB, apiToken: env.POC_API_TOKEN };
}
