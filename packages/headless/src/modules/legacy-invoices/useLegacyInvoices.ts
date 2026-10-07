import { createScopedComposable } from "../scope";
import createLegacyInvoicesServices from "./legacy-invoices.services";
import { LEGACY_INVOICES_SCOPE_MATRIX } from "./legacy-invoices.types";
import { createLegacyInvoicesActions } from "./useLegacyInvoices.actions";
import { createLegacyInvoicesContext } from "./useLegacyInvoices.context";
import { createLegacyInvoicesInternals } from "./useLegacyInvoices.internals";
import { createLegacyInvoicesMeta } from "./useLegacyInvoices.meta";
import type { LegacyInvoicesScopeMatrix } from "./legacy-invoices.types";
import type { ScopeConfig, ScopeKey } from "../scope";
// -----------------------------------------------------------------------------
/**
 * @module legacy-invoices/useLegacyInvoices
 * @description Scoped, query-backed collection of a client's imported
 * invoices: one TanStack list query per concrete actor scope, minted once at
 * construction so it survives component lifecycles. Its sibling is
 * `useLegacyInvoice` — a second scoped composable registered under the SAME
 * module name. Read-only + PDF: no write member exists (FE-3230 Out of
 * Scope, AC13).
 *
 * @doctrine clause 1 (uniform four-layer default).
 * @doctrine clause 4 — `config.actor` arriving here is ALREADY a concrete
 * actor; the scope builder resolves SELF before this factory runs.
 */
function createLegacyInvoicesForScope(config: ScopeConfig, scopeKey: ScopeKey) {
  const actorScope = config.actor;

  /** ONE services instance for this scope. */
  const service = createLegacyInvoicesServices(actorScope);

  // Mint the list query ONCE per scope. `loadList()` takes nothing — the
  // request state is the declared query schema, and the schema's own
  // `pagination.limit`/`offset` defaults govern the boot window (D-24).
  const query = service.loadList();

  // Mint the availability read ONCE per scope — the module's own client read
  // that drives `hasLegacyInvoices` (AC5), independent of the session `/self`.
  const availability = service.loadAvailability();

  /** ONE actions instance per scope; the layers below stay lazy. */
  const actions = createLegacyInvoicesActions(
    actorScope,
    service,
    query,
    scopeKey
  );

  return {
    // --- Sub-composables (no direct props — clause 1 four-layer return)
    /** Sub-composable for collection actions (list controls, lifecycle). */
    useActions: () => actions,

    /** Sub-composable for collection context (reactive list + criteria/schemas). */
    useContext: () => createLegacyInvoicesContext(actorScope, service, query),

    /** Sub-composable for advanced debugging and internal access. */
    useInternals: () =>
      createLegacyInvoicesInternals(actorScope, query, service),

    /** Sub-composable for collection meta (state flags). */
    useMeta: () =>
      createLegacyInvoicesMeta(actorScope, service, query, availability)
  };
}
// -----------------------------------------------------------------------------
/**
 * Scoped composable for a client's imported-invoice archive.
 *
 * @example
 * ```ts
 * const legacyInvoices = useLegacyInvoices().as('self')
 * const { data, schemas } = legacyInvoices.useContext()
 * await legacyInvoices.useActions().isReady()
 * legacyInvoices.useActions().setCriteria({ filters: { number: { like: "INV" } } })
 * ```
 */
// TWO type arguments, and no third RUNTIME argument. Dropping the second
// falls back to the wide `ActorContextMatrix` default and re-opens `.for()`.
export const useLegacyInvoices = createScopedComposable<
  ReturnType<typeof createLegacyInvoicesForScope>,
  LegacyInvoicesScopeMatrix
>(
  "legacy-invoices",
  createLegacyInvoicesForScope,
  LEGACY_INVOICES_SCOPE_MATRIX
);

// Type export for consumers
export type UseLegacyInvoices = ReturnType<typeof useLegacyInvoices>;
