> Companion to [core-machines.md](./core-machines.md) — Upmind-monorepo-specific bindings/examples.

# Core machines are battle-hardened (Upmind bindings)

**This repo declares its core battle-hardened.** The headless state machines and core composables are mature production code trusted by the whole product; when a test looks wrong against headless/core machine behaviour, **the test layer is presumed wrong first, not the core.** This is the declared maturity stance the base rule's red-test presumption is conditional on.

What "core" means here is defined by the architecture ADRs, not restated: the headless architecture (ADR-007), the XState state management layer (ADR-005), and the battle-hardened-core / test-layer-presumed-wrong doctrine of ADR-021. Cite ADR-005/007/021; do not restate them.

## Core paths (this repo's declaration)

`hooks/seat-guard.sh` (U9) enforces **these** core paths for this repo — it greps the bullets below at tool-call time and denies any Edit/Write matching one absent the operator sign-off token. The globs:

- packages/headless/**
- **/*.machine.ts
- **/machines/**
