// -----------------------------------------------------------------------------
/**
 * @fileoverview useContract action schemas — the labs editor's forms for
 * requestCancellation and setPaymentMethod (integration; ruling R28 amendment
 * 2026-09-23, decisions D1/D3/D4/D9)
 *
 * ## Job To Be Done
 * Ruling R28 publishes one schema/uischema pair per model-taking write on
 * `useContract().useContext().schemas.<action>`, each a `ComputedRef` because
 * two pairs read the LIVE contract. This suite drives the REAL manager against
 * the recorded contract capture and proves each pair reflects that record:
 *  - `requestCancellation`: `productIds` is a required array (minItems 1,
 *    uniqueItems) whose `items.enum` is exactly the loaded contract's product
 *    ids (D9) and whose `items.options` label each product by name (labels live
 *    IN THE SCHEMA, like client-address countries); `reason` is a string; its
 *    uischema is a `productIds` control carrying NO `options.items`, then a
 *    multi `reason` control.
 *  - `setPaymentMethod`: `paymentDetailsId` is the payment-details module's
 *    stored-method schema (nullable), defaulted to the contract's OWN current
 *    `paymentDetailsId` (D3/D4); its uischema is the shared radio control keyed
 *    to `form.contract_payment_method`.
 * The published schemas are then compiled with the repo's own AJV
 * (`utils/useValidation`) and shown to accept a correct model and reject an
 * invalid one — an empty `productIds`, an unknown product id, a duplicate id.
 *
 * ## Provenance
 * Every product id, product name and current payment-method id asserted here is
 * read back off the manager's OWN published view model, loaded from the module's
 * recorded `get-contracts-id-with-staged-imports-1` capture — never a literal.
 *
 * ## What Breaks If These Fail
 * The cancellation form offers a product the contract does not hold (or omits
 * one it does), or the payment-method form loses the contract's current method
 * as its default — the labs editor renders a form that cannot round-trip, or
 * lets a client submit a cancellation for a product that is not theirs.
 */

import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { ContractContextTypes, useContract } from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import {
  installContractHandler,
  recorded,
  seedClientSession
} from "./contract.int-helpers";
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

/** Opens the real manager over the recorded contract and returns its context. */
async function openManager() {
  await seedClientSession();
  installContractHandler(server);
  // The cancellation forms compose the CANCEL_REQUEST custom-field catalogue;
  // with no such catalogue on disk this brand carries none (empty), which is the
  // ABSENT-customFields case asserted below. Stub it so that empty case is
  // deterministic and its background read never bleeds into a sibling test.
  server?.use(
    http.get("*/clients/:id", () =>
      HttpResponse.json({ status: "ok", data: { custom_fields: [] } })
    )
  );
  const row = recorded.one().data;
  const manager = useContract()
    .as(ScopeActorTypes.CLIENT)
    .for(ContractContextTypes.CONTRACT, row.id);
  await manager.useActions().isReady();
  return manager;
}

type JsonSchema = {
  required?: string[];
  properties?: Record<string, Record<string, unknown>>;
};

type UiSchema = {
  elements?: {
    scope?: string;
    i18n?: string;
    options?: { multi?: boolean; format?: string; items?: unknown[] };
  }[];
};

// -----------------------------------------------------------------------------

describe("useContract schemas.requestCancellation — the cancellation form reads the live contract (AC-6, D9)", () => {
  it("offers exactly the loaded contract's product ids as the required productIds enum", async () => {
    const manager = await openManager();
    const productIds = (
      manager.useContext().contract.value?.products ?? []
    ).map(product => product.id);
    const schema = manager.useContext().schemas.requestCancellation.schema
      .value as JsonSchema;

    expect(productIds.length).toBeGreaterThan(0);
    expect(schema.required).toEqual(["productIds"]);
    const productIdsProp = schema.properties?.productIds as {
      type: string;
      minItems: number;
      uniqueItems: boolean;
      items: { type: string; enum: string[] };
    };
    expect(productIdsProp.type).toBe("array");
    expect(productIdsProp.minItems).toBe(1);
    expect(productIdsProp.uniqueItems).toBe(true);
    expect(productIdsProp.items.type).toBe("string");
    expect([...productIdsProp.items.enum].sort()).toEqual(
      [...productIds].sort()
    );
    expect(schema.properties?.reason?.type).toBe("string");
  });

  it("labels each product by name on the schema, leaving the productIds control with no items, then a multi reason control", async () => {
    const manager = await openManager();
    const products = manager.useContext().contract.value?.products ?? [];
    const schema = manager.useContext().schemas.requestCancellation.schema
      .value as JsonSchema;
    const uischema = manager.useContext().schemas.requestCancellation.uischema
      .value as UiSchema;

    const productIdsProp = schema.properties?.productIds as {
      items: {
        enum: string[];
        options: { label: string; value: string }[];
      };
    };
    const options = productIdsProp.items.options;
    expect(options.map(option => option.value).sort()).toEqual(
      products.map(product => product.id).sort()
    );
    for (const product of products) {
      const option = options.find(entry => entry.value === product.id);
      expect(option?.label).toBe(product.name);
    }

    const productControl = (uischema.elements ?? []).find(
      element => element.scope === "#/properties/productIds"
    );
    expect(productControl?.i18n).toBe("form.contract_cancellation_products");
    expect(productControl?.options?.items).toBeUndefined();

    const reasonControl = (uischema.elements ?? []).find(
      element => element.scope === "#/properties/reason"
    );
    expect(reasonControl?.options?.multi).toBe(true);
  });

  it("compiles: a correct model validates, an empty / unknown / duplicated productIds is rejected (AJV, D9)", async () => {
    const manager = await openManager();
    const productIds = (
      manager.useContext().contract.value?.products ?? []
    ).map(product => product.id);
    const validate = compile(
      manager.useContext().schemas.requestCancellation.schema.value
    );

    expect(validate({ productIds: [productIds[0]], reason: "done" })).toBe(
      true
    );
    expect(validate({ productIds: [] })).toBe(false);
    expect(validate({ productIds: ["not-a-product-of-this-contract"] })).toBe(
      false
    );
    expect(validate({ productIds: [productIds[0], productIds[0]] })).toBe(
      false
    );
  });
});

