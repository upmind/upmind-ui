> Companion to [core-machines.md](./core-machines.md) — Upmind-monorepo-specific bindings/examples.

# Core machines are battle-hardened (Upmind bindings)

The headless state machines and core composables are mature production code trusted by the whole product. When a test looks wrong against headless/core machine behaviour, **the test layer is presumed wrong first, not the core.**

## The sign-off law (Upmind token)

An Edit/Write under a core path requires an explicit **operator sign-off token** — the same token mechanism that unlocks a U9 core edit and a legacy-parity `Dropped`/`NOT-SUPPORTED` disposition (`legacy-parity-oracle.md`).

What "core" means is defined by the architecture ADRs, not restated here: the headless architecture (ADR-007), the XState state management layer (ADR-005), and the battle-hardened-core / test-layer-presumed-wrong doctrine of ADR-021.

## Core paths

`hooks/seat-guard.sh` (U9) mechanically enforces this rule at tool-call time: it reads the path-glob list below out of this file and denies any Edit/Write matching one absent the operator sign-off token. When this file does not enumerate globs precisely, the hook falls back to the `UPMIND_CORE_PATHS` env config, then to `core-machines.md`. The globs:

- packages/headless/**
- **/*.machine.ts
- **/machines/**

## Always-on

This rule is part of the §3.11 always-on injected law set (`agent-precedence.md` names the full set; `hooks/inject-laws.sh` injects it). It reaches every session so no core-adjacent seat can miss it.

## Why

The core is trusted by the entire product; a green-at-any-cost edit to a machine risks real regressions to make one test pass. Cite ADR-005/007/021; do not restate them.

---

## Lifted from `code-xstate.md` — "Never edit a core machine to pass a test"

(This clause belongs to the core-machines domain per the companion-naming convention, so it is folded here rather than into `code-xstate.companion.md`.)

Core/shared machines are battle-hardened. When a test disagrees with a core machine, **the test layer is presumed wrong first** — do not edit the machine to make a test go green. Core-machine edits require operator sign-off. See `rules/core-machines.md` for the full law (forward reference — that rule lands with Tranche 2; until it exists, this clause carries the design's core-machines law: presume the test layer, escalate for sign-off, never patch a core machine to green a gate).
