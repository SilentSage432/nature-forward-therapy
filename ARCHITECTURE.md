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
| Presentation (`components/*`, `app/articles/**`, `app/bookshelf/**`) | Render only |

## RBAC
| Capability | EDITOR | DEVELOPER |
| --- | --- | --- |
| Edit profile / specialties / practice | ✓ | ✓ |
| Articles & announcement banner | ✓ | ✓ |
| Curated bookshelf | ✓ | ✓ |
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
- Style tokens: `lib/announcement-banner.ts` (theme / alignment / font helpers)
- CMS: `components/admin/AnnouncementBannerEditor.tsx` (live preview + controls)
- Public: `components/AnnouncementBanner.tsx` — dismissible only when `isDismissible`

## Design tokens
Canonical hex values live in `app/globals.css` `@theme` and are documented in `AUDIT_CATALOG.md`.
