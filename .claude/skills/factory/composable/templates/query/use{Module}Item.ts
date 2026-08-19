// -----------------------------------------------------------------------------
/**
 * TEMPLATE FILE — doctrine wins over this skeleton and its named worked
 * example. Authority: `code-composables.md` Part B "Implementation Pattern" +
 * "TanStack Query variant" + `code-composables.companion.md` "Variance law"
 * clauses 1/2/4, plus `templates/SINGLE-READ.md` for the `.withId(id)` law and
 * the intake question that STOPS the run. A disagreement between this skeleton,
 * its worked example, and the doctrine is a surfaced finding, never silently
 * resolved toward either.
 *
 * `@precedent` citations point at `client-email-history/` — the module FE-3095
 * converted off a synthesised context, and the receipt
 * `templates/SINGLE-READ.md` is written about. Cite it for facts; never copy
 * its shape.
 *
 * THE FOUR LAYER FILES this imports are NOT shipped separately: copy the
 * collection's `use{Module}.actions.ts` / `.context.ts` / `.internals.ts` /
 * `.meta.ts` and rename `Module` to `ModuleItem` in the filename and the
 * factory name. The single read's layers are the collection's shape over an
 * item query, not a different contract, so a second near-identical template set
 * would only drift (the same reason `ARMS.md` lives at `templates/` root).
 *
 * THE SINGLE-READ RULE — the one thing this template exists to carry:
 * the record id arrives on `config.id`, set by the builder's `.withId(id)`. It
 * is NOT a scope context, so this composable declares NO context enum, NO
 * `*_SCOPE_MATRIX`, and passes NO `TMatrix` type argument below. If the intake
 * pushed you toward minting one, read `templates/SINGLE-READ.md` first — an
 * absent legacy context is the answer, never a slot to fill.
 */

import { createScopedComposable } from "../scope";
import createModuleServices from "./module.services";
import { createModuleItemActions } from "./useModuleItem.actions";
import { createModuleItemContext } from "./useModuleItem.context";
import { createModuleItemInternals } from "./useModuleItem.internals";
import { createModuleItemMeta } from "./useModuleItem.meta";
import { ScopeActorTypes } from "../scope";
import type { ScopeConfig, ScopeKey } from "../scope";
// -----------------------------------------------------------------------------
/**
 * @module module/useModuleItem
 * @description Scoped, query-backed read of ONE record (no machine): one
 * TanStack item query per concrete `(actor, id)` scope, minted once at
 * construction so it survives component lifecycles. Returns ONLY the four
 * sub-composable factories — no direct props.
 *
 * Its sibling is the collection `useModule`, registered under the SAME module
 * name; the composable name and the scope key carry the differentiation, and
 * both halves resolve their target through the module's ONE services factory.
 *
 * The record read is a RECORD ID (`.withId(id)`), never a scope context — see
 * `templates/SINGLE-READ.md`.
 *
 * @doctrine clause 1 (uniform four-layer default) — same return shape as the
 * collection.
 * @doctrine clause 4 (`.as('self')` builder-owned) — `config.actor` arriving
 * here is ALREADY a concrete actor, and an unnamed one already resolved to the
 * session's own.
 * @precedent `client-email-history/useClientReceivedEmail.ts`.
 */
function createModuleItemForScope(config: ScopeConfig, scopeKey: ScopeKey) {
  const actorScope = config.actor as ScopeActorTypes;

  // ONE services instance for this scope — the same factory the collection
  // calls, so the two halves can never disagree about whose records these are.
  const service = createModuleServices(actorScope, config.context);

  // Mint the item query ONCE per scope. `config.id` is the builder's own
  // `.withId(id)`, already folded into the scope key, which is what makes the
  // instance keyed per RECORD rather than shared across every row opened.
  // Never re-derive this id from `config.context`.
  const query = service.loadOne(config.id);

  return {
    // --- Sub-composables (no direct props — clause 1 / Part B Four-Layer Return Shape)
    /** Sub-composable for single-read actions (lifecycle). */
    useActions: () =>
      createModuleItemActions(actorScope, service, query, scopeKey),

    /** Sub-composable for single-read context (the mapped record + error). */
    useContext: () => createModuleItemContext(actorScope, query),

    /** Sub-composable for advanced debugging and internal access. */
    useInternals: () => createModuleItemInternals(actorScope, query),

    /** Sub-composable for single-read meta (state flags). */
    useMeta: () => createModuleItemMeta(actorScope, query)
  };
}
// -----------------------------------------------------------------------------
/**
 * Scoped single-record read — replace this JSDoc with the module's real usage
 * example.
 *
 * The actor defaults to SELF, so `.as()` is optional; naming one explicitly is
 * how an earned actor arm is reached.
 *
 * @example
 * ```ts
 * const item = useModuleItem().withId(id)
 * const { data } = item.useContext()
 * await item.useActions().isReady()
 * ```
 */
export const useModuleItem = createScopedComposable<
  ReturnType<typeof createModuleItemForScope>
>("module", createModuleItemForScope);

// Type export for consumers
export type UseModuleItem = ReturnType<typeof useModuleItem>;
