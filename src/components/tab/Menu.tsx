import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { menu, descriptors, type MenuItem } from "./menuData";

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

function Row({ item, descriptor }: { item: MenuItem; descriptor: string }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      className="menu-row"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      data-cursor="hover"
      style={{
        padding: "1.1rem 1.25rem",
        borderTop: "1px solid color-mix(in oklab, var(--crimson) 18%, transparent)",
        transition: "transform 280ms ease, background 280ms ease",
        transform: hover ? "translateX(12px)" : "translateX(0)",
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
            transition: "opacity 200ms ease",
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

export function Menu() {
  // stable per-item descriptor
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
      {/* Title band */}
      <div
        style={{
          background: "var(--crimson)",
          padding: "3rem 0 2.4rem",
          textAlign: "center",
          overflow: "hidden",
        }}
      >
        <h2
          style={{
            margin: 0,
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: "18vw",
            color: "var(--cream)",
            lineHeight: 0.9,
            letterSpacing: "-0.02em",
          }}
        >
          MENU
        </h2>
        <p
          style={{
            margin: "0.8rem 0 0",
            fontFamily: "var(--font-mono)",
            fontSize: 12,
            color: "var(--cream)",
            letterSpacing: "0.2em",
            textTransform: "lowercase",
          }}
        >
          — everything is made to order. nothing is rushed.
        </p>
      </div>

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
                <Row key={item.name} item={item} descriptor={itemDescriptors.get(item.name) ?? "trust us"} />
              ))}
              <div style={{ borderTop: "1px solid color-mix(in oklab, var(--crimson) 18%, transparent)" }} />
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
