import { createFileRoute } from "@tanstack/react-router";
import { OrderExperience } from "@/components/tab/OrderExperience";

export const Route = createFileRoute("/order")({
  head: () => ({ meta: [{ title: "Your next good coffee — tab." }, { name: "robots", content: "noindex" }] }),
  component: OrderExperience,
});
