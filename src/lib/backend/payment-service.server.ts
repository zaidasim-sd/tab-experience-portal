import { createHash, createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { readFileSync } from "node:fs";
import process from "node:process";
import { parseEnv } from "node:util";
import { MongoClient, type ClientSession, type Collection, type Db } from "mongodb";
import { menu } from "../../components/tab/menuData";

export class ApiError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string) {
    super(code);
    this.status = status;
    this.code = code;
  }
}

export function assert(condition: unknown, status: number, code: string): asserts condition {
  if (!condition) throw new ApiError(status, code);
}

let cachedLocalEnv: Record<string, string | undefined> | undefined;

function getLocalEnv(): Record<string, string | undefined> {
  if (cachedLocalEnv) return cachedLocalEnv;
  cachedLocalEnv = {};
  for (const candidate of [".env", "backend/.env"]) {
    try {
      Object.assign(cachedLocalEnv, parseEnv(readFileSync(candidate, "utf8")));
    } catch {
      // Ignore missing local .env in serverless production
    }
  }
  return cachedLocalEnv;
}

export function readEnv(key: string): string | undefined {
  const netlifyEnv = (globalThis as { Netlify?: { env?: { get?: (k: string) => string | undefined } } })
    .Netlify?.env;
  const fromNetlify = netlifyEnv?.get?.(key);
  if (fromNetlify !== undefined && fromNetlify !== "") return fromNetlify;
  const fromProcess = process.env[key];
  if (fromProcess !== undefined && fromProcess !== "") return fromProcess;
  return getLocalEnv()[key];
}

export type BackendConfig = {
  port: number;
  publicBaseUrl: string;
  storefrontUrl: string;
  apiKey: string;
  secretKey: string;
  webhookSecret: string;
  mongoUri: string;
  dbName: string;
  apiToken: string;
};

function isLocalhostUrl(raw?: string): boolean {
  if (!raw) return true;
  try {
    const parsed = new URL(raw);
    return parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";
  } catch {
    return true;
  }
}

function resolveOrigin(configured: string | undefined, fallbackOrigin?: string): string {
  const netlifyUrl = readEnv("DEPLOY_PRIME_URL") || readEnv("URL");
  if (netlifyUrl && /^https:\/\//i.test(netlifyUrl) && isLocalhostUrl(configured)) {
    return new URL(netlifyUrl).origin;
  }
  if (fallbackOrigin && /^https:\/\//i.test(fallbackOrigin) && isLocalhostUrl(configured)) {
    return new URL(fallbackOrigin).origin;
  }
  const candidate = configured || netlifyUrl || fallbackOrigin || "http://localhost:8080";
  const parsed = new URL(candidate);
  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("URL must use HTTP or HTTPS");
  }
  if (parsed.username || parsed.password || parsed.search || parsed.hash) {
    throw new Error("URL must be an origin only");
  }
  return parsed.origin;
}

