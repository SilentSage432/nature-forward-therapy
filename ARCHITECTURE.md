# Architecture — Nature-Forward Therapy

## Stack
- **Next.js 16** App Router (React 19, TypeScript)
- **Tailwind CSS v4** (`@import "tailwindcss"` + `@theme` in `app/globals.css`)
- **Prisma 6 + PostgreSQL** for CMS persistence
- **Auth.js (next-auth v5)** credentials provider, JWT sessions

## Request flow
```
Browser
  ├─ /                 → getSiteContent() + getActiveAnnouncement() → sections
  ├─ /articles         → getPublishedArticles() → Publication Hub
  ├─ /articles/[slug]  → getPublishedArticleBySlug() → reading room
  ├─ /login            → credentials sign-in
  ├─ /admin/*          → proxy auth + RBAC → editor UI → actions /api/cms/*
  └─ /api/auth/*       → Auth.js handlers
```

## CMS collections
1. **PractitionerProfile** — identity, bio, imagery URLs, booking links  
2. **Specialty** — card title/icon/description  
3. **FocusTag** — gold pill labels  
4. **Insurance** — accepted carriers  
5. **PracticeDetail** — JSON lists for expertise, payments, therapy types, process steps  
6. **SiteConfig** — title/description (developer)  
7. **BlogPost** — essays (title, slug, excerpt, content, category, cover, publish state)  
8. **AnnouncementBanner** — site-wide top strip (text, optional link, isActive)  
9. **User** — email, password hash, role

## Ownership
| System | Responsibility |
| --- | --- |
| `lib/articles.ts` | Article/banner reads, slug/read-time helpers |
| `lib/actions/articles.ts` | Essay create/update/delete |
| `lib/actions/announcements.ts` | Banner upsert |
| `lib/content.ts` | Landing-page site content composition |
| Presentation (`components/*`, `app/articles/**`) | Render only |

## RBAC
| Capability | EDITOR | DEVELOPER |
| --- | --- | --- |
| Edit profile / specialties / practice | ✓ | ✓ |
| Articles & announcement banner | ✓ | ✓ |
| Manage users | | ✓ |
| Site settings / footer credit | | ✓ |
| Raw env / schema (repo access) | | ✓ (outside app) |

## Force-password flow
1. Seed/editor login with `mustChangePassword: true` → admin layout mounts `ForcePasswordModal`.
2. `POST /api/user/change-password` hashes password and sets DB `mustChangePassword: false`.
3. Client calls `update({ mustChangePassword: false })` so the JWT callback patches the token.
4. Hard navigate to `/admin` so the server layout re-reads the updated session (avoid `router.refresh()` race).

## Design tokens
Canonical hex values live in `app/globals.css` `@theme` and are documented in `AUDIT_CATALOG.md`.
