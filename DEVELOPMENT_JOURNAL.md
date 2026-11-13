# Development Journal — Nature-Forward Therapy

## 2026-11-13 — Typography library + font delivery production release (NFT-STUDIO-007B-REL01)

Authorized gated combined production release of NFT-STUDIO-007B (9 curated typography pairings) and NFT-STUDIO-007B-PERF02 (public/Studio font delivery separation). Ships authoritative `typography-registry.ts`, Studio font gallery with live samples, static `[data-site-font]` scopes, chrome-only root delivery, `PublicFontScope` for published supplements, and Studio full-library attachment with `preload: false` on non-chrome faces. schemaVersion remains 1; Classic/Editorial/Modern stacks unchanged; Forest & Gold + Classic remains canonical. Preflight (read-only): production SiteDesign `default` draft/published revision 0, versions 0, theme forest-gold, legacy typography `presetId: classic` (normalization intact). Local gates: 131 site-design tests, typecheck, build, targeted eslint, PERF02 browser acceptance (Classic public 4 WOFF2 / ~159 KB / 4 preloads / CLS 0; dynamic published pairings + revalidate), 007B Studio acceptance (9 pairings, viewports, handshake reload, dirty-nav, zoom). No production Save Draft/Publish; no migrations; no production DB writes. Authenticated production Studio visual confirmation deferred to operator.

## 2026-11-12 — Public/Studio font delivery separation (NFT-STUDIO-007B-PERF02)

Local bounded optimization of uncommitted 007B typography. Separates the shared typography *contract* (registry / SiteTheme / `[data-site-font]` CSS) from font *delivery*. Root layout attaches chrome faces only (Inter / Montserrat / Cormorant — required for Classic + `.editorial-serif` / `font-serif`). `PublicFontScope` loads published-pairing supplements via pairing-specific modules; Studio layout attaches the full curated library for samples + preview-frame. Supplemental/Studio next/font uses `preload: false` because Next merges font CSS into a shared root chunk (preload:true on curated faces forced public downloads). Measured Classic public cold load: **4 WOFF2 / ~159 KB / 4 preloads / CLS 0** (matches 98001f2 baseline; unoptimized 007B was 12 / ~425 KB). Dynamic published pairings verified via iso DB + `/api/admin/revalidate` without rebuild. Studio open still loads full library (~12 / ~425 KB); switches add 0 extra font requests. Acceptance: `scripts/nft-studio-007b-perf02-acceptance.mjs` on PG17 `nft_studio_007a_44117` @ `127.0.0.1:5433` / Next `:3035`. Quality gates: 131 site-design tests, typecheck, build, targeted eslint. No commit/push/deploy; no production DB writes; no Save Draft/Publish.

## 2026-11-12 — Expanded typography library (NFT-STUDIO-007B)

Local-only expansion of Website Studio curated typography from 3 → 9 professionally coordinated font pairings. Authoritative registry `lib/site-design/typography-registry.ts` owns pairing IDs, labels/groups, heading/body face assignments, OFL provenance, and CSS-variable metadata. Zod `SITE_FONT_FAMILY_IDS`, Studio `FONT_FAMILY_OPTIONS` / groups, and `visual-tokens` stacks derive from the registry. Static `[data-site-font]` scopes in `app/globals.css` remain the runtime stylesheet; parity tests detect drift. Existing Classic / Editorial / Modern IDs and stacks unchanged; Forest & Gold + Classic remains canonical; schemaVersion stays 1. Fonts self-hosted via `next/font/google` (latin, bounded weights). PERF02 later separates public vs Studio delivery (see entry above). Studio Typography UI becomes a grouped pairing gallery with live heading/body samples. Isolated browser acceptance VERIFIED on PG17 `nft_studio_007a_44117` @ `127.0.0.1:5433` (all 9 pairings computed fonts, palette spots, viewports 390/768/1280/1536, keyboard, iframe reload restore, dirty-nav, 200% zoom). Quality gates initially 120 site-design tests (now 131 with PERF02). No commit/push/deploy; no production DB writes; no Save Draft/Publish.

## 2026-11-12 — Palette gallery alignment production hotfix (NFT-STUDIO-007A-UX01)

Authorized gated code-only production hotfix for Studio Colors gallery overflow. Ships stacked palette cards + `@container` / `@[26rem]:grid-cols-2` (replacing viewport `sm:grid-cols-2`). Preflight: Supabase `dbqprchzgfhthpxngemy` SiteDesign `default` draft/published revision 0, versions 0; recovery checkpoint checksum verified. Quality gates: 110 site-design tests, typecheck, build, targeted eslint, isolated geometry acceptance (panel 280–640; viewports 390/768/1280/1536). No palette/token/contrast/schema changes; no Save Draft/Publish; no production DB writes. Authenticated production Studio visual confirmation deferred to operator.