export function loadConfig(requestOrigin?: string): BackendConfig {
  const safepayEnv = readEnv("SAFEPAY_ENVIRONMENT") || "sandbox";
  if (safepayEnv !== "sandbox") throw new Error("Only sandbox is supported");

  const required = [
    "SAFEPAY_API_KEY",
    "SAFEPAY_SECRET_KEY",
    "SAFEPAY_WEBHOOK_SECRET",
    "MONGODB_URI",
    "MONGODB_DB",
    "POC_API_TOKEN",
  ] as const;

  for (const key of required) {
    const val = readEnv(key);
    if (!val || /REPLACE|YOUR_|<|>/i.test(val)) {
      throw new Error(`Populate ${key} in environment variables`);
    }
  }

  const dbName = readEnv("MONGODB_DB")!;
  const mongoUri = readEnv("MONGODB_URI")!;
  const apiToken = readEnv("POC_API_TOKEN")!;

  if (!/^[a-zA-Z0-9_-]+_poc$/.test(dbName)) throw new Error("Database name must end in _poc");
  if (!/^mongodb(?:\+srv)?:\/\//.test(mongoUri)) throw new Error("Invalid MongoDB URI");
  if (apiToken.length < 32) throw new Error("POC_API_TOKEN must have at least 32 characters");

  const publicBaseUrl = resolveOrigin(readEnv("PUBLIC_BASE_URL"), requestOrigin);
  const storefrontUrl = resolveOrigin(readEnv("STOREFRONT_URL"), publicBaseUrl);
  const port = Number(readEnv("PORT") || 8080);

  return {
    port: Number.isInteger(port) && port >= 1 && port <= 65535 ? port : 8080,
    publicBaseUrl,
    storefrontUrl,
    apiKey: readEnv("SAFEPAY_API_KEY")!,
    secretKey: readEnv("SAFEPAY_SECRET_KEY")!,
    webhookSecret: readEnv("SAFEPAY_WEBHOOK_SECRET")!,
    mongoUri,
    dbName,
    apiToken,
  };
}

export type ProductDoc = {
  _id: string;
  name: string;
  category: string;
  priceMinor: number;
  currency: string;
  synthetic: boolean;
  active?: boolean;
};

export type OrderLine = {
  productId: string;
  name: string;
  quantity: number;
  unitPriceMinor: number;
};

export type OrderDoc = {
  _id: string;
  idempotencyKey: string;
  requestHash: string;
  lines: OrderLine[];
  totalMinor: number;
  currency: string;
  synthetic: boolean;
  paymentStatus: string;
  checkoutState: string;
  tracker?: string;
  providerState?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type PaymentEventDoc = {
  _id: string;
  hash: string;
  type: string;
  tracker?: string;
  orderId?: string;
  amount?: number;
  currency?: string;
  state?: string;
  status: string;
  attempts: number;
  nextAttemptAt: Date;
  receivedAt: Date;
  completedAt?: Date;
  lastError?: string;
};

function buildSeedProducts(): ProductDoc[] {
  const items: ProductDoc[] = [];
  for (const act of menu) {
    for (const item of act.items) {
      if (!/^\d+$/.test(item.price)) continue;
      items.push({
        _id: item.name
          .toLowerCase()
          .replace(/&/g, "and")
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, ""),
        name: `TEST - ${item.name}`,
        category: "cafe-menu-test-copy",
        priceMinor: Number(item.price) * 100,
        currency: "PKR",
        synthetic: true,
        active: true,
      });
    }
  }
  items.push({
    _id: "synthetic-sandbox-item",
    name: "TEST - Synthetic sandbox item",
    category: "synthetic",
    priceMinor: 10000,
    currency: "PKR",
    synthetic: true,
    active: true,
  });
  return items;
}

export class Store {
  client: MongoClient;
  db: Db;
  orders: Collection<OrderDoc>;
  events: Collection<PaymentEventDoc>;
  products: Collection<ProductDoc>;

  constructor(client: MongoClient, db: Db) {
    this.client = client;
    this.db = db;
    this.orders = db.collection<OrderDoc>("orders");
    this.events = db.collection<PaymentEventDoc>("payment_events");
    this.products = db.collection<ProductDoc>("products");
  }

  async initialize() {
    await this.orders.createIndex({ idempotencyKey: 1 }, { unique: true });
    await this.orders.createIndex(
      { tracker: 1 },
      { unique: true, partialFilterExpression: { tracker: { $type: "string" } } },
    );
    await this.events.createIndex({ status: 1, nextAttemptAt: 1 });
    const count = await this.products.countDocuments({ active: true });
    if (count === 0) {
      for (const product of buildSeedProducts()) {
        await this.products.updateOne(
          { _id: product._id },
          { $setOnInsert: product },
          { upsert: true },
        );
      }
    }
  }

  async transaction<T>(fn: (session: ClientSession) => Promise<T>): Promise<T> {
    const session = this.client.startSession();
    try {
      return await session.withTransaction(() => fn(session), {
        readConcern: { level: "snapshot" },
        writeConcern: { w: "majority" },
      });
    } finally {
      await session.endSession();
    }
  }

  async catalogue(): Promise<ProductDoc[]> {
    return this.products
      .find(
        { active: true },
        { projection: { _id: 1, name: 1, category: 1, priceMinor: 1, currency: 1, synthetic: 1 } },
      )
      .sort({ _id: 1 })
      .toArray();
  }

  async getOrder(id: string, session?: ClientSession) {
    return this.orders.findOne({ _id: id }, { session });
  }

  async getByKey(key: string) {
    return this.orders.findOne({ idempotencyKey: key });
  }

  async insertOrder(order: OrderDoc) {
    try {
      await this.orders.insertOne(order);
      return order;
    } catch (e: unknown) {
      if ((e as { code?: number })?.code === 11000) return this.getByKey(order.idempotencyKey);
      throw e;
    }
  }

  async claimCheckout(id: string) {
    return this.orders.findOneAndUpdate(
      { _id: id, checkoutState: "new" },
      { $set: { checkoutState: "creating", updatedAt: new Date() } },
      { returnDocument: "after" },
    );
  }

  async attachTracker(id: string, tracker: string) {
    return this.orders.findOneAndUpdate(
      { _id: id, tracker: { $exists: false } },
      { $set: { tracker, checkoutState: "ready", paymentStatus: "pending", updatedAt: new Date() } },
      { returnDocument: "after" },
    );
  }

  async updatePayment(
    id: string,
    paymentStatus: string,
    providerState: string,
    session?: ClientSession,
  ) {
    return this.orders.updateOne(
      { _id: id, ...(paymentStatus === "paid" ? {} : { paymentStatus: { $ne: "paid" } }) },
      { $set: { paymentStatus, providerState, updatedAt: new Date() } },
      { session },
    );
  }

  async insertEvent(event: PaymentEventDoc) {
    try {
      await this.events.insertOne(event);
      return event;
    } catch (e: unknown) {
      if ((e as { code?: number })?.code === 11000) return this.events.findOne({ _id: event._id });
      throw e;
    }
  }

  async dueEvents() {
    return this.events
      .find({ status: "pending", nextAttemptAt: { $lte: new Date() } })
      .limit(10)
      .toArray();
  }

  async eventDone(id: string, status: string, session?: ClientSession, lastError?: string) {
    await this.events.updateOne(
      { _id: id },
      { $set: { status, ...(lastError ? { lastError } : {}), completedAt: new Date() } },
      { session },
    );
  }

  async eventRetry(id: string, code: string) {
    await this.events.updateOne(
      { _id: id, status: "pending" },
      {
        $inc: { attempts: 1 },
        $set: { lastError: code, nextAttemptAt: new Date(Date.now() + 30000) },
      },
    );
  }

  async pendingOrders() {
    return this.orders
      .find({ tracker: { $type: "string" }, paymentStatus: { $ne: "paid" } })
      .limit(100)
      .toArray();
  }

  async close() {
    await this.client.close();
  }
}

const HOST = "https://sandbox.api.getsafepay.com";

export function verifyWebhook(raw: Buffer, signature: string | null | undefined, secret: string) {
  if (typeof signature !== "string" || !/^[a-f0-9]{128}$/i.test(signature)) return false;
  const expected = createHmac("sha512", secret).update(raw).digest();
  return timingSafeEqual(expected, Buffer.from(signature, "hex"));
}

type TrackerPayload = {
  token: string;
  environment: string;
  client: string;
  state: string;
  purchase_totals?: { quote_amount?: { amount?: number; currency?: string } };
  metadata?: { order_id?: string; data?: { order_id?: string } };
};

export class Safepay {
  config: BackendConfig;
  transport: typeof fetch;

  constructor(config: BackendConfig, transport: typeof fetch = fetch) {
    this.config = config;
    this.transport = transport;
  }

  async request(path: string, body?: unknown): Promise<Record<string, unknown>> {
    try {
      const response = await this.transport(`${HOST}${path}`, {
        method: body === undefined ? "GET" : "POST",
        headers: {
          "content-type": "application/json",
          "X-SFPY-MERCHANT-SECRET": this.config.secretKey,
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
        signal: AbortSignal.timeout(8000),
        redirect: "error",
      });
      if (!response.ok) throw new Error("provider_http_error");
      const json = (await response.json()) as {
        data?: Record<string, unknown>;
        status?: { errors?: unknown[] };
      };
      if (!json.data || json.status?.errors?.length) throw new Error("provider_error");
      return json.data;
    } catch {
      throw new ApiError(502, "safepay_unavailable_or_unknown_result");
    }
  }

  async create(order: OrderDoc): Promise<string> {
    const result = await this.request("/order/payments/v3/", {
      merchant_api_key: this.config.apiKey,
      intent: "CYBERSOURCE",
      mode: "payment",
      entry_mode: "flex",
      currency: order.currency,
      amount: order.totalMinor,
      metadata: { order_id: order._id, source: "tab-cafe-poc" },
    });
    const tracker = result.tracker as TrackerPayload;
    this.validate(tracker, order);
    return tracker.token;
  }

  async checkout(tracker: string): Promise<string> {
    const tbt = (await this.request("/client/passport/v1/token", {})) as unknown;
    assert(typeof tbt === "string" && tbt.length > 0, 502, "invalid_checkout_token");
    const url = new URL("/embedded/", HOST);
    url.search = new URLSearchParams({
      environment: "sandbox",
      tracker,
      tbt,
      source: "hosted",
      redirect_url: `${this.config.publicBaseUrl}/payment/return`,
      cancel_url: `${this.config.publicBaseUrl}/payment/cancel`,
    }).toString();
    return url.toString();
  }

  async status(tracker: string): Promise<TrackerPayload> {
    const result = await this.request(`/order/payments/v3/${encodeURIComponent(tracker)}/status`);
    const trackerObj = result.tracker as TrackerPayload | undefined;
    assert(
      trackerObj && typeof trackerObj.state === "string",
      502,
      "invalid_provider_status",
    );
    return trackerObj;
  }

  validate(tracker: TrackerPayload, order: OrderDoc) {
    const quote = tracker?.purchase_totals?.quote_amount;
    assert(
      typeof tracker?.token === "string" && /^track_[a-zA-Z0-9-]+$/.test(tracker.token),
      422,
      "invalid_tracker",
    );
    assert(
      tracker.environment === "sandbox" && tracker.client === this.config.apiKey,
      422,
      "merchant_or_environment_mismatch",
    );
    assert(
      quote?.amount === order.totalMinor && quote?.currency === order.currency,
      422,
      "payment_amount_or_currency_mismatch",
    );
    const metadata = tracker.metadata?.data ?? tracker.metadata;
    const alreadyBound = order.tracker === tracker.token;
    assert(
      metadata?.order_id === order._id || (metadata?.order_id === undefined && alreadyBound),
      422,
      "provider_order_mismatch",
    );
  }
}

export function normalizeItems(body: unknown): { productId: string; quantity: number }[] {
  const record = body as { items?: unknown[] } | null;
  assert(
    record &&
      typeof record === "object" &&
      Object.keys(record).length === 1 &&
      Array.isArray(record.items) &&
      record.items.length > 0 &&
      record.items.length <= 20,
    400,
    "invalid_cart",
  );
  const seen = new Set<string>();
  return record.items
    .map((raw) => {
      const item = raw as { productId?: unknown; quantity?: unknown } | null;
      assert(
        item &&
          typeof item === "object" &&
          Object.keys(item).sort().join(",") === "productId,quantity" &&
          typeof item.productId === "string" &&
          /^[a-z0-9-]{1,80}$/.test(item.productId) &&
          Number.isInteger(item.quantity) &&
          Number(item.quantity) >= 1 &&
          Number(item.quantity) <= 20 &&
          !seen.has(item.productId),
        400,
        "invalid_cart_item",
      );
      seen.add(item.productId);
      return { productId: item.productId, quantity: Number(item.quantity) };
    })
    .sort((a, b) => a.productId.localeCompare(b.productId));
}

const digest = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex");

export class Payments {
  store: Store;
  provider: Safepay;
  config: BackendConfig;

  constructor(store: Store, provider: Safepay, config: BackendConfig) {
    this.store = store;
    this.provider = provider;
    this.config = config;
  }

  async createOrder(body: unknown, key: string | null | undefined): Promise<OrderDoc> {
    assert(
      typeof key === "string" && /^[a-zA-Z0-9_-]{16,100}$/.test(key),
      400,
      "valid_idempotency_key_required",
    );
    const items = normalizeItems(body);
    const requestHash = digest(items);
    const previous = await this.store.getByKey(key);
    if (previous) {
      assert(previous.requestHash === requestHash, 409, "idempotency_key_conflict");
      return previous;
    }
    const products = await this.store.catalogue();
    const lines = items.map((item) => {
      const p = products.find((prod) => prod._id === item.productId);
      assert(
        p &&
          p.synthetic === true &&
          p.currency === "PKR" &&
          Number.isSafeInteger(p.priceMinor) &&
          p.priceMinor > 0,
        400,
        "product_unavailable",
      );
      return { ...item, name: p.name, unitPriceMinor: p.priceMinor };
    });
    const totalMinor = lines.reduce((sum, line) => sum + line.unitPriceMinor * line.quantity, 0);
    assert(
      Number.isSafeInteger(totalMinor) && totalMinor > 0 && totalMinor <= 10000000,
      400,
      "invalid_order_total",
    );
    const order = await this.store.insertOrder({
      _id: randomUUID(),
      idempotencyKey: key,
      requestHash,
      lines,
      totalMinor,
      currency: "PKR",
      synthetic: true,
      paymentStatus: "unpaid",
      checkoutState: "new",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    assert(order && order.requestHash === requestHash, 409, "idempotency_key_conflict");
    return order;
  }

  async order(id: string): Promise<OrderDoc> {
    const order = await this.store.getOrder(id);
    assert(order, 404, "order_not_found");
    return order;
  }

  async checkout(id: string) {
    let order = await this.order(id);
    assert(order.paymentStatus !== "paid", 409, "order_already_paid");
    if (!order.tracker) {
      const claimed = await this.store.claimCheckout(id);
      assert(claimed, 409, "checkout_in_progress_or_unknown_recover_do_not_retry");
      const tracker = await this.provider.create(claimed);
      const attached = await this.store.attachTracker(id, tracker);
      assert(attached, 409, "tracker_attach_conflict");
      order = attached;
    }
    return {
      orderId: id,
      checkoutUrl: await this.provider.checkout(order.tracker!),
      environment: "sandbox",
    };
  }

  async recover(id: string, tracker: unknown) {
    const order = await this.order(id);
    assert(order.checkoutState === "creating" && !order.tracker, 409, "recovery_not_required");
    assert(
      typeof tracker === "string" && /^track_[a-zA-Z0-9-]+$/.test(tracker),
      400,
      "invalid_tracker",
    );
    const status = await this.provider.status(tracker);
    this.provider.validate(status, order);
    const attached = await this.store.attachTracker(id, tracker);
    assert(attached, 409, "tracker_attach_conflict");
    return this.reconcile(id);
  }

  async reconcile(id: string) {
    const order = await this.order(id);
    assert(order.tracker, 409, "no_tracker_recovery_required");
    const tracker = await this.provider.status(order.tracker);
    assert(tracker.token === order.tracker, 422, "tracker_mismatch");
    this.provider.validate(tracker, order);
    if (tracker.state === "TRACKER_ENDED") {
      await this.store.updatePayment(id, "paid", tracker.state);
    }
    return this.order(id);
  }

  async acceptWebhook(raw: Buffer, signature: string | null | undefined) {
    assert(verifyWebhook(raw, signature, this.config.webhookSecret), 401, "invalid_signature");
    let event: Record<string, unknown>;
    try {
      event = JSON.parse(raw.toString("utf8")) as Record<string, unknown>;
    } catch {
      assert(false, 400, "invalid_json");
    }
    const data = event?.data as Record<string, unknown> | undefined;
    assert(
      event &&
        !Array.isArray(event) &&
        event.version === "2.0.0" &&
        typeof event.token === "string" &&
        /^evt_[a-zA-Z0-9-]{1,100}$/.test(event.token) &&
        typeof event.type === "string" &&
        data &&
        typeof data === "object" &&
        !Array.isArray(data),
      400,
      "invalid_v2_event",
    );
    assert(event.merchant_api_key === this.config.apiKey, 422, "merchant_mismatch");
    const supported = ["payment.succeeded", "payment.failed"].includes(event.type);
    if (supported) {
      assert(
        typeof data.tracker === "string" && /^track_[a-zA-Z0-9-]+$/.test(data.tracker),
        400,
        "invalid_tracker",
      );
    }
    const metadata = data.metadata as { order_id?: string } | undefined;
    const record: PaymentEventDoc = {
      _id: event.token,
      hash: digest({
        type: event.type,
        merchant: event.merchant_api_key,
        version: event.version,
        data,
      }),
      type: event.type,
      tracker: data.tracker as string | undefined,
      orderId: metadata?.order_id,
      amount: data.amount as number | undefined,
      currency: data.currency as string | undefined,
      state: data.state as string | undefined,
      status: supported ? "pending" : "ignored",
      attempts: 0,
      nextAttemptAt: new Date(),
      receivedAt: new Date(),
    };
    const saved = await this.store.insertEvent(record);
    assert(saved && saved.hash === record.hash, 409, "event_id_conflict");
    return { accepted: true, eventId: saved._id, duplicate: saved !== record };
  }

  async processEvent(event: PaymentEventDoc) {
    try {
      const order = event.orderId ? await this.store.getOrder(event.orderId) : null;
      const found =
        order ??
        (event.tracker ? await this.store.orders.findOne({ tracker: event.tracker }) : null);
      assert(
        found &&
          found.tracker === event.tracker &&
          (!event.orderId || found._id === event.orderId),
        409,
        "order_or_tracker_not_ready",
      );
      if (event.type === "payment.succeeded") {
        assert(
          event.amount === found.totalMinor &&
            event.currency === found.currency &&
            event.state === "TRACKER_ENDED",
          422,
          "event_payment_mismatch",
        );
        const tracker = await this.provider.status(found.tracker!);
        this.provider.validate(tracker, found);
        assert(
          tracker.token === found.tracker && tracker.state === "TRACKER_ENDED",
          409,
          "capture_not_confirmed",
        );
      }
      await this.store.transaction(async (session) => {
        await this.store.updatePayment(
          found._id,
          event.type === "payment.succeeded" ? "paid" : "failed",
          event.state || "",
          session,
        );
        await this.store.eventDone(event._id, "processed", session);
      });
    } catch (e: unknown) {
      const err = e as { status?: number; code?: string };
      if (err.status === 422) {
        await this.store.eventDone(event._id, "rejected", undefined, err.code);
      } else {
        await this.store.eventRetry(event._id, err.code || "processing_failed");
      }
    }
  }

  async drain() {
    for (const event of await this.store.dueEvents()) {
      await this.processEvent(event);
    }
  }
}

let cachedStorePromise: Promise<Store> | undefined;
let cachedStoreKey: string | undefined;

async function getConnectedStore(config: BackendConfig): Promise<Store> {
  const key = `${config.mongoUri}::${config.dbName}`;
  if (!cachedStorePromise || cachedStoreKey !== key) {
    cachedStoreKey = key;
    cachedStorePromise = (async () => {
      const client = new MongoClient(config.mongoUri, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000,
      });
      try {
        await client.connect();
        const db = client.db(config.dbName);
        const store = new Store(client, db);
        await store.initialize();
        return store;
      } catch (error) {
        cachedStorePromise = undefined;
        await client.close().catch(() => {});
        throw error;
      }
    })();
  }
  return cachedStorePromise;
}

export async function getPaymentService(requestOrigin?: string): Promise<{
  service: Payments;
  config: BackendConfig;
}> {
  const config = loadConfig(requestOrigin);
  const store = await getConnectedStore(config);
  const service = new Payments(store, new Safepay(config), config);
  return { service, config };
}

