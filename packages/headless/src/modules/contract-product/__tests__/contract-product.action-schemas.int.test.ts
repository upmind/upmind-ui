// -----------------------------------------------------------------------------
/**
 * @fileoverview useContractProduct(s) write-form + query schemas — the labs
 * editor's consolidation and cancellation forms, and the products query schema
 * (integration; rulings R33/R35, decisions D8/D12)
 *
 * ## Job To Be Done
 * Ruling R35 fills each write form's OWN context slot on the open event —
 * `useContext().consolidation` and `useContext().cancellation` each a
 * `{ schema, uischema, model }` — and the products query schema stays on
 * `useContractProducts().useContext().schemas.query`. This suite drives the
 * REAL manager and collection against recorded captures and proves:
 *  - the consolidation form: `invoiceConsolidationEnabled` is an INTEGER `enum` of
 *    exactly [ENABLED, DISABLED, INHERIT] — no `oneOf`, no `options` (D8, a real
 *    enum with i18n value labels; `oneOf` leaks memory); its uischema is a
 *    toggle-group control (an enum of more than two values draws as toggle-group)
 *    keyed to `form.contract_product_invoice_consolidation` whose
 *    `defaultOptionValue` is INHERIT (un-pressing writes INHERIT).
 *  - the cancellation form (ONE combined form, R33/R35): an `option` enum of
 *    SOFT/HARD/SCHEDULE_FUTURE, a `futureCancellationDate` floored and defaulted
 *    to the manager's live `minFutureCancellationDate` and required only for
 *    SCHEDULE_FUTURE (schema `if`/`then`), and a `reason` string.
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
import { ContractProductCancelOption } from "../contract-product.types";
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

describe("useContractProduct consolidation form — a real enum, never a oneOf (AC-9, D8)", () => {
  it("declares invoiceConsolidationEnabled as an integer enum of ENABLED/DISABLED/INHERIT, with no oneOf and no options", async () => {
    const manager = await openManager();
    await manager.useActions().openConsolidation();
    const schema = manager.useContext().consolidation.value
      ?.schema as JsonSchema;

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

  it("lays out a toggle-group control whose un-pressed value is INHERIT", async () => {
    const manager = await openManager();
    await manager.useActions().openConsolidation();
    const uischema = manager.useContext().consolidation.value
      ?.uischema as UiSchema;
    const control = (uischema.elements ?? []).find(
      element => element.scope === "#/properties/invoiceConsolidationEnabled"
    );

    expect(control?.i18n).toBe("form.contract_product_invoice_consolidation");
    expect(control?.options?.format).toBe("toggle-group");
    expect(control?.options?.defaultOptionValue).toBe(
      InvoiceConsolidationTypes.INHERIT
    );
  });

  it("compiles: each of the three positions validates, a value outside the enum is rejected (AJV, D8)", async () => {
    const manager = await openManager();
    await manager.useActions().openConsolidation();
    const validate = compile(manager.useContext().consolidation.value?.schema);

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

describe("useContractProduct cancellation form — the ONE combined form (AC-6/AC-22, R33/R35, D12)", () => {
  it("offers the option enum SOFT/HARD/SCHEDULE_FUTURE, floors futureCancellationDate to the live minFutureCancellationDate, and requires it only for SCHEDULE_FUTURE", async () => {
    const manager = await openManager();
    await manager.useActions().openCancellation();
    const floor = manager.useContext().minFutureCancellationDate.value;
    const form = manager.useContext().cancellation.value;
    const schema = form?.schema as JsonSchema & {
      if?: { properties?: Record<string, { const?: string }> };
      then?: { required?: string[] };
    };

    expect(floor).toBeTruthy();
    expect(schema.required).toEqual(["option"]);
    expect((schema.properties?.option as { enum: string[] }).enum).toEqual([
      ContractProductCancelOption.SOFT,
      ContractProductCancelOption.HARD,
      ContractProductCancelOption.SCHEDULE_FUTURE
    ]);
    const dateProp = schema.properties?.futureCancellationDate as {
      format: string;
      formatMinimum: string;
      default: string;
    };
    expect(dateProp.format).toBe("date");
    expect(dateProp.formatMinimum).toBe(floor);
    expect(dateProp.default).toBe(floor);
    expect(schema.properties?.reason?.type).toBe("string");
    expect(schema.if?.properties?.option?.const).toBe(
      ContractProductCancelOption.SCHEDULE_FUTURE
    );
    expect(schema.then?.required).toEqual(["futureCancellationDate"]);
  });

  it("omits customFields without a CANCEL_REQUEST catalogue loaded (D5, D11)", async () => {
    const manager = await openManager();
    await manager.useActions().openCancellation();
    const schema = manager.useContext().cancellation.value
      ?.schema as JsonSchema;

    expect(schema.properties?.customFields).toBeUndefined();
  });

  it("lays out an option radio, a future-cancellation-date control shown only for SCHEDULE_FUTURE, and a multi reason control", async () => {
    const manager = await openManager();
    await manager.useActions().openCancellation();
    const uischema = manager.useContext().cancellation.value
      ?.uischema as UiSchema;

    const optionControl = (uischema.elements ?? []).find(
      element => element.scope === "#/properties/option"
    );
    expect(optionControl?.i18n).toBe(
      "form.contract_product_cancellation_option"
    );
    expect(optionControl?.options?.format).toBe("radio");

    const dateControl = (uischema.elements ?? []).find(
      element => element.scope === "#/properties/futureCancellationDate"
    );
    expect(dateControl?.i18n).toBe(
      "form.contract_product_future_cancellation_date"
    );
    expect(
      (dateControl as { rule?: { effect?: string } } | undefined)?.rule?.effect
    ).toBe("SHOW");

    const reasonControl = (uischema.elements ?? []).find(
      element => element.scope === "#/properties/reason"
    );
    expect(reasonControl?.options?.multi).toBe(true);
  });

  it("compiles: SOFT/HARD need no date; SCHEDULE_FUTURE on/after the floor validates, before it is rejected, and an unknown option is rejected (AJV)", async () => {
    const manager = await openManager();
    await manager.useActions().openCancellation();
    const floor = manager.useContext().minFutureCancellationDate
      .value as string;
    const validate = compile(manager.useContext().cancellation.value?.schema);
    const before = new Date(new Date(floor).getTime() - 86400000)
      .toISOString()
      .slice(0, 10);

    expect(validate({ option: ContractProductCancelOption.SOFT })).toBe(true);
    expect(validate({ option: ContractProductCancelOption.HARD })).toBe(true);
    expect(
      validate({
        option: ContractProductCancelOption.SCHEDULE_FUTURE,
        futureCancellationDate: floor
      })
    ).toBe(true);
    expect(
      validate({
        option: ContractProductCancelOption.SCHEDULE_FUTURE,
        futureCancellationDate: before
      })
    ).toBe(false);
    expect(
      validate({ option: ContractProductCancelOption.SCHEDULE_FUTURE })
    ).toBe(false);
    expect(validate({ option: "abort" })).toBe(false);
    expect(validate({})).toBe(false);
  });
});

/**
 * REPORTED — the present-when-defined half of the cancellation form's
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
