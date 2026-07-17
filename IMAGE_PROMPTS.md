# Image Generation Prompts — Order Flow Matrix

Generate these with your image AI, then drop the files into the exact paths below and
tell me — I'll wire them in (Phase 8b). Brand anchors to include in every prompt:

- **Accent:** emerald green `#10b981` (+ teal/cyan `#22d3ee` as secondary)
- **Dark surface:** deep blue-charcoal `#0f1420` · **Light surface:** cool white `#f8fafc`
- **Mood:** precise, technical, financial-grade — NOT cartoonish, NO mascots, NO text in images
- Prefer **transparent background PNG** (or SVG) unless stated otherwise.

---

## 1. Logo mark → `public/logo.svg` (or `logo.png`, 512×512, transparent)

> Minimal geometric logo mark for a crypto trading terminal called "Order Flow Matrix".
> A rounded square node from which 3–5 thin flowing lines converge from the left and
> exit as one ordered stream to the right, suggesting many market feeds merging into one.
> Flat vector style, emerald green #10b981 gradient into teal #22d3ee on transparent
> background. No text, no letters, sharp and modern, suitable as an app icon. Centered,
> generous padding.

## 2. Favicon → `src/app/icon.png` (512×512, transparent; I'll downscale)

> Same logo mark as above, simplified to its boldest shape so it stays readable at
> 16×16 pixels: one rounded-square node + two converging flow lines. Flat vector,
> emerald green #10b981, transparent background, no text.

## 3. Social / OG banner background → `public/images/og-bg.png` (1200×630, opaque)

> Wide abstract background for a financial technology social card. Deep blue-charcoal
> #0f1420 base, a faint perspective grid, soft emerald #10b981 and cyan #22d3ee glow
> gradients rising from the bottom-left, a few thin ascending candlestick-like light
> streaks. Dark, premium, subtle — must stay quiet enough that white text placed on top
> remains readable. No text, no logos.

## 4. Hero side visual (optional alternative to the live widget) → `public/images/hero-terminal.png` (1600×1200, transparent or dark)

> Slightly angled 3D render of a sleek dark trading dashboard floating in space:
> glassmorphism panels showing a candlestick chart, a green/red order-book ladder and a
> trade list, glowing emerald #10b981 accents on a deep navy #0f1420 background, soft
> shadows, shallow depth of field. Premium fintech product-shot style, no readable text
> (suggest UI with abstract bars and lines only), no people.

## 5. Feature illustrations → `public/images/features/*.png` (800×600 each, transparent)

**a. `live-flow.png`** — abstract stream of small green and red blocks flowing along a
curved path into a structured grid, dark background, emerald glow, isometric flat-3D style.

**b. `depth.png`** — stylized order-book ladder: horizontal green bars stacked below,
red bars stacked above, meeting at a glowing gap, isometric flat-3D, dark background.

**c. `alerts.png`** — one oversized glowing emerald block standing out among small muted
gray blocks on a dark conveyor-like stream, a subtle radar ring pulsing around it.

**d. `multi-venue.png`** — five small glowing nodes in different brand-ish colors
(gold, orange, gray, cyan, teal) connected by thin light lines converging into one
larger emerald node, dark background, network/constellation style.

## 6. Learn article covers → `public/images/learn/*.png` (1200×675 each, opaque dark)

**a. `what-is-order-flow.png`** — abstract tape of alternating green/red ticks flowing
left to right across a dark panel, one section magnified under a subtle lens glow.

**b. `cvd.png`** — a single smooth emerald line rising and falling over faint red/green
volume bars, dark background, one divergence highlighted with a soft cyan glow.

**c. `trade-matrix.png`** — a dense dark table of abstract rows where a few rows glow
green and red, viewed at a slight angle with depth of field.

**d. `block-trades.png`** — a whale silhouette formed from tiny candlestick shapes
swimming through a dark data stream, emerald accent lighting, elegant not cute.

