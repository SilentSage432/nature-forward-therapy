# NFT-STUDIO-004 — Additive SiteDesign Migration Plan

**Status:** Applied to production in NFT-STUDIO-004D (additive only; empty tables; no seed/publish).
**Note:** Do not re-run destructively. `CREATE IF NOT EXISTS` makes a careful re-apply idempotent, but prefer verify-first.
## Intended SQL changes

File: `prisma/migrations-manual/nft-studio-004-site-design.sql`

Creates only:

1. `"SiteDesignState"` — singleton draft + published JSON + revision counters + attribution timestamps
2. `"SiteDesignVersion"` — append-only published snapshots (`revision` unique)

Indexes:

- unique `"SiteDesignState"("key")`
- unique `"SiteDesignVersion"("revision")`
- `"SiteDesignVersion"("publishedAt" DESC)`

No CMS tables are altered. No seed rows are inserted (no automatic publish).

## Expected database prerequisites

- PostgreSQL already hosting Nature Forward Therapy tables
- Operator confirmed disposable/local clone before production
- Prisma schema models `SiteDesignState` / `SiteDesignVersion` match this SQL
- Do **not** use unrestricted `prisma db push` against production (extra tables exist outside Prisma)

## Verification queries

```sql
SELECT to_regclass('public."SiteDesignState"');
SELECT to_regclass('public."SiteDesignVersion"');

SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name IN ('SiteDesignState', 'SiteDesignVersion')
ORDER BY table_name, ordinal_position;

SELECT indexname FROM pg_indexes
WHERE tablename IN ('SiteDesignState', 'SiteDesignVersion');
```

## Safe application procedure

1. Apply against an isolated disposable database first.
2. Run `prisma generate` + app typecheck/build against that DB.
3. Smoke: ensure public home still renders with no `SiteDesignState` row (canonical default).
4. Smoke: `ensureSiteDesignState` / draft save / publish / history against disposable DB.
5. Only after operator authorization: apply the same SQL to production via `psql` with `ON_ERROR_STOP`.
6. Deploy application that reads the new tables after (or atomically with) the SQL apply.

## Rollback considerations

If tables are empty / unused:

```sql
DROP TABLE IF EXISTS "SiteDesignVersion";
DROP TABLE IF EXISTS "SiteDesignState";
```

Do not drop if published history must be retained. Prefer forward fix.

## Existing data preservation

- No `UPDATE` / `DELETE` / `ALTER` on existing CMS tables
- No automatic insertion of design rows at migration time
- Public site continues to use canonical default until a row exists / is published

## Local verification status

**VERIFIED** in NFT-STUDIO-004A against disposable Homebrew PostgreSQL on `127.0.0.1` (`nft_studio_004a_iso_*` only). Manual SQL applied solely to that isolated database. Production Supabase was not migrated and received no writes from this tranche.

Integration command:

```bash
SITE_DESIGN_TEST_DATABASE_URL='postgresql://USER@127.0.0.1:5432/nft_studio_004a_iso_NNN' \
  npm run test:site-design:db
```

The guard in `lib/site-design/test-db-guard.ts` refuses Supabase hosts and any database name not matching `nft_studio_004a_*`. `NODE_ENV=test` alone is never accepted as proof of isolation.
