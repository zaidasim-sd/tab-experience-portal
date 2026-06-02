import { TabLogo } from "./TabLogo";

const phrases = ["tab cookie", "brown butter", "dark chocolate", "baked daily"];

function Segment() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "1.8rem", padding: "0 1.8rem" }}>
      {phrases.map((p, i) => (
        <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: "1.8rem" }}>
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontStyle: "italic",
              fontSize: "2rem",
              color: "var(--crimson)",
              whiteSpace: "nowrap",
            }}
          >
            {p}
          </span>
          <TabLogo size={18} />
        </span>
      ))}
    </div>
  );
}

export function CookieTicker() {
  // Approx track width: 4 phrases * ~250px per segment ≈ 1000px. duration = width / 35 px/s.
  // We'll use a generous fixed duration that feels right.
  return (
    <section
      style={{
        background: "var(--cream)",
        padding: "2.4rem 0",
        overflow: "hidden",
        borderTop: "0.5px solid color-mix(in oklab, var(--crimson) 25%, transparent)",
        borderBottom: "0.5px solid color-mix(in oklab, var(--crimson) 25%, transparent)",
      }}
    >
      <div
        className="animate-ticker"
        style={
          {
            display: "flex",
            width: "max-content",
            ["--ticker-duration" as string]: "55s",
          } as React.CSSProperties
        }
      >
        {/* duplicate for seamless loop */}
        <Segment />
        <Segment />
        <Segment />
        <Segment />
      </div>
    </section>
  );
}
