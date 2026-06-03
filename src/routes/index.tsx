import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { Intro } from "@/components/tab/Intro";
import { CustomCursor } from "@/components/tab/CustomCursor";
import { Nav } from "@/components/tab/Nav";
import { Hero } from "@/components/tab/Hero";
import { PistachioManifesto } from "@/components/tab/PistachioManifesto";
import { Story } from "@/components/tab/Story";
import { CookieTicker } from "@/components/tab/CookieTicker";
import { FindUs } from "@/components/tab/FindUs";
import { Footer } from "@/components/tab/Footer";
import { Grain } from "@/components/tab/Grain";
import { WaveDivider } from "@/components/tab/WaveDivider";
import { InitialRendering } from "@/components/tab/InitialRendering";

const Menu = lazy(() => import("@/components/tab/Menu").then((m) => ({ default: m.Menu })));

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "tab. — specialty coffee, Karachi" },
      {
        name: "description",
        content: "tab. is a small specialty coffee cafe in Karachi. a place to land. a place to think. a very good coffee.",
      },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { property: "og:title", content: "tab. — specialty coffee, Karachi" },
      {
        property: "og:description",
        content: "twelve seats, a pistachio latte worth the trip, and a cookie baked daily.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <>
      <Intro />
      <InitialRendering />
      <Grain />
      <CustomCursor />
      <Nav />
      <main>
        <Hero />
        {/* cream → crimson */}
        <WaveDivider top="var(--crimson)" bottom="var(--cream)" variant={1} />
        <Suspense fallback={<div style={{ minHeight: "60vh", background: "var(--offwhite)" }} />}>
          <Menu />
        </Suspense>
        {/* offwhite → crimson */}
        <WaveDivider top="var(--crimson)" bottom="var(--offwhite)" variant={2} />
        <PistachioManifesto />
        {/* crimson → cream */}
        <WaveDivider top="var(--cream)" bottom="var(--crimson)" variant={3} />
        <Story />
        <CookieTicker />
        <FindUs />
        {/* cream → crimson (footer) */}
        <WaveDivider top="var(--crimson)" bottom="var(--cream)" variant={4} />
      </main>
      <Footer />
    </>
  );
}
