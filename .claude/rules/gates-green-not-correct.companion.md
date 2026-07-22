> Companion to [gates-green-not-correct.md](./gates-green-not-correct.md) — Upmind-monorepo-specific bindings/examples.

# Green gates are not correctness — Upmind bindings

## The receipt (concrete failure archetype)

The receipt is FE-2824. Right shape, right filenames, green tests, zero new capability: the staff actor was declared, every service still hardwired the session client ID, `.for('client', id)` was silently dropped, and every gate stayed green. Cosplay is gradeable-as-pass precisely because green gates measure shape, not capability.

The whole FE-2824 failure class exists because gates that grade structure can be satisfied without delivering capability.

## ADR binding

This is the correctness-coverage discipline of ADR-021 (Testing Trophy, Agentic Workflow & Coverage Policy). Cite ADR-021; do not restate it.
