import { computed } from "vue";
import { mapToHeadlessError } from "../../utils";
import type {
  ClientEmailHistoryServices,
  ReceivedEmailItemQuery
} from "./client-email-history.types";
import type { ResponseError } from "../../utils";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module client-email-history/useClientReceivedEmail.context
 * @description Single-read context — the mapped email and its captured
 * error. Query-backed: data is mapped in
 * `client-email-history.services.ts` via `select`, never here — the SAME
 * mapper the collection uses (AC-14).
 *
 * ERRORS ARE STATE, NOT EVENTS. `error` is the scope's captured failure,
 * exposed for the consumer to render. This layer never raises it.
 *
 * @doctrine clause 2 — shared-only (armless).
 */
export function createClientReceivedEmailContext(
  _actorScope: ScopeActorTypes,
  service: ClientEmailHistoryServices,
  query: ReceivedEmailItemQuery
) {
  const error = computed<ResponseError | undefined>(
    () =>
      service.error.value ??
      (query.error.value ? mapToHeadlessError(query.error.value) : undefined)
  );

  // --- actor-specific context: none earned yet (clause 2). When a scope
  // earns one, add `useClientReceivedEmail.context.{actor}.ts` and spread it
  // LAST.

  return {
    /** The reactive mapped email this scope resolved. */
    data: query.data,

    /** The scope's captured error — read, never raised. */
    error

    // The arm merges in HERE, last.
    // ...actorContext
  };
}

// Type export for consumers
export type UseClientReceivedEmailContext = ReturnType<
  typeof createClientReceivedEmailContext
>;
