# Chat Handoff — Nature-Forward Therapy

## Current state
Next.js App Router site with Prisma/Postgres CMS and Auth.js RBAC. Public marketing pages are **ISR-cached** (`revalidate = 60`) and **live on production** after NFT-PERF-003 (`a6a5af6`). NFT-PERF-004, NFT-DESIGN-001, and **NFT-STUDIO-003** are deployed (baseline `faff6cf`). Maintenance is enforced in `proxy.ts` (rewrite to `/maintenance`) rather than a dynamic root layout gate. Developer Operational Suite remains. Contact columns (`phone`/`fax`/`publicEmail`) were applied in production via targeted additive SQL (do not re-run `db push` for that change).

**NFT-STUDIO-004 / 004A / 004D (production):** SiteDesign V1 persistence + publish service + public published reader. Additive SQL applied (empty tables at release; no design publish).

**NFT-STUDIO-005 / 005A / 005B (production):** Website Studio shell at `/admin/studio` released to `origin/main` + Vercel (`c567918`). Preview isolation uses `inert` + `aria-hidden` + `pointer-events-none`. No design publish. Canonical singleton may initialize on first authenticated Studio visit only.

**NFT-STUDIO-006 / 006A / 006B (production):** Private visual design editor at `/admin/studio/design` — curated Typography + Colors, private draft iframe preview (`/admin/studio/preview-frame`), Save Draft + optimistic concurrency, unsaved Stay/Discard guard, versioned postMessage protocol, SAMEORIGIN framing only on preview-frame. No design publish/restore/media mutations in this release. Public site remains published/canonical forest-gold until a later authorized publish tranche.

**NFT-STUDIO-006C / 006D / 006E:** 006C diagnosed preview freeze (READY then late iframe `onLoad` cleared readiness). 006D repaired handshake (per-document READY ids, `REQUEST_READY` recovery, stale-id retirement). 006E is the authorized gated code-only production release of that repair — no design Save/Publish and no schema migration.

**NFT-STUDIO-006F (production):** Visual fidelity released — homepage presentation uses live semantic `--site-*` helpers under `SiteTheme`; typography inheritance fixed; Modern/Classic/Editorial stacks distinguishable via loaded Next fonts only. Public published design remains forest-gold canonical until a later authorized publish tranche.

**Public caching (production-measured 2026-11-10):**
- `/`, `/articles`, `/bookshelf`, `/articles/[slug]` → static/ISR (`x-vercel-cache: HIT`, prerender)
- `/login`, `/admin/*` → dynamic (`login` private/no-store; `/admin` auth redirect)
- CMS writes → `revalidatePublicSurfaces()` + path revalidation (now also expires `CACHE_TAGS.siteDesign`)
- Maintenance toggle → `revalidateMaintenanceSurfaces()` (immediate tag expire)
- Acceptance helpers: `scripts/nft-perf-002-verify.mjs`, `scripts/nft-perf-003-acceptance.mjs`

**Visual assets (NFT-PERF-004):**
- Hero: `public/images/hero/forest-{768,1280,1920}.{avif,webp,jpg}` via `.hero-bg--optimized` + `lib/hero-background.ts`
- Nav/footer mark: `/images/fof-logo-mark.png`; icons: `/favicon.ico`, `/favicon.png`, `/icon.png`, `/apple-touch-icon.png`
- OG/Twitter: `/images/brand/fof-logo-og.jpg`

**Icon system (NFT-DESIGN-001):**
- Library: `lucide-react` (named imports only)
- Specialty CMS emoji keys → Lucide via `lib/specialty-icons.tsx` (presentation only; DB unchanged)

**Presentation foundation (NFT-STUDIO-003 + 004 + 006 local):**
- Homepage composition: `components/site/HomePresentation.tsx` (used by `app/page.tsx` + Studio preview)
- Public theme scope: `components/site/SiteTheme.tsx` → `data-site-theme` / font / heading / body attrs
- Semantic tokens: `app/globals.css` (`--site-*` on `:root` + curated theme/type scopes)
- Design state: `lib/site-design/*` + `lib/actions/site-design.ts`
- Studio editor: `components/admin/studio/DesignEditor.tsx` + control/preview panes
- Additive migration (production-applied in 004D): `prisma/migrations-manual/nft-studio-004-site-design.sql`

## How to run
```bash
npm install
npm run db:setup
npm run dev
```

Public site: `http://localhost:3000`
Articles hub: `http://localhost:3000/articles`
Bookshelf: `http://localhost:3000/bookshelf`
CMS login: `http://localhost:3000/login`
Admin: `http://localhost:3000/admin`
Developer support desk: `http://localhost:3000/admin/support`
Cache console: `http://localhost:3000/admin/cache`

SiteDesign unit tests: `npm run test:site-design`
SiteDesign isolated DB integration: `SITE_DESIGN_TEST_DATABASE_URL=postgresql://…@127.0.0.1:5432/nft_studio_004a_* npm run test:site-design:db` (refuses Supabase / non-`nft_studio_004a_*` names)
Local ISR verification helper: `scripts/nft-perf-002-verify.mjs` (uses isolated DB env vars; do not point at production for writes).

