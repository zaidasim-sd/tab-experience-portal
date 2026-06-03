import { useEffect, useRef, useState } from "react";

let sharedCtx: AudioContext | null = null;
function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!sharedCtx) {
    const AC = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;
    if (!AC) return null;
    sharedCtx = new AC();
  }
  return sharedCtx;
}

export function playTick() {
  if (typeof window === "undefined") return;
  if (!(window as any).__tabSoundOn) return;
  const ctx = getCtx();
  if (!ctx) return;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = "sine";
  o.frequency.value = 880;
  g.gain.setValueAtTime(0.0001, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.05, ctx.currentTime + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.04);
  o.connect(g).connect(ctx.destination);
  o.start();
  o.stop(ctx.currentTime + 0.05);
}

export function SoundToggle() {
  const [on, setOn] = useState(false);
  const reducedRef = useRef(false);

  useEffect(() => {
    reducedRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    (window as any).__tabSoundOn = false;
  }, []);

  const toggle = () => {
    if (reducedRef.current) return;
    const next = !on;
    setOn(next);
    (window as any).__tabSoundOn = next;
    if (next) getCtx()?.resume();
  };

  return (
    <button
      onClick={toggle}
      aria-label={on ? "mute sound" : "enable sound"}
      data-cursor="hover"
      style={{
        background: "transparent",
        border: "none",
        color: "var(--crimson)",
        display: "inline-flex",
        alignItems: "center",
        padding: 6,
        lineHeight: 0,
      }}
    >
      {on ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M11 5L6 9H2v6h4l5 4z" />
          <path d="M15.5 8.5a5 5 0 010 7" />
          <path d="M18.5 5.5a9 9 0 010 13" />
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M11 5L6 9H2v6h4l5 4z" />
          <line x1="22" y1="9" x2="16" y2="15" />
          <line x1="16" y1="9" x2="22" y2="15" />
        </svg>
      )}
    </button>
  );
}
