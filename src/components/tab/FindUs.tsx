import { motion } from "framer-motion";

export function FindUs() {
  return (
    <section
      id="find"
      style={{
        background: "var(--cream)",
        padding: "6rem 1.5rem",
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          style={{
            margin: 0,
            fontFamily: "var(--font-mono)",
            fontSize: "3rem",
            color: "var(--crimson)",
            letterSpacing: "-0.02em",
            textTransform: "lowercase",
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
            marginTop: "1.2rem",
            maxWidth: 520,
            fontFamily: "var(--font-display)",
            fontStyle: "italic",
            fontSize: "1.4rem",
            color: "var(--crimson)",
            lineHeight: 1.4,
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
            aspectRatio: "16 / 9",
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
          {/* Custom pin */}
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
            gap: "0.4rem",
            fontFamily: "var(--font-mono)",
            fontSize: "0.9rem",
            color: "var(--crimson)",
          }}
        >
          <div style={{ display: "flex", gap: "2rem" }}>
            <span style={{ minWidth: 110 }}>MON – FRI</span>
            <span>08:00 – 22:00</span>
          </div>
          <div style={{ display: "flex", gap: "2rem" }}>
            <span style={{ minWidth: 110 }}>SAT – SUN</span>
            <span>09:00 – 23:00</span>
          </div>
        </div>
      </div>
    </section>
  );
}
