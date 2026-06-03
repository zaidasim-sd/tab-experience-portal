import { motion } from "framer-motion";
import { useBreakpoint } from "@/hooks/use-tab";

const paras = [
  "there are twelve seats. we like it that way.",
  "the espresso machine is loud. the playlist is quiet. people read books here, or they don't — both are fine.",
  "we made this place for the morning you didn't plan, the meeting that ran short, the friend you needed to see.",
];

export function Story() {
  const bp = useBreakpoint();

  if (bp !== "desktop") {
    // ── MOBILE / TABLET — text inside slowly rotating circle ──
    return (
      <section
        id="story"
        style={{
          position: "relative",
          background: "var(--cream)",
          padding: "5rem 1.25rem",
          overflow: "hidden",
        }}
      >
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 0.7 }}
          style={{
            margin: 0,
            fontFamily: "var(--font-display)",
            fontSize: "8.5vw",
            color: "var(--crimson)",
            lineHeight: 1.05,
          }}
        >
          tab. is small on purpose.
        </motion.h2>

        <div
          style={{
            position: "relative",
            marginTop: "3rem",
            width: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 60, ease: "linear", repeat: Infinity }}
            style={{
              width: "88vw",
              height: "88vw",
              maxWidth: 560,
              maxHeight: 560,
              borderRadius: "9999px",
              border: "2px solid var(--crimson)",
              willChange: "transform",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              padding: "0 14vw",
              textAlign: "center",
              gap: "1rem",
            }}
          >
            {paras.map((p, i) => (
              <motion.p
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.15 + i * 0.12 }}
                style={{
                  margin: 0,
                  fontFamily: "var(--font-sans)",
                  fontSize: "0.95rem",
                  lineHeight: 1.6,
                  color: "color-mix(in oklab, var(--crimson) 80%, transparent)",
                }}
              >
                {p}
              </motion.p>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // ── DESKTOP — split screen ──
  return (
    <section id="story" className="story-grid" style={{ minHeight: "100vh" }}>
      <div
        style={{
          background: "var(--cream)",
          padding: "clamp(3rem, 8vw, 6rem)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-15%" }}
          transition={{ duration: 0.7 }}
          style={{
            margin: 0,
            fontFamily: "var(--font-display)",
            fontSize: "2.8rem",
            color: "var(--crimson)",
            lineHeight: 1.1,
            maxWidth: 460,
          }}
        >
          tab. is small on purpose.
        </motion.h2>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-15%" }}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.12, delayChildren: 0.2 } },
          }}
          style={{ marginTop: "2rem", maxWidth: 460, display: "flex", flexDirection: "column", gap: "1.1rem" }}
        >
          {paras.map((p, i) => (
            <motion.p
              key={i}
              variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}
              style={{
                margin: 0,
                fontFamily: "var(--font-sans)",
                fontSize: "1rem",
                lineHeight: 1.7,
                color: "color-mix(in oklab, var(--crimson) 75%, transparent)",
              }}
            >
              {p}
            </motion.p>
          ))}
        </motion.div>
      </div>

      <div
        style={{
          position: "relative",
          background: "var(--crimson)",
          minHeight: "60vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        <svg aria-hidden style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.04, mixBlendMode: "overlay", pointerEvents: "none" }}>
          <filter id="story-noise">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
          </filter>
          <rect width="100%" height="100%" filter="url(#story-noise)" />
        </svg>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 60, ease: "linear", repeat: Infinity }}
          style={{
            width: "60vw",
            maxWidth: 520,
            aspectRatio: "1 / 1",
            borderRadius: "9999px",
            border: "2px solid var(--cream)",
            willChange: "transform",
          }}
        />
      </div>
    </section>
  );
}
