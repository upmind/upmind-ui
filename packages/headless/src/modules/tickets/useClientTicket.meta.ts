import { computed } from "vue";
import { TicketStatusCodes } from "@upmind-automation/types";
import type { TicketItemQuery, TicketsServices } from "./tickets.types";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module tickets/useClientTicket.meta
 * @description Manager meta — computed state flags, one computed per flag.
 * Every gate here is PER-RECORD, read off the loaded ticket, never per-actor
 * (`design.md` § "Arms determination" — the trap this determination avoids).
 * @doctrine clause 2 — shared-only (armless).
 */
export function createClientTicketMeta(
  _actorScope: ScopeActorTypes,
  service: TicketsServices,
  query: TicketItemQuery
) {
  const hasError = computed(() => !!service.error.value || !!query.error.value);
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

    /** AC17 — true unless the write is refused (mirrors `isLocked` today). */
    canReply: computed(() => !isLocked.value),

    /** AC25 — true only when the ticket is closed. */
    canReopen: isClosed
  };
}

// Type export for consumers
export type UseClientTicketMeta = ReturnType<typeof createClientTicketMeta>;
