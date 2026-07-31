> Companion to [agent-seat-separation.md](./agent-seat-separation.md) — Upmind-monorepo-specific bindings/examples.

# Seat separation — Upmind bindings

## The receipt

The self-certification archetype in the base rule is **FE-2824**: the only "staff" assertion mirrored the label it set, so it could never go red. Seat separation is the structural closure of **ADR-021**'s test-writer ≠ code-writer open item. Cite ADR-021; do not restate it.

## Repo-specific roster bindings

The base registry roster is authoritative; these bind its generic lanes to Upmind paths and issue-tracker states.

- **developer** — "protected core" is **headless core** (`packages/headless/**`, `**/*.machine.ts`, `**/machines/**`). No plugin hook guards it; protection is `permissions.deny` in `settings.json` (ADR 003). See [agent-behavior.companion.md](./agent-behavior.companion.md) §5.
- **verifier** — the base "issue-tracker comment" is a **Linear comment** (filed alongside `verify.md`).
- **pre-gate** — "block a story from advancing" means block it from reaching Linear status **Needs Review**.
- **review verdict** — the base "stays with a human" binds to `actor:Human`, per the dated amendment in [agent-orchestration.companion.md](./agent-orchestration.companion.md) §2.

## Must-fail negative-control patches — who authors them

A `*.must-fail.patch` (this repo's negative-control mutant — a unified diff that mutates PRODUCTION source and must flip a colocated test RED) straddles the two lanes: it needs the exact source line (the **developer**'s knowledge) but lives under `__tests__/` (the **prover**'s write lane). Resolve it by the seam, not by breaching either lane:

- The **developer** authors the mutant patch — it knows the line it changed, and reverting/breaking that line is a code mutation, **not** a test assertion, so it neither self-certifies (FE-2824) nor grades anything.
- The **prover** applies it blind, confirms the intended assertion goes RED, then reverts — never reading src to construct it.

Author-of-mutation ≠ verifier-of-red. A prover that reads implementation source to hand-author a must-fail patch has breached its diff-blindness (base rule §3.9); route the mutant to the developer instead. This holds for every seat map that authors negative controls — agent-run, code-wave, and the scoped-composable-factory alike.

(Incident 2026-07-31: across a factory run, three provers had to read module src to author `.must-fail.patch` files because neither seat's lane cleanly owned them; bridged by developer-authors-mutant / prover-verifies-blind.)
