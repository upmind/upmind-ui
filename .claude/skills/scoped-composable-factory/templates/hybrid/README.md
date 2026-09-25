# module module

> **TEMPLATE — doctrine wins.** `code-composables.md` + `code-composables.companion.md` ("Variance law") are the authority; this skeleton and its named worked examples are one worked example each, never a match target. A disagreement is a surfaced finding, never silently resolved toward either.

<!--
@doctrine `docs-modules.companion.md` — "the module README.md is internal-
facing and stays untouched" (this file's own doctrine binding).

@surfaced-finding this bundle's own `design.md` (§D3 Docs-stage row) and
`SKILL.md` (Stage map, Docs row) state the module README.md is "authored
inside" the Docs stage — in apparent tension with the companion's older
"stays untouched" framing. NOT resolved here (a doctrine-vs-doctrine
disagreement between two of this project's own artefacts, not a
doctrine-vs-example one) — filed for Dom in
`docs/sdd/FE-2966-FE-2967/evidence/decisions.md`, Task 7.
-->

## When Hybrid Is The Right Variant

Pick `hybrid` when the module needs **both** a list and a per-entity form
editor. The mechanical test at intake, in order:

1. **Does the conversion oracle ship a manager?** Inventory the oracle's
   composable shapes (Research stage). If it carries a `use{X}Manager` /
   `dataManagerMachine`-backed per-entity editor *alongside* a collection, the
   derived variant is `hybrid` — full stop. A `variant=query` override against
   such an oracle is a **halt with both determinations shown**, not a choice.
   Receipt: the 2026-08-05 client-email run took `variant=query` against an
   oracle shipping `useClientEmailManager`, and amputated the entire manager
   surface while every gate stayed green.
2. **Net-new:** does the module's parity table name per-entity form state —
   dirty tracking, field validation, a save/complete lifecycle, a draft that
   must survive a remount? That is machine work; a query cannot hold it.
   Collection reads plus fire-and-forget mutations alone are `query`.
3. **Neither half earns its keep?** Then it is not hybrid. A module with only a
   list is `query`; a module with only a bespoke lifecycle it OWNS is `machine`
   (`templates/machine/`, which carries `{module}.machine.ts`).

A hybrid module carries NO `{module}.machine.ts`: it does not own a machine, it
configures the SHARED `dataManagerMachine` through `useModuleManager.machine.ts`
(`templates/NOT-APPLICABLE.md`, "A second public composable").

## What Is This?

Replace with a plain-language explanation of BOTH surfaces — the collection and
the per-entity editor.

## Public Surface

```typescript
import { useModules, useModuleManager } from "@upmind-automation/headless";
```

## Quick Start

```typescript
// --- collection
const list = useModules().as("self");
const { data, findOne, getOne } = list.useContext();
const { isReady, refresh } = list.useActions();
await isReady();

// --- manager (edit one item)
const manager = useModuleManager().as("client").for("module-item", itemId);
const { model, schema, uischema, errors, validationErrors } =
  manager.useContext();
const { isValid, isDirty } = manager.useMeta();
await manager.useActions().isReady();
await manager.useActions().update({ name: "new name" });

// --- manager (new item)
const draft = useModuleManager().as("client").fresh();
```

## Actor Usage

| Call | Meaning |
| --- | --- |
| `useModules().as('self')` | The active session's own collection |
| `useModules().as('staff').for('client', id)` | Staff reading a client's collection |
| `useModuleManager().as('client').for('module-item', id)` | Edit one item; owner = the session's client |
| `useModuleManager().as('client').fresh()` | A new item, isolated instance |
| `useModuleManager().as('staff').for('client', id).fresh()` | Staff minting an item for a named client |

<!-- Keep only the rows this module's two scope matrices actually declare. -->

**Known platform limit (surface it, never silently drop it):** a scope carries
exactly ONE `.for()` context, so a single manager instance cannot name a target
client AND an item id — "staff edits client X's item Y" has no expression
today. If this module's ADR-001 parity table names that cell, raise it at Plan
for an operator ruling; do not ship the module as if the cell did not exist.

## How The Two Composables Share

