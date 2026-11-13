import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ADMIN_CHROME_FACE_IDS,
  ALL_CURATED_FACE_IDS,
  isStudioFontSurface,
  pairingFaceIds,
  pairingRequiresGlobalCormorantUtility,
  publicDeliveryFaceIds,
  resolveDeliveryFaceIds,
  studioDeliveryFaceIds,
} from "@/lib/site-design/font-delivery";
import {
  LEGACY_FONT_FAMILY_IDS,
  SITE_FONT_FAMILY_IDS,
  SITE_TYPOGRAPHY_PAIRINGS,
} from "@/lib/site-design/typography-registry";

describe("font delivery policy (007B-PERF02)", () => {
  it("keeps admin chrome faces as Inter / Montserrat / Cormorant", () => {
    assert.deepEqual([...ADMIN_CHROME_FACE_IDS], [
      "inter",
      "montserrat",
      "cormorant-garamond",
    ]);
  });

  it("maps every pairing to valid heading/body faces", () => {
    for (const pairing of SITE_TYPOGRAPHY_PAIRINGS) {
      const faces = pairingFaceIds(pairing.id);
      assert.ok(faces.includes(pairing.headingFaceId));
      assert.ok(faces.includes(pairing.bodyFaceId));
    }
  });

  it("classic public delivery matches baseline chrome set only", () => {
    assert.deepEqual(publicDeliveryFaceIds("classic").sort(), [
      "cormorant-garamond",
      "inter",
      "montserrat",
    ]);
    assert.deepEqual(publicDeliveryFaceIds("editorial").sort(), [
      "cormorant-garamond",
      "inter",
      "montserrat",
    ]);
    assert.deepEqual(publicDeliveryFaceIds("modern").sort(), [
      "cormorant-garamond",
      "inter",
      "montserrat",
    ]);
  });

  it("includes pairing-specific faces for non-classic published designs", () => {
    const literary = publicDeliveryFaceIds("literary");
    assert.ok(literary.includes("playfair-display"));
    assert.ok(literary.includes("source-sans-3"));
    assert.ok(literary.includes("inter"));
    assert.ok(literary.includes("montserrat"));
    assert.ok(literary.includes("cormorant-garamond"));

    const contemporary = publicDeliveryFaceIds("contemporary");
    assert.ok(contemporary.includes("manrope"));
    assert.ok(contemporary.includes("dm-sans"));
    assert.equal(contemporary.includes("playfair-display"), false);
  });

  it("marks Cormorant utility requirement for pairings without serif override", () => {
    assert.equal(pairingRequiresGlobalCormorantUtility("classic"), true);
    assert.equal(pairingRequiresGlobalCormorantUtility("modern"), true);
    assert.equal(pairingRequiresGlobalCormorantUtility("soft-sans"), true);
    assert.equal(pairingRequiresGlobalCormorantUtility("contemporary"), true);
    assert.equal(pairingRequiresGlobalCormorantUtility("editorial"), false);
    assert.equal(pairingRequiresGlobalCormorantUtility("literary"), false);
  });

  it("studio delivery includes the full curated face library", () => {
    assert.deepEqual(studioDeliveryFaceIds().sort(), [...ALL_CURATED_FACE_IDS].sort());
    assert.ok(studioDeliveryFaceIds().length >= 11);
  });

  it("detects Studio surfaces including preview-frame", () => {
    assert.equal(isStudioFontSurface("/admin/studio"), true);
    assert.equal(isStudioFontSurface("/admin/studio/design"), true);
    assert.equal(isStudioFontSurface("/admin/studio/preview-frame"), true);
    assert.equal(isStudioFontSurface("/admin"), false);
    assert.equal(isStudioFontSurface("/"), false);
    assert.equal(isStudioFontSurface("/login"), false);
  });

  it("resolves public vs studio delivery from pathname + published pairing", () => {
    const publicClassic = resolveDeliveryFaceIds({
      pathname: "/",
      publishedFontFamilyId: "classic",
    });
    assert.equal(publicClassic.surface, "public");
    assert.equal(publicClassic.faceIds.length, 3);

    const studio = resolveDeliveryFaceIds({
      pathname: "/admin/studio/preview-frame",
      publishedFontFamilyId: "classic",
    });
    assert.equal(studio.surface, "studio");
    assert.equal(studio.faceIds.length, ALL_CURATED_FACE_IDS.length);

    const unknown = resolveDeliveryFaceIds({
      pathname: "/articles",
      publishedFontFamilyId: "not-a-font",
    });
    assert.equal(unknown.fontFamilyId, "classic");
  });

  it("preserves legacy pairing IDs in the delivery surface", () => {
    assert.deepEqual([...LEGACY_FONT_FAMILY_IDS], [
      "classic",
      "editorial",
      "modern",
    ]);
    for (const id of SITE_FONT_FAMILY_IDS) {
      assert.ok(publicDeliveryFaceIds(id).length >= 1);
    }
  });
});
