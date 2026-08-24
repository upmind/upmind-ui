/**
 * @fileoverview dLocal & Nicky payer-field collection tests
 *
 * ## Job To Be Done
 * dLocal and Nicky must relay the payer's contact details in
 * `payment_method_addition` when the payer has none on file. dLocal always
 * collects a document (country-specific label/format) and adds email/phone only
 * when the payer lacks them; Nicky collects email only. These tests guard the
 * schema-building logic that decides which fields render and are required.
 *
 * ## What Breaks If These Fail
 * - A payer who already has an email/phone is asked to re-enter it (needless
 *   friction), or a payer with none is never asked (the gateway rejects the pay).
 * - The dLocal document loses its country-specific label / format validation.
 */

import { describe, expect, it } from "vitest";
import {
  useSchema as dlocalSchema,
  useUischema as dlocalUischema
} from "../dlocal/schemas";
import { useSchema as nickySchema } from "../nicky/schemas";
import {
  getPayerEmail,
  payerNeedsEmail,
  payerNeedsPhone
} from "../payment-gateways.utils";
import type { GatewayContext } from "../payment-gateways.types";
import type { JsonSchema, Layout, UISchemaElement } from "@jsonforms/core";

// --- helpers

function ctx(client: unknown, currency = "ARS"): GatewayContext {
  return {
    ctx: "pay",
    supported: true,
    currency: { code: currency },
    client
  } as unknown as GatewayContext;
}

const pma = (schema: JsonSchema) => schema.properties.payment_method_addition;
const fieldKeys = (schema: JsonSchema): string[] | null =>
  pma(schema) ? Object.keys(pma(schema).properties).sort() : null;
const scopes = (uischema: Layout): string[] =>
  uischema.elements.map((e: UISchemaElement) => e.scope).filter(Boolean);

const guest = { is_guest: true };
const clientFull = {
  is_guest: false,
  email: "a@b.com",
  default_phone: { phone: "555" },
  location_country_code: "AR"
};
const clientNoEmail = {
  is_guest: false,
  default_phone: { phone: "555" },
  location_country_code: "AR"
};
const clientNoPhone = {
  is_guest: false,
  email: "a@b.com",
  location_country_code: "AR"
};
const clientDefaultEmailOnly = {
  is_guest: false,
  default_email: { email: "d@b.com" },
  default_phone: { phone: "555" },
  location_country_code: "AR"
};

// --- tests

describe("payer contact detection", () => {
  it("getPayerEmail prefers email, falls back to default_email", () => {
    expect(getPayerEmail(ctx(clientFull))).toBe("a@b.com");
    expect(getPayerEmail(ctx(clientDefaultEmailOnly))).toBe("d@b.com");
    expect(getPayerEmail(ctx(guest))).toBeUndefined();
  });

  it("payerNeedsEmail is true for a guest or a client with no email", () => {
    expect(payerNeedsEmail(ctx(guest))).toBe(true);
    expect(payerNeedsEmail(ctx(clientNoEmail))).toBe(true);
    expect(payerNeedsEmail(ctx(clientFull))).toBe(false);
  });

  it("payerNeedsPhone is true for a guest or a client with no default_phone", () => {
    expect(payerNeedsPhone(ctx(guest))).toBe(true);
    expect(payerNeedsPhone(ctx(clientNoPhone))).toBe(true);
    expect(payerNeedsPhone(ctx(clientFull))).toBe(false);
  });
});

describe("dLocal redirect schema — collect-if-missing", () => {
  it("guest collects document + email + phone", () => {
    expect(fieldKeys(dlocalSchema(ctx(guest)))).toEqual([
      "document",
      "email",
      "phone"
    ]);
  });

  it("client with email & phone collects document only", () => {
    expect(fieldKeys(dlocalSchema(ctx(clientFull)))).toEqual(["document"]);
  });

  it("client missing email collects document + email", () => {
    expect(fieldKeys(dlocalSchema(ctx(clientNoEmail)))).toEqual([
      "document",
      "email"
    ]);
  });

  it("client missing phone collects document + phone", () => {
    expect(fieldKeys(dlocalSchema(ctx(clientNoPhone)))).toEqual([
      "document",
      "phone"
    ]);
  });

  it("document is always required, even for a fully-populated client", () => {
    expect(pma(dlocalSchema(ctx(clientFull))).required).toContain("document");
  });

  it("document uses the country-specific label and format (AR/ARS)", () => {
    const doc = pma(dlocalSchema(ctx(guest))).properties.document;
    expect(doc.title).toBe("DNI / CUIT / CUIL");
    expect(doc.pattern).toBe("^(\\d{7,9}|\\d{11})$");
  });

  it("document format resolves from client.location_country_code, not currency", () => {
    // BR client paying in ARS → Brazilian document format, not Argentine
    const doc = pma(
      dlocalSchema(ctx({ is_guest: true, location_country_code: "BR" }, "ARS"))
    ).properties.document;
    expect(doc.pattern).toBe("^(\\d{11}|\\d{14})$");
  });

  it("uischema renders a control for each collected field", () => {
    const rendered = scopes(dlocalUischema(ctx(guest)));
    expect(rendered).toContain(
      "#/properties/payment_method_addition/properties/document"
    );
    expect(rendered).toContain(
      "#/properties/payment_method_addition/properties/email"
    );
    expect(rendered).toContain(
      "#/properties/payment_method_addition/properties/phone"
    );
  });
});

describe("Nicky schema — email only", () => {
  it("guest collects payment_method_addition.email (required)", () => {
    const schema = nickySchema(ctx(guest));
    expect(fieldKeys(schema)).toEqual(["email"]);
    expect(pma(schema).required).toEqual(["email"]);
  });

  it("client missing email collects email", () => {
    expect(fieldKeys(nickySchema(ctx(clientNoEmail)))).toEqual(["email"]);
  });

  it("client with an email gets no form (no payment_method_addition)", () => {
    expect(pma(nickySchema(ctx(clientFull)))).toBeUndefined();
  });

  it("never collects a document or phone", () => {
    expect(Object.keys(pma(nickySchema(ctx(guest))).properties)).toEqual([
      "email"
    ]);
  });
});
