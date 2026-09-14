/** @internal */
import { useQuery } from "../query";
import {
  mapAcceptedInvite,
  mapDelegate,
  mapDelegateInvite,
  mapDelegates
} from "./delegates.mappers";
import type {
  AcceptedDelegateInvite,
  Delegate,
  DelegateInviteModel
} from "./delegates.types";
import type { QueryKey } from "@tanstack/vue-query";
import type { IClientDelegate, IDelegate } from "@upmind-automation/types";
// -----------------------------------------------------------------------------
/**
 * @module delegates/delegates.services
 * @description Delegate grants, as the CLIENT PORTAL performs them: an owner
 * invites someone to its account, and the invitee accepts.
 *
 * SCOPE (stub — FE-3036). These three calls exist so the delegated-access
 * fixtures can be recorded by driving real services instead of hand-rolled
 * HTTP. FE-3041 (DG-2) owns the full module around them: the scoped composable,
 * per-product and per-ticket scope mutations, sub-resource reads, removal, and
 * the co-mingled visibility surface. Adding those here would pre-empt that
 * story's design, so they are deliberately absent rather than half-built.
 *
 * NOT MODELLED, deliberately: the admin `skip_invite` / `delegate_client_id`
 * direct-attach path. It is an admin capability, not a client-portal one, and
 * FE-3041's AC (FR-17/AC-15) bars exposing it.
 *
 * WARNING: Do not import directly from another module. Resolve via the module
 * barrel only (`@internal/no-cross-module-imports`).
 */
// -----------------------------------------------------------------------------

/** The module's base cache key. */
export const queryKey: QueryKey = ["client", "delegates"];

/**
 * The delegates an owner has granted on its own account.
 *
 * Includes rows whose invitation is still pending (`isAccepted: false`) — a
 * pending invite is a managed state the owner can see and act on, not an
 * absence.
 *
 * @param clientId - The OWNER's client id, whose account the grants are on
 * @returns The owner's delegate rows, accepted and pending alike
 */
export async function readClientDelegates(
  clientId: string
): Promise<Delegate[]> {
  const { get, useUrl } = useQuery();

  return get<IClientDelegate[], Delegate[]>({
    queryKey: [...queryKey, clientId],
    url: useUrl(`clients/${clientId}/delegates`),
    withAccessToken: true,
    select: mapDelegates,
    staleTime: 0
  });
}

/**
 * Invite someone to hold delegated access to the owner's account.
 *
 * The invitee need not already have an account. The API emails them an
 * invitation carrying the accept link; the grant does not take effect until
 * they accept, so the row this creates reads `isAccepted: false`.
 *
 * @param clientId - The OWNER's client id, whose account is being shared
 * @param model - Who to invite, and what to grant them
 * @returns The created delegate row, pending acceptance
 */
export async function inviteClientDelegate(
  clientId: string,
  model: DelegateInviteModel
): Promise<Delegate> {
  const { post, useUrl } = useQuery();

  // `post`/`patch` carry no `select` (only the query-shaped `get`/`list` do),
  // so the mapping happens here rather than in the request options.
  const raw = await post<IClientDelegate>({
    mutationKey: [...queryKey, clientId, "invite"],
    url: useUrl(`clients/${clientId}/delegates`),
    data: mapDelegateInvite(model),
    withAccessToken: true
  });

  return mapDelegate(raw);
}

/**
 * Accept a delegate invitation.
 *
 * Called by the INVITEE, authenticated as themselves — the hash is the
 * invitation's own credential and arrives in the invitation email, so it is the
 * caller's proof they were the one invited.
 *
 * On success the grant takes effect: the owner's row flips to accepted, and the
 * invitee's identity profile begins reporting the granted ids.
 *
 * @param hash - The invitation hash carried by the accept link
 * @returns What the invitee was granted
 */
export async function acceptDelegateInvite(
  hash: string
): Promise<AcceptedDelegateInvite> {
  const { patch, useUrl } = useQuery();

  const raw = await patch<IDelegate>({
    mutationKey: [...queryKey, "accept"],
    url: useUrl(`delegate_access/accept/${hash}`),
    withAccessToken: true
  });

  return mapAcceptedInvite(raw);
}
