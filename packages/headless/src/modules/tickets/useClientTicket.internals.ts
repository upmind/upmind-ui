import { watch } from "vue";
import { TicketStatusCodes } from "@upmind-automation/types";
import { useTime } from "../../utils";
import type { TicketItemQuery } from "./tickets.types";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module tickets/useClientTicket.internals
 * @description AC29's poll — arm, disarm, visibility. `design.md` names this
 * layer's home for the poll explicitly (a deviation from the generic
 * `{ send, state, service }` internals shape in `code-composables.md`,
 * because this module has no machine to expose).
 *
 * @decision
 * what:     The interval is owned here, armed automatically whenever the
 *           loaded ticket's status changes, and disarmed on a hidden tab.
 * why:      AC29 — a non-closed ticket polls every 60s on a visible tab
 *           only; legacy's `checkForUpdates` returns early on a hidden tab
 *           WITHOUT clearing the interval, leaking no-op fires (Z4). This
 *           clears the interval outright instead of leaving it firing.
 * rejected: Porting legacy's early-return — reproduces the exact leak Z4
 *           names.
 */
export function createClientTicketInternals(
  actorScope: ScopeActorTypes,
  query: TicketItemQuery
) {
  let intervalId: ReturnType<typeof setInterval> | undefined;

  function isPollable(): boolean {
    const ticket = query.data.value;
    return !!ticket && ticket.status?.code !== TicketStatusCodes.CLOSED;
  }

  function tick(): void {
    if (typeof document !== "undefined" && document.hidden) return;
    // Fire-and-forget: nothing awaits this call, and a genuine fetch failure
    // is already tracked reactively via `query.error` (read by context/meta).
    // Left as a bare `void`, a refetch cancelled mid-flight by a cache clear
    // (queryClient.clear() rejects in-flight fetches with CancelledError —
    // e.g. a scope evicted from the registry without destroy() running first)
    // surfaces as an unhandled promise rejection instead.
    query.refetch().catch(() => undefined);
  }

  function disarmPoll(): void {
    if (intervalId === undefined) return;
    clearInterval(intervalId);
    intervalId = undefined;
  }

  function armPoll(): void {
    disarmPoll();
    if (!isPollable()) return;
    intervalId = setInterval(tick, useTime().SECOND * 60);
  }

  function onVisibilityChange(): void {
    if (typeof document === "undefined" || document.hidden) return;
    tick();
  }

  if (typeof document !== "undefined") {
    document.addEventListener("visibilitychange", onVisibilityChange);
  }

  // Re-arms whenever the loaded ticket's status changes — including the
  // moment a poll's own response closes the ticket (`design.md` Edge Cases).
  const stopWatch = watch(() => query.data.value?.status?.code, armPoll, {
    immediate: true
  });

  /** `destroy()` disarms first, then tears the rest down (task 12). */
  function teardown(): void {
    disarmPoll();
    stopWatch();
    if (typeof document !== "undefined") {
      document.removeEventListener("visibilitychange", onVisibilityChange);
    }
  }

  return {
    /** Actor scope for this instance. */
    actorScope,
    /** Raw TanStack query object backing the manager. */
    query,
    /** Arms the 60s poll if the loaded ticket is pollable. */
    armPoll,
    /** Clears the poll interval without tearing down the visibility listener. */
    disarmPoll,
    /** Disarms the poll and removes the visibility listener. */
    teardown
  };
}

// Type export for consumers
export type UseClientTicketInternals = ReturnType<
  typeof createClientTicketInternals
>;
