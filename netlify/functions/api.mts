import { randomUUID, timingSafeEqual } from "node:crypto";
import type { Config, Context } from "@netlify/functions";
import { ApiError, assert, getPaymentService } from "../../src/lib/backend/payment-service.server";

function authorized(value: string | null, token: string): boolean {
  const expected = Buffer.from(`Bearer ${token}`);
  const actual = Buffer.from(value || "");
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

async function readBodyBuffer(req: Request): Promise<Buffer> {
  const ab = await req.arrayBuffer();
  assert(ab.byteLength <= 65536, 413, "body_too_large");
  return Buffer.from(ab);
}

function jsonResponse(status: number, data: unknown, requestId: string): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
      "x-request-id": requestId,
      "content-type": "application/json; charset=utf-8",
    },
  });
}

export default async (req: Request, context: Context): Promise<Response> => {
  const requestId = randomUUID();
  try {
    const url = new URL(req.url);
    const path = url.pathname.replace(/^\/\.netlify\/functions\/api/, "") || "/";
    const method = req.method.toUpperCase();

    if (method === "GET" && path === "/health") {
      return jsonResponse(200, { status: "ok", environment: "sandbox" }, requestId);
    }

    const { service, config } = await getPaymentService(url.origin);

    if (method === "GET" && (path === "/payment/return" || path === "/payment/cancel")) {
      const kind = path.endsWith("cancel") ? "cancel" : "return";
      const target = `${config.storefrontUrl}/order?payment=${kind}`;
      return new Response(null, {
        status: 303,
        headers: {
          location: target,
          "cache-control": "no-store",
          "x-content-type-options": "nosniff",
          "x-request-id": requestId,
        },
      });
    }

    if (method === "POST" && path === "/webhooks/safepay") {
      const contentType = req.headers.get("content-type")?.split(";")[0]?.trim();
      assert(contentType === "application/json", 415, "json_required");
      const raw = await readBodyBuffer(req);
      const result = await service.acceptWebhook(raw, req.headers.get("x-sfpy-signature"));
      const drainPromise = service.drain().catch(() => {
        console.error("Webhook drain failed; persisted events will retry");
      });
      if (typeof context?.waitUntil === "function") {
        context.waitUntil(drainPromise);
      } else {
        await drainPromise;
      }
      return jsonResponse(200, result, requestId);
    }

    assert(authorized(req.headers.get("authorization"), config.apiToken), 401, "unauthorized");

    if (method === "GET" && path === "/products") {
      return jsonResponse(200, { products: await service.store.catalogue() }, requestId);
    }

    const eventMatch = path.match(/^\/events\/(evt_[a-zA-Z0-9-]{1,100})$/);
    if (method === "GET" && eventMatch) {
      const event = await service.store.events.findOne({ _id: eventMatch[1] });
      assert(event, 404, "event_not_found");
      return jsonResponse(200, event, requestId);
    }

    const match = path.match(/^\/orders\/([a-f0-9-]{36})(?:\/(checkout|reconcile|recover))?$/);
    if (method === "GET" && match && !match[2]) {
      return jsonResponse(200, await service.order(match[1]), requestId);
    }

    if (method === "POST") {
      if (path === "/orders" || match?.[2] === "recover") {
        const contentType = req.headers.get("content-type")?.split(";")[0]?.trim();
        assert(contentType === "application/json", 415, "json_required");
        const raw = await readBodyBuffer(req);
        let body: Record<string, unknown>;
        try {
          body = JSON.parse(raw.toString("utf8")) as Record<string, unknown>;
        } catch {
          throw new ApiError(400, "invalid_json");
        }
        if (path === "/orders") {
          return jsonResponse(
            200,
            await service.createOrder(body, req.headers.get("idempotency-key")),
            requestId,
          );
        }
        assert(
          body && typeof body === "object" && Object.keys(body).join(",") === "tracker",
          400,
          "tracker_only_required",
        );
        return jsonResponse(200, await service.recover(match[1], body.tracker), requestId);
      }
      if (match?.[2] === "checkout") {
        return jsonResponse(200, await service.checkout(match[1]), requestId);
      }
      if (match?.[2] === "reconcile") {
        return jsonResponse(200, await service.reconcile(match[1]), requestId);
      }
    }

    return jsonResponse(404, { error: "not_found" }, requestId);
  } catch (e: unknown) {
    const status = e instanceof ApiError ? e.status : 503;
    const code = e instanceof ApiError ? e.code : "service_unavailable";
    console.log(JSON.stringify({ requestId, status, code }));
    return jsonResponse(status, { error: code, requestId }, requestId);
  }
};

export const config: Config = {
  path: [
    "/health",
    "/payment/return",
    "/payment/cancel",
    "/webhooks/safepay",
    "/products",
    "/orders",
    "/orders/*",
    "/events/*",
  ],
};

