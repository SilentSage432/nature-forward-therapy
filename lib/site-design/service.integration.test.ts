/**
 * NFT-STUDIO-004A — isolated PostgreSQL integration tests.
 *
 * Requires SITE_DESIGN_TEST_DATABASE_URL pointing at a verified disposable
 * loopback database named nft_studio_004a_*.
 *
 * Refuses production Supabase / unverified hosts.
 * Never uses NODE_ENV=test as proof of disposable DB identity.
 */

import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import {
  assertIsolatedSiteDesignTestDatabase,
  type IsolatedDatabaseIdentity,
} from "@/lib/site-design/test-db-guard";
import { cloneCanonicalSiteDesign } from "@/lib/site-design/defaults";
import { resolvePublishedPresentationFromRow } from "@/lib/site-design/resolve-published";
import { SITE_DESIGN_STATE_KEY } from "@/lib/site-design/types";
import { isEditor } from "@/lib/rbac";

const rawTestUrl = process.env.SITE_DESIGN_TEST_DATABASE_URL?.trim() ?? "";
const dbConfigured = rawTestUrl.length > 0;

let identity: IsolatedDatabaseIdentity | null = null;

if (dbConfigured) {
  identity = assertIsolatedSiteDesignTestDatabase(rawTestUrl);
  // Bind Prisma/service to the isolated DB before any client construction.
  process.env.DATABASE_URL = rawTestUrl;
  process.env.DIRECT_URL = rawTestUrl;
}

type ServiceModule = typeof import("@/lib/site-design/service");
type PrismaModule = typeof import("@/lib/prisma");

let service: ServiceModule;
let prismaMod: PrismaModule;

const actorA = {
  id: "actor-editor-a",
  email: "editor-a@example.test",
};
const actorB = {
  id: "actor-editor-b",
  email: "editor-b@example.test",
};

async function resetDesignTables() {
  await prismaMod.prisma.siteDesignVersion.deleteMany();
  await prismaMod.prisma.siteDesignState.deleteMany();
  await prismaMod.prisma.auditLog.deleteMany();
}

async function publicPresentationFromDb() {
  const row = await prismaMod.prisma.siteDesignState.findUnique({
    where: { key: SITE_DESIGN_STATE_KEY },
    select: { publishedJson: true, publishedRevision: true },
  });
  return resolvePublishedPresentationFromRow(row);
}

