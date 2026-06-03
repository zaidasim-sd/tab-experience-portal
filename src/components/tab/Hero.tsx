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
            right: "1.25rem",
            top: 0,
            bottom: 0,
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            pointerEvents: "none",
          }}
        >
          <div style={{ width: 1, height: "25vh", background: "var(--crimson)" }} />
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 9,
              color: "var(--crimson)",
              letterSpacing: "0.2em",
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
            top: "40%",
            left: 0,
            transform: "translateY(-50%)",
            width: "100%",
            pointerEvents: "none",
          }}
        >
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            style={{
              margin: 0,
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              color: "var(--crimson)",
              fontSize: "clamp(6rem, 25vh, 16rem)",
              lineHeight: 0.85,
              letterSpacing: "-0.04em",
              marginLeft: "-2vw",
              paddingRight: "2vw",
            }}
          >
            tab.
          </motion.h1>

          <div
            style={{
              marginTop: "2rem",
              paddingLeft: "8vw",
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              gap: "0.4rem",
            }}
          >
            {[
              { text: "a place to land.", size: `${8 * tabletScale}vw` },
              { text: "a place to think.", size: `${6 * tabletScale}vw` },
              { text: "a very good coffee.", size: `${4.5 * tabletScale}vw` },
            ].map((l, i) => (
              <motion.p
                key={l.text}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + i * 0.2, duration: 0.6, ease: "easeOut" }}
                style={{
                  margin: 0,
                  fontFamily: "var(--font-display)",
                  fontStyle: "italic",
                  fontSize: l.size,
                  color: "var(--crimson)",
                  lineHeight: 1.1,
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
          transition={{ delay: 1.4, duration: 0.6 }}
          style={{
            position: "absolute",
            bottom: "calc(90px + env(safe-area-inset-bottom))",
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 6,
            pointerEvents: "none",
          }}
        >
          <CoffeeCupScroll />
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
        </motion.div>
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
            fontSize: "clamp(8rem, 24vw, 30rem)",
            lineHeight: 0.85,
            marginLeft: "-2vw",
            paddingRight: "4vw",
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
          scroll to explore
        </span>
      </motion.div>
    </section>
  );
}
