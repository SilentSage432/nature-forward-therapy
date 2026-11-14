import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

export type AxeFindingSummary = {
  id: string;
  impact: string | null | undefined;
  help: string;
  helpUrl: string;
  nodes: Array<{
    target: string[];
    html: string;
    failureSummary?: string;
  }>;
};

export type AxeRunSummary = {
  kind: "automated-axe";
  route: string;
  viewport: string;
  theme?: string;
  browser: string;
  url: string;
  violations: AxeFindingSummary[];
  incomplete: AxeFindingSummary[];
  passes: number;
  disclaimer: string;
};

const DISCLAIMER =
  "axe-core findings are automated heuristics, not a WCAG conformance certificate.";

function mapNodes(
  nodes: Array<{
    target: unknown;
    html: string;
    failureSummary?: string;
  }>,
): AxeFindingSummary["nodes"] {
  return nodes.slice(0, 12).map((node) => ({
    target: (node.target as string[]).map(String),
    html: node.html.slice(0, 280),
    failureSummary: node.failureSummary,
  }));
}

export async function runAxeOnPage(
  page: Page,
  meta: { route: string; viewport: string; theme?: string },
): Promise<AxeRunSummary> {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"])
    .analyze();

  const summary: AxeRunSummary = {
    kind: "automated-axe",
    route: meta.route,
    viewport: meta.viewport,
    theme: meta.theme,
    browser: "chromium",
    url: page.url(),
    violations: results.violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      help: v.help,
      helpUrl: v.helpUrl,
      nodes: mapNodes(v.nodes),
    })),
    incomplete: results.incomplete.map((v) => ({
      id: v.id,
      impact: v.impact,
      help: v.help,
      helpUrl: v.helpUrl,
      nodes: mapNodes(v.nodes),
    })),
    passes: results.passes.length,
    disclaimer: DISCLAIMER,
  };

  return summary;
}

export function persistAxeSummary(summary: AxeRunSummary, fileStem: string) {
  const dir = path.resolve("tmp/a11y/axe");
  mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${fileStem}.json`);
  writeFileSync(file, JSON.stringify(summary, null, 2));
  return file;
}

export function formatAxeFailure(summary: AxeRunSummary): string {
  if (summary.violations.length === 0) return "";
  const lines = [
    `axe violations on ${summary.route} @ ${summary.viewport}` +
      (summary.theme ? ` theme=${summary.theme}` : "") +
      ":",
    DISCLAIMER,
  ];
  for (const v of summary.violations) {
    lines.push(`- [${v.impact ?? "unknown"}] ${v.id}: ${v.help}`);
    for (const node of v.nodes.slice(0, 3)) {
      lines.push(`    target: ${node.target.join(" ")}`);
      if (node.failureSummary) {
        lines.push(`    ${node.failureSummary.split("\n")[0]}`);
      }
    }
  }
  return lines.join("\n");
}
