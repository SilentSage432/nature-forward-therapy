# Chat Handoff — Nature-Forward Therapy

## Current state
Next.js App Router site with Prisma/Postgres CMS and Auth.js RBAC is implemented and builds cleanly. Public footer shows Flock of Fox branding + copyright (no SAGE Federation credit line). EDITOR dashboard includes practice webmail and a developer support request form.

## How to run
```bash
npm install
npm run db:setup
npm run dev
```

Public site: `http://localhost:3000`  
CMS login: `http://localhost:3000/login`  
Admin: `http://localhost:3000/admin`

### Seeded accounts (from `.env` / `.env.example`)
| Role | Email | Password |
| --- | --- | --- |
| Developer | `dev@flockoffox.org` | `ChangeMeDev!` |
| Editor | `nicolegarcia@flockoffox.org` | `ChangeMeEditor!` |

Database: PostgreSQL via `DATABASE_URL` (pooler) + `DIRECT_URL` (migrations).

## Ownership map
| Concern | Owner |
| --- | --- |
| Public presentation | `components/*`, `app/page.tsx` |
| Design tokens | `app/globals.css` `@theme` |
| Content reads | `lib/content.ts` |
| Auth / sessions | `lib/auth.ts`, `proxy.ts` |
| RBAC rules | `lib/rbac.ts` |
| CMS mutations | `app/api/cms/**` |
| Schema / seed | `prisma/schema.prisma`, `prisma/seed.ts` |

## Editor vs developer
- **Editor:** profile, specialties, practice details (bio, insurance, booking URLs, etc.).
- **Developer:** everything editors can do, plus users, site title/description, footer credit.

## Do not regress
- Keep audit color hex values exact.
- Public page must remain a single-page composition with in-page anchors.
- Editors must not reach `/admin/users` or `/admin/settings`.
