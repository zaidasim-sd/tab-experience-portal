import type { Config } from "@netlify/functions";
import { getPaymentService } from "../../src/lib/backend/payment-service.server";

export default async (req: Request) => {
  try {
    const { next_run } = (await req.json().catch(() => ({}))) as { next_run?: string };
    const { service } = await getPaymentService();
    await service.drain();
    console.log("Drained pending payment webhook events. Next invocation at:", next_run);
  } catch {
    console.error("Scheduled webhook drain failed");
  }
};

export const config: Config = {
  // Every 5 minutes UTC to retry any pending Safepay webhook events
  schedule: "*/5 * * * *",
};

