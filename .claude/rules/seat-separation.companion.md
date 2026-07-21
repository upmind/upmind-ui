> Companion to [seat-separation.md](./seat-separation.md) — Upmind-monorepo-specific bindings/examples.

# Seat separation — Upmind bindings

## The receipt

The self-certification archetype in the base rule is **FE-2824**: the only "staff" assertion mirrored the label it set, so it could never go red. Seat separation is the structural closure of **ADR-021**'s test-writer ≠ code-writer open item. Cite ADR-021; do not restate it.

## Concrete seat registry (Upmind lanes)

| Seat | Concrete write lane | Concrete reads | Concrete never |
|------|--------|-------|-----------|
| planner | `docs/sdd/**` only | everything | write src/tests/docs outside `docs/sdd` |
| developer | src (non-core) | everything | write tests/docs; edit **headless core** without an operator token |
| prover | test dirs only | design.md, Gherkin, parity table, public surface (exported types/signatures) | receive the diff or the builder's hand-off report (**§3.9**) |
| reviewer | nothing (text-only) | everything | edit anything; approve without filed evidence; emit a review verdict (pre-gate only) |
| verifier | `verify.md` + Linear comment | everything + targeted execution | accept filed logs as proof; match on paths/SHAs/filenames; return PRESENT under uncertainty |
| documenter | docs only | everything | certify capability the verifier did not confirm |
| **pseudo-nathan** | nothing | everything | Edit/Write (tool-restricted at declaration) |

The review **verdict** stays `actor:Human` per the dated amendment in `agent-labels.md`.

## Machinery names

- Seat transport env var: `UPMIND_SEAT` (set by the spawning skill per the team map).
- Guard hook: `hooks/seat-guard.sh` — reads only the transport, never `tool_input` or prose.
- Lifecycle-orchestration entrypoints that set the lifecycle-context marker: `agent-run`, `agent-queue`, `code-wave`.

## Universal protections that still apply outside a lifecycle context

- U9 core-machines sign-off per `core-machines.md`.
- The graphify (knowledge-graph) gate.
- The operator outranks the machinery per `agent-precedence.md`.

## Always-on set

This rule is part of the **§3.11** always-on injected law set; `agent-precedence.md` names the full set.
