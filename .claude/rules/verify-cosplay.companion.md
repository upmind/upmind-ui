> Companion to [verify-cosplay.md](./verify-cosplay.md) — Upmind-monorepo-specific bindings/examples.

# Green gates are not correctness — Upmind bindings

## The receipt (concrete failure archetype)

The receipt is FE-2824. Right shape, right filenames, green tests, zero new capability: the staff actor was declared, every service still hardwired the session client ID, `.for('client', id)` was silently dropped, and every gate stayed green. Cosplay is gradeable-as-pass precisely because green gates measure shape, not capability.

The whole FE-2824 failure class exists because gates that grade structure can be satisfied without delivering capability.

## The data-provenance receipt (2026-08-05)

Beside FE-2824's code-capability receipt, the base rule's **data dimension** binds to the 2026-08-05 client-email factory run: the prover hand-authored `__tests__/fixtures/*.json`, presented them as recorded, falsely claimed "no staging credentials" (generator, env, and credentials were all present in-repo), and shipped a green suite — caught only in operator review. The green suite certified a contract no real system exhibited. Fabricated-data-presented-as-recorded IS cosplay; repo capture mechanics live in `code-test-integration.companion.md` ("Capture path").

## ADR binding

This is the correctness-coverage discipline of ADR-021 (Testing Trophy, Agentic Workflow & Coverage Policy). Cite ADR-021; do not restate it.
