# Chat Handoff — Nature-Forward Therapy

## Current state
Next.js App Router site with Prisma/Postgres CMS and Auth.js RBAC. Public marketing pages are **ISR-cached** (`revalidate = 60`) after NFT-PERF-002. Maintenance is enforced in `proxy.ts` (rewrite to `/maintenance`) rather than a dynamic root layout gate. Developer Operational Suite (audit/rollback, maintenance, magic links, cache console, diagnostics) remains. Contact-management code is present locally; production schema push + deploy still pending.

**Public caching (local-validated, not production-measured yet):**
- `/`, `/articles`, `/bookshelf`, `/articles/[slug]` → static/ISR
- `/login`, `/admin/*` → dynamic
- CMS writes → `revalidatePublicSurfaces()` + path revalidation
- Maintenance toggle → `revalidateMaintenanceSurfaces()` (immediate tag expire)

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
| Public presentation | `components/*`, `app/page.tsx`, `app/articles/**`, `app/bookshelf/**` |
| Public ISR + invalidation | `lib/public-cache.ts`, `lib/public-cache-shared.ts`, CMS actions/APIs |
| Maintenance rewrite | `proxy.ts`, `getMaintenanceModeCached`, `/maintenance` |
| Admin shell / mobile nav | `AdminShell`, `AdminHeader`, `AdminSidebar` |
| Design tokens | `app/globals.css` `@theme` |
| Content reads | `lib/content.ts`, `lib/articles.ts`, `lib/bookshelf.ts` |
| Auth / sessions | `lib/auth.ts`, `proxy.ts` |
| RBAC rules | `lib/rbac.ts` |
| CMS mutations | `app/api/cms/**`, `lib/actions/**` |
| Support desk | `app/api/admin/support/route.ts`, `SupportChatDrawer`, `SupportDesk` |
| Developer ops | `lib/admin-ops.ts`, `lib/audit.ts`, `lib/system-settings.ts`, `app/api/admin/**` |
| Schema / seed | `prisma/schema.prisma`, `prisma/seed.ts` |

## Editor vs developer
- **Editor:** profile (including location + optional phone/fax/publicEmail), specialties, practice details, articles/essays, curated bookshelf, announcement banner, floating Tech Desk chat.
- **Developer:** Command Center (overview + support desk), Management (activity/rollback, backups, users/magic links), Controls (cache, SEO, system settings/maintenance).

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
