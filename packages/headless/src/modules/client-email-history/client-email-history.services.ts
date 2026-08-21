/** @internal */
import { keepPreviousData } from "@tanstack/vue-query";
import { computed } from "vue";
import { useQuery } from "../query";
import { useActiveSession } from "../session-store";
import {
  mapEmailHistory,
  mapReceivedEmail
} from "./client-email-history.mappers";
import { useQuerySchema } from "./client-email-history.schemas";
import { ReceivedEmailsContextTypes } from "./client-email-history.types";
import { useTime, NotAuthenticatedError } from "../../utils";
import type { ScopeContext } from "../scope";
import type {
  ClientEmailHistoryServices,
  ReceivedEmailItemQuery,
  ReceivedEmailsListQuery,
  SentEmail,
  SentEmailQueryModel
} from "./client-email-history.types";
import type { ResponseError } from "../../utils";
import type { ScopeActorTypes } from "../scope/scope.types";
import type { QueryKey } from "@tanstack/vue-query";
import type { ISentEmail } from "@upmind-automation/types";
// -----------------------------------------------------------------------------
/**
 * @module client-email-history/client-email-history.services
 * @description The ONE services file both halves consume — the collection's
 * `loadList` and the single read's `loadOne`. One factory on purpose: one
 * identity seam, one cache key, one arm-resolution switch, so the two
 * composables can never disagree about whose history is being read.
 *
 * Nothing here raises feedback. A failure rejects for the caller and lands in
 * the scope's own error state, which the composables expose.
 *
 * WARNING: Do not import directly from another module. Resolve via
 * `useClientReceivedEmails.ts` / `useClientReceivedEmail.ts` only
 * (`@internal/no-cross-module-imports`).
 */
// -----------------------------------------------------------------------------

/** The module's base cache key. Unchanged from the oracle. */
export const queryKey: QueryKey = ["client", "emailHistory"];

/**
 * Derives the target client from the RESOLVED scope — the ONE seam every
 * request-issuing function in this file shares.
 *
 * The collection's context names the CLIENT whose history is read; with no
 * context it falls back to the active session's own client (the self case).
 * The single read declares no context type at all — which email is read is a
 * record id, carried by `.withId(id)` — so it takes the same fall-through and
 * resolves the session's own client, which is correct: an email's owner is not
 * the actor's scope.
 *
 * This compares the CONTEXT the scope builder resolved, never the actor, so
 * it is not a branch on `ScopeActorTypes.SELF` (variance-law clause 4).
 */
function resolveClientId(scopeContext?: ScopeContext) {
  const { activeUser } = useActiveSession().useContext();

  return computed(() =>
    scopeContext?.type === ReceivedEmailsContextTypes.CLIENT
      ? scopeContext.id
      : activeUser.value?.id
  );
}

/**
 * @decision
 * what:     Both composables gate on ONE addressability predicate —
 *           isAddressable(clientId) = isAuthenticated && !!clientId —
 *           exposed reactively as `service.isAvailable`. The single read
 *           gains the `guard` + `enabled` it does not have in the oracle;
 *           the oracle's hardcoded `isAvailable: true` is removed.
 *
 * why:      (1) The oracle's asymmetry is not a capability. The single-read
 *               endpoint already sends `withAccessToken: true`, so an
 *               unauthenticated call 401s on the wire — `isAvailable: true`
 *               advertises an availability the wire denies. Unifying
 *               removes a lie, not a feature.
 *           (2) One predicate is the only way the flag a consumer RENDERS
 *               and the gate the WIRE enforces cannot drift apart (the
 *               `client-email` receipt: `service.isAvailable` IS the
 *               function the `enabled`/`guard` call, not a second copy of
 *               it).
 *           (3) Both composables serve the SAME ADR-001 cell (client x
 *               self). Two different answers to "is this mine to read?"
 *               inside one cell is incoherent for a consumer that renders
 *               both surfaces from one page.
 *           (4) It makes AC-18's whole-module negative control possible at
 *               all: a module-wide "no request without an authenticated
 *               client session" claim cannot be proven while one half is
 *               ungated.
 *
 * rejected: Preserve the asymmetry (leave the single read ungated).
 *           Rejected because it keeps an unguarded, token-bearing request
 *           path whose only outcome on an unauthenticated session is a raw
 *           401 the consumer must interpret, and because it would force
 *           AC-18 to be scoped to half the module — a negative control with
 *           a hole in it is the FE-2824 shape.
 *
 *           Also rejected: gate the single read on `isAuthenticated` alone
 *           (without the resolved-client half). That reintroduces the drift
 *           D2 exists to close, and reproduces the readiness hazard NFR-3
 *           names — a session that authenticates without ever resolving a
 *           client id would leave the query permanently disabled and a
 *           readiness wait pending forever.
 */
