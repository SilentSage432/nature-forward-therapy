# Architecture — Nature-Forward Therapy

## Stack
- **Next.js 16** App Router (React 19, TypeScript)
- **Tailwind CSS v4** (`@import "tailwindcss"` + `@theme` in `app/globals.css`)
- **Prisma 6 + PostgreSQL** for CMS persistence
- **Auth.js (next-auth v5)** credentials provider, JWT sessions

## Request flow
```
Browser
  ├─ proxy.ts
  │    ├─ /admin/*     → Auth.js + RBAC (dynamic)
  │    └─ public paths → maintenance rewrite (cached flag) or pass-through
  ├─ /                 → ISR (60s) getSiteContent + announcement
  ├─ /articles         → ISR (60s) published essays (client category filter)
  ├─ /articles/[slug]  → ISR/SSG (60s) reading room
  ├─ /bookshelf        → ISR (60s) curated resources (client category filter)
  ├─ /maintenance      → ISR (30s) holding card (proxy rewrite target)
  ├─ /login            → force-dynamic credentials sign-in
  ├─ /admin/*          → force-dynamic editor UI → actions /api/cms/*
  └─ /api/auth/*       → Auth.js handlers
```

## Public caching contract
- Public HTML is ISR (`revalidate = 60`), not `force-dynamic`.
- Shared CMS reads use `React.cache` + `unstable_cache` tags in `lib/public-cache-shared.ts`.
- CMS mutations call `revalidatePublicSurfaces()` (`revalidateTag(..., { expire: 0 })` + `revalidatePath`).
- Maintenance enforcement lives in `proxy.ts` via `getMaintenanceModeCached()` so public RSC trees stay shareable.
- DEVELOPER maintenance preview uses a short-lived non-HttpOnly cookie + `DeveloperMaintenanceBanner` (banner only; auth bypass is JWT-checked in proxy).

## CMS collections
1. **PractitionerProfile** — identity, location, optional phone/fax/publicEmail, bio, imagery URLs, booking links  

2. **Specialty** — card title/icon/description  
3. **FocusTag** — gold pill labels  
4. **Insurance** — accepted carriers  
5. **PracticeDetail** — JSON lists for expertise, payments, therapy types, process steps  
6. **SiteConfig** — title/description (developer)  
7. **BlogPost** — essays (title, slug, excerpt, content, category, cover, publish state)  
8. **AnnouncementBanner** — site-wide top strip (text, optional link, isActive)  
9. **BookshelfItem** — curated books/podcasts/tools (title, author, type, category, note, link)  
10. **User** — email, password hash, role

## Ownership
| System | Responsibility |
| --- | --- |
| `lib/articles.ts` | Article/banner reads, slug/read-time helpers |
| `lib/actions/articles.ts` | Essay create/update/delete |
| `lib/bookshelf.ts` | Bookshelf reads + category/type constants |
| `lib/actions/bookshelf.ts` | Bookshelf create/update/delete/toggle |
| `lib/actions/announcements.ts` | Banner upsert |
| `lib/content.ts` | Landing-page site content composition |
| `lib/public-cache.ts` / `lib/public-cache-shared.ts` | ISR tags + invalidation helpers (server-only vs shared constants) |
| `proxy.ts` | Admin auth gate + public maintenance rewrite |
| `components/site/HomePresentation.tsx` | Shared homepage composition (Navbar → sections → Footer) |
| `components/site/SiteTheme.tsx` | Public `[data-site-theme]` boundary for semantic tokens |
| `lib/site-design/*` | SiteDesign V1 contract, defaults, published reader, draft/publish service |
| `lib/actions/site-design.ts` | Authenticated draft/publish/history/restore server actions |
| `prisma` `SiteDesignState` / `SiteDesignVersion` | Design persistence (additive; manual SQL until operator applies) |
| Presentation (`components/*`, `app/articles/**`, `app/bookshelf/**`) | Render only |

## RBAC
| Capability | EDITOR | DEVELOPER |
| --- | --- | --- |
| Edit profile / specialties / practice | ✓ | ✓ |
| Articles & announcement banner | ✓ | ✓ |
| Curated bookshelf | ✓ | ✓ |
| Site design draft / publish / history (API; Studio UI deferred) | ✓ | ✓ |
| Manage users | | ✓ |
| Site settings / footer credit | | ✓ |
| Raw env / schema (repo access) | | ✓ (outside app) |

