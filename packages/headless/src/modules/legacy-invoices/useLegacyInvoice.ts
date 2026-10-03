import { ref } from "vue";
import { createScopedComposable } from "../scope";
import createLegacyInvoicesServices from "./legacy-invoices.services";
import { createLegacyInvoiceActions } from "./useLegacyInvoice.actions";
import { createLegacyInvoiceContext } from "./useLegacyInvoice.context";
import { createLegacyInvoiceInternals } from "./useLegacyInvoice.internals";
import { createLegacyInvoiceMeta } from "./useLegacyInvoice.meta";
import type { LegacyInvoiceScopeMatrix } from "./legacy-invoices.types";
import type { ScopeConfig, ScopeKey } from "../scope";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module legacy-invoices/useLegacyInvoice
 * @description Scoped, query-backed read of ONE imported invoice: one
 * TanStack item query per concrete `(actor, id)` scope, minted once at
 * construction. Its sibling is `useLegacyInvoices`, registered under the SAME
 * module name.
 *
 * The record read is a RECORD ID (`.withId(id)`), never a scope context:
 * there is no actor-context cell to declare (ruling OD1), so the matrix this
 * passes as its `TMatrix` refuses every actor (`templates/SINGLE-READ.md`).
 *
 * @doctrine clause 1 (uniform four-layer default).
 * @doctrine clause 4 — `config.actor` arriving here is ALREADY a concrete
 * actor; the scope builder resolves SELF before this factory runs.
 *
 * @decision
 * what: this module ships `useLegacyInvoice.ts` (singular) plus
 * `useLegacyInvoice.actions.ts` / `.context.ts` / `.internals.ts` /
 * `.meta.ts`, never the query template's own placeholder file
 * `useLegacyInvoicesItem.ts`.
 * why: `templates/SINGLE-READ.md` step 1 states the single read's own
 * naming is a variation point — "rename `Item` to the module's own
 * singular" — and instructs copying the collection's four layer files and
 * renaming them, rather than shipping a second near-identical template set.
 * This module's singular is `LegacyInvoice` (the manager composable is
 * `useLegacyInvoice`, beside the collection `useLegacyInvoices` — the same
 * pairing as `useInvoice`/`useInvoices` in the `invoices` exemplar, ruling
 * B6/D-2), never `LegacyInvoicesItem`.
 * rejected: keeping the template's literal `useLegacyInvoicesItem.ts`
 * filename and composable name — that would ship a name the design document
 * (section 5.1) and the exemplar's own naming convention both refuse.
 */
function createLegacyInvoiceForScope(config: ScopeConfig, scopeKey: ScopeKey) {
  const actorScope = config.actor as ScopeActorTypes;

  /** ONE services instance for this scope — the same factory the collection calls. */
  const service = createLegacyInvoicesServices(actorScope);

  // Mint the item query ONCE per scope. `config.id` is the builder's own
  // `.withId(id)`, already folded into the scope key.
  const query = service.loadOne(config.id);

  /** AC8 — true while the document read is in flight (design.md 10.1 row 25). Shared between actions (sets it) and meta (reads it). */
  const isDownloading = ref(false);

  const actions = createLegacyInvoiceActions(
    actorScope,
    service,
    query,
    isDownloading,
    scopeKey
  );

  return {
    // --- Sub-composables (no direct props — clause 1 four-layer return)
    /** Sub-composable for single-read actions (lifecycle, AC8's document read). */
    useActions: () => actions,

    /** Sub-composable for single-read context (the mapped preserved bill). */
    useContext: () => createLegacyInvoiceContext(actorScope, service, query),

    /** Sub-composable for advanced debugging and internal access. */
    useInternals: () => createLegacyInvoiceInternals(actorScope, query),

    /** Sub-composable for single-read meta (state flags, the five record conditions). */
    useMeta: () =>
      createLegacyInvoiceMeta(actorScope, service, query, isDownloading)
  };
}
// -----------------------------------------------------------------------------
/**
 * Scoped composable for one imported invoice, read in full.
 *
 * @example
 * ```ts
 * const legacyInvoice = useLegacyInvoice().withId(recordId)
 * const { data } = legacyInvoice.useContext()
 * await legacyInvoice.useActions().isReady()
 * await legacyInvoice.useActions().downloadPdf()
 * ```
 */
// TWO type arguments, and no third RUNTIME argument. Dropping the second
// falls back to the wide `ActorContextMatrix` default and re-opens `.for()`.
export const useLegacyInvoice = createScopedComposable<
  ReturnType<typeof createLegacyInvoiceForScope>,
  LegacyInvoiceScopeMatrix
>("legacy-invoices", createLegacyInvoiceForScope);

// Type export for consumers
export type UseLegacyInvoice = ReturnType<typeof useLegacyInvoice>;
