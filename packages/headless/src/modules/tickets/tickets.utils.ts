/** @internal */
// -----------------------------------------------------------------------------
/**
 * @module tickets/tickets.utils
 * @description The module's own request-shaping helpers — the pieces
 * `tickets.services.ts` reaches for while building a url, kept out of it
 * because a services file holds request functions and factories, nothing else.
 *
 * Each is here because the query core cannot spell it: the status narrowing
 * and the product scope are wire keys this API has and no SCHEMA declares, so
 * only the module can write them.
 */

import { TicketStatusCodes } from "@upmind-automation/types";
import { TicketsContextTypes } from "./tickets.types";
import type { ScopeContext } from "../scope";

// -----------------------------------------------------------------------------

/**` defect, out of scope
 * here).
 */
export function applyStatusCodeFilter(
  url: URL,
  isClosed: boolean | null
): void {
  url.searchParams.delete("filter[status.code]");
  url.searchParams.delete("filter[status.code|neq]");

  if (isClosed === true)
    url.searchParams.set("filter[status.code]", TicketStatusCodes.CLOSED);
  else if (isClosed === false)
    url.searchParams.set("filter[status.code|neq]", TicketStatusCodes.CLOSED);
}

/**
 * AC-7 — the PRODUCT scope context as the wire key the API has, written onto
 * the request's own `url` exactly as {@link applyStatusCodeFilter} writes the
 * status narrowing.
 *
 * | the scope                        | the wire                                |
 * | -------------------------------- | --------------------------------------- |
 * | `.for('product', id)`            | `filter[contract_product_id]=<id>`      |
 * | no context                       | the key is absent                       |
 *
 * The product a ticket is about is a RELATIONSHIP, so it is a scope context
 * and not a criteria filter column (`tickets.types.ts`'s
 * `TicketsContextTypes`). Only the module can spell the translation: the
 * context's own word is the platform's (`product`, ADR-001 § 3), the wire's
 * is this API's (`contract_product_id`), and the query core only ever writes
 * keys a SCHEMA declared — which is why the column is gone from
 * `useQuerySchema` and no `filter[contract_product_id]` stray can be minted
 * beside this one.
 *
 * Written ONCE, not watched: a scope context is fixed for the life of the
 * instance the scope key mints, so there is no second value to swap to. That
 * is also why the narrowing cannot be widened away — no `setCriteria` write
 * can reach it (AC-7's second Then).
 */
export function applyProductScopeFilter(
  url: URL,
  contractProductId?: string
): void {
  if (contractProductId)
    url.searchParams.set("filter[contract_product_id]", contractProductId);
}

/**
 * The contract product a PRODUCT-scoped read is about, or `undefined` when
 * the scope names no context. Sibling of the `ticketId` resolution in
 * {@link createTicketsServices} — one place each context type is read.
 */
export function resolveContractProductId(
  scopeContext: ScopeContext | undefined
): string | undefined {
  return scopeContext?.type === TicketsContextTypes.PRODUCT
    ? scopeContext.id
    : undefined;
}
