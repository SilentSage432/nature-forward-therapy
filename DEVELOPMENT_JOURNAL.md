# Development Journal — Nature-Forward Therapy

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
