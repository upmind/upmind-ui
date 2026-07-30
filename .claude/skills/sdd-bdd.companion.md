> Companion to the upmind-agent skill /sdd-bdd — Upmind-monorepo-specific bindings/overrides.

Repo-specific bindings for the base doctrine. The base wording is generic; these are the concrete values that apply in this repo.

## Scope — this skill is CLASS 1 (e2e journeys) only

`/sdd-bdd` here owns **cross-module e2e journey** features (`@layer-e2e`, in the e2e features
tree). It does **not** author a module's co-located business-logic feature — that is a distinct
artefact class owned by **`/code-test-bdd`** (see `.claude/skills/code-test-bdd.companion.md`),
which writes a non-executable `<module>/__tests__/<module>.feature` at capability altitude with
`@AC-*` anchor tags. Never produce a module business-logic feature from this skill, and never
route an e2e journey through `/code-test-bdd`.

## Path bindings

| Base placeholder | This repo |
|------------------|-----------|
| BDD feature directory (`<features-dir>/<flow>/*.feature`) | `tests/features/<flow>/*.feature` |
| e2e spec directory (`<flow>/*.spec.ts`) | `tests/Playwright/e2e/e2e-tests/<flow>/*.spec.ts` |
| Feature-file style guide | `tests/features/10-feature-style.md` — re-read it in step 3, and verify against its PR review checklist in step 8 |
| Owning module's unit-test folder | the headless module's `__tests__/`; unit runner is Vitest |

## Decision-record binding

- The Gherkin test-planning ADR is `docs/adr/020-gherkin-test-planning.md` (**ADR-020**).
- It grounds two base rules: **"name a capability, not a structure"** and **"name the production bug or delete it"** — cite ADR-020 when applying them.
- Tautology-sweep precedent: FE-2824 (the tautological test that could never go red) is the canonical example the sweep guards against.

## Issue tracker binding

- The issue tracker is **Linear**. Fetch the ticket with the Linear MCP.
- Look for Given/When/Then AC in the Description, an Acceptance Criteria section, and comments tagged as AC.
- `@<story-id>` tags trace back to the Linear issue id (e.g. `@FE-2243`).

## Flow-folder set

The `<flow>` folder must be one of this repo's flows under `tests/features/`: `basket`, `brand-settings`, `buying-journeys`, `checkout`, `confirmation`, `domain-availability-checker`, `errors`, `login-registration`, `orders`, `products`, `tracking`. If the behaviour spans flows, pick the dominant one — never split one user journey across files.

## Stable-test-id binding

- This repo's stable-test-id attribute is `data-test-key` (paired with `data-test-value`).
- Add `data-test-key` to the banned-selector grep in step 8 — a `.feature` file must never reference it:

```bash
grep -nE '(data-test-key|click |type |navigate |#[a-z]|/[a-z])' tests/features/<flow>/<feature-name>.feature || echo "Clean: no banned selectors"
```
