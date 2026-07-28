---
paths:
  - '**/*.ts'
  - '**/*.tsx'
  - '**/*.js'
  - '**/*.mjs'
  - '**/*.css'
  - '**/*.vue'
---
> Companion to [code-reviews.md](./code-reviews.md) — Upmind-monorepo-specific bindings/examples.

## Path glob

Add `**/*.vue` to this rule's `paths` in the Upmind monorepo — Vue SFCs are in scope for review here alongside the base `.ts`/`.tsx`/`.js`/`.mjs`/`.css` globs.

## Authoring-standard pointers (Upmind flavour)

The base pointer block reads generically; in this monorepo it binds to:

- General hygiene: `code-typescript.md` + `code-quality.md` (the `@internal` barrel law, the **Lodash** state/context access rules, comments, naming).
- Composables: the codebase's **Upmind state utilities** (`stateMatches` / `useContext` / `contextValue`) and return-type export.
- UI: **Vue SFC** structure & `script setup` order, the **CVA** pattern (`.styles.ts` + `useStyles`), **Tailwind**-token discipline (no inline classes, no `<style>` blocks, no arbitrary values), and **uischema / JSONForms i18n** → `code-ui.md`.
- State machines: **XState** → `code-xstate.md`.

The module-structure example uses real Upmind file types: `AuthPage.vue`, `auth.styles.ts` (CVA styles), `auth.machine.ts` (XState).

## Review Depth Tiers — escalation thresholds

**Escalate `high` → `xhigh`** when the diff is **> 8 files, > 300 lines, or > 2 modules**, or when a behaviour-bearing module in the diff lacks unit tests (thresholds provisional — tune against real MRs); the machinery + model pins live in `/core-review` per `agent-orchestration.md` §3.
