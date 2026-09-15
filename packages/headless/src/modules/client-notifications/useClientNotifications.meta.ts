// -----------------------------------------------------------------------------
/**
 * @module client-notifications/useClientNotifications.meta
 * @description Collection meta factory — computed state flags, one computed
 * per flag, `is`/`has` prefixed.
 * @doctrine clause 2 — shared-only (armless, §D10).
 */

import { computed } from "vue";
import { isEmpty } from "lodash-es";
import type { NotificationsServices } from "./client-notifications.types";
import type { ScopeActorTypes } from "../scope";
// -----------------------------------------------------------------------------

export function createClientNotificationsMeta(
  _actorScope: ScopeActorTypes,
  service: NotificationsServices,
  topicsQuery: ReturnType<NotificationsServices["loadTopics"]>,
  channelsQuery: ReturnType<NotificationsServices["loadChannels"]>,
  optOutsQuery: ReturnType<NotificationsServices["loadOptOuts"]>
) {
  const hasError = computed(
    () =>
      !isEmpty(topicsQuery.error.value) ||
      !isEmpty(channelsQuery.error.value) ||
      !isEmpty(optOutsQuery.error.value)
  );

  /**
   * @decision
   * what:     `isLoading` ANDs in `service.isAvailable` — the same
   *           addressability predicate `isAvailable` reads and the three
   *           reads' own `enabled`/`guard` gate on — so an unaddressable
   *           scope reads NOT loading.
   * why:      A client with no token and no session (no link) is unaddressable:
   *           the reads never leave `enabled: false`, so `isFetched` stays
   *           `false` on all three and this flag, built on `isFetched` alone,
   *           stayed `true` forever — the surface drew skeletons with nothing
   *           coming. Gating on addressability lets the scope SETTLE to its
   *           empty preferences list instead of loading in perpetuity, while
   *           an addressable scope still reads loading until its reads land.
   * rejected: Leaving the flag on `isFetched` alone and having the consuming
   *           surface special-case `!isAvailable` — that pushes the module's
   *           own "will this ever fetch" knowledge into every caller.
   */
  const isLoading = computed(
    () =>
      service.isAvailable.value &&
      (!topicsQuery.isFetched.value ||
        !channelsQuery.isFetched.value ||
        !optOutsQuery.isFetched.value)
  );

  /**
   * @decision (`parity.yaml` row `predicate-naming`, D3/D4)
   * what:     `isAvailable` ANDs in `service.isAvailable` (the ONE
   *           actor-blind addressability predicate, computed once in
   *           `client-notifications.services.ts`) alongside the existing
   *           all-three-fetched-clean check.
   * why:      Before this, a genuinely unaddressable client (no token, no
   *           session) left `isAvailable` reading `false` only as a SIDE
   *           EFFECT — the addressability guard keeps `enabled: false`, so
   *           the three reads never fetch and `isLoading` stays `true`
   *           forever; nothing told a consumer WHY. Reading
   *           `service.isAvailable` here directly makes "not addressable" a
   *           NAMED, first-class reason `isAvailable` is `false`, not an
   *           accident of the reads never starting — the SAME predicate the
   *           request guard already reads (ARMS.md:37 — a flag that gates an
   *           action is also read-state), computed once, never duplicated.
   * rejected: A second field (e.g. `isAddressable`) alongside the existing
   *           `isAvailable` — the sibling contract name for this predicate IS
   *           `isAvailable`, and the two questions ("addressable" and "all
   *           three reads settled clean") were already numerically
   *           equivalent in every case the recorded reads exercise; folding
   *           them keeps ONE flag, matching the sibling's own single-field
   *           shape, rather than publishing two overlapping ones.
   */
  const isAvailable = computed(
    () =>
      service.isAvailable.value &&
      topicsQuery.isFetched.value &&
      channelsQuery.isFetched.value &&
      optOutsQuery.isFetched.value &&
      !hasError.value
  );

  // --- actor-specific meta: none earned (§D10 — meta: none).

  return {
    /** True if any of the three reads resolved with an error. */
    hasError,

    /**
     * True while the scope is addressable AND any of the three reads has not
     * completed its first fetch. An unaddressable scope reads `false` — it has
     * settled to its empty list, not stalled mid-load.
     */
    isLoading,

    /** True once addressable AND all three reads have completed with no error. */
    isAvailable

    // The arm merges in HERE, last.
    // ...actorMeta
  };
}

// Type export for consumers
export type UseClientNotificationsMeta = ReturnType<
  typeof createClientNotificationsMeta
>;