describe(
  "SiteDesign PostgreSQL integration (isolated)",
  { skip: !dbConfigured },
  () => {
    before(async () => {
      assert.ok(identity, "isolation identity missing");
      assert.equal(identity.host, "127.0.0.1");
      assert.match(identity.database, /^nft_studio_004a_/i);

      // Dynamic import after env binding so the Prisma singleton targets iso DB.
      service = await import("@/lib/site-design/service");
      prismaMod = await import("@/lib/prisma");

      // Sanity: confirm the live connection matches the disposable DB.
      const rows = await prismaMod.prisma.$queryRaw<
        Array<{ current_database: string }>
      >`SELECT current_database()`;
      assert.equal(rows[0]?.current_database, identity.database);
    });

    after(async () => {
      await resetDesignTables();
      await prismaMod.prisma.$disconnect();
    });

    describe("initialization safety", () => {
      it("A: no row → ensure creates exactly one canonical state", async () => {
        await resetDesignTables();
        const first = await service.ensureSiteDesignState();
        assert.equal(first.created, true);
        const count = await prismaMod.prisma.siteDesignState.count();
        assert.equal(count, 1);
        const row = await prismaMod.prisma.siteDesignState.findUnique({
          where: { key: SITE_DESIGN_STATE_KEY },
        });
        assert.ok(row);
        assert.equal(row.draftRevision, 0);
        assert.equal(row.publishedRevision, 0);
        assert.equal(row.publishedAt, null);
        const history = await prismaMod.prisma.siteDesignVersion.count();
        assert.equal(history, 0);
      });

      it("B: first authenticated Studio read initializes without publishing", async () => {
        await resetDesignTables();
        const workspace = await service.readSiteDesignWorkspace();
        assert.equal(workspace.ok, true);
        if (!workspace.ok) return;
        assert.equal(workspace.data.draftRevision, 0);
        assert.equal(workspace.data.publishedRevision, 0);
        assert.equal(await prismaMod.prisma.siteDesignVersion.count(), 0);
      });

      it("C/D: concurrent first reads / ensures yield a single singleton", async () => {
        await resetDesignTables();
        const results = await Promise.all(
          Array.from({ length: 12 }, () => service.ensureSiteDesignState()),
        );
        const created = results.filter((r) => r.created);
        assert.equal(created.length, 1);
        assert.equal(await prismaMod.prisma.siteDesignState.count(), 1);
        const ids = new Set(results.map((r) => r.id));
        assert.equal(ids.size, 1);
      });

      it("E: existing valid draft is never overwritten by ensure", async () => {
        await resetDesignTables();
        await service.ensureSiteDesignState();
        const mutated = cloneCanonicalSiteDesign();
        mutated.hero.focalPoint = { x: 0.22, y: 0.33 };
        const saved = await service.saveSiteDesignDraft({
          actor: actorA,
          design: mutated,
          expectedDraftRevision: 0,
        });
        assert.equal(saved.ok, true);
        const again = await service.ensureSiteDesignState();
        assert.equal(again.created, false);
        const row = await prismaMod.prisma.siteDesignState.findUnique({
          where: { key: SITE_DESIGN_STATE_KEY },
        });
        assert.equal(row?.draftRevision, 1);
        const draft = row?.draftJson as { hero?: { focalPoint?: { x: number } } };
        assert.equal(draft?.hero?.focalPoint?.x, 0.22);
      });

      it("F: existing invalid draft is preserved by Studio read", async () => {
        await resetDesignTables();
        await service.ensureSiteDesignState();
        await prismaMod.prisma.siteDesignState.update({
          where: { key: SITE_DESIGN_STATE_KEY },
          data: {
            draftJson: { schemaVersion: 99, broken: true },
          },
        });
        const before = await prismaMod.prisma.siteDesignState.findUnique({
          where: { key: SITE_DESIGN_STATE_KEY },
        });
        const workspace = await service.readSiteDesignWorkspace();
        assert.equal(workspace.ok, false);
        if (workspace.ok || workspace.code !== "INVALID_DESIGN") {
          assert.fail("expected INVALID_DESIGN");
        }
        assert.equal(workspace.code, "INVALID_DESIGN");
        const after = await prismaMod.prisma.siteDesignState.findUnique({
          where: { key: SITE_DESIGN_STATE_KEY },
        });
        assert.deepEqual(after?.draftJson, before?.draftJson);
        assert.equal(after?.draftRevision, before?.draftRevision);
      });

      it("public reads do not initialize database state", async () => {
        await resetDesignTables();
        const before = await prismaMod.prisma.siteDesignState.count();
        assert.equal(before, 0);
        const presentation = await publicPresentationFromDb();
        assert.equal(presentation.source, "canonical-default");
        assert.equal(await prismaMod.prisma.siteDesignState.count(), 0);
        assert.equal(await prismaMod.prisma.siteDesignVersion.count(), 0);
      });
    });

    describe("draft save isolation", () => {
      it("advances draft revision only; never publishes or histories", async () => {
        await resetDesignTables();
        await service.ensureSiteDesignState();
        const publishedBefore = await prismaMod.prisma.siteDesignState.findUnique({
          where: { key: SITE_DESIGN_STATE_KEY },
        });
        assert.ok(publishedBefore);

        let expected = 0;
        for (let i = 0; i < 3; i++) {
          const design = cloneCanonicalSiteDesign();
          design.hero.focalPoint = { x: 0.1 + i * 0.1, y: 0.5 };
          const result = await service.saveSiteDesignDraft({
            actor: actorA,
            design,
            expectedDraftRevision: expected,
          });
          assert.equal(result.ok, true);
          if (!result.ok) return;
          expected = result.data.draftRevision;
          assert.equal(result.data.publishedRevision, 0);
        }

        const after = await prismaMod.prisma.siteDesignState.findUnique({
          where: { key: SITE_DESIGN_STATE_KEY },
        });
        assert.equal(after?.draftRevision, 3);
        assert.equal(after?.publishedRevision, 0);
        assert.deepEqual(after?.publishedJson, publishedBefore.publishedJson);
        assert.equal(await prismaMod.prisma.siteDesignVersion.count(), 0);

        const publicView = await publicPresentationFromDb();
        assert.equal(publicView.source, "published");
        assert.equal(publicView.publishedRevision, 0);
        assert.equal(publicView.design.hero.focalPoint.x, 0.5);
      });
    });

    describe("optimistic concurrency", () => {
      it("draft conflict: exactly one concurrent save wins", async () => {
        await resetDesignTables();
        await service.ensureSiteDesignState();
        const d1 = cloneCanonicalSiteDesign();
        d1.hero.focalPoint = { x: 0.11, y: 0.5 };
        const d2 = cloneCanonicalSiteDesign();
        d2.hero.focalPoint = { x: 0.88, y: 0.5 };

        const [a, b] = await Promise.all([
          service.saveSiteDesignDraft({
            actor: actorA,
            design: d1,
            expectedDraftRevision: 0,
          }),
          service.saveSiteDesignDraft({
            actor: actorB,
            design: d2,
            expectedDraftRevision: 0,
          }),
        ]);

        const outcomes = [a, b];
        const wins = outcomes.filter((r) => r.ok);
        const conflicts = outcomes.filter(
          (r) => !r.ok && r.code === "CONFLICT",
        );
        assert.equal(wins.length, 1);
        assert.equal(conflicts.length, 1);

        const row = await prismaMod.prisma.siteDesignState.findUnique({
          where: { key: SITE_DESIGN_STATE_KEY },
        });
        assert.equal(row?.draftRevision, 1);
        assert.equal(row?.publishedRevision, 0);
      });

      it("publish conflict: exactly one concurrent publish wins", async () => {
        await resetDesignTables();
        await service.ensureSiteDesignState();
        const design = cloneCanonicalSiteDesign();
        design.hero.focalPoint = { x: 0.4, y: 0.6 };
        const saved = await service.saveSiteDesignDraft({
          actor: actorA,
          design,
          expectedDraftRevision: 0,
        });
        assert.equal(saved.ok, true);

        const [a, b] = await Promise.all([
          service.publishSiteDesign({
            actor: actorA,
            expectedDraftRevision: 1,
            expectedPublishedRevision: 0,
            note: "publish-a",
          }),
          service.publishSiteDesign({
            actor: actorB,
            expectedDraftRevision: 1,
            expectedPublishedRevision: 0,
            note: "publish-b",
          }),
        ]);

        const wins = [a, b].filter((r) => r.ok);
        const conflicts = [a, b].filter(
          (r) => !r.ok && r.code === "CONFLICT",
        );
        assert.equal(wins.length, 1);
        assert.equal(conflicts.length, 1);
        assert.equal(await prismaMod.prisma.siteDesignVersion.count(), 1);

        const row = await prismaMod.prisma.siteDesignState.findUnique({
          where: { key: SITE_DESIGN_STATE_KEY },
        });
        assert.equal(row?.publishedRevision, 1);
      });

      it("restore conflict: stale restore does not overwrite newer draft", async () => {
        await resetDesignTables();
        await service.ensureSiteDesignState();
        const d1 = cloneCanonicalSiteDesign();
        d1.hero.focalPoint = { x: 0.15, y: 0.5 };
        assert.equal(
          (
            await service.saveSiteDesignDraft({
              actor: actorA,
              design: d1,
              expectedDraftRevision: 0,
            })
          ).ok,
          true,
        );
        const published = await service.publishSiteDesign({
          actor: actorA,
          expectedDraftRevision: 1,
          expectedPublishedRevision: 0,
          note: "baseline",
        });
        assert.equal(published.ok, true);
        if (!published.ok) return;

        const versions = await service.listSiteDesignVersions();
        assert.equal(versions.length, 1);
        const versionId = versions[0].id;

        const d2 = cloneCanonicalSiteDesign();
        d2.hero.focalPoint = { x: 0.75, y: 0.25 };
        const newer = await service.saveSiteDesignDraft({
          actor: actorA,
          design: d2,
          expectedDraftRevision: 1,
        });
        assert.equal(newer.ok, true);
        if (!newer.ok) return;

        const stale = await service.restoreSiteDesignVersionToDraft({
          actor: actorB,
          versionId,
          expectedDraftRevision: 1, // stale — actual is 2
        });
        assert.equal(stale.ok, false);
        if (stale.ok) return;
        assert.equal(stale.code, "CONFLICT");

        const row = await prismaMod.prisma.siteDesignState.findUnique({
          where: { key: SITE_DESIGN_STATE_KEY },
        });
        assert.equal(row?.draftRevision, 2);
        const draft = row?.draftJson as { hero?: { focalPoint?: { x: number } } };
        assert.equal(draft?.hero?.focalPoint?.x, 0.75);
        assert.equal(row?.publishedRevision, 1);
      });
    });

    describe("atomic publishing", () => {
      it("validates, updates published state, appends history, attributes", async () => {
        await resetDesignTables();
        await service.ensureSiteDesignState();
        const design = cloneCanonicalSiteDesign();
        design.hero.focalPoint = { x: 0.31, y: 0.41 };
        assert.equal(
          (
            await service.saveSiteDesignDraft({
              actor: actorA,
              design,
              expectedDraftRevision: 0,
            })
          ).ok,
          true,
        );

        const result = await service.publishSiteDesign({
          actor: actorA,
          expectedDraftRevision: 1,
          expectedPublishedRevision: 0,
          note: "atomic-ok",
        });
        assert.equal(result.ok, true);
        if (!result.ok) return;
        assert.equal(result.data.publishedRevision, 1);
        assert.ok(result.data.versionId);

        const row = await prismaMod.prisma.siteDesignState.findUnique({
          where: { key: SITE_DESIGN_STATE_KEY },
        });
        assert.equal(row?.publishedRevision, 1);
        assert.equal(row?.publishedByEmail, actorA.email);
        assert.equal(row?.publishedById, actorA.id);
        assert.ok(row?.publishedAt);

        const version = await prismaMod.prisma.siteDesignVersion.findUnique({
          where: { revision: 1 },
        });
        assert.ok(version);
        assert.equal(version.publishedByEmail, actorA.email);
        assert.equal(version.note, "atomic-ok");
      });

      it("A: snapshot insertion failure rolls back publication", async () => {
        await resetDesignTables();
        await service.ensureSiteDesignState();
        const design = cloneCanonicalSiteDesign();
        assert.equal(
          (
            await service.saveSiteDesignDraft({
              actor: actorA,
              design,
              expectedDraftRevision: 0,
            })
          ).ok,
          true,
        );

        // Poison unique revision slot that publish would attempt (revision 1).
        await prismaMod.prisma.siteDesignVersion.create({
          data: {
            revision: 1,
            snapshotJson: cloneCanonicalSiteDesign(),
            publishedById: "poison",
            publishedByEmail: "poison@example.test",
          },
        });

        const failed = await service.publishSiteDesign({
          actor: actorA,
          expectedDraftRevision: 1,
          expectedPublishedRevision: 0,
          note: "should-fail",
        });
        assert.equal(failed.ok, false);
        if (failed.ok) return;
        assert.equal(failed.code, "ERROR");
        assert.match(failed.message, /transaction failed|partial publication/i);

        const row = await prismaMod.prisma.siteDesignState.findUnique({
          where: { key: SITE_DESIGN_STATE_KEY },
        });
        assert.equal(row?.publishedRevision, 0);
        assert.equal(row?.publishedAt, null);
        assert.equal(await prismaMod.prisma.siteDesignVersion.count(), 1);
        const audits = await prismaMod.prisma.auditLog.findMany({
          where: { action: "PUBLISH_SITE_DESIGN" },
        });
        assert.equal(audits.length, 0);
      });

      it("B: stale published revision returns CONFLICT with no partial publish", async () => {
        await resetDesignTables();
        await service.ensureSiteDesignState();
        assert.equal(
          (
            await service.saveSiteDesignDraft({
              actor: actorA,
              design: cloneCanonicalSiteDesign(),
              expectedDraftRevision: 0,
            })
          ).ok,
          true,
        );
        assert.equal(
          (
            await service.publishSiteDesign({
              actor: actorA,
              expectedDraftRevision: 1,
              expectedPublishedRevision: 0,
            })
          ).ok,
          true,
        );

        const stale = await service.publishSiteDesign({
          actor: actorB,
          expectedDraftRevision: 1,
          expectedPublishedRevision: 0,
        });
        assert.equal(stale.ok, false);
        if (stale.ok) return;
        assert.equal(stale.code, "CONFLICT");
        assert.equal(await prismaMod.prisma.siteDesignVersion.count(), 1);
      });

      it("C: invalid draft rejects publish and preserves raw JSON", async () => {
        await resetDesignTables();
        await service.ensureSiteDesignState();
        const invalid = { schemaVersion: 1, theme: { presetId: "not-a-theme" } };
        await prismaMod.prisma.siteDesignState.update({
          where: { key: SITE_DESIGN_STATE_KEY },
          data: {
            draftJson: invalid,
            draftRevision: 1,
          },
        });

        const result = await service.publishSiteDesign({
          actor: actorA,
          expectedDraftRevision: 1,
          expectedPublishedRevision: 0,
        });
        assert.equal(result.ok, false);
        if (result.ok) return;
        assert.equal(result.code, "INVALID_DESIGN");

        const row = await prismaMod.prisma.siteDesignState.findUnique({
          where: { key: SITE_DESIGN_STATE_KEY },
        });
        assert.deepEqual(row?.draftJson, invalid);
        assert.equal(row?.publishedRevision, 0);
        assert.equal(await prismaMod.prisma.siteDesignVersion.count(), 0);
      });
    });

    describe("invalid-design recovery", () => {
      it("PUBLIC: malformed published JSON falls back without DB writes", async () => {
        await resetDesignTables();
        await service.ensureSiteDesignState();
        await prismaMod.prisma.siteDesignState.update({
          where: { key: SITE_DESIGN_STATE_KEY },
          data: {
            publishedJson: { schemaVersion: 99 },
            publishedRevision: 3,
          },
        });
        const before = await prismaMod.prisma.siteDesignState.findUnique({
          where: { key: SITE_DESIGN_STATE_KEY },
        });
        const presentation = await publicPresentationFromDb();
        assert.equal(presentation.source, "fallback");
        assert.equal(presentation.themePresetId, "forest-gold");
        assert.equal(presentation.design.theme.presetId, "forest-gold");
        const after = await prismaMod.prisma.siteDesignState.findUnique({
          where: { key: SITE_DESIGN_STATE_KEY },
        });
        assert.deepEqual(after?.publishedJson, before?.publishedJson);
        assert.equal(after?.publishedRevision, 3);
      });

      it("STUDIO: INVALID_DESIGN preserves raw docs across repeated reads", async () => {
        await resetDesignTables();
        await service.ensureSiteDesignState();
        const badDraft = { nope: true };
        const badPublished = { schemaVersion: "x" };
        await prismaMod.prisma.siteDesignState.update({
          where: { key: SITE_DESIGN_STATE_KEY },
          data: {
            draftJson: badDraft,
            publishedJson: badPublished,
          },
        });

        for (let i = 0; i < 3; i++) {
          const workspace = await service.readSiteDesignWorkspace();
          assert.equal(workspace.ok, false);
          if (workspace.ok || workspace.code !== "INVALID_DESIGN") {
            assert.fail("expected INVALID_DESIGN");
          }
          assert.deepEqual(workspace.data.rawDraftJson, badDraft);
          assert.deepEqual(workspace.data.rawPublishedJson, badPublished);
        }

        const row = await prismaMod.prisma.siteDesignState.findUnique({
          where: { key: SITE_DESIGN_STATE_KEY },
        });
        assert.deepEqual(row?.draftJson, badDraft);
        assert.deepEqual(row?.publishedJson, badPublished);
      });
    });

    describe("audit consistency", () => {
      it("successful draft/publish/restore write audits; failures do not", async () => {
        await resetDesignTables();
        await service.ensureSiteDesignState();

        const saved = await service.saveSiteDesignDraft({
          actor: actorA,
          design: cloneCanonicalSiteDesign(),
          expectedDraftRevision: 0,
        });
        assert.equal(saved.ok, true);

        const conflict = await service.saveSiteDesignDraft({
          actor: actorB,
          design: cloneCanonicalSiteDesign(),
          expectedDraftRevision: 0,
        });
        assert.equal(conflict.ok, false);

        const published = await service.publishSiteDesign({
          actor: actorA,
          expectedDraftRevision: 1,
          expectedPublishedRevision: 0,
          note: "audited-publish",
        });
        assert.equal(published.ok, true);
        if (!published.ok) return;

        const versions = await service.listSiteDesignVersions();
        const restored = await service.restoreSiteDesignVersionToDraft({
          actor: actorA,
          versionId: versions[0].id,
          expectedDraftRevision: 1,
        });
        assert.equal(restored.ok, true);

        const invalidPublish = await service.publishSiteDesign({
          actor: actorA,
          expectedDraftRevision: 999,
          expectedPublishedRevision: 1,
        });
        assert.equal(invalidPublish.ok, false);

        const audits = await prismaMod.prisma.auditLog.findMany({
          orderBy: { createdAt: "asc" },
        });
        const actions = audits.map((a) => a.action);
        assert.deepEqual(actions, [
          "UPDATE_SITE_DESIGN_DRAFT",
          "PUBLISH_SITE_DESIGN",
          "RESTORE_SITE_DESIGN_DRAFT",
        ]);
        assert.ok(
          audits.every((a) => a.userEmail === actorA.email),
          "failed ops must not attribute success audits to the loser",
        );

        const publishAudit = audits.find(
          (a) => a.action === "PUBLISH_SITE_DESIGN",
        );
        assert.ok(publishAudit?.newState?.includes('"publishedRevision":1'));
      });
    });

    describe("cache invalidation contract", () => {
      it("draft save and restore do not require revalidation; publish reports failure safely outside Next runtime", async () => {
        await resetDesignTables();
        await service.ensureSiteDesignState();
        assert.equal(
          (
            await service.saveSiteDesignDraft({
              actor: actorA,
              design: cloneCanonicalSiteDesign(),
              expectedDraftRevision: 0,
            })
          ).ok,
          true,
        );

        const published = await service.publishSiteDesign({
          actor: actorA,
          expectedDraftRevision: 1,
          expectedPublishedRevision: 0,
          note: "revalidate-path",
        });
        assert.equal(published.ok, true);
        if (!published.ok) return;

        // Outside a Next.js request context, revalidateTag typically throws.
        // Publication must remain committed and the response must not claim rollback.
        assert.equal(await prismaMod.prisma.siteDesignVersion.count(), 1);
        const row = await prismaMod.prisma.siteDesignState.findUnique({
          where: { key: SITE_DESIGN_STATE_KEY },
        });
        assert.equal(row?.publishedRevision, 1);

        if (published.data.revalidation === "failed") {
          assert.ok(published.data.revalidationError);
          assert.match(
            published.message ?? "",
            /revalidation failed|cache flush/i,
          );
        } else {
          assert.equal(published.data.revalidation, "ok");
        }

        const versions = await service.listSiteDesignVersions();
        const restored = await service.restoreSiteDesignVersionToDraft({
          actor: actorA,
          versionId: versions[0].id,
          expectedDraftRevision: 1,
        });
        assert.equal(restored.ok, true);
        // Restore must not invent a second published snapshot.
        assert.equal(await prismaMod.prisma.siteDesignVersion.count(), 1);
        assert.equal(
          (
            await prismaMod.prisma.siteDesignState.findUnique({
              where: { key: SITE_DESIGN_STATE_KEY },
            })
          )?.publishedRevision,
          1,
        );
      });
    });

    describe("authorization helpers (role matrix)", () => {
      it("EDITOR and DEVELOPER pass isEditor; others do not", () => {
        assert.equal(isEditor("EDITOR"), true);
        assert.equal(isEditor("DEVELOPER"), true);
        assert.equal(isEditor(undefined), false);
        assert.equal(isEditor(null), false);
      });
    });
  },
);

describe("SiteDesign DB integration gate", () => {
  it("documents skip when SITE_DESIGN_TEST_DATABASE_URL is unset", () => {
    if (!dbConfigured) {
      assert.ok(
        true,
        "Integration suite skipped — set SITE_DESIGN_TEST_DATABASE_URL to a verified nft_studio_004a_* loopback DB.",
      );
      return;
    }
    assert.ok(identity);
    assert.equal(identity.host, "127.0.0.1");
  });
});