| Shared | Where | Why it matters |
| --- | --- | --- |
| Types + BOTH scope matrices | `module.types.ts` | One file, two matrices (`MODULE_SCOPE_MATRIX`, `MODULE_MANAGER_SCOPE_MATRIX`) — the composables scope on different things and cannot share one |
| Services factory | `module.services.ts` → `createModuleServices(actor, context)` | Each composable calls it ONCE with its OWN resolved scope; the collection uses `loadList`, the manager uses `loadOne`/`add`/`update`/`ensure`/`validate`/`refresh` |
| Identity seam | `resolveClientId()` in `module.services.ts` | The single place a target client is derived. `.for('client', id)` wins; the session's `activeUser` supplies the self case. The manager seeds its machine from `service.clientId` — never a second session read (that is the FE-2824 shape) |
| Cache key | `queryKey` in `module.services.ts` | The manager's mutations invalidate it; that, and nothing else, is how a save refreshes the collection. Neither composable holds a reference to the other's instance |
| Mappers | `module.mappers.ts` | `mapModuleItems`/`mapModuleItem` inbound (both halves), `mapModuleRequestData` outbound (manager only) |
| Schemas | `module.schemas.ts` | Consumed ONLY by the manager's machine config (`setSchemas`) and by `validate`. Never re-exported bare from `index.ts` — consumers read them off `useModuleManager().useContext()` |

## Actor Arms

This module ships armless (clause 2, `code-composables.companion.md` "Variance
law"). The COLLECTION half carries an opt-in arm template for all five layers
(`module.services.{actor}.ts` / `useModules.actions.{actor}.ts` /
`useModules.context.{actor}.ts` / `useModules.meta.{actor}.ts` /
`module.schemas.{actor}.ts`). The MANAGER half ships no separate arm templates:
its arms are the same pattern under the manager's own filenames
(`useModuleManager.actions.{actor}.ts`, `.context.{actor}.ts`,
`.meta.{actor}.ts`), and each manager layer already carries the merge-seam
comment showing where the spread goes. Services and schemas are shared by both
halves, so their single arm serves both. See
`.claude/skills/scoped-composable-factory/templates/ARMS.md` for the full
when/how/checker-gate decision tree; do not scaffold an arm un-earned.

## File Layout

```text
module/
├── module.types.ts                 # BOTH scope matrices + shared item/model/service contracts
├── module.services.ts              # BOTH halves' services + the machine services adapter
├── module.services.{actor}.ts      # opt-in — see .claude/skills/scoped-composable-factory/templates/ARMS.md
├── module.mappers.ts               # inbound (both) + mapModuleRequestData (manager)
├── module.schemas.ts               # consumed by the manager's machine config only
├── module.schemas.{actor}.ts       # opt-in — see .claude/skills/scoped-composable-factory/templates/ARMS.md
│
├── useModules.ts                    # --- collection half (query-backed)
├── useModules.actions.ts
├── useModules.actions.{actor}.ts    # opt-in
├── useModules.context.ts
├── useModules.context.{actor}.ts    # opt-in
├── useModules.meta.ts
├── useModules.meta.{actor}.ts       # opt-in
├── useModules.internals.ts
│
├── useModuleManager.machine.ts     # --- manager half (shared dataManagerMachine)
├── useModuleManager.ts
├── useModuleManager.actions.ts
├── useModuleManager.context.ts
├── useModuleManager.meta.ts
├── useModuleManager.internals.ts
│
├── index.ts
└── README.md            # this file
```

(`.claude/skills/scoped-composable-factory/templates/ARMS.md` /
`.claude/skills/scoped-composable-factory/templates/NOT-APPLICABLE.md` are this
template set's own factory-authoring guidance — they are not copied into a built
module.)

No `module.machine.ts` — the manager configures the SHARED `dataManagerMachine`
rather than owning one (see
`.claude/skills/scoped-composable-factory/templates/NOT-APPLICABLE.md`).

## Dependencies

<!-- List the module's real dependencies here. A hybrid module always depends on
`query`, `scope`, `session-store` and `data-manager`; add the module's own
siblings. -->

## Gotchas

<!-- Lifecycle/singleton-per-scope-key gotchas. The hybrid-specific ones a
rebuilder always hits:
- The manager's `destroy()` stops the machine AND deregisters it; the
  collection's only deregisters (a query has no service to stop).
- `.fresh()` mints a unique scope key per call, so two concurrent drafts are two
  interpreters — do not "optimise" that into one.
- The machine stays in `subscribing` until a client id exists: a manager that
  never leaves `subscribing` is an unresolved identity, not a hung machine.
- The manager's meta returns FLAT computeds, not the legacy single `meta`
  object the pre-scope managers exposed — note the rename for porting
  consumers. -->
