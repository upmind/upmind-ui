---
paths:
  - '**/*.ts'
  - '**/*.tsx'
  - '**/*.js'
  - '**/*.mjs'
  - '**/*.css'
  - '**/*.vue'
---
> Companion to `code-reviews.md` — Upmind-monorepo bindings.

## Authoring-standard pointers

- General hygiene: `code-typescript.md` + `code-quality.md` (`@internal` barrel law, Lodash, comments, naming).
- Composables: the Upmind state utilities (`stateMatches` / `useContext` / `contextValue`) and return-type export.
- UI: Vue SFC structure, `script setup` order, Tailwind-token discipline, uischema `i18n` → `code-ui.md` and its companion.
- State machines: XState → `code-xstate.md`.

## Variance-law cues (headless modules)

For diffs under `packages/headless/src/modules/**`, hold the diff to the variance law in `code-composables.companion.md`. The `scope-based/*` ESLint rules report clauses 2, 4 and 5 mechanically; clauses 1 and 3 are this review's judgment. A deviation without a complete `@decision` is 🔴 Blocker; one with a complete `@decision` passes and is surfaced.

Pre-existing unscoped module structure grades 🟡 Suggestion only. 🔴 applies solely to a diff that adds or modifies scoped structure (a new or edited `.{actor}.ts`, `.actions.ts`, `.meta.ts`, `.context.ts`, `.services.ts`, `.schemas.ts` arm), never to a module simply staying unscoped, and never to a bare `.as(actor)` call site.

## Review depth — escalation

Escalate `high` → `xhigh` when the diff is > 8 files, > 300 lines, or > 2 modules, or when a behaviour-bearing module in the diff lacks unit tests. Machinery and model pins: `/code-review` per `agent-orchestration.md` §3.
