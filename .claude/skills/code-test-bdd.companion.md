> Companion to the upmind-agent skill /code-test-bdd — Upmind-monorepo-specific bindings/overrides.

## Decision records (base "This is NOT /sdd-bdd" and "Inputs")

- The Gherkin-test-planning decision record is **ADR-020** (`docs/adr/020-gherkin-test-planning.md`). It holds the "declarative, non-executable" law and the "name the production bug or delete it" filter (base §6).
- The actor×context cells come from **ADR-001** (`docs/adr/001-scope-based-composables.md`): the actors are guest, client and staff (`ScopeActorTypes`). The parity table has one row per cell.

## Paths (base "Output")

- The module feature is co-located at `packages/headless/src/modules/<name>/__tests__/<name>.feature`. Scenario ids are `@AC-<cell><n>` (`design.md` §6).
- The traceability test is `<name>.traceability.test.ts` beside it.

## Display claims (base §6)

The headless modules have no UI. A headless scenario names an action, a guard, a transition or a state of the composable. Example of a reframed display claim: "I cannot ask to cancel while a pro-rata invoice is pending".
