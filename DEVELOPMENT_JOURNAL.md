# Development Journal — Nature-Forward Therapy

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