### Seeded accounts (from `.env` / `.env.example`)
| Role | Email | Password | Force password |
| --- | --- | --- | --- |
| Developer | `dev@flockoffox.org` | `ChangeMeDev!` | `false` (never blocked) |
| Editor | `nicolegarcia@flockoffox.org` | `ChangeMeEditor!` | `true` on seed (modal on first login) |

Database: PostgreSQL via `DATABASE_URL` (pooler) + `DIRECT_URL` (migrations).

## Ownership map
| Concern | Owner |
| --- | --- |
| Public presentation | `components/site/HomePresentation.tsx`, `components/site/SiteTheme.tsx`, `components/*`, `app/page.tsx`, `app/articles/**`, `app/bookshelf/**` |
| Semantic public theme tokens | `app/globals.css` (`--site-*`, `[data-site-theme]`) |
| SiteDesign contract / defaults | `lib/site-design/schema.ts`, `lib/site-design/defaults.ts`, `lib/site-design/options.ts` |
| Design draft/publish/history | `lib/site-design/service.ts`, `lib/actions/site-design.ts` |
| Studio visual editor (draft only) | `components/admin/studio/DesignEditor.tsx`, preview-frame route |
| Published design public read | `lib/site-design/published.ts` / `resolve-published.ts` |
| Design persistence SQL | `prisma/migrations-manual/nft-studio-004-site-design.sql` |
| Public ISR + invalidation | `lib/public-cache.ts`, `lib/public-cache-shared.ts`, CMS actions/APIs |
| Maintenance rewrite | `proxy.ts`, `getMaintenanceModeCached`, `/maintenance` |
| Admin shell / mobile nav | `AdminShell`, `AdminHeader`, `AdminSidebar` |
| Brand + semantic design tokens | `app/globals.css` `@theme` + `--site-*` semantic variables |
| Content reads | `lib/content.ts`, `lib/articles.ts`, `lib/bookshelf.ts` |
| Auth / sessions | `lib/auth.ts`, `proxy.ts` |
| RBAC rules | `lib/rbac.ts` |
| CMS mutations | `app/api/cms/**`, `lib/actions/**` |
| Support desk | `app/api/admin/support/route.ts`, `SupportChatDrawer`, `SupportDesk` |
| Developer ops | `lib/admin-ops.ts`, `lib/audit.ts`, `lib/system-settings.ts`, `app/api/admin/**` |
| Schema / seed | `prisma/schema.prisma`, `prisma/seed.ts` |

## Editor vs developer
- **Editor:** profile (including location + optional phone/fax/publicEmail), specialties, practice details, articles/essays, curated bookshelf, announcement banner, floating Tech Desk chat, **SiteDesign draft/publish/history (server actions; UI deferred)**.
- **Developer:** Command Center (overview + support desk), Management (activity/rollback, backups, users/magic links), Controls (cache, SEO, system settings/maintenance), same SiteDesign ops.

## Contact fields ownership
| Concern | Owner |
| --- | --- |
| Validation + save | `lib/profile-contact.ts`, `lib/actions/profile.ts` |
| Admin UI | `components/admin/ProfileForm.tsx`, `/admin/profile` |
| Public render | `components/Contact.tsx`, `components/Footer.tsx` (fax only) |
| Content mapping | `lib/content.ts`, `lib/types.ts` |
| Legacy API | Does **not** accept phone/fax/publicEmail (`EDITOR_PROFILE_FIELDS`) |

## Do not regress
- Keep audit color hex values exact.
- Public home page must remain a single-page composition with in-page anchors (`/#about` etc. from Essays).
- Editors must not reach developer-only paths (`/admin/users`, `/admin/settings`, `/admin/support`, `/admin/activity`, `/admin/backup`, `/admin/seo`, `/admin/cache`).
- Unpublished essays must not appear on `/articles` or `[slug]`.
- After force-password change: call `update({ mustChangePassword: false })` then hard reload — do not rely on `router.refresh()` alone.
- Seed: editor starts with `mustChangePassword: true`; developer stays `false`.
- Article covers from the Photo Studio are stored as compressed data URLs; set `GEMINI_API_KEY` for AI botanical generation.
- Force-password modal: authenticated EDITOR + mustChangePassword only; Sign Out → `/` via client `signOut`.
- Optional `DISCORD_SUPPORT_WEBHOOK_URL` posts EDITOR support messages to Discord (failures never block the DB save).
- JSON backups via `/api/admin/backup` never include password hashes.
- Maintenance mode: anonymous/EDITOR public traffic rewritten to `/maintenance`; DEVELOPER JWT bypasses and may see client banner cookie.
- Magic links are single-use and expire in 15 minutes (`MagicToken`).
- Do not reintroduce root `force-dynamic` / layout `auth()` for public pages without revisiting the caching contract.
- SiteDesign: never auto-publish on startup/migration; never overwrite invalid stored JSON on public read; never expose draft via public reader; never `prisma db push` production for Studio tables — use additive manual SQL.
