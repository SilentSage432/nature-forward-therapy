# Architecture — Nature-Forward Therapy

## Stack
- **Next.js 16** App Router (React 19, TypeScript)
- **Tailwind CSS v4** (`@import "tailwindcss"` + `@theme` in `app/globals.css`)
- **Prisma 6 + SQLite** for CMS persistence
- **Auth.js (next-auth v5)** credentials provider, JWT sessions

## Request flow
```
Browser
  ├─ /                 → server page loads getSiteContent() → section components
  ├─ /login            → credentials sign-in
  ├─ /admin/*          → middleware auth + RBAC → editor UI → /api/cms/*
  └─ /api/auth/*       → Auth.js handlers
```

## CMS collections
1. **PractitionerProfile** — identity, bio, imagery URLs, booking links  
2. **Specialty** — card title/icon/description  
3. **FocusTag** — gold pill labels  
4. **PracticeDetails** — JSON lists for expertise, payments, insurance, therapy types, process steps  
5. **SiteConfig** — title/description (developer)  
6. **User** — email, password hash, role

## RBAC
| Capability | EDITOR | DEVELOPER |
| --- | --- | --- |
| Edit profile / specialties / practice | ✓ | ✓ |
| Manage users | | ✓ |
| Site settings / footer credit | | ✓ |
| Raw env / schema (repo access) | | ✓ (outside app) |

## Design tokens
Canonical hex values live in `app/globals.css` `@theme` and are documented in `AUDIT_CATALOG.md`.
