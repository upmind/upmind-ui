// -----------------------------------------------------------------------------
/**
 * @fileoverview The payment domain renderers
 *
 * ## Job To Be Done
 * Each tester claims its own control, leaves its sibling's, and refuses other shapes.
 *
 * ## What Breaks If These Fail
 * The gateway field falls back to a bare enum, or an unrelated enum renders as a card list.
 */

import { describe, expect, it } from "vitest";
import { paymentRenderers } from "../index";
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";

// -----------------------------------------------------------------------------

const PAYMENT_DETAILS = 0;
const GATEWAYS = 1;

const RANK = 4;

const SCHEMA = {
  type: "object",
  properties: {
    payment_details_id: { type: "string", enum: ["stored-card", "new-card"] },
    gateway_id: { type: "string", enum: ["stripe", "paypal"] },
    country_id: { type: "string", enum: ["GB", "PT"] },
    reference: { type: "string" }
  }
} satisfies JsonSchema;

function control(property: string): UISchemaElement {
  return {
    type: "Control",
    scope: `#/properties/${property}`
  } as UISchemaElement;
}

function rankFor(index: number, uischema: UISchemaElement, schema = SCHEMA) {
  const entry = paymentRenderers[index];
  if (!entry) throw new Error(`no renderer entry at index ${index}`);
  return entry.tester(uischema, schema as JsonSchema, {
    rootSchema: schema as JsonSchema,
    config: {}
  });
}

describe("the payment renderer entries", () => {
  it("registers exactly two, payment-details before gateways", () => {
    expect(paymentRenderers).toHaveLength(2);
    for (const entry of paymentRenderers) {
      expect(Object.keys(entry).sort()).toEqual(["renderer", "tester"]);
      expect(entry.renderer).toBeTruthy();
    }
  });

  it("claims the stored-payment-method field for the payment-details renderer", () => {
    expect(rankFor(PAYMENT_DETAILS, control("payment_details_id"))).toBe(RANK);
  });

  it("claims the gateway field for the gateways renderer", () => {
    expect(rankFor(GATEWAYS, control("gateway_id"))).toBe(RANK);
  });

  it("keeps the two renderers off each other's field", () => {
    expect(rankFor(PAYMENT_DETAILS, control("gateway_id"))).toBe(-1);
    expect(rankFor(GATEWAYS, control("payment_details_id"))).toBe(-1);
  });

  it("leaves an unrelated enum field to the engine's own controls", () => {
    expect(rankFor(PAYMENT_DETAILS, control("country_id"))).toBe(-1);
    expect(rankFor(GATEWAYS, control("country_id"))).toBe(-1);
  });

  it("refuses a same-named field that offers the customer no choice", () => {
    const noChoice = {
      type: "object",
      properties: {
        payment_details_id: { type: "string" },
        gateway_id: { type: "string" }
      }
    } satisfies JsonSchema;

    expect(
      rankFor(PAYMENT_DETAILS, control("payment_details_id"), noChoice)
    ).toBe(-1);
    expect(rankFor(GATEWAYS, control("gateway_id"), noChoice)).toBe(-1);
  });

  it("refuses a layout that merely mentions the field", () => {
    const layout = {
      type: "VerticalLayout",
      elements: [control("gateway_id")]
    } as UISchemaElement;

    expect(rankFor(GATEWAYS, layout)).toBe(-1);
    expect(rankFor(PAYMENT_DETAILS, layout)).toBe(-1);
  });

  it("outranks the engine's own enum control, so it wins the field", () => {
    const engineEnumRank = 2;

    expect(rankFor(GATEWAYS, control("gateway_id"))).toBeGreaterThan(
      engineEnumRank
    );
    expect(
      rankFor(PAYMENT_DETAILS, control("payment_details_id"))
    ).toBeGreaterThan(engineEnumRank);
  });
});
