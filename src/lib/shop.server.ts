import { readFileSync } from "node:fs";
import { parseEnv } from "node:util";
import { createHmac, timingSafeEqual } from "node:crypto";
import { getCookie, setCookie, deleteCookie } from "@tanstack/react-start/server";

function settings() {
  let local: Record<string, string | undefined> = {};
  try { local = parseEnv(readFileSync("backend/.env", "utf8")); } catch { /* deployment may supply server environment */ }
  const token = process.env.POC_API_TOKEN || local.POC_API_TOKEN;
  if (!token || token.includes("REPLACE") || token.length < 32) throw new Error("shop_unavailable");
  const port = process.env.BACKEND_PORT || local.PORT || "8080";
  if (!/^\d+$/.test(port)) throw new Error("shop_unavailable");
  return { token, origin: `http://127.0.0.1:${port}` };
}
const cookieName = "tab_order";
function signature(value: string, token: string) { return createHmac("sha256", token).update(value).digest("hex"); }
function currentId(token: string) {
  const cookie = getCookie(cookieName);
  if (!cookie) return null;
  const [id, expires, sig] = cookie.split(".");
  if (!id || !/^[a-f0-9-]{36}$/.test(id) || !expires || !/^\d+$/.test(expires) || Number(expires) < Date.now() || !sig || !/^[a-f0-9]{64}$/.test(sig)) return null;
  const expected = signature(`${id}.${expires}`, token);
  return timingSafeEqual(Buffer.from(sig), Buffer.from(expected)) ? id : null;
}
export type ShopProduct = { _id: string; name: string; category: string; priceMinor: number; currency: string };
export type ShopOrder = { _id: string; totalMinor: number; currency: string; paymentStatus: string; checkoutState: string; lines: { productId: string; name: string; quantity: number; unitPriceMinor: number }[] };
function publicOrder(order: ShopOrder): ShopOrder {
  return { _id: order._id, totalMinor: order.totalMinor, currency: order.currency, paymentStatus: order.paymentStatus, checkoutState: order.checkoutState, lines: order.lines };
}
export async function shopAction(data: { action: string; items?: { productId: string; quantity: number }[]; key?: string }) {
  try {
    const { token, origin } = settings();
    const request = async (path: string, body?: unknown, key?: string) => {
      const response = await fetch(origin + path, { method: body === undefined ? "GET" : "POST", headers: { authorization: `Bearer ${token}`, "content-type": "application/json", ...(key ? { "idempotency-key": key } : {}) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }), signal: AbortSignal.timeout(12000) });
      const value = await response.json();
      if (!response.ok) throw new Error(value.error || "shop_unavailable");
      return value;
    };
    if (data.action === "products") {
      const { products } = await request("/products");
      return { ok: true as const, products: products as ShopProduct[] };
    }
    const id = currentId(token);
    if (data.action === "current") return { ok: true as const, order: id ? publicOrder(await request(`/orders/${id}`)) : null };
    if (data.action === "create") {
      if (id) {
        const previous = await request(`/orders/${id}`);
        if (previous.paymentStatus !== "paid") return { ok: true as const, order: publicOrder(previous) };
      }
      const order = await request("/orders", { items: data.items }, data.key);
      const value = `${order._id}.${Date.now() + 7 * 86400000}`;
      setCookie(cookieName, `${value}.${signature(value, token)}`, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 7 * 86400, secure: process.env.NODE_ENV === "production" });
      return { ok: true as const, order: publicOrder(order) };
    }
    if (!id) throw new Error("order_session_missing");
    if (data.action === "checkout") {
      const result = await request(`/orders/${id}/checkout`, {});
      const url = new URL(result.checkoutUrl);
      if (url.origin !== "https://sandbox.api.getsafepay.com") throw new Error("shop_unavailable");
      return { ok: true as const, checkoutUrl: url.toString() };
    }
    if (data.action === "refresh") return { ok: true as const, order: publicOrder(await request(`/orders/${id}/reconcile`, {})) };
    if (data.action === "clear") {
      const order = await request(`/orders/${id}`);
      if (order.paymentStatus !== "paid" && order.checkoutState !== "new") throw new Error("payment_still_pending");
      deleteCookie(cookieName, { path: "/" });
      return { ok: true as const };
    }
    throw new Error("shop_unavailable");
  } catch (error) {
    const code = error instanceof Error ? error.message : "shop_unavailable";
    const allowed = ["checkout_in_progress_or_unknown_recover_do_not_retry", "safepay_unavailable_or_unknown_result", "product_unavailable", "order_already_paid", "order_session_missing", "no_tracker_recovery_required", "payment_still_pending"];
    return { ok: false as const, error: allowed.includes(code) ? code : "shop_unavailable" };
  }
}
