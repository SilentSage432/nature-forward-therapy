/**
 * Authorization boundary checks for site-design server actions.
 *
 * Tests the pure resolveDesignActor gate with synthetic sessions.
 * Full Auth.js cookie/session integration against a live Next server is
 * DEFERRED (requires request-scoped auth plumbing).
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveDesignActor } from "@/lib/site-design/actor";
import { isEditor } from "@/lib/rbac";

describe("site-design action authorization", () => {
  it("denies unauthenticated sessions", () => {
    assert.equal(resolveDesignActor(null), null);
    assert.equal(resolveDesignActor({ user: undefined }), null);
  });

  it("denies non-editor roles", () => {
    assert.equal(
      resolveDesignActor({
        user: {
          id: "u-viewer",
          email: "viewer@example.test",
          role: "VIEWER",
        },
      }),
      null,
    );
    assert.equal(isEditor("VIEWER" as never), false);
  });

  it("denies EDITOR sessions missing id or email", () => {
    assert.equal(
      resolveDesignActor({
        user: { role: "EDITOR", email: null, id: "x" },
      }),
      null,
    );
    assert.equal(
      resolveDesignActor({
        user: { role: "EDITOR", email: "ed@example.test" },
      }),
      null,
    );
  });

  it("allows EDITOR and DEVELOPER with id + email", () => {
    assert.deepEqual(
      resolveDesignActor({
        user: {
          id: "ed-1",
          email: "editor@example.test",
          role: "EDITOR",
        },
      }),
      { id: "ed-1", email: "editor@example.test" },
    );
    assert.deepEqual(
      resolveDesignActor({
        user: {
          id: "dev-1",
          email: "dev@example.test",
          role: "DEVELOPER",
        },
      }),
      { id: "dev-1", email: "dev@example.test" },
    );
    assert.equal(isEditor("EDITOR"), true);
    assert.equal(isEditor("DEVELOPER"), true);
  });
});
