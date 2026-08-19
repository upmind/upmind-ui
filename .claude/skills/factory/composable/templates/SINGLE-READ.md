# Single-record reads — the `.withId(id)` shape

> **TEMPLATE — doctrine wins.** [ADR-001](../../../../docs/adr/001-scope-based-composables.md) + `code-composables.md` Part B + `code-composables.companion.md` ("Variance law") are the authority; this file is a navigation aid over them, never a match target. A disagreement is a surfaced finding, never silently resolved toward either.

**This file covers BOTH template variants** (`machine/` and `query/`), and lives at `templates/` root for the same reason [ARMS.md](./ARMS.md) does.

A composable that reads **one record by its id** takes that id from the scope builder's `.withId(id)` step. It does **not** take it from `.for(type, id)`, and it does **not** get a context enum or a scope matrix to carry it.

```ts
useModuleItem().withId(id)                 // ✅ self by default
useModuleItem().as("staff").withId(id)     // ✅ an actor named explicitly
useModuleItem().for("thing", id)           // ❌ a leaf record modelled as a context
```

## Why an id is not a context

An ADR-001 context names an entity the **actor acts upon** — its declared set is `client`, `lead`, `contract`, `invoice`, `order`, `ticket`, all large entities that own records of their own. The record a single read fetches is the thing being **read**, not an entity anyone acts on behalf of.

Two consequences follow, and both are load-bearing:

- **A context is matrix-constrained; an id is not.** A matrix cell answers "which entities may this actor act for". There is no per-actor answer to "which record ids exist", so a context type minted for a leaf record makes the matrix say something it cannot mean, and every actor cell has to repeat it.
- **The two compose.** `.as('staff').for('client', c).withId(r)` is coherent — staff, acting for client `c`, reading record `r`. Collapsing the id into the context position makes that sentence unsayable.

Mechanically: `.withId(id)` sets `config.id`, which `generateScopeKey` folds in as `id:<value>`, so same id → same instance and a new id → a new instance. The factory reads `config.id` and passes it to its single-read service. No factory signature changes.

**Receipt (FE-3095).** `client-email-history` minted a `ReceivedEmailContextTypes.EMAIL` and a `RECEIVED_EMAIL_SCOPE_MATRIX` whose only cell was that enum, then read the email id back out of `config.context`. Every gate stayed green — the shape was right and the capability was a fiction: the matrix advertised a per-actor context that named a leaf record. It was deleted and replaced with `.withId(id)`.

## The intake question, and when the run STOPS

Before scaffolding the scope block of any composable, answer from the **legacy oracle**, not from the template:

> Which entities does the legacy code let this actor act **on behalf of** for this capability?

- **The oracle names one or more entities** → mint the context enum and the matrix from exactly those, per [ARMS.md](./ARMS.md) and the module's ADR-001 parity table.
- **The oracle names none, and the composable reads one record by id** → mint **no** context enum, **no** `*_SCOPE_MATRIX`, and **no** `TMatrix` type parameter on `createScopedComposable`. The id rides on `.withId(id)`. This is the answer, not a gap.
- **The oracle names none, and it is not a single-record read** → **STOP and ask the operator.** Do not mint a context type to fill the slot.

That last branch is the law this file exists for: **an absent legacy context is never licence to invent one.** The graph answering "no such construct exists" (`hooks/graphify-gate.sh`, `code-quality.companion.md`) licenses a new **name**; it never licenses a new **concept**. A minted context type is a claimed capability, and a claimed capability with no oracle behind it is the `verify-cosplay.md` failure — gradeable as pass, delivering nothing.

## How to scaffold one

1. Copy `query/use{Module}Item.ts` beside the collection's `use{Module}.ts` (rename `Item` to the module's own singular — `useClientReceivedEmail` beside `useClientReceivedEmails`). Both register under the **same** module name; the composable name and the scope key carry the differentiation.
   Its four layer files are **not** shipped as separate templates: copy the collection's `use{Module}.actions.ts` / `.context.ts` / `.internals.ts` / `.meta.ts` and rename. The single read's layers are the collection's shape over an item query, not a different contract — a second near-identical template set would only drift.
2. Call `createScopedComposable<ReturnType<typeof createModuleItemForScope>>` with **one** type argument. A second one is a matrix, and a single read has none.
3. In the factory, read `config.id` and hand it to the service's single-read function. Never re-derive it from `config.context`.
4. Keep the service's request gated on the id: absent an id there is nothing to fetch, so `enabled` is false and no request goes out. Its presence is what fires exactly one request.
5. Reuse the module's ONE services factory — the collection and the single read share it, so both resolve the same target through the same seam.

## Actor arms on a single read

Unchanged: [ARMS.md](./ARMS.md) governs. A single read ships **armless** and earns an arm only when an actor has a member exclusive to it or overriding the shared factory (clause 3). `.as(actor)` stays available with no matrix — the default `ActorContextMatrix` refuses nobody — which is exactly how a staff arm is reached the day one is earned.

## Variant deltas

| | `query/` | `machine/` |
| --- | --- | --- |
| Template | `use{Module}Item.ts` (shipped) | copy `query/use{Module}Item.ts` and swap the query layer for the machine's `{module}.machine.ts` seam |
| The single read | one TanStack item query, minted once per scope | one machine actor per scope, `config.id` in its input |
| Gate on a missing id | `enabled` / `guard` false | the machine's own boot guard |