## 2026-11-12 — Palette gallery responsive layout repair (NFT-STUDIO-007A-UX01)

Local presentation-layer repair for Website Studio Colors gallery overflow. Root cause: viewport `sm:grid-cols-2` forced two columns inside the ~280–360px Design control column at xl, while title and `shrink-0` 28px swatches shared one horizontal flex row — swatches escaped cards and overlapped neighbors. Fix: stacked card composition (radio+title → swatch row → description) and `@container` / `@[26rem]:grid-cols-2` so two columns appear only when the gallery container itself is wide enough. Geometry acceptance VERIFIED at panel widths 280/320/360/420/520/640 and viewports 390/768/1280/1536 (1280 stays 1-col ≈310px). Preview selection, keyboard, dirty-nav intact. Quality gates: 110 site-design tests, typecheck, build, targeted eslint. No palette/token/contrast/schema changes; no commit/push/deploy; no production writes.

## 2026-11-12 — Expanded curated palette library production release (NFT-STUDIO-007A)

Authorized gated code-only production release of NFT-STUDIO-007A. Ships 15 curated palettes, authoritative registry, deterministic contrast contract, grouped Studio gallery, and static CSS scopes. Preflight: production Supabase `dbqprchzgfhthpxngemy` / PG 17.6 SiteDesign singleton `default` draft/published revision 0, versions 0; carpet/store tables intact. Recovery checkpoint checksum verified. Quality gates: 105 site-design tests, typecheck, build, targeted eslint, CSS generator idempotency + marker safety, isolated browser/a11y acceptance on `nft_studio_007a_44117`. No production Save Draft/Publish, migrations, or DB writes during release. Public site remains forest-gold canonical until a later authorized publish tranche. Authenticated production Studio gallery smoke deferred to operator.

## 2026-11-12 — Expanded curated palette library (NFT-STUDIO-007A)

Local-only expansion of Website Studio curated color palettes from 3 → 15 complete visual systems. Authoritative registry in `lib/site-design/palette-registry.ts` drives Zod theme enums, Studio gallery options, and mirrored CSS under `[data-site-theme]`. Deterministic WCAG contrast evaluator + required opaque pair contract (`contrast.ts`, `palette-contrast-contract.ts`) gates every palette. Studio Colors UI becomes a grouped swatch gallery (Botanical / Earthy / Light & Airy / Deep & Calm) with instant preview. Forest & Gold remains canonical default with exact token identity. schemaVersion stays 1; existing stored V1 designs remain valid. Soft decorative borders / translucent focus / hero-over-image pairs intentionally excluded from deterministic required checks (documented). Isolated browser acceptance VERIFIED on PG17 `nft_studio_007a_44117` @ `127.0.0.1:5433` (all 15 palettes in Studio iframe, forest-gold at 390/768/1280, typography combos, keyboard gallery, handshake dusk switch, zoom spot checks). Quality gates: 105 site-design tests, typecheck, build. No commit/push/deploy; no production DB writes; no Save Draft/Publish.

## 2026-11-12 — Visual design fidelity production release (NFT-STUDIO-006F)

Authorized gated code-only production release of NFT-STUDIO-006F visual fidelity. Homepage presentation uses live `--site-*` helpers under `SiteTheme`; typography inheritance corrected; Classic/Editorial/Modern differentiated via loaded Next fonts only. Forest-gold remains published/canonical. No Save Draft, Publish, Restore, migrations, or production DB writes. Quality gates: 87 site-design tests, typecheck, build, isolated browser acceptance, contrast sampling. WAVE deferred (tool unavailable).

## 2026-11-12 — Visual design fidelity (NFT-STUDIO-006F)

Local bounded fidelity pass so curated Studio palettes/typography actually restyle homepage presentation. Homepage Hero/About/Specialties/Contact/Navbar/Footer/AtmosphereGlow consume live `--site-*` helper classes (Tailwind `@theme` bridges can snapshot `:root` and were not sufficient for palette switching). Section surfaces bind under `[data-site-theme]` rules. Typography: SiteTheme re-applies `font-family: var(--font-body)`; Modern uses Inter headings (distinct from Classic Montserrat); Inter loads weight 700. Shared `HomePresentation`/`SiteTheme` path unchanged; admin chrome stays on fixed forest/gold. Mirrored token tables + tests in `lib/site-design/visual-tokens.ts`. Browser acceptance VERIFIED on iso DB `127.0.0.1:5433/nft_studio_006_22555` (forest-gold parity vs pre-change baseline; dusk/clay surface+accent movement; Classic/Editorial/Modern distinct; heading/body scales move). Quality gates: 87 site-design tests, typecheck, build. No new controls, no publish, no commit/push/deploy, no production writes.

