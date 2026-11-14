# Rendered accessibility harness (NFT-STUDIO-007C-ENG03 / FIX01)

Browser evidence for public Nature Forward Therapy routes. Complements the deterministic Studio engine (`lib/site-design/accessibility-evaluation.ts`).

## What this is / is not

- **Is:** Repeatable Playwright + axe-core checks, custom keyboard assertions, viewport/reflow probes, representative palette sampling.
- **Is not:** A WCAG conformance certificate. A green `test:a11y` run does **not** mean every sampled palette is violation-free.

## Enforcement policy (FIX01)

| Lane | Scope | Behavior |
| --- | --- | --- |
| **Enforced** | Public routes as served (published/default design, currently forest-gold) + keyboard + reflow assertions + forest-gold palette sample | Axe / landmark / name / keyboard / reflow failures **fail the suite** |
| **Advisory** | Ephemeral alternate palette × font samples | Axe runs; violations **recorded** under `tmp/a11y/` and annotations; **zero violations is valid**; never required to remain |
| **Manual review** | axe `incomplete`, true browser zoom, image-backed contrast, unsampled combinations | Reported; not a certificate |

Future **pre-publish strict** evaluation is defined in `helpers/enforcement-policy.ts` (`axeEnforcementForPrePublishCandidate`) for a later authorized tranche. It is **not** wired to Save Draft / Publish / SiteDesign writes.

## Safety

- Public GET routes only (`/`, `/articles`, `/bookshelf`; article detail only if a published link exists).
- No authentication, no Studio session, no Save Draft / Publish, no SiteDesign DB writes.
- Palette/typography sampling mutates `data-site-theme` / `data-site-font` in the browser session only.

## Run

```bash
# Policy unit tests (no browser)
npm run test:a11y:policy

# Build first, then either:

# A) Let Playwright start `next start` on :3042
npm run build
npm run test:a11y

# B) Reuse a running loopback server:
npx next start --hostname 127.0.0.1 --port 3042
A11Y_BASE_URL=http://127.0.0.1:3042 npm run test:a11y
```

Prefer a loopback `DATABASE_URL` via `.env.local`.

**Server lifecycle (STAB01):** By default Playwright starts a fresh `next start` and waits until `/articles` responds. Set `A11Y_REUSE_SERVER=1` only when intentionally reusing an existing listener. `global-setup` warms `/`, `/articles`, and `/bookshelf` before tests. Navigation requires `[data-site-theme]`; a single remount is used only if Next’s client recovery shell appears.

Artifacts (gitignored): `tmp/a11y/` including `enforcement-summary.json`, `palette-rendered-findings.json`, `stab01/` diagnostics, and per-run axe JSON.

After a browser run, read the console **A11Y HARNESS ENFORCEMENT SUMMARY** (and `tmp/a11y/enforcement-summary.json`) so advisory findings are not mistaken for a clean bill of health.
