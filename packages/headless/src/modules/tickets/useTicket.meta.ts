import { computed } from "vue";
import { TicketStatusCodes } from "@upmind-automation/types";
import type { TicketItemQuery, TicketsServices } from "./tickets.types";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module tickets/useTicket.meta
 * @description Manager meta — computed state flags, one computed per flag.
 * Every gate here is PER-RECORD, read off the loaded ticket, never per-actor
 * (`design.md` § "Arms determination" — the trap this determination avoids).
 * @doctrine clause 2 — shared-only (armless).
 */
export function createTicketMeta(
  _actorScope: ScopeActorTypes,
  service: TicketsServices,
  query: TicketItemQuery
) {
  /**
   * AC-CE (R9 fold-in) — `loadOne` declares no schema, so `query.criteriaError`
   * stays inert here in practice (nothing ever calls `setCriteria` on the
   * manager); folded in for consistency with `useTickets.meta.ts`.
   */
  const hasError = computed(
    () =>
      !!service.error.value ||
      !!query.error.value ||
      !!query.criteriaError.value
  );
  const isLoading = computed(
    () => query.isLoading.value || !query.isFetched.value
  );

  const isClosed = computed(
    () => query.data.value?.status?.code === TicketStatusCodes.CLOSED
  );
  const isLocked = computed(() => !!query.data.value?.settings?.lock);
  const isScheduled = computed(
    () => query.data.value?.status?.code === TicketStatusCodes.SCHEDULED
  );
  const isStaged = computed(() => !!query.data.value?.staged_import);
  const isDelegated = computed(() => !!query.data.value?.is_delegated_object);

  return {
    /** AC29 — true while a further poll is due for this ticket. */
    isPollable: computed(() => !!query.data.value && !isClosed.value),

    /** AC24/AC27 — true when close/subject writes are refused. */
    isLocked,

    /** AC25 — true only when the ticket's status is closed. */
    isClosed,

    /** AC9/AC12 — true when the ticket carries a send-later status. */
    isScheduled,

    /** AC12 — true when the ticket originated from a staged import. */
    isStaged,

    /** AC10 — true when this ticket is delegated in, not owned. */
    isDelegated,

    /** True while this scope can address a client. */
    isAvailable: service.isAvailable,

    /** True if the read failed. */
    hasError,

    /** True while the ticket is loading or has not completed its first fetch. */
    isLoading,

    /**
     * AC17 — true unless the composer is refused. The oracle gates it on
     * `isStaged` ALONE for a client: `ticketFeed.vue:8` disables on
     * `isStaged || (!canReplyToTicket && !canAddInternalNote)`, and
     * `canReplyToTicket` (`ticketProvider.ts:210-212`) is
     * `canManageTicket && $userCan(...)` where `canManageTicket`
     * (`ticketProvider.ts:172-173`) returns TRUE immediately for a non-admin —
     * so the second clause can never fire for client×self.
     *
     * The LOCK does not gate a reply. It gates the action-list writes only
     * (`ticketProvider.ts:244,:268,:283,:299` — close, subject, related
     * product), which is what `isLocked` above is for. Gating a reply on the
     * lock refused a reply legacy allows.
     */
    canReply: computed(() => !isStaged.value),

    /** AC25 — true only when the ticket is closed. */
    canReopen: isClosed
  };
}

// Type export for consumers
export type UseTicketMeta = ReturnType<typeof createTicketMeta>;
