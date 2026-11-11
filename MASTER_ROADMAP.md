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
- [x] Owner-managed contact fields (location + phone/fax/publicEmail) in Practice Profile — **production columns applied via targeted additive SQL**
- [x] Public rendering optimization (ISR + proxy maintenance + request/data cache) — **NFT-PERF-003 released to production (`a6a5af6`); TTFB/cache HIT measured**
- [x] Visual asset optimization (responsive hero + sized logo/favicon) — **NFT-PERF-004 deployed**
- [x] Unified Lucide SVG icon system replacing UI emoji (NFT-DESIGN-001) — **deployed at `134a497`**
- [x] Shared homepage presentation + semantic public theme tokens (NFT-STUDIO-003) — **local implementation; not committed/deployed**

## Near-term
- [ ] Website Studio foundation: SiteDesign draft/publish persistence (NFT-STUDIO-002 Tranche 2)
- [ ] Media Library + Vercel Blob optimized variants (NFT-STUDIO-002 Tranche 3)
- [ ] Theme presets over semantic tokens (NFT-STUDIO-002 Tranche 4)
- [ ] Visual Website Studio editor over `HomePresentation` (NFT-STUDIO-002 Tranche 5)
- [ ] Optional follow-up: cold-start / edge geography re-measure after traffic settles
- [ ] Optional: localize remaining below-fold Unsplash section images (About/Specialties/Contact)
- [ ] Rotate seed passwords / `AUTH_SECRET` for production
- [ ] Optional image upload for headshot (covers now use studio data URLs)
- [x] Replace deprecated Next.js middleware convention with `proxy`
- [ ] Remove/archive duplicate Desktop folder `Nature-Forward-Therapy` if unused
- [ ] Draft preview for unpublished essays (admin-only)
- [ ] Persist studio covers to object storage instead of DB data URLs at scale

## Later
- [ ] Rich-text / markdown preview in article editor
- [ ] Accessibility pass on admin forms and public CTAs
- [ ] Design history UI + constrained section order (Studio advanced)
