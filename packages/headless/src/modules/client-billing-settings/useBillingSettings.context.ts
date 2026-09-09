import { computed } from "vue";
import { mapToHeadlessError } from "../../utils";
import type {
  ClientBillingSettingsRecordQuery,
  ClientBillingSettingsServices
} from "./client-billing-settings.types";
import type { ResponseError } from "../../utils";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module client-billing-settings/useBillingSettings.context
 * @description Read context — the reactive invoice-consolidation preference,
 * flat off the shared client-record query's own projection, plus the
 * session-resolved account values folded in 2026-09-09 (rows B1, X4, X7).
 *
 * ERRORS ARE STATE, NOT EVENTS. `error` is the query's own captured failure,
 * exposed for the consumer to render. This layer never raises it.
 *
 * @doctrine clause 2 — shared-only (armless).
 */
export function createBillingSettingsContext(
  _actorScope: ScopeActorTypes,
  service: ClientBillingSettingsServices,
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
    isStaged,

    /**
     * The session-resolved account's id (rows B1/X4) — a literal absence,
     * never substituted, when the addressed client is not the session's own
     * (row X7/AC25).
     */
    accountId: service.accountId,

    /** The account's own billing currency id, off the session's own account list (rows B1/B5). */
    currencyId: service.currencyId,

    /** The account's preferred payment currency id, or a literal absence when unset (rows B1/B4). */
    preferredPaymentCurrencyId: service.preferredPaymentCurrencyId,

    /**
     * The currency options both account-currency controls offer — the
     * brand's supported currencies ordered by name, plus the account's own
     * currency when the brand list omits it (rows B2/B3).
     */
    currencyOptions: service.currencyOptions

    // The arm merges in HERE, last.
    // ...actorContext
  };
}

// Type export for consumers
export type UseBillingSettingsContext = ReturnType<
  typeof createBillingSettingsContext
>;
