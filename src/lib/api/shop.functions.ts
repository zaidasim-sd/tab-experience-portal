import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { shopAction } from "../shop.server";

export const shop = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    action: z.enum(["products", "current", "create", "checkout", "refresh", "clear"]),
    items: z.array(z.object({ productId: z.string().max(80), quantity: z.number().int().min(1).max(20) })).max(20).optional(),
    key: z.string().uuid().optional(),
  }).superRefine((data, context) => {
    if (data.action === "create" && (!data.items?.length || !data.key)) context.addIssue({ code: "custom", message: "Cart and request key required" });
  }))
  .handler(({ data }) => shopAction(data));
