import { useEffect, useRef, useState } from "react";

export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const target = useRef({ x: -100, y: -100 });
  const pos = useRef({ x: -100, y: -100 });
  const [hover, setHover] = useState(false);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    setEnabled(true);

    const move = (e: MouseEvent) => {
      target.current.x = e.clientX;
      target.current.y = e.clientY;
      const el = e.target as HTMLElement | null;
      if (el && el.closest("a, button, [data-cursor='hover'], input, textarea, select, label")) {
        setHover(true);
      } else {
        setHover(false);
      }
    };
    window.addEventListener("mousemove", move);

    let raf = 0;
    const tick = () => {
      pos.current.x += (target.current.x - pos.current.x) * 0.18;
      pos.current.y += (target.current.y - pos.current.y) * 0.18;
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
        transition: "width 150ms ease, height 150ms ease, background 150ms ease, border 150ms ease",
        mixBlendMode: "normal",
        willChange: "transform, width, height",
      }}
    />
  );
}
