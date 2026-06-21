# Order Flow Matrix — Build & Test Task Board

Phase-by-phase plan. Each task is checked off only after it is **implemented,
re-checked, and verified** (build/typecheck/lint or manual test). Work happens on
`building-and-testing`; `main` is not touched until a phase set is approved.

Legend: `[ ]` todo · `[~]` in progress · `[x]` done & verified

---

## Phase 0 — Decommission scaffold & secure  ✅ DONE
- [x] Remove Socket.IO chat scaffold (`examples/websocket/`)
- [x] Remove Prisma/SQLite scaffold (`prisma/`, `src/lib/db.ts`, local `db/`)
- [x] Remove placeholder API route (`src/app/api/route.ts`)
- [x] Harden trades CORS proxy: strict symbol allowlist, rate limit, short cache, origin check
- [x] Prune unused dependencies (24 grep-verified zero-import packages) + drop 4 leaf UI components
- [x] Migrate tooling bun → npm (scripts + lockfile) for portability
- [x] Secure `next.config.ts`: remove `ignoreBuildErrors`, enable strict mode, add security headers
- [x] Stop tracking non-code artifacts (.env, screenshots, agent context, Caddyfile, .zscripts) via `.gitignore`
- [x] Verify: `npm install` clean, `tsc --noEmit` passes (4 latent type bugs fixed), `next build` succeeds

### Deferred out of Phase 0 (tracked, not silently dropped)
- [ ] **Lint:** 4 pre-existing `react-hooks/set-state-in-effect` errors (e.g. `use-mobile.ts`) — refactor in Phase 6 (does not block build).
- [ ] **CSP:** add a Content-Security-Policy that enumerates every exchange WS/REST origin, then test against the live terminal.
- [ ] **npm audit:** 2 moderate transitive `postcss` advisories via `next`; resolve by upgrading Next when patched (no breaking downgrade).
- [ ] **Bootstrap:** `order-flow.css` still imports full Bootstrap CSS — evaluate removing once layout is confirmed Tailwind-only.
- [ ] **Branding:** package still named `nextjs_tailwind_shadcn_ts` — renamed in Phase 1.

## Phase 1 — Branding & metadata  ✅ DONE
- [x] Rename package to `order-flow-matrix`; brand set across metadata
- [x] `layout.tsx`: `metadataBase` (env `NEXT_PUBLIC_SITE_URL`, localhost fallback), title template, accurate multi-venue description, robots
- [x] Local favicon (`app/icon.svg`, drop external z-cdn icon) + `app/manifest.ts`
- [x] Correct OpenGraph/Twitter + canonical + dynamic `app/opengraph-image.tsx`
- [x] "Not financial advice" `Disclaimer` component (built; wired into footer in Phase 2)
- [x] Verify: `tsc` + `next build` green; `/icon.svg`, `/manifest.webmanifest`, `/opengraph-image` routes generated

## Phase 2 — Content & trust pages  ✅ DONE
- [x] Marketing route group `(marketing)` with shared header/footer layout (dark site-wide)
- [x] Home (real landing: hero, features, adapter story, honest framing, CTAs)
- [x] About, Contact, Privacy, Terms, Disclaimer pages (each with SEO metadata + canonical)
- [x] Move terminal to `/terminal`; `/` is now the marketing home
- [x] Disclaimer component wired into the footer; "not financial advice" sitewide
- [x] Contact form (react-hook-form) — opens a pre-filled `mailto:` (hosted form + Turnstile in Phase 7)
- [x] Verify: `tsc` + `next build` green; prod server returns 200 on all routes; titles/headers confirmed

### Notes
- Contact email is env-driven (`NEXT_PUBLIC_CONTACT_EMAIL`).
- Legal pages are solid templates; have a professional review them before a real launch.

## Phase 3 — Evergreen "Learn" content  ✅ DONE
- [x] MDX setup (`@next/mdx`, `pageExtensions`, `src/mdx-components.tsx`)
- [x] Learn index (`/learn`) + article registry (`articles.ts`)
- [x] 4 MDX articles: order flow, CVD, reading the matrix, block trades
- [x] Microstructure glossary (`/learn/glossary`, data-driven for future DefinedTerm schema)
- [x] Cross-link content ↔ terminal; Learn added to header + footer nav
- [x] Verify: `tsc` + `next build` green (19 routes); all Learn routes 200; MDX metadata renders correct titles

### Notes
- Add an article: create `learn/<slug>/page.mdx` (with `export const metadata`) **and** a registry entry in `articles.ts`.
- Article/DefinedTerm JSON-LD comes in Phase 4–5; the registry + glossary are structured for it.

## Phase 4 — Programmatic market pages + technical SEO  ← current
- [ ] `/markets/[exchange]/[symbol]` SSR pages + `generateStaticParams` for top pairs
- [ ] `app/sitemap.ts` (dynamic) + `app/robots.ts` (disallow `/api`, add Sitemap)
- [ ] JSON-LD: Organization, WebSite, SoftwareApplication, FAQPage, Breadcrumb, Article
- [ ] Per-page canonical + OG via `generateMetadata`
- [ ] **Expand coin/category coverage** — as many coins, spot + perps, categories as feasible
- [ ] Verify: sitemap valid, rich-results test passes

## Phase 5 — LLM-SEO
- [ ] `public/llms.txt` + `llms-full.txt`
- [ ] Semantic HTML + FAQ schema + clear headings on content pages
- [ ] Ensure LLM-crawlable (server-rendered) content
- [ ] Verify: llms.txt reachable; content readable without JS

## Phase 6 — Performance & correctness
- [ ] Virtualize trade matrix; batch high-frequency updates (refs/rAF)
- [ ] Pool/cap comparison-mode connections
- [ ] `next/image` for images; lazy-load below the fold
- [ ] Core Web Vitals pass (web-perf)
- [ ] Tests: Vitest for adapter normalization (timestamp/side); Playwright smoke
- [ ] Verify: CWV green, tests pass in CI

## Phase 7 — Commercialization scaffolding
- [ ] Privacy-friendly analytics + cookie consent
- [ ] Contact form delivery (email) + Turnstile bot protection
- [ ] Define paid wedge (e.g. cross-venue block-trade alerts) before adding accounts/quota
- [ ] Verify: form delivers, bot protection active

---

### Working rules
- Granular commits: one logical change per commit, message describes the file/intent.
- After each change: re-check and re-test; update this board and any affected docs.
- No overclaiming in copy or commits — describe exactly what was done.
