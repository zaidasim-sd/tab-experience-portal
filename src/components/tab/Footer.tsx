import { TabLogo } from "./TabLogo";

export function Footer() {
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

        <div
          style={{
            textAlign: "center",
            fontFamily: "var(--font-display)",
            fontStyle: "italic",
            fontSize: "1.4rem",
          }}
        >
          pull up a chair.
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: "1.2rem",
          }}
        >
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
            © tab. all rights reserved
          </span>
        </div>
      </footer>
    </>
  );
}
