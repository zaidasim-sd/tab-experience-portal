import { MongoClient } from 'mongodb';

export async function connectStore(config) {
  const client = new MongoClient(config.mongoUri, { serverSelectionTimeoutMS: 5000, connectTimeoutMS: 5000 });
  try {
    await client.connect();
    const db = client.db(config.dbName);
    const store = new Store(client, db);
    await store.initialize();
    return store;
  } catch (error) { await client.close(); throw error; }
}
export class Store {
  constructor(client, db) { this.client = client; this.db = db; this.orders = db.collection('orders'); this.events = db.collection('payment_events'); this.products = db.collection('products'); }
  async initialize() {
    await this.orders.createIndex({ idempotencyKey: 1 }, { unique: true });
    await this.orders.createIndex({ tracker: 1 }, { unique: true, partialFilterExpression: { tracker: { $type: 'string' } } });
    await this.events.createIndex({ status: 1, nextAttemptAt: 1 });
  }
  async transaction(fn) {
    const session = this.client.startSession();
    try { return await session.withTransaction(() => fn(session), { readConcern: { level: 'snapshot' }, writeConcern: { w: 'majority' } }); }
    finally { await session.endSession(); }
  }
  async catalogue() { return this.products.find({ active: true }, { projection: { _id: 1, name: 1, category: 1, priceMinor: 1, currency: 1, synthetic: 1 } }).sort({ _id: 1 }).toArray(); }
  async getOrder(id, session) { return this.orders.findOne({ _id: id }, { session }); }
  async getByKey(key) { return this.orders.findOne({ idempotencyKey: key }); }
  async insertOrder(order) { try { await this.orders.insertOne(order); return order; } catch (e) { if (e.code === 11000) return this.getByKey(order.idempotencyKey); throw e; } }
  async claimCheckout(id) { return this.orders.findOneAndUpdate({ _id: id, checkoutState: 'new' }, { $set: { checkoutState: 'creating', updatedAt: new Date() } }, { returnDocument: 'after' }); }
  async attachTracker(id, tracker) { return this.orders.findOneAndUpdate({ _id: id, tracker: { $exists: false } }, { $set: { tracker, checkoutState: 'ready', paymentStatus: 'pending', updatedAt: new Date() } }, { returnDocument: 'after' }); }
  async updatePayment(id, paymentStatus, providerState, session) {
    // Paid is monotonic: stale failures/pending reads cannot undo capture.
    return this.orders.updateOne({ _id: id, ...(paymentStatus === 'paid' ? {} : { paymentStatus: { $ne: 'paid' } }) }, { $set: { paymentStatus, providerState, updatedAt: new Date() } }, { session });
  }
  async insertEvent(event) { try { await this.events.insertOne(event); return event; } catch (e) { if (e.code === 11000) return this.events.findOne({ _id: event._id }); throw e; } }
  async dueEvents() { return this.events.find({ status: 'pending', nextAttemptAt: { $lte: new Date() } }).limit(10).toArray(); }
  async eventDone(id, status, session, lastError) { await this.events.updateOne({ _id: id }, { $set: { status, ...(lastError ? { lastError } : {}), completedAt: new Date() } }, { session }); }
  async eventRetry(id, code) { await this.events.updateOne({ _id: id, status: 'pending' }, { $inc: { attempts: 1 }, $set: { lastError: code, nextAttemptAt: new Date(Date.now() + 30000) } }); }
  async pendingOrders() { return this.orders.find({ tracker: { $type: 'string' }, paymentStatus: { $ne: 'paid' } }).limit(100).toArray(); }
  async close() { await this.client.close(); }
}
