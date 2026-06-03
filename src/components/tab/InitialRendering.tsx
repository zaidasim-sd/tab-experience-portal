import { useEffect, useState } from "react";

export function InitialRendering() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth < 768);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const circle = isMobile ? 56 : 72;

  return (
    <>
      {/* Diagonal repeating watermark */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 99998,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "6rem",
          overflow: "hidden",
        }}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              fontFamily: "var(--font-display)",
              fontStyle: "italic",
              fontSize: "clamp(1.8rem, 5vw, 3.8rem)",
              color: "#8B0000",
              opacity: 0.07,
              transform: "rotate(-32deg)",
              whiteSpace: "nowrap",
              lineHeight: 1,
            }}
          >
            Initial Rendering
          </span>
        ))}
      </div>

      {/* Corner stamp */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          bottom: isMobile ? 88 : 28,
          left: isMobile ? 16 : 24,
          width: circle,
          height: circle,
          zIndex: 99999,
          pointerEvents: "none",
        }}
      >
        {/* rotating border */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "9999px",
            border: "1.5px solid #8B0000",
            background: "transparent",
            animation: "stamp-spin 18s linear infinite",
            willChange: "transform",
          }}
        />
        {/* static inner */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "9999px",
            background: "#FAF7F2",
            opacity: 0.82,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 3,
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 7,
              letterSpacing: "0.2em",
              color: "#8B0000",
            }}
          >
            INITIAL
          </span>
          <span style={{ width: 40, height: 0.5, background: "#8B0000" }} />
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 7,
              letterSpacing: "0.2em",
              color: "#8B0000",
            }}
          >
            RENDERING
          </span>
        </div>
      </div>

      <style>{`@keyframes stamp-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