## Force-password flow
1. Seed/editor login with `mustChangePassword: true` → admin layout mounts `ForcePasswordModal`.
2. `POST /api/user/change-password` hashes password and sets DB `mustChangePassword: false`.
3. Client calls `update({ mustChangePassword: false })` so the JWT callback patches the token.
4. Hard navigate to `/admin` so the server layout re-reads the updated session (avoid `router.refresh()` race).

## Cover Studio
- Presentation: `components/admin/ImageEditorModal.tsx` + helpers in `lib/image-studio.ts`
- Mutations: article form `coverImage` (compressed data URL) via `lib/actions/articles.ts`
- AI generation: `POST /api/cms/generate-cover` → Gemini image model (requires `GEMINI_API_KEY`)

## Announcement banner
- Style tokens: `lib/announcement-banner.ts` (theme / alignment / font helpers + Lucide theme icons)
- CMS: `components/admin/AnnouncementBannerEditor.tsx` (live preview + controls)
- Public: `components/AnnouncementBanner.tsx` — dismissible only when `isDismissible`

## Icon system
- Library: `lucide-react` (named imports; no icon CDN / font)
- Specialty presentation: `lib/specialty-icons.tsx` maps stored CMS emoji keys → Lucide glyphs without migrating DB values
- Unknown specialty icon strings render as authored text; known defaults are Leaf / Mountain / Sprout

## Design tokens
Brand palette hex values live in `app/globals.css` `@theme` (forest/sage/gold/…) and are documented in `AUDIT_CATALOG.md`.

### Semantic public theme (NFT-STUDIO-003)
- Semantic CSS variables (`--site-surface-page`, `--site-accent`, `--site-foreground`, …) are defined on `:root` and `[data-site-theme="forest-gold"]` with **identical current values**.
- Public marketing surfaces wrap with `SiteTheme` (`data-site-theme="forest-gold"`). Admin / login remain outside that wrapper and inherit stable `:root` defaults.
- Shared chrome classes (`.btn-gold`, `.btn-outline`, `.nav-glass`, hero overlays, `.frosted-leaf-card`, …) read semantic variables so a future curated public theme can override without rewriting components.

