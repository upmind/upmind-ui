# Layers this template set intentionally does not carry

> **TEMPLATE — doctrine wins.** `code-composables.md` + `code-composables.companion.md` ("Variance law") are the authority; this index and any file it names are one worked example each, never a match target. A disagreement is a surfaced finding, never silently resolved toward either.

Read-back for AC6 half one ("template set diffed against the `auth/` and `client-email/` trees → every layer those modules carry is present or explicitly marked not-applicable").

**Covers BOTH variants.** Rows that apply to only one are marked in the Variant column. This file lives at `templates/` root because two per-variant copies drifted once already (`docs/sdd/FE-2966-FE-2967/evidence/decisions.md`, 2026-07-28) and the duplicated content was prose, not logic.

## Present, opt-in

| Item | Variant | Status | Why |
| --- | --- | --- | --- |
| `module.services.{actor}.ts` / `useModule.actions.{actor}.ts` / `useModule.context.{actor}.ts` / `useModule.meta.{actor}.ts` / `module.schemas.{actor}.ts` | both | **Opt-in, present as templates (all five layers)** | Per the operator ruling superseding the prior two-layer cut (2026-07-28 "OPERATOR RULING"), clause 3 applies to any actor-exclusive/overriding member of any layer. `machine/` cites `auth/`'s real earned arms for services/actions; `query/` has no live arm precedent at any layer (`client-email/` is armless throughout) and cross-cites `auth/` or the doctrine prose, honestly labelled. Context/meta/schemas have no runtime exemplar in either variant (`code-composables.companion.md`: "meta/context are single factories today") and derive from Part B's "same pattern for every layer". Copied and concretised only when clause 3 is earned; armless by default (clause 2). See `ARMS.md`. |

## Not present, by ruling

| Item | Variant | Status | Why |
| --- | --- | --- | --- |
| `module.mappers.{actor}.ts` | both | **Not present, by ruling** | A mapper is a pure function with no actor-scoped state — an arm would hold nothing. A services arm reading a different endpoint gets a different response shape, so it maps with an **actor-named** mapper exported from the shared `module.mappers.ts` (`mapClientModuleItems` / `mapClientModuleRequestData` beside the shared one, each with its own wire type) and picks it at its own call site. Operator ruling, 2026-07-28 — see `ARMS.md`'s "Which files can earn an arm" test. |
| `module.utils.{actor}.ts` | both | **Not present, by ruling** | Same test, same answer as mappers: pure-function util file, so actor-named exports rather than an arm. |
| `module.machine.{actor}.ts` | `machine/` | Not present | No worked example of an earned arm exists at this layer anywhere in the codebase today (see `module.machine.ts`'s own annotation) — not invented un-cited. The capability-guarded transition inside the shared machine covers the real per-actor need. |
| `module.machine.ts` | `query/` | **Not present** | `code-composables.md` Part B "State Machine vs TanStack Query — usually one or the other." `client-email/` carries no `.machine.ts` anywhere in its tree — the query itself is the state. Design §D3 tags this layer "(machine)" for exactly this reason; see `templates/machine/{module}.machine.ts`. |

## Not present — other seats or other stages own them

| Item | Variant | Status | Why |
| --- | --- | --- | --- |
| `__tests__/` | both | Not present | Prover-seat artefact (`/test`, was `/test-module`), never authored by the developer seat that owns this template set (`seat-separation.md`). |
| `docs/architecture.md` / `docs/usage.md` / `docs/gotchas.md` / `docs/CHANGELOG.md` | both | Not present | Optional `/docs` (was `/docs-module`) deliverables beyond the mandatory `docs/foundation.md` — produced by the Docs stage when a module warrants them, not templated up front. |
| `docs/README.md` (the docs-folder landing page, distinct from the module-root `README.md`) | both | Not present | Design §D3's template file-list names `README.md` + `docs/foundation.md` explicitly; a docs-folder landing page is an optional `/docs-guide`-style deliverable, same disposition as the row above. Noted for `query/`: `client-email/docs/` carries only this landing page and no `foundation.md`, yet this template set carries `docs/foundation.md` per D3 — see that file's own surfaced finding. |
| `module.schemas.{flow}.ts` split (e.g. auth's `.login`/`.recover`/`.register`/`.twofa`) | both | Not present | `module.schemas.ts` starts single-file; the split is earned when a second form flow exists (Part A "File Naming"). |
| A second public composable | both | Not present | This template set covers ONE scoped composable. A module needing a second (auth's `useVerifyEmail.ts` with its own `auth.services.client.email.ts`; client-email's `useClientEmailManager`, a per-item form on the shared `dataManagerMachine`) repeats this same template set — or the other variant, for a form beside a collection — under its own `use{Second}.ts` name. |
| `client-email/actions.ts` (bare, module-root) | `query/` | Not present | Confirmed by reading it — shared `assign`/guard factories (`useClientEmailActions`/`useClientEmailGuards`) for the **manager's** `dataManagerMachine`, i.e. it belongs to the second composable excluded above, not to the collection this template set covers. |
| `client-email/client-email.utils.ts` | `query/` | Not present | Confirmed by reading it — a single-line vestigial file (`// --- keep`), not a meaningful layer to template. |
