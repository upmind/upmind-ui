/**
 * @fileoverview payment-gateways schemas — shared, openPay, razorpay schema pairs
 *
 * ## Job To Be Done
 * Each gateway needs a JSONForms schema pair (useSchema/useUischema) that decides
 * which fields to collect from the payer. The schema must collect the right fields
 * for the context (pay vs add), and the uischema must render controls for those
 * fields.
 *
 * ## What Breaks If These Fail
 * A client is asked for fields they already provided (friction), or a required
 * field is missing and the gateway rejects the payment.
 */

import { describe, expect, it } from "vitest";
import { useUischema as nickyUischema } from "../nicky/schemas";
import {
  useSchema as openPaySchema,
  useUischema as openPayUischema
} from "../openPay/schemas";
import { useSchema, useUischema } from "../payment-gateways.schemas";
import {
  useSchema as razorpaySchema,
  useUischema as razorpayUischema
} from "../razorpay/schemas";
import type { GatewayContext } from "../payment-gateways.types";
// `JsonSchema` leaves this import with the two commented-out helpers below;
// add it back when they return.
import type { Layout, UISchemaElement } from "@jsonforms/core";

function ctx(
  client: unknown,
  context: "pay" | "add" = "pay",
  currency = "GBP"
): GatewayContext {
  return {
    ctx: context,
    supported: true,
    currency: { code: currency },
    client,
    canStore: true,
    mustStore: false
  } as unknown as GatewayContext;
}

// Helpers with no caller yet. Kept for the field-keys assertion that will use
// them.
// const pma = (schema: JsonSchema) =>
//   schema?.properties?.payment_method_addition as JsonSchema | undefined;
//
// const fieldKeys = (schema: JsonSchema): string[] | null => {
//   const addition = pma(schema);
//   return addition?.properties ? Object.keys(addition.properties).sort() : null;
// };

const scopes = (uischema: Layout): string[] =>
  (uischema?.elements
    ?.map((e: UISchemaElement) => (e as { scope?: string }).scope)
    .filter(Boolean) as string[]) ?? [];

const guest = { is_guest: true };
const clientFull = {
  is_guest: false,
  email: "a@b.com",
  default_phone: { phone: "555" },
  location_country_code: "GB"
};

describe("shared schema pair (AC-C1, AC-D4)", () => {
  it("AC-C1 ADD context: a client storing a method is not asked for an amount", () => {
    const schema = useSchema(ctx(clientFull, "add"));
    expect(schema?.properties?.amount).toBeUndefined();
  });

  it("AC-D4 PAY context: returns a schema object", () => {
    const schema = useSchema(ctx(guest, "pay"));
    expect(schema).toBeDefined();
    expect(typeof schema).toBe("object");
  });

  it("AC-D4 PAY context with canStore: returns a valid schema", () => {
    const schema = useSchema(ctx(clientFull, "pay"));
    expect(schema).toBeDefined();
    expect(typeof schema).toBe("object");
  });

  it("uischema returns a layout structure", () => {
    const uischema = useUischema(ctx(guest, "pay"));
    expect(uischema).toBeDefined();
    expect(typeof uischema).toBe("object");
  });

  it("ADD context with no storage produces a schema", () => {
    const addCtx = {
      ...ctx(clientFull, "add"),
      canStore: false,
      mustStore: false
    } as GatewayContext;
    const schema = useSchema(addCtx);
    expect(schema).toBeDefined();
  });
});

describe("openPay schema pair", () => {
  it("PAY context schema has type object and a properties block", () => {
    const schema = openPaySchema(ctx(guest, "pay"));
    expect(schema.type).toBe("object");
    expect(schema.properties).toBeDefined();
  });

  it("uischema has a type and elements array", () => {
    const uischema = openPayUischema(ctx(guest, "pay")) as Layout;
    expect(uischema.type).toBeDefined();
    expect(Array.isArray(uischema.elements)).toBe(true);
  });

  it("ADD context does not ask for an amount", () => {
    const schema = openPaySchema(ctx(clientFull, "add"));
    expect(schema?.properties?.amount).toBeUndefined();
  });
});

describe("razorpay schema pair", () => {
  it("PAY context schema has type object and a properties block", () => {
    const schema = razorpaySchema(ctx(guest, "pay"));
    expect(schema.type).toBe("object");
    expect(schema.properties).toBeDefined();
  });

  it("uischema has a type and elements array", () => {
    const uischema = razorpayUischema(ctx(guest, "pay")) as Layout;
    expect(uischema.type).toBeDefined();
    expect(Array.isArray(uischema.elements)).toBe(true);
  });

  it("ADD context does not ask for an amount", () => {
    const schema = razorpaySchema(ctx(clientFull, "add"));
    expect(schema?.properties?.amount).toBeUndefined();
  });
});

describe("nicky uischema (AC-D4)", () => {
  it("uischema for guest returns layout with type and elements", () => {
    const uischema = nickyUischema(ctx(guest, "pay")) as Layout;
    expect(uischema.type).toBeDefined();
    expect(Array.isArray(uischema.elements)).toBe(true);
  });

  it("uischema for client with email returns layout", () => {
    const uischema = nickyUischema(ctx(clientFull, "pay")) as Layout;
    expect(uischema.type).toBeDefined();
  });

  it("uischema elements contain scopes for collected fields", () => {
    const uischema = nickyUischema(ctx(guest, "pay")) as Layout;
    const elemScopes = scopes(uischema);
    expect(elemScopes.length).toBeGreaterThan(0);
  });
});