### SiteDesign persistence (NFT-STUDIO-004)
- **Contract:** Zod `siteDesignSchema` in `lib/site-design/schema.ts` (schemaVersion `1`). Presentation only — CMS content stays in existing models.
- **Canonical default:** `CANONICAL_SITE_DESIGN` (`forest-gold` / classic / fixed sections) — deterministic, not inferred from DB.
- **Persistence:** `SiteDesignState` (draft + published JSON + revisions) and append-only `SiteDesignVersion`. Additive SQL: `prisma/migrations-manual/nft-studio-004-site-design.sql` (do not `db push` production).
- **Ops:** `lib/site-design/service.ts` + `lib/actions/site-design.ts` — EDITOR/DEVELOPER; optimistic concurrency; restore → draft only; publish appends history and calls `revalidatePublicSurfaces()` (includes `CACHE_TAGS.siteDesign`). Hard publish transaction failures return `{ ok:false, code:"ERROR" }` (no success audit). Audit writes remain outside the publish transaction (best-effort; failures are logged).
- **Public read:** `getPublishedPresentationConfig()` — published only, cached, falls back to canonical default on missing/invalid JSON **without mutating storage**.
- **Isolation tests:** `SITE_DESIGN_TEST_DATABASE_URL` + `lib/site-design/test-db-guard.ts` / `npm run test:site-design:db` (loopback `nft_studio_004a_*` only).
- **Website Studio shell (NFT-STUDIO-005/005B):** `/admin/studio` for EDITOR/DEVELOPER — Overview/Design/Media/History via `getSiteDesignWorkspaceAction`. Preview isolation uses `inert` + `aria-hidden` + `pointer-events-none`. First authenticated Studio visit may initialize the canonical `default` singleton only.
- **Visual design editing Phase One (NFT-STUDIO-006, local):** `/admin/studio/design` loads the draft workspace into `DesignEditor`. Curated Typography + Colors controls map to existing SiteDesign fields (expanded enums only — no arbitrary CSS/font URLs). Private draft preview is an authenticated same-origin iframe at `/admin/studio/preview-frame` that renders real `HomePresentation`/`SiteTheme` and accepts design updates via postMessage without writing the DB on every tweak. Desktop/mobile modes change iframe width (390px mobile) so CSS media queries reflow inside the frame. Save Draft uses `saveSiteDesignDraftAction` with `expectedDraftRevision`; conflicts preserve local edits and offer reload. Public published resolver and ISR remain unchanged; no publish/media/restore UI in this tranche.
- **Editor safety (NFT-STUDIO-006A) / production release (NFT-STUDIO-006B):** Unsaved-change guard intercepts in-app link navigations away from Design (accessible Stay/Discard dialog; beforeunload kept). Preview route adds `requireStudioPreviewAccess()` on top of proxy + studio layout. Preview protocol is versioned (`protocolVersion: 1`) with exact origin, expected `event.source`, SiteDesign V1 parse, and oversized rejection. `X-Frame-Options` remains `DENY` sitewide except `SAMEORIGIN` on `/admin/studio/preview-frame` so the authenticated iframe can embed. Draft Save UI is live for EDITOR/DEVELOPER; design publish remains unavailable until a later authorized tranche.
- **Preview handshake repair (NFT-STUDIO-006D, local):** READY includes a per-document `documentId`. Parent handshake state invalidates on iframe `load`, accepts re-READY for the same id, retires superseded ids, and pings `STUDIO_PREVIEW_REQUEST_READY` after load so late resource load cannot permanently freeze SET_DESIGN. Iframe re-announces READY on mount, window load, bounded retries, and REQUEST_READY. No DB writes on preview tweaks.
- **Visual design fidelity (NFT-STUDIO-006F):** Homepage components under `SiteTheme` use live semantic helper classes (`.site-accent`, `.site-fg-supporting`, section rules under `[data-site-theme]`) bound to `--site-*` vars. Tailwind `@theme` `bg-site-*`/`text-site-*` bridges can snapshot `:root` values and must not be relied on for palette switching. `[data-site-theme]` re-scopes `font-family`/`font-size` so curated typography is not defeated by body inheritance from `:root`. Font stacks: Classic = Montserrat+Inter, Editorial = Cormorant+Inter, Modern = Inter+Inter (loaded Next fonts only). Token tables mirrored in `lib/site-design/visual-tokens.ts` for tests. Admin/login remain outside `SiteTheme` on fixed brand utilities. Public published appearance remains forest-gold until an authorized publish tranche.
- **Expanded curated palettes (NFT-STUDIO-007A):** Authoritative registry `lib/site-design/palette-registry.ts` owns palette IDs, Nicole-facing labels/groups, and full `--site-*` token tables. Zod `SITE_THEME_PRESET_IDS`, Studio `THEME_PALETTE_OPTIONS` / gallery groups, and `visual-tokens` derive from that registry. Static CSS theme scopes in `app/globals.css` remain the runtime stylesheet (no fragile runtime CSS generation); parity tests detect registry/CSS drift. Deterministic contrast module (`lib/site-design/contrast.ts`) + required opaque pair contract (`palette-contrast-contract.ts`) validate every curated palette (4.5:1 normal text, 3:1 large text; decorative translucent borders/focus/hero-over-image excluded and documented). Studio Colors UI is a grouped swatch gallery with instant preview. schemaVersion remains `1`. Custom color pickers and saved palette DB tables are out of scope.
- **Expanded curated typography (NFT-STUDIO-007B / REL01):** Authoritative registry `lib/site-design/typography-registry.ts` owns font pairing IDs (`SiteFontFamilyId`), Nicole-facing labels/groups, heading/body face assignments, OFL license metadata, and CSS variable names. Zod `SITE_FONT_FAMILY_IDS`, Studio `FONT_FAMILY_OPTIONS` / groups, and `SITE_FONT_STACKS` derive from that registry. Static `[data-site-font]` scopes in `app/globals.css` remain the runtime stylesheet; parity tests detect registry/CSS/layout drift. Existing Classic (Montserrat/Inter), Editorial (Cormorant/Inter), and Modern (Inter/Inter) IDs and stacks are stable. Additional curated pairings share body faces where practical. No arbitrary font-family strings or remote stylesheet imports. schemaVersion remains `1`.
- **Font delivery separation (NFT-STUDIO-007B-PERF02 / REL01):** Typography *contract* (registry / SiteTheme / CSS stacks) stays shared. Font *delivery* splits: (1) root `site-font-chrome.ts` attaches Inter/Montserrat/Cormorant CSS variables (Cormorant independently required by public `.editorial-serif` / `font-serif` even when Classic is published); (2) `PublicFontScope` on marketing pages derives supplemental faces from `getPublishedPresentationConfig()` only (never draft) via `publicSupplementalClassName` in `site-font-loaders.ts`; (3) `app/admin/studio/layout.tsx` attaches the full curated library for Design samples and the authenticated preview-frame document. Each Google face is declared exactly once (Turbopack production builds reject duplicate `next/font/google` constructors). Nested layouts cannot undo root preloads — root must stay chrome-only. Next merges next/font CSS into a shared root chunk, so non-chrome faces use `preload: false`; browsers still fetch faces when CSS uses them. Publish freshness: PublicFontScope reads the same `unstable_cache` + `CACHE_TAGS.siteDesign` path as SiteTheme; design publish / admin revalidate keeps classes and assets coherent without redeploy. Performance guard: `scripts/nft-studio-007b-perf02-acceptance.mjs` (artifacts under `tmp/`, gitignored). Classic public cold load measured locally at 4 WOFF2 / ~159 KB / 4 preloads.
- **Deterministic Studio accessibility feedback (NFT-STUDIO-007C-ENG01):** `lib/site-design/accessibility-evaluation.ts` composes the existing contrast engine + required opaque pair contract for the current (possibly unsaved) SiteDesign. Studio Design panel renders `DesignAccessibilityPanel` with Nicole-facing pass / near-threshold advisory / needs-attention / rendered-or-manual review language — never a WCAG compliance claim. Pure evaluation (no DB / Save Draft / publish). Near-threshold margin is documented (`NEAR_THRESHOLD_MARGIN = 0.15`). Typography is informational context only (no font legibility scores).
- **Public keyboard accessibility (NFT-STUDIO-007C-ENG02):** `SkipToContent` is the first child of `SiteTheme` (public + Studio preview iframe only; admin/login stay outside). Stable `#main-content` / `tabIndex={-1}` on homepage, articles, and bookshelf mains. CSS under `[data-site-theme]` provides `:focus-visible` rings (accent + page-surface cushion; `.btn-gold` uses accent-foreground) and a clipped skip link that reveals on keyboard focus without layout shift. Translucent `--site-focus-ring` remains decorative. Not a full WCAG certification.
- **Rendered accessibility harness (NFT-STUDIO-007C-ENG03 / FIX01):** Playwright + `@axe-core/playwright` (devDependencies) via `playwright.a11y.config.ts` and `e2e/a11y/**` (`npm run test:a11y`). Public routes only; no auth / SiteDesign writes. **Enforcement:** published/default design (forest-gold) + public route axe/landmarks/keyboard/reflow fail the suite; alternate ephemeral palette samples are **advisory** (recorded under `tmp/a11y/`; zero violations valid; never required to remain). Pre-publish strict helper exists for a future tranche and is not wired to publish. Viewport probes ≠ browser zoom; axe ≠ WCAG certificate. Policy unit tests: `npm run test:a11y:policy`.
- **Light-airy semantic contrast remaps (NFT-STUDIO-007C-ENG04-ENG01):** Public utilities `.site-accent-soft-muted` and `.focus-pill` assume dark-first translucent composition. Light & Airy themes (`coastal-mist`, `lavender-meadow`, `botanical-cream`, `misty-morning`) override those utilities to opaque `--site-accent` (and accent-tinted pill fills) so footer brand/links and specialty tags meet ≥4.5:1 without retokenizing the 15-palette registry or changing Forest & Gold resting gold/terracotta. Deterministic composed pairs: `lib/site-design/light-semantic-contrast.ts`. Option C contrast tokens not added. Decorative pill borders remain excluded from opaque 3:1 solids.
- **Not implemented yet:** Design publish UI, Media Library uploads/mutations, history restore UI, rendered section reorder/visibility, custom colors, complete accessibility certification, CI-enforced a11y gates, publish-time a11y blockers. Browser back/forward while dirty is not intercepted (documented limitation).

### Shared homepage presentation
- `app/page.tsx` loads CMS data (`getSiteContent`, `getActiveAnnouncement`) plus `getPublishedPresentationConfig()` and renders `HomePresentation`.
- Section order and anchors (`hero`, `about`, `specialties`, `contact`) remain fixed in `HomePresentation` until Studio rendering support ships; reserved design fields are persisted but not advertised as live controls.