## 2026-11-11 — Preview handshake production hotfix (NFT-STUDIO-006E)

Authorized gated code-only release of NFT-STUDIO-006D handshake repair to `origin/main` + Vercel production. No production DB writes, Save Draft, design publish/restore, or schema migrations. Preflight: baseline `7b98005`, recovery checkpoint checksum verified, SiteDesign tables expected unchanged (draft/published revision 0). Quality gates: 76 site-design tests, typecheck, build, targeted eslint, isolated prod-mode browser acceptance on `nft_studio_006_22555`. Release scope limited to preview handshake + tests + docs.

## 2026-11-11 — Preview handshake repair (NFT-STUDIO-006D)

Local bounded correction for NFT-STUDIO-006C. Parent iframe `onLoad` was clearing `frameReady` after READY without a recoverable re-handshake, freezing subsequent SET_DESIGN posts. Added per-document READY `documentId`, parent handshake state (`preview-handshake.ts`) that retires superseded ids, iframe READY on mount/load/bounded retries, and parent `STUDIO_PREVIEW_REQUEST_READY` ping on load so late load and genuine reload both re-arm. Protocol remains version 1 with exact origin, source-window, and SiteDesign validation. Isolated DB `nft_studio_006_22555` on `127.0.0.1:5433`; production-mode Playwright on `:3014` VERIFIED clay/dusk accents, modern font attr, prominent h1 size change, late-load recovery, reload restore of unsaved design, draft/published/version unchanged. Quality gates: 75 site-design tests, typecheck, build, targeted eslint clean. No commit/push/deploy; no production design writes.

## 2026-11-11 — Visual editor production release (NFT-STUDIO-006B)

Authorized gated release of NFT-STUDIO-006/006A private visual design editor to `origin/main` and Vercel production. Code-only release: curated Typography/Colors controls, private draft preview iframe, Save Draft UI, concurrency/unsaved guards, preview protocol hardening, SAMEORIGIN framing limited to `/admin/studio/preview-frame`. No production schema migration, no authorized draft writes during release smoke, no design publish/restore. Preflight confirmed Supabase `dbqprchzgfhthpxngemy` / PG 17.6 singleton `default` draft/published revision 0, versions 0. Recovery checkpoint `nature-forward-prod-pre-studio-004c-20261111-1658.dump` checksum verified. Public site must remain forest-gold canonical until an authorized publish tranche.

## 2026-11-11 — Editor safety & release readiness (NFT-STUDIO-006A)

Local hardening over uncommitted NFT-STUDIO-006. Added accessible unsaved-change navigation guard (capture-phase link intercept + Stay/Discard dialog; beforeunload retained). Strengthened preview-frame authorization with `requireStudioPreviewAccess()` (proxy + layout + page). Versioned postMessage protocol (`protocolVersion: 1`) with exact origin, expected source window, SiteDesign V1 validation, oversized rejection, and no-op on invalid messages. Fixed iframe embedding by scoping `X-Frame-Options: SAMEORIGIN` to `/admin/studio/preview-frame` only (sitewide DENY preserved). Isolated DB `nft_studio_006_22555`; Playwright verified discard cancel/confirm, save/reload, unauth redirects, iframe valid/invalid/rapid updates, viewports. Quality gates: 61 site-design tests, typecheck, build, targeted eslint clean. No publish/media/restore; no commit/push/deploy; no production writes.

## 2026-11-11 — Visual design editing Phase One (NFT-STUDIO-006)

Local-only Website Studio visual design workspace. Expanded SiteDesign V1 curated enums (themes `forest-gold|dusk-sage|clay-sand`; fonts `classic|editorial|modern`; heading/body scales) with deterministic CSS via `data-site-theme|font|heading|body`. Design editor at `/admin/studio/design` provides Typography + Colors controls beside a private draft preview that reuses `HomePresentation`/`SiteTheme` inside an authenticated iframe (`/admin/studio/preview-frame`) with same-origin postMessage SET_DESIGN/READY. Local editor state tracks baseline equality (`designsEqual`), unsaved changes, Save Draft via existing `saveSiteDesignDraftAction` + optimistic concurrency, and conflict reload messaging. Desktop/mobile preview modes resize the iframe viewport (390px mobile) rather than CSS-scaling a desktop layout. Isolated acceptance on disposable PG17 `nft_studio_006_22555` (`127.0.0.1:5433`) via `.env.local`; Playwright browser acceptance VERIFIED (EDITOR/DEVELOPER, save/reload/conflict, viewports 390/768/1280). Quality gates: `test:site-design` 44 pass, typecheck, build, targeted eslint clean (pre-existing AdminShell setState lint remains). Production singleton read-only: `key=default`, draft/published revision 0, versions 0. No publish/media/restore UI; no commit/push/deploy; no production writes.

