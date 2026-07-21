> Companion to [reality-check.md](./reality-check.md) — Upmind-monorepo-specific bindings/examples.

## Identity-retargeting = scope work (the A7 clause)

In this monorepo, "identity-retargeting work" is **scope work**: a call made `.for('client', id)` on behalf of another actor. The read-back must assert:

- the **request URL retarget** (the outbound call went to the target client's resource), and
- the **auth identity transport**: which **session token** was selected and which **acting-as headers** were sent.

`.for('client', id)` is proven only when the filed proof shows the request went out as that client, with that client's headers — never the response payload alone.

## The sanctioned test-mode divergence

The single sanctioned PROD-path divergence is the **FE-2865 `useTestAttrs`** carve-out (enforced by `ci/lint-scope-purity.mjs`). No other divergence between the exercised path and the PROD path is permitted.

## Interactive read-back vehicle

`playground-composable` (`skills/playground-composable/SKILL.md`) is the accepted operator-run interactive read-back vehicle — a live playground page exercising a composable against the real thing. The filed artifact (command, output, request-contract assertion) is still the evidence (A8), not the session.

## The 30-minute ceiling

Read-backs run within the standing **30-minute** test ceiling, scoped to **EN / targeted specs** per **ADR-021** (Testing Trophy, Agentic Workflow & Coverage Policy). Cite ADR-021; do not restate it.

## Provenance

The archetype in the base rule is **FE-2824**: the client-email pilot shipped the right shape (matrix entry, filenames, green tests) while `.for('client', id)` was silently dropped — the exact failure a named read-back would have caught before "done."
