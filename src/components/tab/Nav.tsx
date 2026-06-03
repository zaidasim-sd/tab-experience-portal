import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TabLogo } from "./TabLogo";
import { useBreakpoint } from "@/hooks/use-tab";
import { SoundToggle } from "./SoundToggle";

const links = [
  { label: "menu", href: "#menu" },
  { label: "story", href: "#story" },
  { label: "find us", href: "#find" },
];

export function Nav() {
  const bp = useBreakpoint();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > window.innerHeight * 0.85);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ── MOBILE / TABLET: floating glass pill at bottom ──
  if (bp !== "desktop") {
    return (
      <>
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
            padding: "16px 20px",
            background: scrolled ? "var(--cream)" : "transparent",
            borderBottom: scrolled ? "0.5px solid var(--crimson)" : "none",
            transition: "all 280ms ease",
          }}
        >
          <a href="#top" aria-label="tab. home">
            <TabLogo size={36} />
          </a>
        </header>
        <nav
          aria-label="primary"
          style={{
            position: "fixed",
            left: "50%",
            transform: "translateX(-50%)",
            bottom: "calc(20px + env(safe-area-inset-bottom))",
            zIndex: 100,
            padding: "14px 32px",
            background: "rgba(237, 232, 223, 0.85)",
            border: "1px solid var(--crimson)",
            borderRadius: 999,
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            gap: 16,
            fontFamily: "var(--font-sans)",
            fontSize: bp === "tablet" ? 16 : 14,
            color: "var(--crimson)",
            boxShadow: "0 6px 24px -10px rgba(139,0,0,0.35)",
          }}
        >
          {links.map((l, i) => (
            <span key={l.href} style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
              <a href={l.href} style={{ color: "var(--crimson)", textDecoration: "none", whiteSpace: "nowrap" }}>
                {l.label}
              </a>
              {i < links.length - 1 && <span aria-hidden style={{ opacity: 0.6 }}>·</span>}
            </span>
          ))}
        </nav>
      </>
    );
  }

  // ── DESKTOP ──
  return (
    <>
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
          <TabLogo size={scrolled ? 40 : 56} />
        </a>
        <nav style={{ display: "flex", gap: "2.5rem", alignItems: "center" }}>
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: 16,
                color: "var(--crimson)",
                textDecoration: "none",
              }}
            >
              {l.label}
            </a>
          ))}
          <SoundToggle />
        </nav>
      </header>
    </>
  );
}
