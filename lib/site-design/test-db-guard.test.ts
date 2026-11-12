import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  assertIsolatedSiteDesignTestDatabase,
  fingerprintDatabaseUrl,
} from "@/lib/site-design/test-db-guard";

describe("SiteDesign test DB isolation guard", () => {
  it("fingerprints loopback URLs without exposing passwords", () => {
    const id = fingerprintDatabaseUrl(
      "postgresql://tester:secret@127.0.0.1:5432/nft_studio_004a_iso_1",
    );
    assert.equal(id.host, "127.0.0.1");
    assert.equal(id.database, "nft_studio_004a_iso_1");
    assert.equal(id.user, "tester");
    assert.equal(id.port, "5432");
  });

  it("rejects missing URL", () => {
    assert.throws(() => assertIsolatedSiteDesignTestDatabase(undefined), /required/i);
  });

  it("rejects Supabase pooler hosts", () => {
    assert.throws(
      () =>
        assertIsolatedSiteDesignTestDatabase(
          "postgresql://postgres.dbqprchzgfhthpxngemy:x@aws-0-ca-central-1.pooler.supabase.com:6543/postgres",
        ),
      /refuse|loopback|supabase/i,
    );
  });

  it("rejects loopback databases that are not nft_studio_004a_*", () => {
    assert.throws(
      () =>
        assertIsolatedSiteDesignTestDatabase(
          "postgresql://silentsage@127.0.0.1:5432/postgres",
        ),
      /nft_studio_004a_/i,
    );
  });

  it("accepts verified disposable loopback database names", () => {
    const id = assertIsolatedSiteDesignTestDatabase(
      "postgresql://silentsage@127.0.0.1:5432/nft_studio_004a_iso_99",
    );
    assert.equal(id.database, "nft_studio_004a_iso_99");
    assert.equal(id.host, "127.0.0.1");
  });
});
