// -----------------------------------------------------------------------------
/**
 * @fileoverview AC-7 — the tickets acting-for bar offers a contract-product PICKER
 *
 * ## Job To Be Done
 * The `useTickets` collection bar builds itself from two module-owned inputs:
 * `TICKETS_SCOPE_MATRIX` decides WHICH contexts each actor is offered, and the
 * client cell's `schemas.lookups` form decides HOW the offered context is drawn.
 * A client acting for one of their own contract products must be offered that
 * context on the client row alone, and it must render as a bound, searchable
 * lookup — not a bare id text box. This reads those two published inputs
 * directly, the same pair the running bar consumes, so no mount or fetch is
 * needed to prove the capability.
 *
 * ## What Breaks If These Fail
 * The bar offers "Product" but paints a dead id box (or offers nothing at all),
 * so a client cannot pick a product to narrow their ticket list — the whole
 * client-facing half of AC-7 is inert.
 */

import { describe, expect, it } from "vitest";
import {
  ScopeActorTypes,
  TICKETS_SCOPE_MATRIX,
  TicketsContextTypes,
  useTickets
} from "@upmind-automation/headless";
import { servesContext } from "../../../app/composables/scope";
import { find, get, isFunction, keys } from "lodash-es";

// -----------------------------------------------------------------------------

const PRODUCT = TicketsContextTypes.CONTRACT_PRODUCT;
const PRODUCT_SCOPE = `#/properties/${PRODUCT}`;

const lookupsForm = () =>
  useTickets().as(ScopeActorTypes.CLIENT).useContext().schemas.lookups;

const productControl = () =>
  find(
    get(lookupsForm(), "uischema.elements"),
    element => get(element, "scope") === PRODUCT_SCOPE
  );

// -----------------------------------------------------------------------------

describe("the tickets bar offers contract-product on the client actor only", () => {
  it("offers the contract-product context to a client acting for their product", () => {
    expect(
      servesContext(TICKETS_SCOPE_MATRIX, ScopeActorTypes.CLIENT, {
        type: PRODUCT
      })
    ).toBe(true);
  });

  it("refuses that context to the staff and guest actors", () => {
    expect(
      servesContext(TICKETS_SCOPE_MATRIX, ScopeActorTypes.STAFF, {
        type: PRODUCT
      })
    ).toBe(false);
    expect(
      servesContext(TICKETS_SCOPE_MATRIX, ScopeActorTypes.GUEST, {
        type: PRODUCT
      })
    ).toBe(false);
  });

  it("rides no other context type on the client row", () => {
    expect(
      servesContext(TICKETS_SCOPE_MATRIX, ScopeActorTypes.CLIENT, {
        type: "contract"
      })
    ).toBe(false);
  });
});

describe("the offered context is drawn as a bound picker, not a dead id box", () => {
  it("keys the lookup form by the contract-product context and nothing else", () => {
    expect(keys(get(lookupsForm(), "schema.properties"))).toStrictEqual([
      PRODUCT
    ]);
  });

  it("draws the product control as a bound lookup searched by the service identifier", () => {
    const control = productControl();

    expect(get(control, "type")).toBe("Lookup");
    expect(isFunction(get(control, "options.lookup.service"))).toBe(true);
    expect(get(control, "options.lookup.searchScope")).toBe(
      "filters.service_identifier.like"
    );
  });
});
