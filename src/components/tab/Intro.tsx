import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Reset the one-time intro after the confirmation modal has been removed.
const KEY = "tab_intro_played_v3";

export function Intro() {
  const [show, setShow] = useState(false);
  const [showSkip, setShowSkip] = useState(false);
  const [folding, setFolding] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(KEY)) return;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setReduceMotion(prefersReducedMotion);
    setShow(true);
    if (prefersReducedMotion) {
      const end = setTimeout(() => {
        setShow(false);
        sessionStorage.setItem(KEY, "1");
      }, 1200);
      return () => clearTimeout(end);
    }
    const t = setTimeout(() => setShowSkip(true), 1500);
    const fold = setTimeout(() => setFolding(true), 2800);
    const end = setTimeout(() => {
      setShow(false);
      sessionStorage.setItem(KEY, "1");
    }, 3500);
    return () => {
      clearTimeout(t);
      clearTimeout(fold);
      clearTimeout(end);
    };
  }, []);

  const skip = () => {
    setShow(false);
    sessionStorage.setItem(KEY, "1");
  };

  const letters = ["t", "a", "b", "."];

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="intro"
          initial={reduceMotion ? false : { y: 0 }}
          animate={
            reduceMotion
              ? { y: 0 }
              : folding
                ? { y: "-100%", transition: { duration: 0.7, ease: [0.76, 0, 0.24, 1] } }
                : {}
          }
          style={{
            position: "fixed",
            inset: 0,
            background: "var(--cream)",
            zIndex: 10000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            transformOrigin: "top center",
          }}
        >
          <motion.div
            data-theme="dark"
            initial={reduceMotion ? false : { scale: 0 }}
            animate={{ scale: 1 }}
            transition={reduceMotion ? { duration: 0 } : { duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
            style={{
              width: "80vmin",
              height: "80vmin",
              borderRadius: "9999px",
              background: "var(--crimson)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              willChange: "transform",
            }}
          >
            <div style={{ display: "flex", overflow: "hidden" }}>
              {letters.map((l, i) => (
                <motion.span
                  key={i}
                  initial={reduceMotion ? false : { y: -120, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={reduceMotion ? { duration: 0 } : {
                    delay: 0.9 + i * 0.08,
                    type: "spring",
                    stiffness: 380,
                    damping: 14,
                  }}
                  style={{
                    fontFamily: "var(--font-display)",
                    fontStyle: "italic",
                    fontWeight: 600,
                    color: "var(--cream)",
                    fontSize: "clamp(4rem, 18vmin, 14rem)",
                    lineHeight: 1,
                    display: "inline-block",
                  }}
                >
                  {l}
                </motion.span>
              ))}
            </div>
          </motion.div>

          {showSkip && !folding && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={skip}
              style={{
                position: "absolute",
                bottom: 24,
                right: 24,
                fontSize: 11,
                fontFamily: "var(--font-sans)",
                color: "var(--crimson)",
                background: "transparent",
                border: "none",
                letterSpacing: "0.05em",
              }}
            >
              skip
            </motion.button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
