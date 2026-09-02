import { computed } from "vue";
import { mapToHeadlessError } from "../../utils";
import type { ClientBillingSettingsRecordQuery } from "./client-billing-settings.types";
import type { ResponseError } from "../../utils";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module client-billing-settings/useBillingSettings.context
 * @description Read context — the reactive invoice-consolidation preference,
 * flat off the shared client-record query's own projection.
 *
 * ERRORS ARE STATE, NOT EVENTS. `error` is the query's own captured failure,
 * exposed for the consumer to render. This layer never raises it.
 *
 * @doctrine clause 2 — shared-only (armless).
 */
export function createBillingSettingsContext(
  _actorScope: ScopeActorTypes,
  query: ClientBillingSettingsRecordQuery
) {
  /** The five persisted consolidation fields, mapped off the client record. */
  const data = computed(() => query.data.value);

  /** `true` while the addressed client record is a staged, unprocessed import (row C14). */
  const isStaged = computed(() => !!query.data.value?.isStaged);

  /** The query's own captured error — read, never raised. */
  const error = computed<ResponseError | undefined>(() =>
    query.error.value ? mapToHeadlessError(query.error.value) : undefined
  );

  // --- actor-specific context: none earned (arms: none — parity.yaml).

  return {
    /** The five persisted consolidation fields, plus `isStaged`. */
    data,

    /** The query's own captured error — read, never raised. */
    error,

    /** `true` while the addressed client record is a staged import. */
    isStaged

    // The arm merges in HERE, last.
    // ...actorContext
  };
}

// Type export for consumers
export type UseBillingSettingsContext = ReturnType<
  typeof createBillingSettingsContext
>;
