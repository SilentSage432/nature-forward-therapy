# Master Roadmap — Nature-Forward Therapy

## Completed
- [x] Design system audit (`AUDIT_CATALOG.md`)
- [x] Next.js App Router + TypeScript + Tailwind v4 migration
- [x] Component decomposition of the static landing page
- [x] Prisma CMS schema + seed content
- [x] Auth.js credentials auth with DEVELOPER / EDITOR RBAC
- [x] Editor dashboard for business content
- [x] Build + typecheck green
- [x] Public footer copyright (Flock of Fox, LLC) — no SAGE Federation credit
- [x] Editor seed email `nicolegarcia@flockoffox.org` + in-portal support card
- [x] Portal Login → `/login`; force-password modal only on `/admin`
- [x] 30-day JWT session, login auto-redirect, password visibility toggles
- [x] Article Engine + Publication Hub (`/articles`, `/articles/[slug]`)
- [x] Admin article manager/editor + announcement banner CMS
- [x] Site-wide Announcement Banner + Essays nav/footer links
- [x] Force-password JWT sync via `update({ mustChangePassword })` + hard reload
- [x] Article Photo Editor & Cover Studio (crop, filters, AI Gemini covers)
- [x] Curated Bookshelf & Recommended Resources (`/bookshelf` + admin CMS)
- [x] Announcement banner themes, alignment, typography, dismissible toggle
- [x] In-app Dev Support Chat & Feedback Desk (`SupportMessage` + editor drawer + `/admin/support`)
- [x] Developer command center sidebar + backup / activity / SEO ops surfaces
- [x] Developer Operational Suite (audit, maintenance, magic links, cache console, diagnostics)
- [x] Public site scroll/render performance (GPU glows, lighter glass, image sizes/quality)
- [x] Admin / Developer portal mobile responsiveness (drawer nav, stacked grids, touch targets)
- [x] Owner-managed contact fields (location + phone/fax/publicEmail) in Practice Profile — **local code complete; production schema push still pending**
- [x] Public rendering optimization (ISR + proxy maintenance + request/data cache) — **NFT-PERF-003 released to production (`a6a5af6`); TTFB/cache HIT measured**
- [x] Visual asset optimization (local responsive hero + sized logo/favicon) — **NFT-PERF-004 validated locally; not deployed**

## Near-term
- [ ] Apply additive production Prisma `db push` for `phone` / `fax` / `publicEmail` (contact columns; separate from caching release)
- [ ] Deploy NFT-PERF-004 visual assets and re-measure production mobile image weight / FCP
- [ ] Optional follow-up: cold-start / edge geography re-measure after traffic settles
- [ ] Optional: localize remaining below-fold Unsplash section images (About/Specialties/Contact)
- [ ] Rotate seed passwords / `AUTH_SECRET` for production
- [ ] Deploy target (Vercel or container) with persistent Postgres
- [ ] Optional image upload for headshot (covers now use studio data URLs)
- [x] Replace deprecated Next.js middleware convention with `proxy`
- [ ] Remove/archive duplicate Desktop folder `Nature-Forward-Therapy` if unused
- [ ] Draft preview for unpublished essays (admin-only)
- [ ] Persist studio covers to object storage instead of DB data URLs at scale

## Later
- [ ] Audit logging for CMS edits
- [ ] Rich-text / markdown preview in article editor
- [ ] Accessibility pass on admin forms and public CTAs
