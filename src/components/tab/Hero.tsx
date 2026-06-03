import { motion } from "framer-motion";
import { CoffeeCupScroll } from "./CoffeeCupScroll";
import { useBreakpoint } from "@/hooks/use-tab";

export function Hero() {
  const bp = useBreakpoint();
  const isDesktop = bp === "desktop";

  if (!isDesktop) {
    // ── MOBILE / TABLET ──
    const tabletScale = bp === "tablet" ? 1.15 : 1;
    return (
      <section
        id="top"
        style={{
          position: "relative",
          minHeight: "100svh",
          background: "var(--cream)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "42%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "100%",
            textAlign: "center",
            pointerEvents: "none",
          }}
        >
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            style={{
              margin: 0,
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              color: "var(--crimson)",
              fontSize: "94vw",
              lineHeight: 0.85,
              letterSpacing: "-0.04em",
            }}
          >
            tab.
          </motion.h1>
        </div>

        <div
          style={{
            position: "absolute",
            top: "65%",
            left: 0,
            right: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "0.35rem",
          }}
        >
          {["a place to land.", "a place to think.", "a very good coffee."].map((t, i) => (
            <motion.p
              key={t}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.12, duration: 0.55, ease: "easeOut" }}
              style={{
                margin: 0,
                fontFamily: "var(--font-sans)",
                fontSize: `${5.5 * tabletScale}vw`,
                color: "var(--crimson)",
              }}
            >
              {t}
            </motion.p>
          ))}
        </div>

        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: "calc(20px + env(safe-area-inset-bottom))",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 6,
            pointerEvents: "none",
          }}
        >
          <motion.svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--crimson)"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <polyline points="6 9 12 15 18 9" />
          </motion.svg>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 9,
              color: "var(--crimson)",
              letterSpacing: "0.25em",
              textTransform: "lowercase",
            }}
          >
            scroll in
          </span>
        </div>
      </section>
    );
  }

  // ── DESKTOP ──
  return (
    <section
      id="top"
      style={{
        position: "relative",
        minHeight: "100vh",
        background: "var(--cream)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          right: "2.5rem",
          top: 0,
          bottom: 0,
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          pointerEvents: "none",
        }}
      >
        <div style={{ width: 1, height: "70vh", background: "var(--crimson)" }} />
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: "var(--crimson)",
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            writingMode: "vertical-rl",
            transform: "rotate(180deg)",
          }}
        >
          EST. KARACHI — SPECIALTY COFFEE
        </span>
      </div>

      <div
        style={{
          position: "absolute",
          left: 0,
          top: "50%",
          transform: "translateY(-50%)",
          width: "100%",
          pointerEvents: "none",
        }}
      >
        <motion.h1
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            color: "var(--crimson)",
            fontSize: "clamp(8rem, 28vw, 32rem)",
            lineHeight: 0.85,
            marginLeft: "-4vw",
            whiteSpace: "nowrap",
            willChange: "transform",
          }}
        >
          tab.
        </motion.h1>

        <div
          style={{
            position: "absolute",
            right: "8vw",
            bottom: "-4vw",
            textAlign: "right",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: "0.4rem",
          }}
        >
          {[
            { text: "a place to land.", size: "2.4rem" },
            { text: "a place to think.", size: "1.8rem" },
            { text: "a very good coffee.", size: "1.2rem" },
          ].map((l, i) => (
            <motion.p
              key={l.text}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 + i * 0.3, duration: 0.7, ease: "easeOut" }}
              style={{
                fontFamily: "var(--font-display)",
                fontStyle: "italic",
                fontSize: l.size,
                color: "var(--crimson)",
                lineHeight: 1.1,
                margin: 0,
              }}
            >
              {l.text}
            </motion.p>
          ))}
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.2, duration: 0.6 }}
        style={{
          position: "absolute",
          bottom: 28,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 6,
        }}
      >
        <CoffeeCupScroll />
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            color: "var(--crimson)",
            letterSpacing: "0.25em",
            textTransform: "lowercase",
          }}
        >
          scroll to order
        </span>
      </motion.div>
    </section>
  );
}
