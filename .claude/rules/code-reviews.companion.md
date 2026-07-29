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

## Variance-law cues (headless modules)

For diffs under `packages/headless/src/modules/**`, hold the diff to the variance law bound in `code-composables.companion.md` — cite it, never restate it here.

- **Clause 2 (armless-fresh / arm-only-for-exclusive-members):** the tell is a new `.{actor}.ts` file, or one gaining a member, that carries nothing exclusive to or overriding the shared factory — an arm scaffolded rather than earned.
- **Clause 4 (`.as('self')` builder-owned):** the tell is a SELF branch — a `case ScopeActorTypes.SELF` or a comparison against it — inside a module's own factory or services file. A consumer's `.as('self')` call site and an `as const` scope-matrix computed key are the documented API: the `scope-based/no-self-branch` ESLint rule reports only branch positions and ignores call sites and matrix keys, so a call site is surfaced, never 🔴.
- **Clause 5 (`@decision`):** the tell is a `@decision` block missing any field clause 5 requires; the required set and verdict are clause 5's (cited, not restated here). `scope-based/require-decision` reports this mechanically.
- **Clauses 1 and 3** are already covered by base Part B, not delta-only: a non-uniform four-layer return across actors, or an arm carrying a member the shared implementation already serves, are judgement calls this review makes directly.

A deviation without a conforming `@decision` is 🔴 Blocker (Severity Levels, above). One carrying a complete `@decision` passes, and the decision is surfaced in the review output rather than silently accepted.

**Grandfather clause.** Of the 48 module directories under `packages/headless/src/modules/` (excluding `index.ts`), only `account/`, `auth/`, `client-email/`, and `session-store/` carry an `.actions.ts`/`.meta.ts` layer at all — the other 44 predate this law. Pre-existing unscoped module structure grades 🟡 Suggestion, advisory only; it is never itself a finding. 🔴 Blocker applies solely to a diff that **adds or modifies** scoped-composable structure (a new/edited `.{actor}.ts`, `.actions.ts`, `.meta.ts`, `.context.ts`, `.services.ts`, `.schemas.ts` arm) — never to a module simply staying unscoped, and never to a bare `.as(actor)` call site (that is the documented API, surfaced per clause 4, never itself 🔴).

## Review Depth Tiers — escalation thresholds

**Escalate `high` → `xhigh`** when the diff is **> 8 files, > 300 lines, or > 2 modules**, or when a behaviour-bearing module in the diff lacks unit tests (thresholds provisional — tune against real MRs); the machinery + model pins live in `/core-review` per `agent-orchestration.md` §3.
