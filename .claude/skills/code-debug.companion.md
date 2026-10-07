> Companion to the upmind-agent skill /code-debug — Upmind-monorepo-specific bindings/overrides.

## Protected machines (base laws 2–3)

The base asks the repo to name the machines it treats as protected. Here they are the headless state machines and core composables: `packages/headless/**`, `**/*.machine.ts` and `**/machines/**`. They are mature production code that the whole product trusts.

- When a test disagrees with one of them, the test, fixture or caller is presumed wrong first (base law 2).
- Never edit one to make a test pass. If the evidence points at the machine, stop and ask the operator (base law 3).

The developer and planner seats and `/code-refactor` read this list too.
