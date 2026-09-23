// -----------------------------------------------------------------------------
/**
 * @fileoverview useContractProduct(s) action + query schemas — the labs editor's
 * forms for setConsolidation and scheduleCancellation, and the products query
 * schema (integration; ruling R28 amendment 2026-09-23, decisions D8/D12)
 *
 * ## Job To Be Done
 * Ruling R28 publishes one schema/uischema pair per model-taking write on
 * `useContractProduct().useContext().schemas.<action>`, and the products query
 * schema on `useContractProducts().useContext().schemas.query`. This suite
 * drives the REAL manager and collection against recorded captures and proves:
 *  - `setConsolidation`: `invoiceConsolidationEnabled` is an INTEGER `enum` of
 *    exactly [ENABLED, DISABLED, INHERIT] — no `oneOf`, no `options` (D8, a real
 *    enum with i18n value labels; `oneOf` leaks memory); its uischema is a
 *    button-group control keyed to `form.contract_product_invoice_consolidation`
 *    whose `defaultOptionValue` is INHERIT (un-pressing writes INHERIT).
 *  - `scheduleCancellation`: `futureCancellationDate` is a required date whose
 *    `formatMinimum` and `default` are the manager's live
 *    `minFutureCancellationDate`; `reason` is a string.
 *  - the products query schema's `sort.field` is a PLAIN `enum`
 *    [status, created_at, next_due_date, cancelled_date] with no `oneOf`
 *    anywhere (D12).
 * The published schemas are compiled with the repo's own AJV
 * (`utils/useValidation`, `formatMinimum` supported) and shown to accept a
 * correct model and reject an invalid one — a consolidation value outside the
 * enum, a date before the floor, a sort field outside the four.
 *
 * ## Provenance
 * The cancellation floor asserted here is read back off the manager's OWN
 * published `minFutureCancellationDate`, derived from the module's recorded
 * `get-contract-products-id` capture — never a literal.
 *
 * ## What Breaks If These Fail
 * The consolidation control re-grows a memory-leaking `oneOf`, or un-pressing
 * stops writing INHERIT; the cancellation form lets a client book a date the
 * platform forbids; or the sort control offers a column the API answers 500 to.
 */

import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { unref } from "vue";
import { InvoiceConsolidationTypes } from "@upmind-automation/types";
import { useContractProduct, useContractProducts } from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import {
  installBackgroundStubs,
  installProductHandler,
  recorded,
  seedClientSession
} from "./contract-product.int-helpers";
import { server } from "./setup.integration";
import { useValidation } from "../../../utils";
import type { ErrorObject } from "ajv";

// -----------------------------------------------------------------------------

type Validator = ((data: unknown) => boolean) & {
  errors?: ErrorObject[] | null;
};

function compile(schema: unknown): Validator {
  const { ajv } = useValidation() as unknown as {
    ajv: { compile: (schema: object) => Validator };
  };
  return ajv.compile(schema as object);
}

async function openManager() {
  await seedClientSession();
  installProductHandler(server);
  // The schedule-cancellation form composes the CANCEL_REQUEST custom-field
  // catalogue; this brand carries none (empty) — the ABSENT-customFields case
  // asserted below. Stub it so that case is deterministic and its background
  // read never bleeds into a sibling test.
  server?.use(
    http.get("*/clients/:id", () =>
      HttpResponse.json({ status: "ok", data: { custom_fields: [] } })
    )
  );
  const row = recorded.one().data;
  const manager = useContractProduct()
    .as(ScopeActorTypes.CLIENT)
    .withId(row.id);
  await manager.useActions().isReady();
  return manager;
}

async function openCollection() {
  await seedClientSession();
  installBackgroundStubs();
  server?.use(
    http.get("*/contracts_products", () =>
      HttpResponse.json(recorded.list(), { status: 200 })
    )
  );
  const collection = useContractProducts().as(ScopeActorTypes.CLIENT);
  await collection.useActions().isReady();
  return collection;
}

type JsonSchema = {
  required?: string[];
  properties?: Record<string, Record<string, unknown>>;
};

type UiSchema = {
  elements?: {
    scope?: string;
    i18n?: string;
    options?: Record<string, unknown>;
  }[];
};

// -----------------------------------------------------------------------------

