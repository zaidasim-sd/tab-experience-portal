import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TabLogo } from "./TabLogo";

const links = [
  { label: "menu", href: "#menu" },
  { label: "story", href: "#story" },
  { label: "find us", href: "#find" },
];

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > window.innerHeight * 0.85);
    const onResize = () => setIsMobile(window.innerWidth < 768);
    onScroll();
    onResize();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <>
      {/* Sliding bar */}
      <motion.div
        initial={{ y: "-100%" }}
        animate={{ y: scrolled ? 0 : "-100%" }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: 64,
          background: "var(--cream)",
          borderBottom: "0.5px solid var(--crimson)",
          zIndex: 50,
        }}
      />

      <header
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 60,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: scrolled ? "12px 32px" : "28px 40px",
          transition: "padding 280ms ease",
        }}
      >
        <a href="#top" aria-label="tab. home">
          <TabLogo size={scrolled ? 32 : 44} />
        </a>

        {/* Desktop links */}
        {!isMobile && (
          <nav style={{ display: "flex", gap: "2.5rem" }}>
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: 13,
                  color: "var(--crimson)",
                  textDecoration: "none",
                }}
              >
                {l.label}
              </a>
            ))}
          </nav>
        )}

        {/* Mobile toggle */}
        {isMobile && (
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label="menu"
            style={{
              width: 40,
              height: 40,
              borderRadius: "9999px",
              background: "var(--crimson)",
              color: "var(--cream)",
              border: "none",
              fontSize: 18,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 70,
              position: "relative",
            }}
          >
            {open ? "✕" : "≡"}
          </button>
        )}
      </header>

      {/* Mobile takeover */}
      <AnimatePresence>
        {open && isMobile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{
              position: "fixed",
              inset: 0,
              background: "var(--crimson)",
              zIndex: 65,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              paddingLeft: "2rem",
              gap: "1.2rem",
            }}
          >
            {links.map((l, i) => (
              <motion.a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                initial={{ x: -60, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.1 + i * 0.06, duration: 0.4, ease: "easeOut" }}
                style={{
                  fontFamily: "var(--font-display)",
                  fontStyle: "italic",
                  fontSize: "3.5rem",
                  color: "var(--cream)",
                  textDecoration: "none",
                  lineHeight: 1,
                }}
              >
                {l.label}
              </motion.a>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
