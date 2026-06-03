import { motion } from "framer-motion";
import { useBreakpoint } from "@/hooks/use-tab";

const hours = [
  ["MON – FRI", "08:00 – 22:00"],
  ["SAT – SUN", "09:00 – 23:00"],
];

export function FindUs() {
  const bp = useBreakpoint();
  const isMobile = bp !== "desktop";
  const mapHeight = bp === "mobile" ? 240 : bp === "tablet" ? 320 : undefined;

  return (
    <section
      id="find"
      style={{
        background: "var(--cream)",
        padding: isMobile ? "4rem 1.25rem 6rem" : "6rem 1.5rem",
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto", textAlign: isMobile ? "center" : "left" }}>
        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          style={{
            margin: 0,
            fontFamily: "var(--font-mono)",
            fontSize: isMobile ? "18vw" : "clamp(2.5rem, 5vw, 4rem)",
            color: "var(--crimson)",
            letterSpacing: "-0.02em",
            textTransform: "lowercase",
            lineHeight: 0.95,
          }}
        >
          karachi.
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.15 }}
          style={{
            margin: isMobile ? "1.2rem auto 0" : "1.2rem 0 0",
            maxWidth: 520,
            fontFamily: isMobile ? "var(--font-sans)" : "var(--font-display)",
            fontStyle: isMobile ? "normal" : "italic",
            fontSize: isMobile ? "1rem" : "1.4rem",
            color: "var(--crimson)",
            lineHeight: 1.5,
          }}
        >
          we're not hard to find. we're just easy to miss if you're moving too fast.
        </motion.p>

        <div
          style={{
            position: "relative",
            marginTop: "3rem",
            border: "1px solid color-mix(in oklab, var(--crimson) 25%, transparent)",
            overflow: "hidden",
            ...(mapHeight ? { height: mapHeight } : { aspectRatio: "16 / 9" }),
          }}
        >
          <iframe
            title="tab. location"
            src="https://www.openstreetmap.org/export/embed.html?bbox=67.0,24.8,67.1,24.9&layer=mapnik"
            style={{
              width: "100%",
              height: "100%",
              border: 0,
              filter: "grayscale(1) sepia(0.2)",
            }}
            loading="lazy"
          />
          <svg
            width="36"
            height="48"
            viewBox="0 0 36 48"
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -100%)",
              pointerEvents: "none",
            }}
            aria-hidden
          >
            <path
              d="M18 0 C8 0 0 8 0 18 C0 30 18 48 18 48 C18 48 36 30 36 18 C36 8 28 0 18 0 Z"
              fill="var(--crimson)"
            />
            <circle cx="18" cy="18" r="6" fill="var(--cream)" />
          </svg>
        </div>

        <div
          style={{
            marginTop: "2.5rem",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            fontFamily: "var(--font-mono)",
            fontSize: isMobile ? 13 : "0.9rem",
            color: "var(--crimson)",
            maxWidth: isMobile ? 360 : 520,
            marginInline: isMobile ? "auto" : undefined,
            textAlign: "left",
          }}
        >
          {hours.map(([d, t]) => (
            <div
              key={d}
              style={{
                display: "contents",
              }}
            >
              <div
                style={{
                  padding: "10px 4px",
                  borderTop: "1px solid color-mix(in oklab, var(--crimson) 25%, transparent)",
                }}
              >
                {d}
              </div>
              <div
                style={{
                  padding: "10px 4px",
                  textAlign: "right",
                  borderTop: "1px solid color-mix(in oklab, var(--crimson) 25%, transparent)",
                }}
              >
                {t}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
