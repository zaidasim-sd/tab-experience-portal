import { readFile } from 'node:fs/promises';
import { loadConfig } from '../src/config.js';
import { connectStore } from '../src/store.js';

// Read the existing menu without importing/changing frontend code or its toolchain.
// Only fixed prices can be seeded. The ranged Pistachio Latte is deliberately omitted.
const source = await readFile(new URL('../../src/components/tab/menuData.ts', import.meta.url), 'utf8');
const products = [...source.matchAll(/\{ name: "([^"]+)", desc: "[^"]*", price: "(\d+)"[^}]*\}/g)].map(([, name, price]) => ({
  _id: name.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
  name: `TEST - ${name}`, category: 'cafe-menu-test-copy', priceMinor: Number(price) * 100, currency: 'PKR', synthetic: true, active: true,
}));
if (products.length !== 20) throw new Error('Menu format changed. Review seed data before continuing.');
products.push({ _id: 'synthetic-sandbox-item', name: 'TEST - Synthetic sandbox item', category: 'synthetic', priceMinor: 10000, currency: 'PKR', synthetic: true, active: true });
let store;
try {
  store = await connectStore(loadConfig());
  for (const product of products) await store.products.updateOne({ _id: product._id }, { $setOnInsert: product }, { upsert: true });
  console.log(`Ensured ${products.length} synthetic products. Existing database prices were preserved.`);
} catch { console.error('Seed failed. Check configuration and Atlas access.'); process.exitCode = 1; }
finally { await store?.close(); }
