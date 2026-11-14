import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { AxeRunSummary } from "./axe";
import {
  HARNESS_DISCLAIMER,
  buildEmptyEnforcementSummary,
  type EnforcementSummary,
} from "./enforcement-policy";

export function recordAdvisoryAxeSample(
  summary: EnforcementSummary,
  meta: {
    paletteId: string;
    fontId?: string;
    axe: AxeRunSummary;
  },
): void {
  if (meta.axe.violations.length === 0) return;
  summary.advisory.violationSamples.push({
    paletteId: meta.paletteId,
    fontId: meta.fontId,
    violationCount: meta.axe.violations.length,
    ruleIds: meta.axe.violations.map((v) => v.id),
  });
}

export function recordManualIncomplete(
  summary: EnforcementSummary,
  meta: { context: string; axe: AxeRunSummary },
): void {
  if (meta.axe.incomplete.length === 0) return;
  const rules = meta.axe.incomplete.map((i) => i.id).join(", ");
  summary.manualReview.items.push(
    `axe incomplete @ ${meta.context}: ${rules}`,
  );
}

export function markEnforcedNote(
  summary: EnforcementSummary,
  note: string,
): void {
  summary.enforced.notes.push(note);
}

export function persistEnforcementSummary(summary: EnforcementSummary) {
  const dir = path.resolve("tmp/a11y");
  mkdirSync(dir, { recursive: true });
  const file = path.join(dir, "enforcement-summary.json");
  writeFileSync(
    file,
    JSON.stringify({ ...summary, disclaimer: HARNESS_DISCLAIMER }, null, 2),
  );
  return file;
}

export function formatEnforcementConsoleSummary(
  summary: EnforcementSummary,
): string {
  const lines = [
    "=== A11Y HARNESS ENFORCEMENT SUMMARY (not a WCAG certificate) ===",
    `Enforced lane: ${summary.enforced.passed ? "PASSED" : "FAILED"}`,
    ...summary.enforced.notes.map((n) => `  - ${n}`),
    `Advisory alternate-palette samples with violations: ${summary.advisory.violationSamples.length}`,
    `  (zero advisory violations is valid: ${summary.advisory.zeroViolationsIsValid})`,
  ];
  for (const sample of summary.advisory.violationSamples) {
    lines.push(
      `  - ${sample.paletteId}${sample.fontId ? `+${sample.fontId}` : ""}: ${sample.violationCount} rule(s) [${sample.ruleIds.join(", ")}]`,
    );
  }
  if (summary.advisory.violationSamples.length === 0) {
    lines.push("  - none recorded (advisory clean is allowed)");
  }
  lines.push("Manual review required:");
  for (const item of summary.manualReview.items) {
    lines.push(`  - ${item}`);
  }
  lines.push(
    `Pre-publish strict helper available: ${summary.prePublishStrictAvailable} (wired to publish service: ${summary.prePublishStrictWiredToPublishService})`,
  );
  lines.push(summary.disclaimer);
  return lines.join("\n");
}

export function createRunEnforcementSummary(): EnforcementSummary {
  return buildEmptyEnforcementSummary();
}