## 2026-11-11 — Website Studio production release (NFT-STUDIO-005B)

Authorized gated release of NFT-STUDIO-005/005A Website Studio shell to `origin/main` and Vercel production (`nature-forward-therapy` / `tyson-zauggs-projects`). Preflight confirmed Supabase `dbqprchzgfhthpxngemy` on PostgreSQL 17.6 with empty `SiteDesignState`/`SiteDesignVersion` (0/0) and existing CMS rows intact. Backup `nature-forward-prod-pre-studio-004c-20261111-1658.dump` checksum verified. No production schema migration, draft editing, design publish, or restore. Local `.env.local` iso DB remains gitignored and excluded from deploy. Canonical singleton initialization authorized only via authenticated Studio `getSiteDesignWorkspaceAction` → `ensureSiteDesignState`.

## 2026-11-11 — Isolated Studio browser acceptance (NFT-STUDIO-005A)

Local acceptance of NFT-STUDIO-005 against disposable PostgreSQL 17 `nft_studio_005a_69653` on loopback `:5433` only. Proven Next.js Environments `.env.local, .env` with effective DATABASE_URL/DIRECT_URL on `127.0.0.1:5433` (no Supabase). Auth.js credentials sessions for local EDITOR/DEVELOPER; unauthenticated `/admin/studio` redirects to login. Workspace action initialized canonical singleton (`key=default`, draft/published revision 0, empty history) idempotently. Playwright Chromium exercised Studio routes, mouse/keyboard Studio chrome, Tab isolation (0 focus hits inside preview), and responsive viewports. Preview isolation correction: standards `inert` on `StudioPreviewFrame` (plus existing pointer-events/aria-hidden). Login form gained `method="post"` so pre-hydration submits cannot leak credentials into the query string. Failure probes: invalid draft preserved with “needs attention” UI and no publish; DB connection limit caused auth/session redirect rather than fake Studio success. Regression: `test:site-design` 36 pass, typecheck, build, targeted eslint clean. No production writes, commit, push, or deploy.

## 2026-11-11 — Website Studio workspace shell (NFT-STUDIO-005)

Local Website Studio shell at `/admin/studio` (Overview / Design / Media / History) for EDITOR and DEVELOPER. Integrates `getSiteDesignWorkspaceAction` only (no parallel reader), shows live vs draft status without inventing publication, and reuses `HomePresentation` in a read-only preview of the live-facing design (not draft preview). Media/history are informational placeholders without upload/restore/publish controls. RBAC path `/admin/studio` added. No production writes, commit, or deploy in this tranche.

## 2026-11-11 — Production SiteDesign release (NFT-STUDIO-004D)

Authorized production release of NFT-STUDIO-004/004A. Verified 004C backup checksum, passed tests/typecheck/build, confirmed production DB identity (`dbqprchzgfhthpxngemy`), applied additive SQL `prisma/migrations-manual/nft-studio-004-site-design.sql` via PostgreSQL 17 `psql` (`ON_ERROR_STOP=1`) creating empty `SiteDesignState` / `SiteDesignVersion` only. Existing CMS + carpet/store row counts unchanged. No design publish; no `prisma db push`. Commit/push/Vercel deploy follow this journal entry in the same release window.

## 2026-11-11 — Isolated DB publishing acceptance (NFT-STUDIO-004A)

Verified NFT-STUDIO-004 against disposable local PostgreSQL `nft_studio_004a_iso_*` on `127.0.0.1` (never production Supabase). Applied additive SQL only to the isolated DB. Integration suite (`SITE_DESIGN_TEST_DATABASE_URL` + isolation guard) confirmed singleton init races, draft isolation, concurrent draft/publish/restore conflicts, atomic publish rollback on snapshot unique failure, invalid-design preservation, audit success-only attribution, and post-commit revalidation failure reporting. Focused corrections: `publishSiteDesign` maps hard transaction failures to `{ok:false,code:"ERROR"}` (no false success/audit); exported `resolveDesignActor` for auth-gate tests. Production migration still NOT applied. Commit/push/deploy NOT authorized.

## 2026-11-11 — Design state & publishing foundation (NFT-STUDIO-004)

Local-only SiteDesign persistence foundation (not committed/deployed; production migration not applied). Added Zod SiteDesign V1 (`lib/site-design/schema.ts`) with canonical forest-gold default, Prisma models `SiteDesignState` / `SiteDesignVersion`, additive manual SQL + migration plan under `prisma/migrations-manual/`. Server service supports ensure/read workspace, optimistic draft save, atomic publish + append-only snapshot, history list, and restore-to-draft. Public reader (`getPublishedPresentationConfig`) is ISR-tagged (`CACHE_TAGS.siteDesign`), never exposes drafts, and falls back to the canonical default on missing/invalid published JSON without overwriting storage. `HomePresentation` / `SiteTheme` accept the safe published theme preset only; section order/visibility/media remain reserved. Authenticated server actions in `lib/actions/site-design.ts` (EDITOR/DEVELOPER). No Studio UI, Media Library, or selectable themes.

