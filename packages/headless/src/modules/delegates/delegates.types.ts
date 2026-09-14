import type { IClientDelegate, IDelegate } from "@upmind-automation/types";
// -----------------------------------------------------------------------------
/**
 * @module delegates/types
 * @description Delegate-management type definitions.
 * @see graphify-out/ for `IClientDelegate` / `IDelegate` provenance — FE-3041
 * confirmed via `graphify query "delegate invite accept hash client delegates"`
 * that no delegate module or mapped delegate type already exists in the tree.
 *
 * SCOPE OF THIS FILE (stub). FE-3041 (DG-2) owns the full delegates module —
 * owner CRUD, per-product and per-ticket scope mutations, accept-invite, and
 * the co-mingled visibility surface. What lands here is the narrow slice
 * FE-3036 needs to record a delegated `/self` by driving real services rather
 * than hand-rolled HTTP: invite, list, and accept. Everything else is DG-2's.
 */

/**
 * A delegate row as the owner sees it on its own account — the shape
 * `clients/{clientId}/delegates` returns.
 *
 * `active` is the invite lifecycle: `false` while the invitation is pending,
 * `true` once the invitee has accepted. A pending row is a first-class managed
 * state, not an error.
 */
export type Delegate = {
  id: IClientDelegate["id"];
  ownerClientId: IClientDelegate["owner_client_id"];
  clientId: IClientDelegate["client_id"];
  inviteEmail: IClientDelegate["invite_email"];
  publicName: IClientDelegate["public_name"];
  imageUrl: IClientDelegate["image_url"];
  isFullDelegate: IClientDelegate["is_full_delegate"];
  isAccepted: IClientDelegate["active"];
  delegatedProductCount: IClientDelegate["num_delegated_cps"];
  delegatedTicketCount: IClientDelegate["num_delegated_tickets"];
};

/**
 * What an owner sends to grant another party access.
 *
 * `fullDelegate` grants the whole account; the id lists grant only the named
 * records. The admin-only `skip_invite` / `delegate_client_id` direct-attach
 * path is deliberately NOT modelled — it is not a client-portal capability
 * (FE-3041 AC, FR-17/AC-15).
 */
export type DelegateInviteModel = {
  /** The invitee's email address. They need not already hold an account. */
  email: IClientDelegate["invite_email"];
  /** Grant the entire account rather than named records. */
  fullDelegate?: boolean;
  /** Grant only these contract products. */
  contractProductIds?: string[];
  /** Grant only these tickets. */
  ticketIds?: string[];
};

/**
 * The outcome of accepting an invitation.
 *
 * `objectType` discriminates what was granted — a single contract product, a
 * single ticket, or (when absent) the whole account — which is what drives the
 * confirmation copy and where the invitee is sent next.
 */
export type AcceptedDelegateInvite = {
  id: IDelegate["id"];
  clientId: IDelegate["client_id"];
  objectType?: IDelegate["object_type"];
  objectId?: IDelegate["object_id"];
  isAccepted: IDelegate["active"];
};
