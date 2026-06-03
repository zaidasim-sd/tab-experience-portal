import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { menu, descriptors, type MenuItem } from "./menuData";
import { useBreakpoint } from "@/hooks/use-tab";
import { playTick } from "./SoundToggle";

function Asterisk() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" style={{ display: "inline-block", marginRight: 6 }} aria-hidden>
      <g stroke="var(--crimson)" strokeWidth="1.2" strokeLinecap="round">
        <line x1="7" y1="2" x2="7" y2="12" />
        <line x1="2.5" y1="4.5" x2="11.5" y2="9.5" />
        <line x1="11.5" y1="4.5" x2="2.5" y2="9.5" />
      </g>
    </svg>
  );
}

/* ── DESKTOP row (with magnetic pull) ── */
function DesktopRow({ item, descriptor }: { item: MenuItem; descriptor: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState(false);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      const cy = r.top + r.height / 2;
      const dy = e.clientY - cy;
      const dist = Math.abs(dy);
      if (dist < 80) {
        const pull = (1 - dist / 80) * 6;
        setOffset(pull);
      } else if (offset !== 0) {
        setOffset(0);
      }
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [offset]);

  return (
    <div
      ref={ref}
      className="menu-row"
      onMouseEnter={() => {
        setHover(true);
        playTick();
      }}
      onMouseLeave={() => setHover(false)}
      data-cursor="hover"
      style={{
        padding: "1.1rem 1.25rem",
        borderTop: "1px solid color-mix(in oklab, var(--crimson) 18%, transparent)",
        transition: "transform 200ms ease-out, background 280ms ease",
        transform: `translateX(${hover ? 12 + offset : offset}px)`,
        background: hover && item.signature ? "var(--wash)" : "transparent",
        willChange: "transform",
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: 0 }}>
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "1.2rem",
            color: "var(--crimson)",
            display: "inline-flex",
            alignItems: "center",
          }}
        >
          {item.signature && <Asterisk />}
          {item.name}
        </span>
        <span className="dotted-leader" aria-hidden />
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.95rem",
            color: "var(--crimson)",
            minWidth: 90,
            textAlign: "right",
            fontStyle: hover ? "italic" : "normal",
          }}
        >
          {hover ? descriptor : item.price}
        </span>
      </div>
      <p
        style={{
          margin: "0.35rem 0 0",
          fontSize: 12,
          fontFamily: "var(--font-sans)",
          color: "color-mix(in oklab, var(--crimson) 65%, transparent)",
        }}
      >
        {item.desc}
      </p>
    </div>
  );
}

/* ── MOBILE card (tap to expand) ── */
function MobileCard({ item, descriptor }: { item: MenuItem; descriptor: string }) {
  const [open, setOpen] = useState(false);
  return (
    <button
      type="button"
      onClick={() => setOpen((v) => !v)}
      aria-expanded={open}
      style={{
        all: "unset",
        cursor: "pointer",
        display: "block",
        width: "100%",
        background: open && item.signature ? "var(--wash)" : "var(--cream)",
        borderLeft: `${open ? 8 : 4}px solid var(--crimson)`,
        padding: "16px",
        borderBottom: "1px solid color-mix(in oklab, var(--crimson) 14%, transparent)",
        transition: "border-left-width 300ms ease, background 300ms ease",
        boxSizing: "border-box",
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "1rem",
            color: "var(--crimson)",
            display: "inline-flex",
            alignItems: "center",
          }}
        >
          {item.signature && <Asterisk />}
          {item.name}
        </span>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.85rem",
            color: "var(--crimson)",
            whiteSpace: "nowrap",
          }}
        >
          {item.price}
        </span>
      </div>
      <p
        style={{
          margin: "4px 0 0",
          fontFamily: "var(--font-sans)",
          fontSize: "0.75rem",
          color: "color-mix(in oklab, var(--crimson) 65%, transparent)",
          overflow: open ? "visible" : "hidden",
          textOverflow: "ellipsis",
          whiteSpace: open ? "normal" : "nowrap",
          lineHeight: 1.4,
        }}
      >
        {item.desc}
      </p>
      <div
        style={{
          maxHeight: open ? 60 : 0,
          overflow: "hidden",
          transition: "max-height 300ms ease",
        }}
      >
        <p
          style={{
            margin: "8px 0 0",
            fontFamily: "var(--font-sans)",
            fontStyle: "italic",
            fontSize: "0.8rem",
            color: "var(--crimson)",
          }}
        >
          — {descriptor}
        </p>
      </div>
    </button>
  );
}