## 2026-11-11 — Shared presentation & semantic theme foundation (NFT-STUDIO-003 / 003B)

Extracted `components/site/HomePresentation.tsx` so `app/page.tsx` only loads CMS data and renders the shared composition (Navbar → Hero → About → Specialties → Contact → Footer). Introduced `SiteTheme` (`data-site-theme="forest-gold"`) on public marketing routes and semantic `--site-*` CSS variables in `app/globals.css` mapped to the current forest/sage/gold identity. Refactored theme-blocker chrome (body gradient, `.nav-glass`, `.btn-gold` / `.btn-outline`, hero overlays, frosted cards, public footer/nav stone/amber fills) to read semantic tokens while preserving hex/rgba values. Admin/login remain outside the public theme wrapper and keep `:root` defaults. NFT-STUDIO-003A acceptance: CONDITIONAL PASS. NFT-STUDIO-003B restored bookshelf “Coming soon” border to exact former `stone-700` via `--site-border-muted: #44403c`. No Prisma/schema, Studio UI, draft/publish, Media Library, or new presets. Typecheck + production build passed; full-repo eslint still reports pre-existing admin/script issues unrelated to this tranche.

## 2026-11-10 — Unified vector icon system (NFT-DESIGN-001)

Replaced hardcoded UI emoji/Unicode control glyphs with Lucide React SVGs across public and admin surfaces. Established presentation-only specialty mapping in `lib/specialty-icons.tsx` so CMS `Specialty.icon` emoji keys remain stored unchanged while the public site renders Leaf/Mountain/Sprout. Banner theme picker, support chat prompts, admin action labels, article/bookshelf CTAs, and status chrome now use named Lucide imports. Authored article/profile/DB content untouched; no Prisma operations. Local-only — not committed or deployed.

## 2026-11-10 — Visual asset optimization (NFT-PERF-004)

Local-only visual performance work (not committed/deployed). Replaced the Unsplash CSS hero (`~730KB` JPEG at `w=1920`) with local responsive AVIF/WebP/JPEG variants (`forest-768/1280/1920`) selected via CSS `image-set` + viewport media queries. Legacy CMS Unsplash hero URLs still map to the optimized default via `lib/hero-background.ts`. Replaced 417KB favicon/icon/logo PNGs with sized derivatives (`favicon.ico` ~1.2KB, `favicon.png` ~3KB, `apple-touch-icon.png` 180px, nav `fof-logo-mark.png` 64px). Headshot remains `next/image` priority. Added `prefers-reduced-motion` so delayed hero animations do not stay at `opacity: 0`. Local cold mobile hero transfer dropped from ~730KB → ~50KB AVIF; cold mobile total image transfer ~2.0MB (prod) → ~134KB (local). Public ISR retained; login remains dynamic. No production deploy.

## 2026-11-10 — Performance release (NFT-PERF-003)

Committed and pushed `a6a5af6` (`perf: cache public pages and reduce render overhead`) to `main`. Vercel production deployment `dpl_DnRRAdad8LRZ9sW4a8YYzRh1vzzQ` Ready and aliased to `www.flockoffox.org`. Local acceptance (isolated `nft_perf_002` + browser EDITOR profile save) passed before release. Production smoke: `/`, `/articles`, `/bookshelf`, `/login` 200; `/admin` 307→login; contact location + Headway/Psychology Today CTAs present; maintenance not stuck on. Homepage multi-request TTFB ~0.13–0.23s with `x-vercel-cache: HIT`, `x-nextjs-prerender: 1`. No `prisma db push`.

## 2026-11-10 — Public rendering optimization (NFT-PERF-002)

Removed root `force-dynamic` / `noStore` / `headers()` / layout `auth()` so public pages can ISR (`revalidate = 60`). Maintenance enforcement moved to Node `proxy.ts` with `getMaintenanceModeCached()` + rewrite to `/maintenance`; DEVELOPER preview uses a short-lived cookie + client banner. Public CMS reads use `React.cache` + tagged `unstable_cache`; mutations/APIs call `revalidatePublicSurfaces()` with `revalidateTag(tag, { expire: 0 })`. Articles/bookshelf category filters moved client-side so hubs stay static. Local production build shows `○`/`●` for public routes and `ƒ` for admin/login. Local `next start` responses report `x-nextjs-cache: HIT|STALE` with `s-maxage=60`. Verified against isolated Postgres `nft_perf_002` only — no production DB writes/deploy.

## 2026-11-10 — Owner-managed practice contact fields