## 7. About page visual → `public/images/about-desk.png` (1200×800, opaque dark)

> Moody wide shot of a modern trading desk at night: multiple dark monitors with
> abstract green/red charts (no readable text), emerald ambient glow, empty chair,
> rain-flecked window with city bokeh behind. Cinematic, premium, no identifiable
> brands or people.

## 8. Empty/error state → `public/images/empty-signal.png` (600×600, transparent)

> Minimal illustration of a disconnected plug or a satellite dish with a dotted signal
> line breaking up, flat vector, muted slate gray with one emerald accent, transparent
> background, gentle and clean.

---

### After you generate them
1. Put each file at the exact path listed (create `public/images/` subfolders as needed).
2. Keep filenames exactly as written.
3. Tell me they're in — I'll integrate them (OG image composition, hero, feature cards,
   learn covers, about page) and re-verify light/dark rendering in Phase 8b.

---

# ROUND 2 — LIGHT-THEME VARIANTS

Your first set is dark-designed (integrated: dark art sits on dark panels, which works in
both themes). These optional light variants let light mode feel fully native. Same
filename + `-light` suffix, same folder. Once dropped in, tell me — I'll render dark/light
conditionally.

**Shared style for ALL light prompts:** background is soft cool white `#f8fafc` (or
transparent where noted) with a very subtle slate grid; keep the SAME composition as the
dark version; accents stay emerald `#10b981` / teal `#22d3ee`, sell-side red `#ef4444`;
shadows soft light-gray, glows gentle (no neon bloom); still no text, no mascots.

## L1. `public/images/og-bg-light.png` (1200×630, opaque)
> Wide abstract fintech background on soft white #f8fafc: faint perspective grid in light
> slate, gentle emerald #10b981 and cyan #22d3ee gradient washes rising from bottom-left,
> thin ascending candlestick light-streaks in emerald and soft red. Airy, premium, quiet
> enough for dark text overlay. No text.

## L2. `public/images/hero-terminal-light.png` (1600×1200, transparent)
> Slightly angled 3D render of a sleek LIGHT-mode trading dashboard floating in space:
> white and pale-gray glass panels with soft shadows, a candlestick chart, green/red
> order-book ladder and trade list as abstract bars, emerald #10b981 accents, gentle
> daylight studio lighting. Premium fintech product shot, no readable text, no people.

## L3. Features → `public/images/features/*-light.png` (800×600, transparent)
**a. `live-flow-light.png`** — same flowing stream of small green/red blocks into a
structured grid, but rendered as clean flat-3D on transparent/white, soft gray shadows.
**b. `depth-light.png`** — the same green-vs-red bid/ask pyramid on a white studio
backdrop with light slate gridlines, soft shadows instead of glow.
**c. `alerts-light.png`** — one saturated emerald cube among pale-gray cubes on a light
conveyor, thin emerald radar rings, soft daylight shadows.
**d. `multi-venue-light.png`** — five colored venue nodes (gold, orange, gray, cyan,
teal) linked by thin slate lines to one emerald node, white background, clean
constellation style.

## L4. Learn covers → `public/images/learn/*-light.png` (1200×675, opaque light)
**a. `what-is-order-flow-light.png`** — green/red tick tape across a white panel, one
section magnified under a glass lens with a soft emerald rim.
**b. `cvd-light.png`** — single emerald line over faint green/red volume bars on white,
one divergence marked with a soft cyan line.
**c. `trade-matrix-light.png`** — light-mode data table (white rows, slate text hints)
at a slight angle, a few rows tinted green and red, shallow depth of field.
**d. `block-trades-light.png`** — whale silhouette formed from tiny green/red
candlesticks on a pale background with a soft emerald wash — elegant, not cute.

## L5. `public/images/about-desk-light.png` (1200×800, opaque)
> Bright modern trading desk by a daylight window: light desk, multiple monitors showing
> abstract green/red charts (no readable text), soft morning light, plants, city view.
> Clean, optimistic, premium — no people, no brands.
