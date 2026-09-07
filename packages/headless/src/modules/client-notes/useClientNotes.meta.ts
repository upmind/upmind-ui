import { computed } from "vue";
import { isEmpty } from "lodash-es";
import type {
  ClientNoteListQuery,
  ClientNoteServices
} from "./client-notes.types";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module client-notes/useClientNotes.meta
 * @description Collection meta — computed state flags, one computed per
 * flag.
 * @doctrine clause 2 — shared-only (armless). No per-actor capability
 * read-state exists (the oracle's `$userCan` gates are constant-true for a
 * client, row S6), so `meta` legitimately stays shared-only.
 */
export function createClientNotesMeta(
  _actorScope: ScopeActorTypes,
  service: ClientNoteServices,
  query: ClientNoteListQuery
) {
  // Truthiness, not `isEmpty`: a TanStack error is an `Error` instance with no
  // own enumerable keys, which `isEmpty` reports as empty. Includes
  // `query.criteriaError` (W5) — an invalid `setCriteria` populates `error`
  // (`context.ts`) without this, the `client-address` sibling precedent.
  const hasError = computed(
    () =>
      !!service.error.value ||
      !!query.error.value ||
      !!query.criteriaError.value
  );

  const isEmptyList = computed(() => isEmpty(query.data?.value));

  const isLoading = computed(
    () => query.isLoading.value || !query.isFetched.value
  );

  // --- actor-specific meta: none earned yet (clause 2). When a scope earns
  // one, add `useClientNotes.meta.{actor}.ts` and spread it LAST.

  return {
    /** True if a row mutation or the list query failed. */
    hasError,

    /**
     * True while this scope can address a client — authenticated, with a
     * resolved client id, and the brand's vault feature switched on. Handed
     * straight through from the services instance: this IS the predicate the
     * request gates call, not a second copy of it (row C14).
     */
    isAvailable: service.isAvailable,

    /**
     * True for a staged-import client — reads still work; every write action
     * refuses (row C15).
     */
    isDisabled: service.isDisabled,

    /** True if this scope's vault has no assets. */
    isEmpty: isEmptyList,

    /** True while the list is loading or has not completed its first fetch. */
    isLoading

    // The arm merges in HERE, last.
  };
}

// Type export for consumers
export type UseClientNotesMeta = ReturnType<typeof createClientNotesMeta>;
