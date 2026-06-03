import { useEffect, useRef, useState } from "react";

export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const target = useRef({ x: -100, y: -100 });
  const pos = useRef({ x: -100, y: -100 });
  const [hover, setHover] = useState(false);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Desktop only — >1024px AND fine pointer
    if (!window.matchMedia("(hover: hover) and (pointer: fine) and (min-width: 1025px)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setEnabled(true);

    const move = (e: MouseEvent) => {
      target.current.x = e.clientX;
      target.current.y = e.clientY;
      const el = e.target as HTMLElement | null;
      setHover(
        !!el?.closest("a, button, [data-cursor='hover'], input, textarea, select, label")
      );
    };
    window.addEventListener("mousemove", move);

    let raf = 0;
    const tick = () => {
      // Tighter follow — ~25ms of lag at 60fps
      pos.current.x += (target.current.x - pos.current.x) * 0.28;
      pos.current.y += (target.current.y - pos.current.y) * 0.28;
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${pos.current.x}px, ${pos.current.y}px, 0) translate(-50%, -50%)`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("mousemove", move);
      cancelAnimationFrame(raf);
    };
  }, []);

  if (!enabled) return null;

  return (
    <div
      ref={dotRef}
      aria-hidden
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: hover ? 32 : 12,
        height: hover ? 32 : 12,
        borderRadius: "9999px",
        background: hover ? "transparent" : "var(--crimson)",
        border: hover ? "1.5px solid var(--crimson)" : "none",
        pointerEvents: "none",
        zIndex: 9999,
        transition: "width 120ms ease-out, height 120ms ease-out, background 120ms ease-out, border 120ms ease-out",
        willChange: "transform, width, height",
      }}
    />
  );
}