Extended `PractitionerProfile` with nullable `phone`, `fax`, and `publicEmail`. Active Practice Profile admin form (`ProfileForm` + `updateProfile`) now edits location plus these optional contact fields with Zod normalization (empty → null). Public Contact section shows location/phone/fax/email when set; Footer shows fax when set. Headway/Psychology Today CTAs unchanged. Legacy `/api/cms/profile` deliberately excludes the new contact fields so they cannot bypass server-action validation. Audit rollback restores nullables. **Not production-deployed yet** — additive `prisma db push` against production Postgres is still required before the app that reads these columns can go live. Local schema edited only; no production DB write in this change set.

## 2026-07-24 — Admin portal mobile responsiveness

Refactored the admin/developer shell for small screens: hamburger + slide-over nav drawer below `lg`, stacked dashboard grids, `overflow-x-auto` + `.admin-scroll` on tables/feeds, and 44px touch targets on key controls. Support chat, force-password, and Cover Studio modals fit mobile viewports (`max-w-full` / `sm:max-w-lg`).

## 2026-07-24 — Diagnostics probe browser headers + CF 403

External link probes send browser-like `User-Agent` / `Accept` / `Accept-Language` headers. Status `200` / `301` / `302`, and Cloudflare/WAF `403` responses, count as reachable so Headway bot gates do not false-alarm the diagnostics dashboard.

## 2026-07-24 — Public scroll / render performance

GPU-accelerated ambient light leaks (`transform-gpu will-change-transform` on `AtmosphereGlow`), replaced heavy frosted `backdrop-filter` cards/nav with solid `bg-stone-950/85` fills, confirmed Navbar scroll uses `{ passive: true }`, and set public `<Image />` `quality={80}` + `sizes`. Dropped hero `background-attachment: fixed` to reduce scroll paint cost.

## 2026-07-24 — Maintenance toggle-off cache bust

Hardened MAINTENANCE_MODE reads with `noStore()` + `connection()`, explicit `enabled === false` parsing in POST, `revalidatePath("/", "layout")` + `/admin/settings`, fail-safe `GET ?action=off`, and `router.refresh()` in Emergency Controls so turning maintenance off clears the public holding card and developer banner immediately.

## 2026-07-24 — Ops suite audit: maintenance gate fix

Fixed Emergency Maintenance Mode: root layout is `force-dynamic`, `getMaintenanceMode` uses `noStore`, proxy sets `x-pathname` on all page routes, and `PublicMaintenanceGate` blocks public visitors/editors while developers see an amber ACTIVE banner site-wide. Also hardened revalidate (layout+page), magic-login (`redirect: false`), audit rollback try/catch, diagnostics 5s AbortController + `/admin/diagnostics` UI.

## 2026-07-24 — Developer Operational Suite

Added `AuditLog`, `SystemSetting`, and `MagicToken` models. Developer APIs: revalidate (path-aware), maintenance + session flush, magic-link, audit list/rollback, diagnostics. New `/admin/cache` console; settings emergency controls; users magic-login button; activity feed with snapshot revert. Public maintenance holding card via `PublicMaintenanceGate` (developers exempt). CMS mutations write audit snapshots. Ownership: `lib/audit.ts`, `lib/system-settings.ts`, `app/api/admin/*`.

## 2026-07-24 — Support desk active-feed resolve flow

`GET /api/admin/support` returns only `OPEN` / `IN_PROGRESS` messages. Marking resolved bulk-updates those rows; developer desk empties with a resolved banner, sidebar badge clears via `support-desk:updated`, and the editor drawer re-polls to the “How can we help you today?” greeting.

## 2026-07-24 — Support chat drawer mount + preview mode

`SupportChatDrawer` restyled (emerald floating CTA) and mounted from `app/admin/layout.tsx` via `AdminSupportChatHost` for EDITORS and when DEVELOPER Preview Editor View is on (`EditorPreviewContext`).

## 2026-07-24 — Developer command center sidebar & ops widgets

Developer sidebar drops CMS content links and uses Command Center / Management / Controls. Overview gains JSON backup export, activity feed preview, and Headway/webmail link checks. New developer routes: `/admin/activity`, `/admin/backup`, `/admin/seo`. Ownership: `lib/admin-ops.ts` + `GET /api/admin/backup`.

## 2026-07-24 — Discord webhook for editor support messages

`POST /api/admin/support` now notifies `DISCORD_SUPPORT_WEBHOOK_URL` when an EDITOR posts (embed with email + message). Failures are swallowed so DB saves still succeed.

## 2026-07-24 — In-app Dev Support Chat & Feedback Desk

Added `SupportMessage` Prisma model and `GET/POST/PATCH /api/admin/support`. EDITORS get a floating “Need Help / Chat with Dev” drawer (Flock of Fox Tech Desk, quick-prompt chips, polled thread). DEVELOPERS get `/admin/support` Client Support Desk with sidebar unread badge and “Mark Topic Resolved”. Ownership: schema + API route; presentation in `SupportChatDrawer` / `SupportDesk`.

