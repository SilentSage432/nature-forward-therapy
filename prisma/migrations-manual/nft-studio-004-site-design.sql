-- NFT-STUDIO-004 — Additive SiteDesign persistence
--
-- SAFETY:
--   * ADDITIVE ONLY — creates two new tables.
--   * Does NOT drop, truncate, or alter existing CMS/ops tables.
--   * Does NOT write SiteDesignState rows (no automatic publish).
--   * Must NOT be applied via unrestricted `prisma db push` against production.
--
-- PREREQUISITES:
--   * PostgreSQL database already hosting Nature Forward Therapy CMS tables.
--   * Operator has confirmed this SQL against a disposable/local clone first.
--
-- APPLY (operator-authorized, non-production first):
--   psql "$DIRECT_URL" -v ON_ERROR_STOP=1 -f prisma/migrations-manual/nft-studio-004-site-design.sql
--
-- VERIFY:
--   SELECT to_regclass('public."SiteDesignState"');
--   SELECT to_regclass('public."SiteDesignVersion"');
--   \d "SiteDesignState"
--   \d "SiteDesignVersion"
--
-- ROLLBACK (only if tables are empty / unused):
--   DROP TABLE IF EXISTS "SiteDesignVersion";
--   DROP TABLE IF EXISTS "SiteDesignState";
--
-- NOTE: Prisma model names map to quoted PascalCase table names matching
-- existing schema conventions in this repository (e.g. "BlogPost").

BEGIN;

CREATE TABLE IF NOT EXISTS "SiteDesignState" (
  "id" TEXT NOT NULL,
  "key" TEXT NOT NULL DEFAULT 'default',
  "publishedJson" JSONB NOT NULL,
  "draftJson" JSONB NOT NULL,
  "publishedRevision" INTEGER NOT NULL DEFAULT 0,
  "draftRevision" INTEGER NOT NULL DEFAULT 0,
  "publishedAt" TIMESTAMP(3),
  "publishedById" TEXT,
  "publishedByEmail" TEXT,
  "draftUpdatedAt" TIMESTAMP(3),
  "draftUpdatedById" TEXT,
  "draftUpdatedByEmail" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SiteDesignState_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "SiteDesignState_key_key"
  ON "SiteDesignState"("key");

CREATE TABLE IF NOT EXISTS "SiteDesignVersion" (
  "id" TEXT NOT NULL,
  "revision" INTEGER NOT NULL,
  "snapshotJson" JSONB NOT NULL,
  "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "publishedById" TEXT NOT NULL,
  "publishedByEmail" TEXT NOT NULL,
  "note" TEXT,
  "sourceRevision" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SiteDesignVersion_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "SiteDesignVersion_revision_key"
  ON "SiteDesignVersion"("revision");

CREATE INDEX IF NOT EXISTS "SiteDesignVersion_publishedAt_idx"
  ON "SiteDesignVersion"("publishedAt" DESC);

COMMIT;
