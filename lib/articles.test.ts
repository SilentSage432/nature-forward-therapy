import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { formatPublishedDate } from "@/lib/articles";

describe("formatPublishedDate (BUILD02 cache-safe)", () => {
  const iso = "2026-11-12T01:35:02.000Z";
  const instant = new Date(iso);

  it("formats a valid Date", () => {
    const label = formatPublishedDate(instant);
    assert.notEqual(label, "");
    assert.match(label, /2026/);
    assert.match(label, /November|Nov/i);
  });

  it("formats a valid ISO timestamp string", () => {
    const label = formatPublishedDate(iso);
    assert.notEqual(label, "");
    assert.match(label, /2026/);
  });

  it("produces identical output for a Date and its equivalent ISO string", () => {
    assert.equal(formatPublishedDate(instant), formatPublishedDate(iso));
  });

  it("returns empty string for null", () => {
    assert.equal(formatPublishedDate(null), "");
  });

  it("returns empty string for undefined", () => {
    assert.equal(formatPublishedDate(undefined), "");
  });

  it("returns empty string for Invalid Date without throwing", () => {
    assert.equal(formatPublishedDate(new Date(NaN)), "");
  });

  it("returns empty string for invalid date strings without throwing", () => {
    assert.equal(formatPublishedDate("not-a-date"), "");
    assert.equal(formatPublishedDate(""), "");
  });

  it("handles JSON-deserialized unstable_cache article payloads", () => {
    // Mirrors .next/cache/fetch-cache body after JSON.parse (BUILD01 evidence).
    const cached = JSON.parse(
      JSON.stringify({
        slug: "art-of-relational-presence",
        publishedAt: instant,
        createdAt: instant,
      }),
    ) as {
      slug: string;
      publishedAt: string;
      createdAt: string;
    };

    assert.equal(typeof cached.publishedAt, "string");
    assert.equal(typeof cached.createdAt, "string");

    const label = formatPublishedDate(
      cached.publishedAt ?? cached.createdAt,
    );
    assert.equal(label, formatPublishedDate(instant));
    assert.notEqual(label, "");
  });

  it("honors publishedAt ?? createdAt fallback with string dates", () => {
    const createdIso = "2026-01-15T12:00:00.000Z";
    const withPublished = {
      publishedAt: iso as string | null,
      createdAt: createdIso,
    };
    const withoutPublished = {
      publishedAt: null as string | null,
      createdAt: createdIso,
    };

    assert.equal(
      formatPublishedDate(
        withPublished.publishedAt ?? withPublished.createdAt,
      ),
      formatPublishedDate(iso),
    );
    assert.equal(
      formatPublishedDate(
        withoutPublished.publishedAt ?? withoutPublished.createdAt,
      ),
      formatPublishedDate(createdIso),
    );
  });

  it("does not invent today's date for invalid input", () => {
    const todayLabel = formatPublishedDate(new Date());
    assert.notEqual(formatPublishedDate("garbage"), todayLabel);
    assert.equal(formatPublishedDate("garbage"), "");
  });
});
