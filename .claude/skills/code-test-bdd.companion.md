> Companion to the upmind-agent skill /code-test-bdd — Upmind-monorepo-specific bindings/overrides.

Repo-specific bindings for the base doctrine. The base wording is generic; these are the
concrete values that apply in this repo. The base owns *what* a module business-logic feature
is; this binds *where* and *in what vocabulary* for this monorepo.

## Path bindings

| Base placeholder | This repo |
| --- | --- |
| Module test dir (`<module-tests-dir>`) | `packages/headless/src/modules/<name>/__tests__/` |
| The feature file | `packages/headless/src/modules/<name>/__tests__/<name>.feature` |
| The traceability test | `packages/headless/src/modules/<name>/__tests__/<name>.traceability.test.ts` (Vitest, rides the module's own suite) |
| Public barrel (contract input) | `packages/headless/src/modules/<name>/index.ts` |
| Parity table | `docs/sdd/<story>/parity.yaml` (one row per ADR-001 actor×context cell) |
| Shared feature-file style guide | `tests/features/10-feature-style.md` (declarative style — cite, don't restate) |

## Capability-id scheme (the anchor)

- Scenario tags reuse `design.md` §6 acceptance-criteria ids: `@AC-<cell><n>` —
  `@AC-A1` / `@AC-A2` / `@AC-B1` / `@AC-S1` / `@AC-12a` … plus `@AC-MATRIX` for the
  actor-matrix contract. The same id appears on the scenario, in `design.md`, and in the
  test title — one id, three places.
- Actor tags: `@client`, `@staff` (the ADR-001 actor set; there is no `@guest` cell for a
  client-identity module).
- `@todo` marks a designed capability not yet provable from the public surface — kept visible,
  never dropped. The traceability test exempts `@todo` scenarios from the coverage-hole check
  but still requires the id to exist.

## Decision-record bindings

- Actor×context capability model: **ADR-001** (`docs/adr/001-scope-based-composables.md`) — cite; the parity table's cells are ADR-001 cells.
- Non-executable Gherkin: **ADR-020** (`docs/adr/020-gherkin-test-planning.md`) — `.feature` files are spec-only, no `@cucumber/cucumber`. Applies to this class exactly as to `/sdd-bdd`'s.
- Test-layer routing (unit + integration, not e2e, for headless modules): **ADR-021**
  (`docs/adr/021-testing-pyramid-and-agentic-workflow.md`). The factory never dispatches e2e for
  these modules — the feature's capabilities are proven at unit/integration and still each earn a scenario.
- Tautology / "name the capability, not a structure" / "name the bug or delete": ADR-020;
  FE-2824 is the canonical could-never-go-red example.

## Traceability test convention + exemplar

- The traceability test parses `@AC-*` tags off the feature's scenario tag-lines and the sibling
  `*.test.ts` describe/`it` titles, and asserts both directions (no orphan scenario, no untethered test).
- **Reference implementation:** `packages/headless/src/modules/client-phone-dry/__tests__/` —
  `client-phone-dry.feature` (this artefact) + `client-phone-dry.traceability.test.ts` (the
  enforcement, negative-control-verified). Copy its shape for a new module.

## Banned-selector sweep (step 8)

A module business-logic feature must never reference a mechanic. `data-test-key` is this repo's
stable-test-id attribute:

```bash
grep -nE '(data-test-key|click |type |navigate |https?://|#[a-z]|/[a-z])' \
  packages/headless/src/modules/<name>/__tests__/<name>.feature \
  || echo "Clean: no banned mechanics"
```
