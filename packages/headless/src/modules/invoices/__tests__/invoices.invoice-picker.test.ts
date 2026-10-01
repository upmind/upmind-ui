/**
 * @fileoverview invoices — the invoice-picker schema + uischema (single-control finder)
 *
 * ## Job To Be Done
 * Prove, off the module's LIVE published `schemas.invoicePicker`, that the
 * invoice finder is ONE Lookup control over a single nullable `invoice` id —
 * the counterpart of tickets' `schemas.ticketPicker`. The schema declares
 * exactly that one property and forbids any other; the uischema lays out
 * exactly one lookup control scoped to it, labelled `form.invoice_picker`,
 * searching by invoice number (`filters.number.like`), and bound to a lookup
 * service of the picker's OWN — never `lookups.invoice`, the credited-parents
 * lookup that narrows with `filter[partial_amount_credited|gt]`. The picker
 * finds ANY of the scope's invoices, so its service must be a different
 * reference from the credited-parents one.
 *
 * ## What Breaks If These Fail
 * The finder grows a second control (client, contract, contract-product or
 * parent-invoice) and stops being a single-field finder, or it re-uses the
 * credited-parents lookup so a client can only ever find the small set of
 * credited invoices instead of any invoice they hold.
 */

import { describe, expect, it } from "vitest";
import { unref } from "vue";
import { useInvoices } from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import { keys } from "lodash-es";

type LookupControl = {
  type: string;
  scope: string;
  i18n: string;
  options?: { lookup?: { service?: unknown; searchScope?: string } };
};

const ctx = useInvoices().as(ScopeActorTypes.CLIENT).useContext() as {
  schemas: { invoicePicker: { schema: unknown; uischema: unknown } };
  lookups: { invoice: unknown };
};

const schema = unref(ctx.schemas.invoicePicker.schema) as {
  properties: Record<string, { type: unknown }>;
  additionalProperties: unknown;
};
const uischema = unref(ctx.schemas.invoicePicker.uischema) as {
  elements: LookupControl[];
};
const controls = uischema.elements;

// -----------------------------------------------------------------------------

describe("invoices invoice picker — the schema is one nullable invoice id", () => {
  it("declares exactly one property, `invoice`, and forbids any other", () => {
    expect(keys(schema.properties)).toEqual(["invoice"]);
    expect(schema.additionalProperties).toBe(false);
  });

  it("types the invoice id as a nullable string", () => {
    expect(schema.properties.invoice.type).toEqual(["string", "null"]);
  });
});

describe("invoices invoice picker — the uischema is one number-searching lookup control", () => {
  it("lays out exactly ONE control, scoped to the invoice id — no client, contract, contract-product or parent-invoice control beside it", () => {
    expect(controls).toHaveLength(1);
    expect(controls[0]!.scope).toBe("#/properties/invoice");
  });

  it("is a Lookup control, labelled form.invoice_picker, searching by invoice number", () => {
    const control = controls[0]!;
    expect(control.type).toBe("Lookup");
    expect(control.i18n).toBe("form.invoice_picker");
    expect(control.options?.lookup?.searchScope).toBe("filters.number.like");
  });

  it("drives its OWN lookup over all the scope's invoices, never the credited-parents lookup `lookups.invoice`", () => {
    const service = controls[0]!.options?.lookup?.service;
    expect(typeof service).toBe("function");
    expect(typeof ctx.lookups.invoice).toBe("function");
    expect(service).not.toBe(ctx.lookups.invoice);
  });
});
