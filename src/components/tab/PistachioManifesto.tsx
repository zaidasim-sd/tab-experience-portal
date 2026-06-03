import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

const words = "we didn't invent it. we just refused to do it any other way.".split(" ");

export function PistachioManifesto() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  // exit scale (TV-off)
  const scale = useTransform(scrollYProgress, [0.75, 1], [1, 0]);
  const opacity = useTransform(scrollYProgress, [0.75, 1], [1, 0]);

  return (
    <section
      ref={ref}
      style={{
        position: "relative",
        minHeight: "100svh",
        background: "var(--crimson)",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 1.25rem",
      }}
    >
      <motion.div
        style={{
          scale,
          opacity,
          textAlign: "center",
          maxWidth: 1100,
        }}
      >
        <h2
          className="animate-breathe"
          style={{
            margin: 0,
            fontFamily: "var(--font-display)",
            fontStyle: "italic",
            fontSize: "clamp(2.6rem, 9.5vw, 8rem)",
            color: "var(--cream)",
            lineHeight: 1,
            fontWeight: 500,
          }}
        >
          the pistachio latte
        </h2>

        <p
          style={{
            marginTop: "2rem",
            fontFamily: "var(--font-display)",
            fontSize: "clamp(1.05rem, 2vw, 1.5rem)",
            color: "var(--cream)",
            lineHeight: 1.6,
            display: "flex",
            justifyContent: "center",
            flexWrap: "wrap",
            gap: "0.4rem",
          }}
        >
          {words.map((w, i) => {
            const start = 0.15 + (i / words.length) * 0.55;
            const end = start + 0.05;
            return <ScrollWord key={i} word={w} progress={scrollYProgress} start={start} end={end} />;
          })}
        </p>
      </motion.div>

      <span
        style={{
          position: "absolute",
          right: "1.5rem",
          bottom: "calc(2.5rem + env(safe-area-inset-bottom))",
          fontFamily: "var(--font-mono)",
          fontSize: "clamp(2rem, 5vw, 4rem)",
          color: "var(--cream)",
          opacity: 0.15,
          letterSpacing: "-0.02em",
        }}
      >
        280–420
      </span>
    </section>
  );
}

function ScrollWord({
  word,
  progress,
  start,
  end,
}: {
  word: string;
  progress: ReturnType<typeof useScroll>["scrollYProgress"];
  start: number;
  end: number;
}) {
  const o = useTransform(progress, [start, end], [0, 1]);
  const y = useTransform(progress, [start, end], [8, 0]);
  return (
    <motion.span style={{ opacity: o, y, display: "inline-block" }}>{word}</motion.span>
  );
}
