---
paths:
  - '**/*.machine.ts'
  - '**/*.machine.*.ts'
---
> Companion to [code-xstate.md](./code-xstate.md) — Upmind-monorepo-specific bindings.

## Our machines are battle-hardened

The headless state machines and core composables (`packages/headless/**`, `**/*.machine.ts`, `**/machines/**`) are mature production code trusted by the whole product. When a test disagrees with one of these machines, **the test layer is presumed wrong first, not the machine.** Never edit a headless/core machine to make a test pass — diagnose the test/fixture/caller, and if the evidence genuinely points at the machine, **stop and ask the operator** before touching it.
