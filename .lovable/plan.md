# tab. — Coffee Experience Site

A single-page experience for tab. specialty coffee (Karachi). Cream + crimson, type-driven, no photography. Built section-by-section with the exact spec provided.

## Tech & Setup

- Stack: existing TanStack Start + Tailwind v4 + React 19. Add `framer-motion` for animations. (Spec mentions React + Vite — TanStack Start is Vite-based; functionally equivalent.)
- Fonts: Playfair Display, DM Sans, DM Mono via Google Fonts (`<link>` in `__root.tsx` head).
- Logo: convert uploaded `tab_logo.pdf` to an inline SVG component (`<TabLogo />`) reused across nav, footer, ticker separators, story circle.
- Design tokens in `src/styles.css`:
  - `--crimson: oklch(...)` ≈ #8B0000
  - `--cream: oklch(...)` ≈ #EDE8DF
  - `--off-white: oklch(...)` ≈ #FAF7F2
  - `--wash: #F5EFE6` for signature row hover
  - Selection color, custom scrollbar (4px crimson on cream), `::selection` crimson bg / cream text.
- Single page lives at `src/routes/index.tsx`; sections split into components under `src/components/tab/`.
- SEO: title "tab. — specialty coffee, Karachi", meta description, og tags, single H1 (the hero "tab.").

## File Plan

```
src/
  routes/index.tsx                  → composes all sections + Intro + CustomCursor
  routes/__root.tsx                 → add Google Fonts <link> tags
  styles.css                        → tokens, fonts mapping, ::selection, scrollbar, cursor:none on desktop
  components/tab/
    TabLogo.tsx                     → inline SVG from PDF
    Intro.tsx                       → sessionStorage gated bloom intro
    CustomCursor.tsx                → rAF lag follower, hover expand
    Nav.tsx                         → invisible→sliding cream bar; mobile crimson takeover
    Hero.tsx                        → 28vw "tab.", 3 staggered lines, vertical EST. line, coffee-cup scroll SVG
    Menu.tsx                        → MENU band + 4 acts + dotted-leader rows with hover swap
    menuData.ts                     → 4 acts of items + signature flag + hover descriptors pool
    PistachioManifesto.tsx          → crimson full screen, breathing text, word-stagger, TV-off exit
    Story.tsx                       → split cream/crimson(noise SVG), empty bordered circle
    CookieTicker.tsx                → infinite marquee w/ logo separators, hover slowdown
    FindUs.tsx                      → big "Karachi.", grayscale map iframe + crimson pin, hours
    Footer.tsx                      → crimson band, inverted logo, instagram, copyright
    CoffeeCupScroll.tsx             → SVG cup fill/empty loop
```

## Section Build Notes

- **Intro**: full-screen cream overlay, crimson circle scales 0→80vmin (~1.4s ease-out), letters t·a·b·. drop in with bounce (60ms stagger), 600ms hold, then overlay `clip-path`/translateY folds upward like a napkin. Skip button fades in at 1.5s. Sets `sessionStorage.tab_intro_played`.
- **Hero**: H1 "tab." at 28vw clipping off left edge (negative margin). Three breath-lines at 2.4 / 1.8 / 1.2rem, 0.3s stagger. Right-edge vertical 1px crimson line with rotated `EST. KARACHI — SPECIALTY COFFEE` in DM Mono 11px tracking-widest. Bottom: animated cup SVG + "scroll to order".
- **Nav**: `useScroll` threshold = hero height. Before: transparent, logo 44px top-left, links top-right. After: cream bar slides from `-100%` to `0` in 280ms ease-out, logo shrinks to 32px, 0.5px crimson bottom border. Mobile: crimson circle toggle → full-screen crimson sheet with cream Playfair italic 3.5rem links staggered 60ms from left.
- **Menu**: title "MENU" 18vw cream on full-bleed crimson band with kicker. Four acts (COFFEE / FRAPPES / THE TABLE / SIGNATURES) with side-ruled label. Each row: hr, name (Playfair 1.2rem), dotted leader (flex-grow border-dotted), price (DM Mono). Hover: row translateX 12px, dotted line redraw L→R via keyframe, price swaps to a random descriptor from pool of 8 (assigned once per item on mount for stability). Signature items get hand-drawn asterisk SVG + `#F5EFE6` row wash on hover. Section lazy-loaded via dynamic import + Suspense.
- **Pistachio Manifesto**: crimson bg, "the pistachio latte" Playfair italic 6vw cream, CSS `breathe` keyframe (scale 1↔1.015, 4s ease-in-out infinite). Tagline appears word-by-word at 120ms stagger via Framer Motion `whileInView`. Watermark price `280–420` DM Mono 4rem opacity 0.15 bottom-right. Exit: when next section enters viewport, this one scales to 0 at center (TV-off feel) using scroll-driven `useScroll` transforms.
- **Story**: 2-col split (stacks on mobile). Right side gets SVG noise pattern (`<feTurbulence>` filter, 4% opacity overlay) + 60vw crimson circle with 2px cream border, empty. Left: "tab. is small on purpose." + 3 short human paragraphs (no corporate speak — "there are twelve seats. we like it that way.").
- **Cookie Ticker**: two duplicated tracks animated via `transform: translateX` at 35px/s (compute duration from content width). Hover sets animation-duration to slow to 8px/s. Separators are 18px `<TabLogo />`.
- **Find Us**: "Karachi." 3rem DM Mono crimson. Scroll-in line. Embedded Google Maps iframe (Karachi placeholder location) with `filter: grayscale(1) sepia(0.2)`. Absolute crimson pin SVG centered over map. Hours block DM Mono.
- **Footer**: full-bleed crimson, 0.5px cream rule above, 3-col layout (logo / "pull up a chair." Playfair italic 1.4rem / Instagram SVG + copyright).

## Global Polish

- **Custom cursor**: `position: fixed`, `pointer-events: none`, 12px crimson disc; rAF loop lerps toward mouse at ~0.18 for the 80ms lag feel. On `:hover` of `a, button, [data-cursor=hover]` it scales to 32px and switches to outline (stroke). Desktop only (`matchMedia('(hover: hover)')`); hide default cursor via `html { cursor: none }` on desktop.
- **Scroll-in**: Framer Motion `initial/whileInView` with `viewport={{ once: true, margin: '-10%' }}`, y:24→0, opacity 0→1, children staggered 80ms.
- **Selection**: `::selection { background: var(--crimson); color: var(--cream); }`
- **Scrollbar**: 4px crimson thumb on cream track, hidden under `(max-width: 768px)`.
- **Performance**: `will-change: transform` on intro/hero/manifesto animated nodes; lazy-load Menu; respect `prefers-reduced-motion` (skip intro, disable breathing + ticker animations).

## Out of Scope

- No CMS / backend. Menu data is a static TS file.
- No analytics, no email capture.
- Vercel deploy is handled by the user post-build; project ships ready to deploy.

Ready to build on approval.