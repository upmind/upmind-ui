> Companion to [docs-reference-register.md](./docs-reference-register.md) — Upmind-monorepo-specific bindings/examples.

# Reference & register docs — Upmind bindings

## The governing decision record

The "governing decision record" the base rule cites is **ADR-019 (Module Documentation Shape)**. Cite ADR-019; do not restate it.

## The drift incident

The base rule's warning about colliding copies of the "same" record is the concrete ADR-019 incident: **three colliding ADR-019s drifted** because the register paraphrased and duplicated the decision instead of citing it once.

## Documenter seat pointer

The seat bound by this rule is the concrete **documenter seat** (`agents/documenter.md`). The "documentation-corpus audit" that catches lying registers is `docs-corpus-audit` (see `ci/docs-corpus-gate.mjs`).

## Migration note (Wave 5)

This rule is the path-scoped home for the register half of the older `docs-modules.md` / `docs-reviews.md` / `docs-writing.md` guidance. Those files are **not** deleted — per the migration table they are folded in gradually and only fully retired in **Wave 5**. Until then, this rule is additive and wins on its scoped paths.