## 2026-07-24 — Sign-out + force-password mount guards

Sign Out now uses client `signOut({ callbackUrl: "/", redirect: true })` and skips the login bounce while signing out. `ForcePasswordModal` mounts only when `status === "authenticated"`, `role === "EDITOR"`, and `mustChangePassword === true` — never during loading/unauthenticated.

## 2026-07-24 — Announcement banner styling controls

Extended `AnnouncementBanner` with `isDismissible` (default false), `alignment`, `theme`, and `fontStyle`. Admin CMS adds live preview, alignment segmented control, dismissible toggle, theme swatches (amber/sage/clay/forest), and sans vs serif typography. Public banner renders those styles and only shows the close `X` when dismissible.

## 2026-07-24 — Article cover remove button

Article editor cover section now includes a “🗑️ Remove Image” control that clears `coverImage` / studio source, resets the file input, hides the preview, and confirms with a short success message.

## 2026-07-24 — Curated Bookshelf & Recommended Resources

Added `BookshelfItem` Prisma model (`db push`). Public `/bookshelf` hub with Cormorant hero, category chips, warm library-style cards, and “Nicole’s Note” parchment callouts. Admin CMS at `/admin/bookshelf` (list, new, edit) with BookOpen sidebar link. Nav/Footer **Bookshelf** links. Seeded three recommended books. Ownership: `lib/bookshelf.ts` reads; `lib/actions/bookshelf.ts` mutations.

## 2026-07-24 — Article Photo Editor & Cover Studio

Added client-side `ImageEditorModal` (crop presets, brightness/contrast/saturation/warmth/blur/vignette, nature aesthetic filters, rotate/flip, JPEG/WebP compress under 500KB). Article editor supports file upload, clipboard paste, and “Open Photo Editor & Studio”. AI Botanical Cover Generator calls `POST /api/cms/generate-cover` (Gemini `gemini-3.1-flash-image-preview`) when `GEMINI_API_KEY` is set. Cover field accepts large data URLs; server Actions body limit raised to 2mb.

## 2026-07-24 — Article editor category chips + URL helper

Article editor replaces the category `<select>` with preset chips plus “+ Custom Category” free text. Slug field relabeled “Article Web Address (URL)” with helper copy; still auto-slugifies from title until manually overridden. Server action accepts any category string (not only presets).

## 2026-07-24 — Force-password session sync fix

JWT `update` trigger now applies `session.mustChangePassword` from `update({ mustChangePassword: false })` instead of only re-reading the DB (which raced with soft refresh). `ForcePasswordModal` awaits that session patch then hard-navigates to `/admin`. `AdminShell` prefers live client session for the modal gate. Seed: editor `mustChangePassword: true`, developer `false`.

## 2026-07-24 — Article Engine, Publication Hub & Announcement Banner

Added `BlogPost` and `AnnouncementBanner` Prisma models (`db push`). Public hub at `/articles` with category filters and frosted article cards; reading room at `/articles/[slug]` with share/copy, author badge, and Headway CTA. Admin CMS: `/admin/articles` list + editor (`new` / `[id]`), `/admin/announcements` banner manager; sidebar + editor dashboard links. Site-wide amber banner above Navbar when active (session dismiss). Nav/Footer **Essays** links. Seeded two published sample essays. Ownership: schema + `lib/articles.ts` reads; mutations via `lib/actions/articles.ts` / `announcements.ts`.

## 2026-07-23 — Session persistence + login UX

JWT/session cookie `maxAge` extended to 30 days. Login auto-redirects authenticated users to `/admin` (server + client). Admin shell waits for `useSession` loading before treating unauthenticated as a logout. Password fields on login and force-password modal include Eye/EyeOff toggles. Admin header shows “Signed in as {email}” with Sign Out.

## 2026-07-23 — Change-password API + session refresh

Added `POST /api/user/change-password` (auth, bcrypt hash, `mustChangePassword: false`). `ForcePasswordModal` now posts to that API with client/API error messages, spinner disabled submit, success toast, `session.update()`, and `router.refresh()`. JWT callback re-reads `mustChangePassword` on `trigger === "update"`.

## 2026-07-23 — Force-password modal admin-only

Confirmed `ForcePasswordModal` mounts only from `app/admin/layout.tsx` when `mustChangePassword === true`. Public layout/Navbar/Footer/home never import it. Portal Login is a plain `/login` link; proxy no longer auto-redirects authenticated users from `/login` into admin (avoids modal appearing from the public portal link).

## 2026-07-23 — Portal login / force-password routing

