import { computed } from "vue";
import { isEmpty } from "lodash-es";
import type { CustomPagesListQuery } from "./client-custom-pages.types";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module client-custom-pages/useClientCustomPages.meta
 * @description Collection meta — computed state flags, one computed per
 * flag.
 * @doctrine clause 2 — shared-only (armless). `isAvailable` is unconditionally
 * `true`, and that is honest here: the list needs no session (parity O5,
 * AC9), so availability does not vary by actor — the guest arm the sibling
 * `client-email-history` module earns at this layer is NOT earned here.
 */
export function createClientCustomPagesMeta(
  _actorScope: ScopeActorTypes,
  query: CustomPagesListQuery
) {
  const hasError = computed(() => !!query.error.value);

  const isEmptyList = computed(() => isEmpty(query.data?.value));

  const isLoading = computed(
    () => query.isLoading.value || !query.isFetched.value
  );

  /**
   * AUTHORITATIVE copy (N12) — `useClientCustomPage.meta.ts`'s `isReloading`
   * is the same computation and cites this block rather than repeating it.
   *
   * @decision
   * what:     The module exposes `meta.isReloading`, computed as
   *           `query.isFetching.value && query.isFetched.value` — true only
   *           for a background re-fetch that follows a completed first load,
   *           never on the first load itself.
   * why:      Oracle capability O16 (`customPageProvider.vue:39-40,73,105-
   *           106,110`) holds two separate flags — `isLoading` for the first
   *           read, `isReloading` for a background re-read — and `parity.yaml`
   *           dispositions the distinction `Direct`, with an explicit note
   *           that flattening it is not permitted. `isLoading` alone cannot
   *           carry this: it is computed as `query.isLoading.value ||
   *           !query.isFetched.value`, which is `false` once the first fetch
   *           completes, so a consumer has no signal during a later refetch.
   *           Parity is this story's JTBD, and the oracle is the disposition
   *           this member exists to satisfy, so the oracle's own name is
   *           used verbatim.
   * rejected: Name it `isFetching`, matching the repo precedent at
   *           `invoices/useInvoice.ts:40` (`query?.isFetching.value`,
   *           documented `invoices/docs/usage.md:65`). Rejected: that
   *           precedent is a raw pass-through — `true` from the very start of
   *           the FIRST fetch too — a materially different truth condition
   *           from the first-load-exclusive flag O16 requires. Reusing the
   *           same name for a different truth condition would read as
   *           consistent while silently changing meaning between modules.
   */
  const isReloading = computed(
    () => query.isFetching.value && query.isFetched.value
  );

  // --- actor-specific meta: none earned yet (clause 2). When a scope earns
  // one, add `useClientCustomPages.meta.{actor}.ts` and spread it LAST.

  return {
    /** True if the list query failed. */
    hasError,

    /** True unconditionally — the list needs no session (AC9). */
    isAvailable: computed(() => true),

    /** True if the brand publishes no custom pages. */
    isEmpty: isEmptyList,

    /** True while the list is loading or has not completed its first fetch. */
    isLoading,

    /** True during a background re-fetch that follows a completed first load (O16). */
    isReloading,

    /** True while there is a further page beyond the current one. */
    hasNextPage: computed(() => query.meta.value.hasNextPage),

    /** True while there is a page before the current one. */
    hasPrevPage: computed(() => query.meta.value.hasPrevPage),

    /** True while the list spans more than one page. */
    hasPages: computed(() => query.meta.value.hasPages)

    // The arm merges in HERE, last.
    // ...actorMeta
  };
}

// Type export for consumers
export type UseClientCustomPagesMeta = ReturnType<
  typeof createClientCustomPagesMeta
>;
