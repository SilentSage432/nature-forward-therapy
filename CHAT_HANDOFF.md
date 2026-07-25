# Chat Handoff — Nature-Forward Therapy

## Current state
Next.js App Router site with Prisma/Postgres CMS and Auth.js RBAC. Public Publication Hub (`/articles`), Curated Bookshelf (`/bookshelf`), and site-wide announcement banner are live. In-app Dev Support Desk persists editor↔developer chat (`SupportMessage` + `/api/admin/support`); EDITORS use the floating Tech Desk drawer, DEVELOPERS use `/admin/support` with an unread sidebar badge. Public footer shows Flock of Fox branding + copyright (no SAGE Federation credit line).

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
| Design tokens | `app/globals.css` `@theme` |
| Content reads | `lib/content.ts`, `lib/articles.ts`, `lib/bookshelf.ts` |
| Auth / sessions | `lib/auth.ts`, `proxy.ts` |
| RBAC rules | `lib/rbac.ts` |
| CMS mutations | `app/api/cms/**`, `lib/actions/**` |
| Support desk | `app/api/admin/support/route.ts`, `SupportChatDrawer`, `SupportDesk` |
| Schema / seed | `prisma/schema.prisma`, `prisma/seed.ts` |

## Editor vs developer
- **Editor:** profile, specialties, practice details, articles/essays, curated bookshelf, announcement banner, floating Tech Desk chat.
- **Developer:** everything editors can do, plus users, site settings, Client Support Desk (`/admin/support`).

## Do not regress
- Keep audit color hex values exact.
- Public home page must remain a single-page composition with in-page anchors (`/#about` etc. from Essays).
- Editors must not reach `/admin/users`, `/admin/settings`, or `/admin/support`.
- Unpublished essays must not appear on `/articles` or `[slug]`.
- After force-password change: call `update({ mustChangePassword: false })` then hard reload — do not rely on `router.refresh()` alone.
- Seed: editor starts with `mustChangePassword: true`; developer stays `false`.
- Article covers from the Photo Studio are stored as compressed data URLs; set `GEMINI_API_KEY` for AI botanical generation.
- Force-password modal: authenticated EDITOR + mustChangePassword only; Sign Out → `/` via client `signOut`.
- Optional `DISCORD_SUPPORT_WEBHOOK_URL` posts EDITOR support messages to Discord (failures never block the DB save).
