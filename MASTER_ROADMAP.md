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

## Near-term
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
