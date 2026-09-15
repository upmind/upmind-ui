/** @internal */
import { map } from "lodash-es";
import type { Delegate, DelegateInviteModel } from "./delegates.types";
import type { IClientDelegate } from "@upmind-automation/types";
// -----------------------------------------------------------------------------
/**
 * @module delegates/delegates.mappers
 * @description Wire ⇄ model mapping for the delegates module.
 *
 * WARNING: Do not import directly from another module. Resolve via the
 * module barrel only (`@internal/no-cross-module-imports`).
 */
// -----------------------------------------------------------------------------

/**
 * Map one owner-side delegate row.
 *
 * `active` is renamed to `isAccepted` deliberately: on the wire it reads as a
 * status flag, but the only thing it records is whether the invitee has taken
 * up the invitation. Naming it for that removes the "is this row switched off?"
 * misreading.
 */
export function mapDelegate(raw: IClientDelegate): Delegate {
  return {
    id: raw.id,
    ownerClientId: raw.owner_client_id,
    inviteEmail: raw.invite_email,
    publicName: raw.public_name,
    imageUrl: raw.image_url,
    isFullDelegate: !!raw.is_full_delegate,
    isAccepted: !!raw.active,
    delegatedProductCount: raw.num_delegated_cps,
    delegatedTicketCount: raw.num_delegated_tickets
  };
}

/** Map a list of owner-side delegate rows. */
export function mapDelegates(raw: IClientDelegate[]): Delegate[] {
  return map(raw, mapDelegate);
}

/**
 * Map the invite model onto the wire body.
 *
 * Only the keys the caller actually set are sent — an absent id list must not
 * be transmitted as an empty array, which the API would read as "grant nothing"
 * rather than "this grant is not scoped by that dimension".
 */
export function mapDelegateInvite(
  model: DelegateInviteModel
): Record<string, unknown> {
  return {
    delegate_email: model.email,
    ...(model.fullDelegate === undefined
      ? {}
      : { full_delegate: model.fullDelegate }),
    ...(model.contractProductIds
      ? { contract_product_ids: model.contractProductIds }
      : {}),
    ...(model.ticketIds ? { ticket_ids: model.ticketIds } : {})
  };
}
