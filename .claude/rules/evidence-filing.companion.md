> Companion to [evidence-filing.md](./evidence-filing.md) — Upmind-monorepo-specific bindings/examples.

## Law code and always-on status

The base rule is law **A8** ("evidence is executable or it is decoration"), part of the §3.11 always-on injected law set (`agent-precedence.md` names the full set; `hooks/inject-laws.sh` injects it). It reaches every session.

## Evidence location

The project's evidence location is **`docs/sdd/<ID>/evidence/`** (one folder per Linear ticket). The filing layout, artifact format, and directory conventions are specified in [`templates/sdd/evidence/README.md`](../templates/sdd/evidence/README.md) — read that file for the exact shape; do not duplicate it. The design/spec side of the same `docs/sdd/<ID>/` tree is governed by `design-thinking.md` (+ companion).

## Enforcement gate

The "ready-for-review gate" is **U7**, which **blocks the Needs Review state** absent conforming evidence. U7 itself is owned by `ci/` and `hooks/`; this rule only states the law U7 enforces.

## Provenance (FE-2824) and ADR

- The provenance is the **FE-2824** class this plugin's other anti-cosplay rules cite: paperwork that looked complete while the capability behind it was absent.
- This is the evidence discipline of **ADR-021** (Testing Trophy, Agentic Workflow & Coverage Policy) applied to every filed proof. Cite ADR-021; do not restate it.

## Mutation-lane cross-reference

Negative-control mutant patches are a specialised case of this same discipline: their commit-and-CI-replay mechanics are governed by `rules/negative-controls.md` and enforced by the mutation lane under `ci/negative-control-enforce.*` — cite both, do not restate or touch either. This rule closes the evidence gap generally the way `negative-controls.md` closes it specifically for mutation-tested negative controls.
