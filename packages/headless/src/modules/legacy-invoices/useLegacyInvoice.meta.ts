import { computed } from "vue";
import { InvoiceStatus } from "@upmind-automation/types";
import { get } from "lodash-es";
import type {
  LegacyInvoiceItemQuery,
  LegacyInvoicesServices
} from "./legacy-invoices.types";
import type { ScopeActorTypes } from "../scope/scope.types";
import type { Ref } from "vue";
// -----------------------------------------------------------------------------
/**
 * @module legacy-invoices/useLegacyInvoice.meta
 * @description Single-read meta — computed state flags, one computed per
 * flag, plus the five published record conditions design.md 8.13
 * enumerates. Each condition reads its OWN path off the preserved bill
 * (`content`) or the record's top level — the bill is loosely typed on the
 * wire [w3], so the path is what keeps every assertion honest.
 * @doctrine clause 2 — shared-only (armless).
 *
 * @decision
 * what: this file, `useLegacyInvoice.meta.ts`, exists although the query
 * template ships no matching template file for it.
 * why: `templates/SINGLE-READ.md` step 1 instructs copying the collection's
 * own `.meta.ts` and renaming it for the single read.
 * rejected: leaving this layer unwritten — clause 1 requires the uniform
 * four-layer return on both composables.
 */
export function createLegacyInvoiceMeta(
  _actorScope: ScopeActorTypes,
  service: LegacyInvoicesServices,
  query: LegacyInvoiceItemQuery,
  isDownloading: Ref<boolean>
) {
  const hasError = computed(() => !!service.error.value || !!query.error.value);

  const isEmptyResult = computed(() => !query.data.value?.id);

  const isLoading = computed(
    () => query.isLoading.value || !query.isFetched.value
  );

  const isComplete = computed(() => query.isFetched.value);

  /** design.md 8.13 — paid/overdue read `content.status`, the shared status vocabulary (`oracle: legacyInvoiceProvider.vue:67-71` isPaid, `:72-76` isOverdue). */
  const statusCode = computed(() =>
    get(query.data.value, "content.status.code")
  );

  const isPaid = computed(() => statusCode.value === InvoiceStatus.PAID);

  const isOverdue = computed(() => statusCode.value === InvoiceStatus.OVERDUE);

  /** design.md 8.13 — read as a truthiness off `content.partial_amount_credited_converted` (`oracle: legacyInvoiceProvider.vue:145-147`). */
  const isCredited = computed(
    () => !!get(query.data.value, "content.partial_amount_credited_converted")
  );

  /** design.md 8.13 — read off the record's TOP LEVEL, never the bill (`oracle: legacyInvoiceProvider.vue:142-144`). */
  const isStaged = computed(() => !!query.data.value?.staged_import);

  /** Ruling B8 — no oracle producer exists; mapped from the wire, defaulting to false. */
  const isProforma = computed(
    () => !!get(query.data.value, "content.proforma", false)
  );

  // --- actor-specific meta: none earned yet (clause 2). When a scope earns
  // one, add `useLegacyInvoice.meta.{actor}.ts` and spread it LAST.

  return {
    /** True if the item query failed. */
    hasError,

    /**
     * True while this scope can address a client — authenticated, with a
     * resolved client id. Handed straight through from the services
     * instance: this IS the predicate the request gate calls, not a second
     * copy of it.
     */
    isAvailable: service.isAvailable,

    /** True once the first fetch has completed, regardless of outcome (ruling OD3). */
    isComplete,

    /** AC8 — true while the document download is in flight. */
    isDownloading,

    /** True if this scope's record carries no id. */
    isEmpty: isEmptyResult,

    /** True while the read is loading or has not completed its first fetch. */
    isLoading,

    /** design.md 8.13 — true when the credited amount is non-zero. */
    isCredited,

    /** design.md 8.13 — true when `content.status.code` reads `invoice_overdue`. */
    isOverdue,

    /** design.md 8.13 — true when `content.status.code` reads `invoice_paid`. */
    isPaid,

    /** Ruling B8 — true when `content.proforma` reads true; false by default. */
    isProforma,

    /** design.md 8.13 — true when the record's top-level `staged_import` reads true. */
    isStaged

    // The arm merges in HERE, last.
    // ...actorMeta
  };
}

// Type export for consumers
export type UseLegacyInvoiceMeta = ReturnType<typeof createLegacyInvoiceMeta>;