Portal Login in Navbar/Footer always targets `/login`. Successful credentials sign-in always redirects to `/admin`. `ForcePasswordModal` mounts only in the admin layout when `mustChangePassword` is true (not on `/login`).

## 2026-07-23 — Editor seed email + in-portal support

Editor seed account is now `nicolegarcia@flockoffox.org` (password `ChangeMeEditor!`, `mustChangePassword: true`), with legacy `nicole@flockoffox.org` migrated on seed. EDITOR dashboard includes a Contact Developer & Support card that submits via `submitSupportRequest` (auth + validation + success toast / log notification to `dev@flockoffox.org`).

## 2026-07-23 — Footer copyright polish

Removed public “Powered by SAGE Federation” / `footerCredit` display from `Footer.tsx`. Added dynamic `© {year} Flock of Fox, LLC. All rights reserved.` with muted stone/amber styling; fox emblem, LLC name, clinician line, and Portal Login retained. Typecheck + build green.

## 2026-07-23 — Editor preview + password gating refine

Developers can toggle “Preview Editor View” on `/admin` with an exit banner; force-password modal now applies only to `EDITOR` + `mustChangePassword`. Users page supports force-change toggle and temp password resets.

## 2026-07-23 — First-login password + user security

Added `User.mustChangePassword`, admin force-password modal, developer reset-password tools, and login “Forgot password?” guidance pointing to `dev@flockoffox.org`.

## 2026-07-23 — Proxy convention migration

Renamed `middleware.ts` → `proxy.ts` and exported Auth.js guard as named `proxy`. Next.js build no longer emits the middleware deprecation warning.

## 2026-07-23 — Admin CMS forms & navigation

Profile and Insurances/Payments forms now use Server Actions with `revalidatePath('/')`, toast feedback, admin `loading.tsx` skeletons, and sidebar navigation via `next/link` + `useTransition` for responsive client transitions. New route: `/admin/details`.

## 2026-07-23 — Nature-Forward aesthetic pass

Added Cormorant Garamond (`--font-serif`) for editorial moments, clay/parchment tokens, komorebi light-leak glows, frosted-leaf cards with soft gold hover bloom, and organic portrait/arch image frames across Hero, About, Specialties, and Contact.

## 2026-07-23 — Security hardening

Added HTTP security headers in `next.config.ts`, hardened Auth.js session cookies (`HttpOnly`, `SameSite=Lax`, `Secure` in production) with 24h JWT maxAge, and in-memory rate limiting (10 attempts / 15 min per IP) on credentials auth POSTs.

## 2026-07-23 — Role-tailored admin dashboards

`/admin` now renders a Developer System Health Monitor (DB ping, routes, telemetry, security + revalidate/users actions) for `DEVELOPER`, and a warm practice portal for `EDITOR` (no raw metrics/settings). Sidebar uses Lucide icons with an active gold border indicator.

## 2026-07-23 — PostgreSQL seed & CMS schema

Switched Prisma from SQLite to PostgreSQL (Supabase pooler + `DIRECT_URL`), added `Insurance` model, renamed practice singleton to `PracticeDetail`, and seeded `dev@flockoffox.org` (DEVELOPER) + `nicole@flockoffox.org` (EDITOR) with audit catalog content. `npm run db:push` and `npm run db:seed` succeed against Postgres.

## 2026-07-23 — Next.js + RBAC CMS migration

Converted the static single-page HTML site into a Next.js App Router application with Tailwind CSS v4 `@theme` tokens matching `AUDIT_CATALOG.md`, modular section components, and a Prisma + Auth.js CMS with `DEVELOPER` / `EDITOR` roles.

### What changed
- Replaced `index.html` + CLI Tailwind build with Next.js 16 (App Router, TypeScript, Tailwind v4).
- Wired Montserrat / Inter via `next/font/google`.
- Declared brand colors in `app/globals.css` `@theme` (forest, sage, gold, sand, body-text).
- Moved headshot to `public/images/nicole.jpg`; Unsplash remote patterns in `next.config.ts`.
- Split UI into `Navbar`, `Hero`, `About`, `Specialties`, `Contact`, `Footer`, `BotanicalLine`.
- Added SQLite CMS collections: practitioner profile, specialties, focus tags, practice details, site config, users.
- Editor dashboard at `/admin` (content only); developer-only `/admin/users` and `/admin/settings`.
- Seeded default content from the pre-migration public site copy.

### Verification
- `npm run typecheck` — clean
- `npm run build` — clean

### Notes
- A duplicate Desktop folder `Nature-Forward-Therapy` (hyphenated) existed during scaffold; the Cursor workspace is `Nature-Forward Therapy` (spaced). Prefer the spaced path as source of truth.
- Next.js 16 warns that the `middleware` file convention is deprecated in favor of `proxy`; auth gate still works via current middleware.
