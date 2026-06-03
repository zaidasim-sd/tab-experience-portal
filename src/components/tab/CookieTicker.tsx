import { TabLogo } from "./TabLogo";

const phrases = ["tab cookie", "brown butter", "dark chocolate", "baked daily"];

function Segment({ isMobile }: { isMobile: boolean }) {
  const fontSize = isMobile ? 14 : "2rem";
  const logoSize = isMobile ? 14 : 18;
  const gap = isMobile ? "1rem" : "1.8rem";
  return (
    <div style={{ display: "flex", alignItems: "center", gap, padding: `0 ${gap}` }}>
      {phrases.map((p, i) => (
        <span key={i} style={{ display: "inline-flex", alignItems: "center", gap }}>
          <span
            style={{
              fontFamily: isMobile ? "var(--font-sans)" : "var(--font-display)",
              fontStyle: isMobile ? "normal" : "italic",
              fontSize,
              color: "var(--crimson)",
              whiteSpace: "nowrap",
            }}
          >
            {p}
          </span>
          <TabLogo size={logoSize} />
        </span>
      ))}
    </div>
  );
}

export function CookieTicker() {
  return (
    <section
      style={{
        background: "var(--cream)",
        padding: "1.6rem 0",
        overflow: "hidden",
        borderTop: "0.5px solid color-mix(in oklab, var(--crimson) 25%, transparent)",
        borderBottom: "0.5px solid color-mix(in oklab, var(--crimson) 25%, transparent)",
      }}
    >
      <div className="tab-ticker-desktop">
        <div
          className="animate-ticker"
          style={{ display: "flex", width: "max-content", ["--ticker-duration" as any]: "55s" } as React.CSSProperties}
        >
          <Segment isMobile={false} />
          <Segment isMobile={false} />
          <Segment isMobile={false} />
          <Segment isMobile={false} />
        </div>
      </div>
      <div className="tab-ticker-mobile">
        <div
          className="animate-ticker"
          style={{ display: "flex", width: "max-content", ["--ticker-duration" as any]: "40s" } as React.CSSProperties}
        >
          <Segment isMobile={true} />
          <Segment isMobile={true} />
          <Segment isMobile={true} />
          <Segment isMobile={true} />
        </div>
      </div>
    </section>
  );
}
