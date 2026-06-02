import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

const words = "we didn't invent it. we just refused to do it any other way.".split(" ");

export function PistachioManifesto() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const scale = useTransform(scrollYProgress, [0.6, 1], [1, 0]);
  const opacity = useTransform(scrollYProgress, [0.6, 1], [1, 0]);

  return (
    <section
      ref={ref}
      style={{
        position: "relative",
        minHeight: "100vh",
        background: "var(--crimson)",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <motion.div
        style={{
          scale,
          opacity,
          textAlign: "center",
          padding: "0 1.5rem",
          maxWidth: 1100,
        }}
      >
        <h2
          className="animate-breathe"
          style={{
            margin: 0,
            fontFamily: "var(--font-display)",
            fontStyle: "italic",
            fontSize: "6vw",
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
            fontSize: "clamp(1.1rem, 1.8vw, 1.5rem)",
            color: "var(--cream)",
            lineHeight: 1.6,
            display: "flex",
            justifyContent: "center",
            flexWrap: "wrap",
            gap: "0.4rem",
          }}
        >
          {words.map((w, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12, duration: 0.5 }}
            >
              {w}
            </motion.span>
          ))}
        </p>
      </motion.div>

      <span
        style={{
          position: "absolute",
          right: "3rem",
          bottom: "2.5rem",
          fontFamily: "var(--font-mono)",
          fontSize: "4rem",
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