describe("useContractProduct schemas.setConsolidation — a real enum, never a oneOf (AC-9, D8)", () => {
  it("declares invoiceConsolidationEnabled as an integer enum of ENABLED/DISABLED/INHERIT, with no oneOf and no options", async () => {
    const manager = await openManager();
    const schema = manager.useContext().schemas.setConsolidation.schema
      .value as JsonSchema;

    expect(schema.required).toEqual(["invoiceConsolidationEnabled"]);
    const prop = schema.properties?.invoiceConsolidationEnabled as {
      type: string;
      enum: number[];
      oneOf?: unknown;
      options?: unknown;
    };
    expect(prop.type).toBe("integer");
    expect(prop.enum).toEqual([
      InvoiceConsolidationTypes.ENABLED,
      InvoiceConsolidationTypes.DISABLED,
      InvoiceConsolidationTypes.INHERIT
    ]);
    expect(prop.oneOf).toBeUndefined();
    expect(prop.options).toBeUndefined();
    expect(JSON.stringify(schema)).not.toContain("oneOf");
  });

  it("lays out a button-group control whose un-pressed value is INHERIT", async () => {
    const manager = await openManager();
    const uischema = manager.useContext().schemas.setConsolidation.uischema
      .value as UiSchema;
    const control = (uischema.elements ?? []).find(
      element => element.scope === "#/properties/invoiceConsolidationEnabled"
    );

    expect(control?.i18n).toBe("form.contract_product_invoice_consolidation");
    expect(control?.options?.format).toBe("button-group");
    expect(control?.options?.defaultOptionValue).toBe(
      InvoiceConsolidationTypes.INHERIT
    );
  });

  it("compiles: each of the three positions validates, a value outside the enum is rejected (AJV, D8)", async () => {
    const manager = await openManager();
    const validate = compile(
      manager.useContext().schemas.setConsolidation.schema.value
    );

    for (const value of [
      InvoiceConsolidationTypes.ENABLED,
      InvoiceConsolidationTypes.DISABLED,
      InvoiceConsolidationTypes.INHERIT
    ]) {
      expect(validate({ invoiceConsolidationEnabled: value })).toBe(true);
    }
    expect(validate({ invoiceConsolidationEnabled: 7 })).toBe(false);
  });
});

describe("useContractProduct schemas.scheduleCancellation — the floor the product allows (AC-22, D12)", () => {
  it("requires futureCancellationDate as a date floored and defaulted to the live minFutureCancellationDate", async () => {
    const manager = await openManager();
    const floor = manager.useContext().minFutureCancellationDate.value;
    const schema = manager.useContext().schemas.scheduleCancellation.schema
      .value as JsonSchema;

    expect(floor).toBeTruthy();
    expect(schema.required).toEqual(["futureCancellationDate"]);
    const prop = schema.properties?.futureCancellationDate as {
      type: string;
      format: string;
      formatMinimum: string;
      default: string;
    };
    expect(prop.format).toBe("date");
    expect(prop.formatMinimum).toBe(floor);
    expect(prop.default).toBe(floor);
    expect(schema.properties?.reason?.type).toBe("string");
  });

  it("omits customFields without a CANCEL_REQUEST catalogue loaded (D5, D11)", async () => {
    const manager = await openManager();
    const schema = manager.useContext().schemas.scheduleCancellation.schema
      .value as JsonSchema;

    expect(schema.properties?.customFields).toBeUndefined();
  });

  it("compiles: a date on/after the floor validates, a date before it is rejected (AJV formatMinimum)", async () => {
    const manager = await openManager();
    const floor = manager.useContext().minFutureCancellationDate
      .value as string;
    const validate = compile(
      manager.useContext().schemas.scheduleCancellation.schema.value
    );
    const before = new Date(new Date(floor).getTime() - 86400000)
      .toISOString()
      .slice(0, 10);

    expect(validate({ futureCancellationDate: floor })).toBe(true);
    expect(validate({ futureCancellationDate: before })).toBe(false);
  });
});

/**
 * REPORTED — the present-when-defined half of `scheduleCancellation`'s
 * `customFields` branch (ruling R28 / D5). Same disposition as
 * `contract.action-schemas.int.test.ts`: the CANCEL_REQUEST catalogue
 * (`GET custom_fields?filter[object_type]=contract_request`) was RECORDED
 * against staging and this brand carries ZERO definitions — verbatim
 * `{"status":"ok","data":[],"total":0,...}`
 * (`contract/__tests__/fixtures/get-custom-fields-brand-id-filter-object-type-contract-request-sort-order-asc.json`).
 * The present-when-defined half is unreachable against this brand's real data;
 * fabricating a definition is barred. The pure builder is proven in
 * `client-custom-fields.schemas.test.ts`; the ABSENT half — this brand's real
 * state — is proven above.
 */

describe("useContractProducts schemas.query — sort.field is a plain enum, no oneOf (AC-1, D12)", () => {
  it("types sort.field as the four declared columns with no oneOf anywhere in the schema", async () => {
    const collection = await openCollection();
    const querySchema = unref(collection.useContext().schemas.query.schema) as {
      properties: {
        sort: {
          items: {
            properties: { field: { enum?: string[]; oneOf?: unknown } };
          };
        };
      };
    };
    const field = querySchema.properties.sort.items.properties.field;

    expect(field.enum).toEqual([
      "status",
      "created_at",
      "next_due_date",
      "cancelled_date"
    ]);
    expect(field.oneOf).toBeUndefined();
    expect(JSON.stringify(querySchema)).not.toContain("oneOf");
  });

  it("compiles: a declared sort field validates, an undeclared one is rejected (AJV)", async () => {
    const collection = await openCollection();
    const validate = compile(
      unref(collection.useContext().schemas.query.schema)
    );

    expect(validate({ sort: [{ field: "status", dir: "asc" }] })).toBe(true);
    expect(validate({ sort: [{ field: "closed_date", dir: "asc" }] })).toBe(
      false
    );
  });
});
