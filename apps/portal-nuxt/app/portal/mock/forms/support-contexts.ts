// -----------------------------------------------------------------------------
/**
 * @module portal/mock/forms/support-contexts
 * @description What the support pillar's schema modules are handed (plan F4)
 * — the desks the brand publishes and the products this client holds, from
 * the live dataset. Which of them the new-ticket form draws a control for is
 * the SCHEMA's call; this only states the facts it decides on.
 */

import { newLineKey, submitsWithShortcut } from "../facades";
import { map } from "lodash-es";
import type {
  SupportPreferencesContext,
  TicketFormContext,
  TicketMessageContext,
  TicketRelatedProductContext
} from "../contracts/client-tickets";
import type { DataRouteContext } from "../injection";
import type { MockDataset, MockTicket, MockTicketMessage } from "../types";

/**
 * What `client-tickets`'s own new-ticket builders are handed. The product the
 * client arrived about rides in the route (`/support/tickets/new?product=`),
 * so a thread opened from a product's assistance link opens on that product.
 */
export function ticketFormContext(
  data: MockDataset,
  context: DataRouteContext
): TicketFormContext {
  return {
    departments: map(data.departments, department => ({
      id: department.id,
      name: department.name
    })),
    products: map(data.products, product => ({
      id: product.id,
      name: product.name
    })),
    productId: context.productId,
    canSchedule: data.features.CLIENT_TICKET_SCHEDULING_ENABLED
  };
}

/**
 * What the composer's post-options form is handed — what the two keys do for
 * this client today, which is their own answer where they have given one and
 * the brand's `UI_ENTER_KEY_ACTION` until they do.
 */
export function supportPreferencesContext(
  data: MockDataset
): SupportPreferencesContext {
  return {
    submitWithShortcut: submitsWithShortcut(data),
    newLineKey: newLineKey(data)
  };
}

/**
 * What `client-tickets`'s own message-edit builders are handed — the message
 * as it reads now, which is what legacy's inline editor opened on.
 */
export function ticketMessageContext(
  message: MockTicketMessage
): TicketMessageContext {
  return { body: message.body };
}

/**
 * What `client-tickets`'s own related-product builders are handed — the
 * products this client holds, and the one the thread already names, which is
 * the selection legacy's picker opened on.
 */
export function ticketRelatedProductContext(
  data: MockDataset,
  ticket: MockTicket
): TicketRelatedProductContext {
  return {
    products: map(data.products, product => ({
      id: product.id,
      name: product.name
    })),
    productId: ticket.productId
  };
}
