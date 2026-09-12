import { computed } from "vue";
import type {
  ClientBillingSettingsRecordQuery,
  ClientBillingSettingsServices
} from "./client-billing-settings.types";
import type { ScopeActorTypes } from "../scope/scope.types";
import type { Ref } from "vue";
// -----------------------------------------------------------------------------
/**
 * @module client-billing-settings/useBillingSettings.meta
 * @description Read meta — computed state flags, one computed per flag.
 * @doctrine clause 2 — shared-only (armless). No capability read-state
 * exists in this module, so `meta` legitimately stays shared-only rather
 * than needing a per-actor capability arm.
 */
export function createBillingSettingsMeta(
  _actorScope: ScopeActorTypes,
  service: ClientBillingSettingsServices,
  query: ClientBillingSettingsRecordQuery,
  restrictToStaff: Ref<boolean | undefined>,
  differentCurrencyPayment: Ref<boolean | undefined>,
  visibilityError: Ref<boolean>
) {
  const hasErrors = computed(() => !!query.error.value);

  const isLoading = computed(
    () => query.isLoading.value || !query.isFetched.value
  );

  /**
   * Row O8 — hidden unless the brand explicitly opts clients in. The `?? true`
   * polarity is the oracle's own (`comp:72-79`): an absent or `true` value
   * hides the surface; only an explicit literal `false` reveals it.
   * `restrictToStaff` is settled by `useBillingSettings.ts`
   * (`service.loadVisibility()`, re-invocable via `useActions().refresh()`),
   * shared with `useActions().isReady()` so a consumer that awaits readiness
   * always reads a SETTLED value here, never one still in flight. A failed
   * fetch fails this closed (`undefined` reads as not-`false`) — surfaced
   * separately via `hasVisibilityError`, not conflated with an explicit
   * brand opt-out.
   */
  const isVisible = computed(() => restrictToStaff.value === false);

  /**
   * Row B6 — offered ONLY when the brand has explicitly opted clients into
   * paying in a different currency. OPPOSITE polarity to `isVisible` above:
   * consumed as `!!value`, never `!(value ?? true)`. Absent or falsy
   * withholds the choice entirely — never merged with `isVisible`'s own
   * default or code path.
   */
  const hasPaymentCurrencyChoice = computed(
    () => !!differentCurrencyPayment.value
  );

  /** Row C14 — `true` while the addressed client record is a staged, unprocessed import. A state flag, so meta, not context. */
  const isStaged = computed(() => !!query.data.value?.isStaged);

  // --- actor-specific meta: none earned (arms: none — parity.yaml).

  return {
    /** True if the preference read failed. */
    hasErrors,

    /**
     * True while this scope can address a client — authenticated with a
     * resolved client id. Handed straight through from the services
     * instance: this IS the predicate the request gate calls.
     */
    isAvailable: service.isAvailable,

    /**
     * True when row O8's brand-gate fetch has failed and not yet recovered.
     * `isVisible` fails closed (`false`) on the same condition, which reads
     * identically to an explicit brand opt-out — this flag is how a
     * consumer tells the two apart. Recovers on the next successful
     * `useActions().refresh()`.
     */
    hasVisibilityError: computed(() => visibilityError.value),

    /** True while the read is loading or has not completed its first fetch. */
    isLoading,

    /** True while the addressed client record is a staged, unprocessed import (row C14). */
    isStaged,

    /** True only when the brand has explicitly opted clients into this surface (row O8). */
    isVisible,

    /** True only when the brand has explicitly opted clients into paying in a different currency (row B6). */
    hasPaymentCurrencyChoice

    // The arm merges in HERE, last.
    // ...actorMeta
  };
}

// Type export for consumers
export type UseBillingSettingsMeta = ReturnType<
  typeof createBillingSettingsMeta
>;
