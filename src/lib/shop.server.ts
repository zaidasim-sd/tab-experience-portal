import { createHmac, timingSafeEqual } from "node:crypto";
import process from "node:process";
import { deleteCookie, getCookie, getRequestUrl, setCookie } from "@tanstack/react-start/server";
import { ApiError, getPaymentService } from "./backend/payment-service.server";

const cookieName = "tab_order";

function signature(value: string, token: string) {
  return createHmac("sha256", token).update(value).digest("hex");
}

function currentId(token: string) {
  const cookie = getCookie(cookieName);
  if (!cookie) return null;
  const [id, expires, sig] = cookie.split(".");
  if (
    !id ||
    !/^[a-f0-9-]{36}$/.test(id) ||
    !expires ||
    !/^\d+$/.test(expires) ||
    Number(expires) < Date.now() ||
    !sig ||
    !/^[a-f0-9]{64}$/.test(sig)
  ) {
    return null;
  }
  const expected = signature(`${id}.${expires}`, token);
  return timingSafeEqual(Buffer.from(sig), Buffer.from(expected)) ? id : null;
}

export type ShopProduct = {
  _id: string;
  name: string;
  category: string;
  priceMinor: number;
  currency: string;
};

export type ShopOrder = {
  _id: string;
  totalMinor: number;
  currency: string;
  paymentStatus: string;
  checkoutState: string;
  lines: { productId: string; name: string; quantity: number; unitPriceMinor: number }[];
};

function publicOrder(order: ShopOrder): ShopOrder {
  return {
    _id: order._id,
    totalMinor: order.totalMinor,
    currency: order.currency,
    paymentStatus: order.paymentStatus,
    checkoutState: order.checkoutState,
    lines: order.lines,
  };
}

export async function shopAction(data: {
  action: string;
  items?: { productId: string; quantity: number }[];
  key?: string;
}) {
  try {
    let requestOrigin: string | undefined;
    try {
      requestOrigin = getRequestUrl({ xForwardedHost: true, xForwardedProto: true }).origin;
    } catch {
      // Ignore if outside request context
    }

    const { service, config } = await getPaymentService(requestOrigin);
    const token = config.apiToken;

    if (data.action === "products") {
      const products = await service.store.catalogue();
      return { ok: true as const, products: products as ShopProduct[] };
    }

    const id = currentId(token);

    if (data.action === "current") {
      if (!id) return { ok: true as const, order: null };
      await service.drain().catch(() => {});
      return { ok: true as const, order: publicOrder(await service.order(id)) };
    }

    if (data.action === "create") {
      if (id) {
        try {
          const previous = await service.order(id);
          if (previous.paymentStatus !== "paid") {
            return { ok: true as const, order: publicOrder(previous) };
          }
        } catch {
          // If previous order ID in cookie no longer exists in DB, create a new one
        }
      }
      const order = await service.createOrder({ items: data.items }, data.key);
      const value = `${order._id}.${Date.now() + 7 * 86400000}`;
      const isHttps = requestOrigin?.startsWith("https://") || process.env.NODE_ENV === "production";
      setCookie(cookieName, `${value}.${signature(value, token)}`, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 7 * 86400,
        secure: isHttps,
      });
      return { ok: true as const, order: publicOrder(order) };
    }

    if (!id) throw new Error("order_session_missing");

    if (data.action === "checkout") {
      const result = await service.checkout(id);
      const url = new URL(result.checkoutUrl);
      if (url.origin !== "https://sandbox.api.getsafepay.com") throw new Error("shop_unavailable");
      return { ok: true as const, checkoutUrl: url.toString() };
    }

    if (data.action === "refresh") {
      await service.drain().catch(() => {});
      return { ok: true as const, order: publicOrder(await service.reconcile(id)) };
    }

    if (data.action === "clear") {
      const order = await service.order(id);
      if (order.paymentStatus !== "paid" && order.checkoutState !== "new") {
        throw new Error("payment_still_pending");
      }
      deleteCookie(cookieName, { path: "/" });
      return { ok: true as const };
    }

    throw new Error("shop_unavailable");
  } catch (error) {
    const code =
      error instanceof ApiError
        ? error.code
        : error instanceof Error
          ? error.message
          : "shop_unavailable";
    const allowed = [
      "checkout_in_progress_or_unknown_recover_do_not_retry",
      "safepay_unavailable_or_unknown_result",
      "product_unavailable",
      "order_already_paid",
      "order_session_missing",
      "no_tracker_recovery_required",
      "payment_still_pending",
    ];
    return { ok: false as const, error: allowed.includes(code) ? code : "shop_unavailable" };
  }
}
