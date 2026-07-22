> Companion to [seat-separation.md](./seat-separation.md) — Upmind-monorepo-specific bindings/examples.

# Seat separation — Upmind bindings

## The receipt

The self-certification archetype in the base rule is **FE-2824**: the only "staff" assertion mirrored the label it set, so it could never go red. Seat separation is the structural closure of **ADR-021**'s test-writer ≠ code-writer open item. Cite ADR-021; do not restate it.

## Repo-specific roster bindings

The base registry roster is authoritative; these bind its generic lanes to Upmind paths and issue-tracker states.

- **developer** — "protected core" is **headless core**; the operator token gates edits to it.
- **verifier** — the base "issue-tracker comment" is a **Linear comment** (filed alongside `verify.md`).
- **pre-gate** — "block a story from advancing" means block it from reaching Linear status **Needs Review**.
- **review verdict** — the base "stays with a human" binds to `actor:Human`, per the dated amendment in `agent-labels.md`.
