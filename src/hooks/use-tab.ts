import { useEffect, useState } from "react";

export function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return reduced;
}

export type BP = "mobile" | "tablet" | "desktop";

export function useBreakpoint(): BP {
  const [bp, setBp] = useState<BP>("desktop");
  useEffect(() => {
    if (typeof window === "undefined") return;
    const update = () => {
      const w = window.innerWidth;
      setBp(w < 768 ? "mobile" : w < 1024 ? "tablet" : "desktop");
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return bp;
}
