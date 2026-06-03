import { TabLogo } from "./TabLogo";
import { useBreakpoint } from "@/hooks/use-tab";

export function Footer() {
  const bp = useBreakpoint();
  const isMobile = bp !== "desktop";

  if (isMobile) {
    return (
      <footer
        style={{
          background: "var(--crimson)",
          color: "var(--cream)",
          padding: "2.5rem 1.5rem calc(7rem + env(safe-area-inset-bottom))",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "1.2rem",
          textAlign: "center",
        }}
      >
        <TabLogo size={44} color="var(--cream)" />
        <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: "1.4rem" }}>
          pull up a chair.
        </div>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, opacity: 0.85 }}>
          mon–fri 08:00 – 22:00 · sat–sun 09:00 – 23:00
        </div>
        <a
          href="https://instagram.com"
          target="_blank"
          rel="noreferrer"
          aria-label="Instagram"
          style={{ color: "var(--cream)", lineHeight: 0 }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <rect x="3" y="3" width="18" height="18" rx="5" />
            <circle cx="12" cy="12" r="4" />
            <circle cx="17.5" cy="6.5" r="0.9" fill="currentColor" stroke="none" />
          </svg>
        </a>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, opacity: 0.8 }}>
          © tab. All Rights Reserved
        </span>
        <a
          href="https://vision71tech.com"
          target="_blank"
          rel="noreferrer"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "0.6rem",
            textDecoration: "none",
            marginTop: "1.5rem",
            opacity: 0.85,
            transition: "opacity 0.25s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.85")}
        >
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--cream)", letterSpacing: "0.15em", textTransform: "uppercase" }}>Powered By</span>
          <img src="/v71_white.png" alt="Vision71 Tech" style={{ height: "40px", width: "auto", objectFit: "contain" }} />
        </a>
      </footer>
    );
  }

  return (
    <>
      <div style={{ height: 0.5, background: "var(--cream)", width: "100%" }} />
      <footer
        style={{
          background: "var(--crimson)",
          color: "var(--cream)",
          padding: "2.5rem 2rem",
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          alignItems: "center",
          gap: "1rem",
        }}
      >
        <div>
          <TabLogo size={44} color="var(--cream)" />
        </div>
        <div style={{ textAlign: "center", fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: "1.4rem" }}>
          pull up a chair.
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "1.8rem" }}>
          <a
            href="https://vision71tech.com"
            target="_blank"
            rel="noreferrer"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              gap: "0.6rem",
              textDecoration: "none",
              opacity: 0.85,
              transition: "opacity 0.25s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.85")}
          >
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--cream)", letterSpacing: "0.15em", textTransform: "uppercase" }}>Powered By</span>
            <img src="/v71_white.png" alt="Vision71 Tech" style={{ height: "48px", width: "auto", objectFit: "contain" }} />
          </a>

          <div style={{ display: "flex", alignItems: "center", gap: "1.2rem" }}>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram"
              style={{ color: "var(--cream)", lineHeight: 0 }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <rect x="3" y="3" width="18" height="18" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.5" cy="6.5" r="0.9" fill="currentColor" stroke="none" />
              </svg>
            </a>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 10 }}>
              © tab. All Rights Reserved
            </span>
          </div>
        </div>
      </footer>
    </>
  );
}
