> Companion to the upmind-agent skill /docs-corpus-audit — Upmind-monorepo-specific bindings/overrides.

Additive. These bind the generic gate, tracker, module-root, ADR designations, and identity/ceiling placeholders in the base to this repo's concrete values. Repo wins on any conflict.

## The docs-corpus gate (mechanical enforcement)

- **CI host = GitLab.** The base's "blocking CI lane on the git host" is a **blocking GitLab CI lane**, defined in `ci/docs-corpus-gate.yml`, triggered on every MR that touches `docs/**` or `packages/**/docs/foundation.md`.
- **Gate script = `ci/docs-corpus-gate.mjs`** (reports ADR-number collisions, reports missing `## Implementation Status`, EXECUTEs `capability-proof`-marked snippets + asserts the A7 request contract).
- **Selftest = `ci/docs-corpus-gate.selftest.mjs`**, proving the gate goes RED on its ≥2 known-bad fixtures and GREEN on the known-good one under `ci/fixtures/docs-corpus-gate/`.

## Module-root binding (step 1 inventory, step 5 scope)

- Per-module workshop deliverables live at **`packages/**/docs/foundation.md`**; module READMEs under **`packages/**`**. `/docs-review` (the module/foundation lane) reviews `packages/headless/src/modules/<name>/docs/foundation.md` — that is the module-level `foundation.md` the base refers to.

## Designated ADRs (step 4 Implementation-Status enforcement)

- The mechanically-enforced `## Implementation Status` ADRs are **ADR-001 and ADR-022** (per the corpus design decision record, §5). The gate fails the MR if either lacks the heading.

## Capability-proof decision record (step 5)

- The base's "repo's capability-proof decision record" is **ADR-026, Gate #3 upgrade (§5)** — the EXECUTE-clean + A7-assert requirement for capability-claiming snippets.
- **A7 auth identity, concrete:** in this repo the "auth identity" a capability read-back must assert is the **session token and acting-as headers** (e.g. a call retargeted with `.for('client', id)`) — assert the outbound request identity, never the response echo.

## KNOWN-RED baseline (step 4, Mechanical enforcement)

Against the live monorepo the gate is **expected** to fire on:

- the **three ADRs numbered `019`** (collision), and
- **ADR-001 / ADR-022 lacking `## Implementation Status`**.

This is the gate working — do **not** treat these as NEW or REGRESSED, and do **not** suppress them. Remediation (renumber the `019`s; add the headings) edits `docs/adr/**`, which this skill and its gate never touch; the operator actions it separately (design §5).

## Test-time ceiling + locale (step 5, Mechanical enforcement)

- **Ceiling = 30 minutes; locale scope = EN.** The base's "targeted specs in the primary locale, under the repo's test-time ceiling" is EN / targeted specs inside a hard 30-minute ceiling, per **ADR-021** (Testing Trophy, Agentic Workflow & Coverage Policy). Cite it; do not restate it.

## Findings mirror (step 8)

- **Issue tracker = Linear.** Post the corpus audit as a single **`save_comment`** on the corpus's tracking Linear issue. Never transition Linear labels/status — mirror findings only.
