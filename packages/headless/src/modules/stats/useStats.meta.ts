import { computed } from "vue";
import { BrandConfigKeys } from "@upmind-automation/types";
import { useBrand } from "../brand";
import { isUpmindContext } from "./stats.utils";
import { every, isNil, some } from "lodash-es";
import type {
  StatCurrencyQuery,
  StatsServices,
  StatTicketQuery,
  UpmindUsageQuery
} from "./stats.types";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module stats/useStats.meta
 * @description Read meta — computed state flags: four tile loading flags plus
 * one aggregate (design DA5), the tile error flag, the all-empty flag (design
 * DA56, DA59), addressability, the support-system visibility pair (design 8.5,
 * AC7), and the THREE usage flags.
 *
 * WHY THE USAGE FLAGS STAY SEPARATE: the usage read is gated on the Upmind
 * host context and the four tile reads are not. On a non-Upmind host the
 * usage query never fetches, so a shared `isLoading` would hold a spinner
 * that can never resolve while four settled counts sit behind it, and a
 * shared `hasError` would report a 409 refusal as a tile failure. The usage
 * flags therefore carry their own names — `isLoadingUsage`, `hasUsageError`,
 * `isUsageVisible` — and are never merged with the tile flags.
 *
 * @doctrine clause 2 — shared-only (armless).
 */
export function createStatsMeta(
  _actorScope: ScopeActorTypes,
  service: StatsServices,
  queries: {
    totalOrders: StatCurrencyQuery;
    totalInvoices: StatCurrencyQuery;
    unpaidInvoices: StatCurrencyQuery;
    activeTickets: StatTicketQuery;
  },
  usageQuery: UpmindUsageQuery
) {
  const isLoadingTotalOrders = computed(
    () =>
      queries.totalOrders.isLoading.value ||
      !queries.totalOrders.isFetched.value
  );
  const isLoadingTotalInvoices = computed(
    () =>
      queries.totalInvoices.isLoading.value ||
      !queries.totalInvoices.isFetched.value
  );
  const isLoadingUnpaidInvoices = computed(
    () =>
      queries.unpaidInvoices.isLoading.value ||
      !queries.unpaidInvoices.isFetched.value
  );
  const isLoadingActiveTickets = computed(
    () =>
      queries.activeTickets.isLoading.value ||
      !queries.activeTickets.isFetched.value
  );

  const allQueries = [
    queries.totalOrders,
    queries.totalInvoices,
    queries.unpaidInvoices,
    queries.activeTickets
  ];

  const hasError = computed(() => some(allQueries, q => !!q.error.value));

  /**
   * True only when none of the four counts has resolved to a number and the
   * read has not failed (design DA56, DA59, AC23). A real zero is a number,
   * so it reads false; a failed read reads false too — `isEmpty` is never
   * conflated with `hasError`.
   *
   * Reads the NORMALISED counts, the same values `useStats.context.ts`
   * publishes: the query core's `[] as TData` fallback on an unresolved
   * branch normalises to `null` BEFORE the absence test, so an absent count
   * is distinguishable from a real `0`. The four TILE queries alone feed it —
   * the usage query never does, because the usage read is host-gated.
   */
  const isEmpty = computed(
    () =>
      !hasError.value &&
      every(allQueries, q => {
        const count = Array.isArray(q.data.value) ? null : q.data.value;
        return isNil(count);
      })
  );

  /**
   * The support-system brand gate (AC7, design 8.5). Read off the ALREADY
   * loaded brand config set — no second fetch. `undefined` on an unsettled
   * or failed brand read; the oracle default (an absent/falsy key means the
   * support system is NOT disabled) governs `isVisible` below.
   */
  const disableSupportSystem = computed(() =>
    useBrand().getConfigValue<boolean>(
      BrandConfigKeys.UI_CLIENT_APP_DISABLE_SUPPORT_SYSTEM
    )
  );

  /**
   * True while the brand config read has failed. The oracle has no
   * equivalent signal — a net add, so a consumer can tell "hidden by the
   * brand" from "hidden because the read is broken" (design 8.5).
   */
  const hasVisibilityError = computed(() => useBrand().meta.value.hasError);

  /**
   * DA4 — fails OPEN, the OPPOSITE default to the landed sibling: a failed
   * brand read keeps the ticket count visible. Only an explicit disable key
   * hides it.
   */
  const isVisible = computed(
    () => hasVisibilityError.value || !disableSupportSystem.value
  );

  // ---------------------------------------------------------------------------
  // USAGE — the host-gated half. Its own flags, never the tiles'.
  // ---------------------------------------------------------------------------

  const hasUsageError = computed(() => !!usageQuery.error.value);

  /**
   * Outside the Upmind context the query is gated off and never fetches, so
   * `isFetched` stays false for good. Reading that as "still loading" leaves
   * every consumer on a spinner that can never resolve, so the gate closes
   * this flag too: nothing is loading, because nothing will load.
   */
  const isLoadingUsage = computed(
    () =>
      isUpmindContext() &&
      (usageQuery.isLoading.value || !usageQuery.isFetched.value)
  );

  /**
   * Visible only after a SUCCESSFUL settled read. Outside the Upmind context
   * the request never fires (`stats.services.ts`, mirroring the oracle
   * at vue-app `src/views/client/dashboard/index.vue:43-49`), so the query
   * stays unfetched and this reads false without a round trip. A refusal or
   * an unsettled read read as not-visible too.
   */
  const isUsageVisible = computed(
    () => usageQuery.isFetched.value && !usageQuery.error.value
  );

  // --- actor-specific meta: none earned (arms: none — parity.yaml).

  return {
    /** TILES — true while the orders read is loading or has not completed its first fetch. */
    isLoadingTotalOrders,

    /** TILES — true while the invoices read is loading or has not completed its first fetch. */
    isLoadingTotalInvoices,

    /** TILES — true while the unpaid-invoices read is loading or has not completed its first fetch. */
    isLoadingUnpaidInvoices,

    /** TILES — true while the tickets read is loading or has not completed its first fetch. */
    isLoadingActiveTickets,

    /**
     * TILES — true while any of the four stats is loading (design DA5). The
     * usage read is NOT in this aggregate; it is host-gated and has its own
     * `isLoadingUsage`.
     */
    isLoading: computed(
      () =>
        isLoadingTotalOrders.value ||
        isLoadingTotalInvoices.value ||
        isLoadingUnpaidInvoices.value ||
        isLoadingActiveTickets.value
    ),

    /** TILES — true if any of the four stat reads failed (AC9, design DA10). */
    hasError,

    /**
     * TILES — true only while none of the four counts holds a number and the
     * read has not failed (design DA56, DA59, AC23). Reads the normalised
     * counts; see the computed above.
     */
    isEmpty,

    /**
     * SHARED — true while this scope can address a client: authenticated,
     * with a resolved client id. Handed straight through from the services
     * instance: this IS the predicate the request gates call (AC19).
     */
    isAvailable: service.isAvailable,

    /** TILES — true unless the brand has explicitly disabled the support system (AC7). */
    isVisible,

    /** TILES — true when the support-system brand-gate read has failed (AC7). */
    hasVisibilityError,

    /** USAGE — true if the usage read failed. */
    hasUsageError,

    /**
     * USAGE — true while the usage read is loading or has not completed its
     * first fetch, and only inside the Upmind context.
     */
    isLoadingUsage,

    /** USAGE — true only after a settled, successful usage read (AC13). */
    isUsageVisible

    // The arm merges in HERE, last.
    // ...actorMeta
  };
}

// Type export for consumers
export type UseStatsMeta = ReturnType<typeof createStatsMeta>;