export function Menu() {
  const bp = useBreakpoint();
  const isMobile = bp !== "desktop";
  const bandRef = useRef<HTMLDivElement>(null);
  const bandInView = useInView(bandRef, { once: true, margin: "-10%" });

  const itemDescriptors = useMemo(() => {
    const map = new Map<string, string>();
    menu.forEach((act) =>
      act.items.forEach((item) => {
        map.set(item.name, descriptors[Math.floor(Math.random() * descriptors.length)]);
      })
    );
    return map;
  }, []);

  return (
    <section id="menu" style={{ background: "var(--offwhite)" }}>
      {/* Title band — drawer slam */}
      <div ref={bandRef} data-theme="dark" style={{ background: "var(--crimson)", overflow: "hidden" }}>
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={bandInView ? { y: 0, opacity: 1 } : {}}
          transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
          style={{
            padding: "3rem 0 2.4rem",
            textAlign: "center",
          }}
        >
          <h2
            style={{
              margin: 0,
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: isMobile ? "22vw" : "18vw",
              color: "var(--cream)",
              lineHeight: 0.9,
              letterSpacing: "-0.02em",
            }}
          >
            MENU
          </h2>
          <p
            style={{
              margin: "0.8rem 1rem 0",
              fontFamily: "var(--font-mono)",
              fontSize: 12,
              color: "var(--cream)",
              letterSpacing: "0.2em",
              textTransform: "lowercase",
            }}
          >
            — everything is made to order. nothing is rushed.
          </p>
        </motion.div>
      </div>

      {/* ── MOBILE / TABLET LAYOUT — printed-menu cards ── */}
      {isMobile ? (
        <div style={{ paddingBottom: "8rem" }}>
          {menu.map((act, ai) => (
            <motion.div
              key={act.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-5%" }}
              transition={{ duration: 0.5, delay: 0.05 * ai }}
            >
              <div
                style={{
                  background: "var(--crimson)",
                  color: "var(--cream)",
                  padding: "8px 16px",
                  fontFamily: "var(--font-mono)",
                  fontSize: 12,
                  letterSpacing: "0.25em",
                  textTransform: "lowercase",
                }}
              >
                {act.numeral} — {act.title.toLowerCase()}
              </div>
              {act.items.map((item) => (
                <MobileCard
                  key={item.name}
                  item={item}
                  descriptor={itemDescriptors.get(item.name) ?? "trust us"}
                />
              ))}
            </motion.div>
          ))}
        </div>
      ) : (
        /* ── DESKTOP LAYOUT ── */
        <div style={{ maxWidth: 980, margin: "0 auto", padding: "4rem 1.5rem 6rem" }}>
          {menu.map((act) => (
            <motion.div
              key={act.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10%" }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              style={{ marginBottom: "4rem" }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                  marginBottom: "1.4rem",
                  paddingLeft: "0.5rem",
                  borderLeft: "2px solid var(--crimson)",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 11,
                    letterSpacing: "0.25em",
                    color: "var(--crimson)",
                  }}
                >
                  {act.numeral}
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-display)",
                    fontStyle: "italic",
                    fontSize: "1.6rem",
                    color: "var(--crimson)",
                  }}
                >
                  {act.title.toLowerCase()}
                </span>
              </div>
              <div>
                {act.items.map((item) => (
                  <DesktopRow
                    key={item.name}
                    item={item}
                    descriptor={itemDescriptors.get(item.name) ?? "trust us"}
                  />
                ))}
                <div style={{ borderTop: "1px solid color-mix(in oklab, var(--crimson) 18%, transparent)" }} />
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </section>
  );
}