function isAddressable(clientId?: string): boolean {
  const { isAuthenticated } = useActiveSession().useMeta();

  return isAuthenticated.value && !!clientId;
}

/**
 * COLLECTION — the reactive list query, minted once per scope.
 *
 * The URL stays `self/email_history` regardless of the resolved client — the
 * endpoint is self-shaped and takes no client id, so `resolveClientId` here
 * supplies the addressability predicate and the cache-key partition, not a
 * path segment (design D1's documented divergence).
 *
 * The whole request state is the DECLARED query schema: `list()` builds the
 * criteria from it and publishes filters/sort/pagination back on the handle,
 * so there is no raw `sort`/`filters`/`pagination` param beside it.
 */
function loadList(scopeContext?: ScopeContext): ReceivedEmailsListQuery {
  const { list, useUrl } = useQuery();
  const clientId = resolveClientId(scopeContext);

  return list<ISentEmail[], SentEmail[], SentEmailQueryModel>({
    criteria: { schema: useQuerySchema() },
    queryKey: [...queryKey, { client: clientId }],
    url: useUrl("self/email_history", {
      with: ["recipient", "recipient_type", "recipient.image"].join(",")
    }),
    withAccessToken: true,
    guard: async () =>
      new Promise((resolve, reject) => {
        if (!isAddressable(clientId.value)) {
          reject(new NotAuthenticatedError());
          return;
        }
        resolve(true);
      }),
    enabled: () => isAddressable(clientId.value),
    select: mapEmailHistory,
    staleTime: useTime().DAY,
    placeholderData: keepPreviousData
  });
}

/**
 * SINGLE READ — the reactive item query, minted once per scope. Reactive,
 * not a one-shot promise — the oracle's `data`/`error`/`refresh` are
 * reactive and `EmailOverview.vue` renders them.
 */
function loadOne(
  emailId?: SentEmail["id"],
  scopeContext?: ScopeContext
): ReceivedEmailItemQuery {
  const { query, useUrl } = useQuery();
  const clientId = resolveClientId(scopeContext);

  return query<ISentEmail, SentEmail>({
    queryKey: [...queryKey, "email", emailId, { client: clientId }],
    url: useUrl(`emails/${emailId}`, { with: "data" }),
    withAccessToken: true,
    guard: async () =>
      new Promise((resolve, reject) => {
        if (!emailId || !isAddressable(clientId.value)) {
          reject(new NotAuthenticatedError());
          return;
        }
        resolve(true);
      }),
    enabled: () => !!emailId && isAddressable(clientId.value),
    select: mapReceivedEmail,
    staleTime: useTime().DAY
  });
}

// -----------------------------------------------------------------------------
// Scope-Ready Services

/**
 * Services factory — the concrete actor and the context it acts upon arrive
 * first, at construction. `useClientReceivedEmails.ts` calls it once and so
 * does `useClientReceivedEmail.ts`, each with ITS OWN resolved scope, so the
 * two instances share no mutable state.
 *
 * `_scopeActor` is unused today — with a single resolving actor (`client`)
 * in both matrices (D6), there is no per-actor member to select. Kept in the
 * signature so a future arm can switch on it without a call-site change.
 */
export const createClientEmailHistoryServices = (
  _scopeActor: ScopeActorTypes,
  scopeContext?: ScopeContext
): ClientEmailHistoryServices => {
  const clientId = resolveClientId(scopeContext);

  return {
    queryKey,
    clientId,
    isAvailable: computed(() => isAddressable(clientId.value)),
    error: computed<ResponseError | undefined>(() => undefined),
    loadList: () => loadList(scopeContext),
    loadOne: emailId => loadOne(emailId, scopeContext)
  };
};

export default createClientEmailHistoryServices;
