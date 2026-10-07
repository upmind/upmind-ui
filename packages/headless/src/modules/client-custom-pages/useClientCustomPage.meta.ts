import { computed } from "vue";
import { mapToHeadlessError, responseCodes } from "../../utils";
import { isEmpty } from "lodash-es";
import type { CustomPage, CustomPageQuery } from "./client-custom-pages.types";
import type { ScopeActorTypes } from "../scope/scope.types";
import type { ComputedRef } from "vue";
// -----------------------------------------------------------------------------
/**
 * @module client-custom-pages/useClientCustomPage.meta
 * @description Single-read meta — computed state flags, one computed per
 * flag.
 * @doctrine clause 2 — shared-only (armless). `isAvailable` is unconditionally
 * `true` for the same reason the collection's is (AC9) — this read carries a
 * token, but availability does not vary by actor here.
 */
export function createClientCustomPageMeta(
  _actorScope: ScopeActorTypes,
  query: CustomPageQuery,
  listRow?: ComputedRef<CustomPage | undefined>
) {
  const error = computed(() =>
    query.error.value ? mapToHeadlessError(query.error.value) : undefined
  );

  const hasError = computed(() => !!error.value);

  /**
   * @decision
   * what:     `isEmptyResult` is true only when NEITHER the item query NOR
   *           the list fallback resolved a row.
   * why:      O10 makes `context.data` resolve from the list when the item
   *           read is guarded off; a consumer gating on `meta.isEmpty` must
   *           see the SAME answer `context.data` gives, or a page already on
   *           the list would report "empty" while `context.data` is already
   *           populated.
   * rejected: Leave `isEmptyResult` reading `query.data.value` alone —
   *           rejected, it would disagree with `context.data` for every
   *           guarded scope.
   */
  const isEmptyResult = computed(
    () => isEmpty(query.data.value?.id) && isEmpty(listRow?.value?.id)
  );

  /**
   * @decision
   * what:     `isLoading` also turns false the moment `listRow` resolves a
   *           row.
   * why:      A guarded query's `isFetched` never becomes true (O9), so
   *           `query.isLoading.value || !query.isFetched.value` alone would
   *           stay `true` forever for a guarded scope even though the
   *           resolved page is already available via the list fallback —
   *           the oracle sets `isLoading = false` in the SAME tick the guard
   *           short-circuits (`customPageProvider.vue:90,105`).
   * rejected: Leave `isLoading` unchanged — rejected for the same
   *           desynchronisation reason as `isEmptyResult` above.
   */
  const isLoading = computed(
    () => query.isLoading.value || (!query.isFetched.value && !listRow?.value)
  );

  /**
   * @decision
   * what:     The module exposes `meta.isNotFound`, computed as
   *           `error.value?.status === responseCodes.Not_Found`. Errors are
   *           still captured, never thrown; `data` stays empty.
   * why:      The established convention already gives error-populated /
   *           data-empty / no-throw (`invoices.int.test.ts:243-255`; doctrine
   *           `client-email-history/docs/architecture.md:55`), and the live
   *           probe proved the wire returns a real, typed 404 envelope for an
   *           unknown slug — `{"error":{"code":404,"message":"Custom Page not
   *           found!"}}` (2026-09-09). `isNotFound` names that one case so a
   *           consumer can tell "this page does not exist" from "the read
   *           failed", which is exactly the distinction the oracle draws with
   *           `api/is404` before calling `onNotFound`
   *           (`customPageProvider.vue:101-102`). It is a computed over an
   *           existing typed member (`useError.ts:22-42`) living in this
   *           module's own meta layer — no platform member is added.
   * rejected: (a) Leave consumers to inspect `error.status` themselves.
   *           Rejected: it re-implements `api/is404` at every call site,
   *           which is the legacy smell, and AC5 would then grade a raw field
   *           rather than a capability. (b) Add `isNotFound` to the query
   *           layer for every module. Rejected — operator ruling: no new
   *           platform member.
   */
  const isNotFound = computed(
    () => error.value?.status === responseCodes.Not_Found
  );

  /**
   * `meta.isReloading` — same computation, same O16 justification as the
   * collection's. See `useClientCustomPages.meta.ts`'s `@decision` block for
   * the full rationale (name, oracle citation, rejected alternatives) — kept
   * in ONE place so the two copies cannot drift (N12).
   */
  const isReloading = computed(
    () => query.isFetching.value && query.isFetched.value
  );

  // --- actor-specific meta: none earned yet (clause 2). When a scope earns
  // one, add `useClientCustomPage.meta.{actor}.ts` and spread it LAST.

  return {
    /** True if the item query failed. */
    hasError,

    /** True unconditionally — the same reason the collection's is (AC9). */
    isAvailable: computed(() => true),

    /** True if this scope's page carries no id. */
    isEmpty: isEmptyResult,

    /** True while the read is loading or has not completed its first fetch. */
    isLoading,

    /** True if the resolved slug does not exist (D3/AC5). */
    isNotFound,

    /** True during a background re-fetch that follows a completed first load (O16). */
    isReloading

    // The arm merges in HERE, last.
    // ...actorMeta
  };
}

// Type export for consumers
export type UseClientCustomPageMeta = ReturnType<
  typeof createClientCustomPageMeta
>;