/**
 * REPORTED — the `customFields` PRESENT-when-defined branch of
 * `schemas.requestCancellation` (ruling R28 / D5: present only when the
 * CANCEL_REQUEST custom-field catalogue has definitions). RECORDED, not
 * skipped: `contract-cancel-request-catalogue.fixtures.ts` captured the real
 * `GET custom_fields?filter[object_type]=contract_request` against staging and
 * this brand carries ZERO definitions — verbatim
 * `{"status":"ok","data":[],"total":0,...}` (fixture
 * `fixtures/get-custom-fields-brand-id-filter-object-type-contract-request-sort-order-asc.json`;
 * the same finding FE-3034's `client-custom-fields.catalogue-url.int.test.ts`
 * records). The present-when-defined half is therefore UNREACHABLE against this
 * brand's real data — no CANCEL_REQUEST definition exists to render a
 * `customFields.properties.<code>` from, and fabricating one is barred. The
 * ABSENT-when-empty half — the real state of this brand — is proven below. The
 * pure builder (`useCustomFieldsSchema`) is proven over real definitions in
 * `client-custom-fields.schemas.test.ts`.
 */
describe("useContract schemas.requestCancellation — no custom-field controls without a catalogue (D5, D11)", () => {
  it("omits customFields from the schema and its controls when no CANCEL_REQUEST catalogue is loaded", async () => {
    const manager = await openManager();
    const schema = manager.useContext().schemas.requestCancellation.schema
      .value as JsonSchema;
    const uischema = manager.useContext().schemas.requestCancellation.uischema
      .value as UiSchema;

    expect(schema.properties?.customFields).toBeUndefined();
    const customFieldControls = (uischema.elements ?? []).filter(element =>
      element.scope?.startsWith("#/properties/customFields")
    );
    expect(customFieldControls).toEqual([]);
  });
});

/**
 * Why the setPaymentMethod `paymentDetailsId.enum` is not asserted populated
 * HERE — this harness does not seed its source, and the source is NOT broken.
 * D3 sources the enum from `usePaymentDetails().data` (the stored-methods
 * `loadList` query). That collection is sound: fed the real gap-keyed recorded
 * list, `mapPaymentDetails` reads it as the client's full list of cards
 * (`payment-details.composables.int.test.ts` "shows the page every card the
 * client holds", and the live AC-A1 receipt in `payment-details.int.test.ts`;
 * the operator observed a populated list live on `/usePaymentDetailAdd`). The
 * enum is empty in THIS suite for a harness reason only: `openManager` seeds the
 * contract capture, the client session and the cancellation-catalogue stub, but
 * NOT the payment-details stored-methods query — its `clients/:id/payment_details`
 * route, its brand and its currency are never installed here (see
 * `contract.int-helpers.ts`). Standing that query up inside a contract test is
 * out of this suite's scope. The populated enum is proven in the payment-details
 * module's own suite (`payment-details.stored-methods-schema.test.ts` — enum of
 * card ids + null, labelled options, byte-identical to the PAY machine's own
 * definition). This suite proves the manager's OWN wiring: default = the
 * contract's current method, nullable, radio control.
 */
describe("useContract schemas.setPaymentMethod — the payment-method form reads the live contract (AC-8, D3/D4)", () => {
  it("defaults paymentDetailsId to the contract's own current method, nullable and required", async () => {
    const manager = await openManager();
    const current = manager.useContext().contract.value?.paymentDetailsId;
    const schema = manager.useContext().schemas.setPaymentMethod.schema
      .value as JsonSchema;

    expect(current).toBeTruthy();
    expect(schema.required).toEqual(["paymentDetailsId"]);
    const prop = schema.properties?.paymentDetailsId as {
      type: string[];
      default: string;
    };
    expect(prop.type).toContain("null");
    expect(prop.default).toBe(current);
  });

  it("lays out the shared stored-method radio control keyed to form.contract_payment_method", async () => {
    const manager = await openManager();
    const uischema = manager.useContext().schemas.setPaymentMethod.uischema
      .value as UiSchema;

    const control = (uischema.elements ?? []).find(
      element => element.scope === "#/properties/paymentDetailsId"
    );
    expect(control?.i18n).toBe("form.contract_payment_method");
    expect(control?.options?.format).toBe("radio");
  });
});
