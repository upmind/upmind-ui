// -----------------------------------------------------------------------------
/**
 * @fileoverview useContract payment-method form schema — the labs editor's
 * only remaining write form after ruling R34 (integration; R34/R35, D3/D4)
 *
 * ## Job To Be Done
 * Ruling R33 moved every cancellation write to `useContractProduct`, so
 * `useContract` keeps only the payment-method form (R34). Ruling R35 fills the
 * form's OWN context slot on the open event — `useContext().paymentMethod` a
 * `{ schema, uischema, model }`. This suite drives the REAL manager against the
 * recorded contract capture and proves the form reflects that record:
 *  - `paymentDetailsId` is the payment-details module's stored-method schema
 *    (nullable), defaulted to the contract's OWN current `paymentDetailsId`
 *    (D3/D4); its uischema is the shared radio control keyed to
 *    `form.contract_payment_method`.
 *  - opening the form never leaves the status node — `isActive` holds (R35).
 *
 * ## Provenance
 * The current payment-method id asserted here is read back off the manager's
 * OWN published view model, loaded from the module's recorded
 * `get-contracts-id-with-staged-imports-1` capture — never a literal.
 *
 * ## What Breaks If These Fail
 * The payment-method form loses the contract's current method as its default —
 * the labs editor renders a form that cannot round-trip.
 */

import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { ContractStatusCodes } from "@upmind-automation/types";
import { useContract } from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import {
  installContractHandler,
  recorded,
  seedClientSession
} from "./contract.int-helpers";
import { server } from "./setup.integration";

// -----------------------------------------------------------------------------

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
  const manager = useContract().as(ScopeActorTypes.CLIENT).withId(row.id);
  await manager.useActions().isReady();
  return manager;
}

/** Opens the manager over the recorded contract with its `status.code`
 * overridden to `code` — the only field any assertion below reads. */
async function openManagerWithStatus(code: ContractStatusCodes) {
  await seedClientSession();
  const base = recorded.one().data as Record<string, unknown> & { id: string };
  const row = { ...base, status: { code } };
  installContractHandler(server, row);
  const manager = useContract().as(ScopeActorTypes.CLIENT).withId(row.id);
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

/**
 * The cancellation form moved to `useContractProduct` with ruling R33 (the
 * write lives with the thing it changes), and R35 made it the ONE combined
 * form (an `option` enum, no `productIds` enum — the product knows its own
 * id). Its schema is proven in
 * `contract-product.action-schemas.int.test.ts`; `useContract` keeps only the
 * payment-method form below (R34).
 */

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
describe("useContract payment-method form — reads the live contract (AC-8, R35, D3/D4)", () => {
  it("defaults paymentDetailsId to the contract's own current method, nullable and required", async () => {
    const manager = await openManager();
    const current = manager.useContext().contract.value?.paymentDetailsId;
    await manager.useActions().openPaymentMethod();
    const schema = manager.useContext().paymentMethod.value
      ?.schema as JsonSchema;

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
    await manager.useActions().openPaymentMethod();
    const uischema = manager.useContext().paymentMethod.value
      ?.uischema as UiSchema;

    const control = (uischema.elements ?? []).find(
      element => element.scope === "#/properties/paymentDetailsId"
    );
    expect(control?.i18n).toBe("form.contract_payment_method");
    expect(control?.options?.format).toBe("radio");
  });

  it("stays on the status node while the form is open — isActive holds true (R35)", async () => {
    const manager = await openManager();
    expect(manager.useMeta().isActive.value).toBe(true);
    await manager.useActions().openPaymentMethod();
    expect(manager.useContext().paymentMethod.value).toBeTruthy();
    expect(manager.useMeta().isActive.value).toBe(true);
  });
});

describe("useContract payment-method form — where legacy offers it, and where it refuses (AC-8, R13/R24)", () => {
  it("opens the payment-method form on a cancelled contract (R13 ports the change to a read-only contract)", async () => {
    const manager = await openManagerWithStatus(ContractStatusCodes.CANCELLED);
    await manager.useActions().openPaymentMethod();
    expect(manager.useContext().paymentMethod.value).toBeTruthy();
  });

  it("refuses the payment-method form on a fraud contract — its slot stays empty (R13 excludes fraud)", async () => {
    const manager = await openManagerWithStatus(ContractStatusCodes.FRAUD);
    await manager.useActions().openPaymentMethod();
    expect(manager.useContext().paymentMethod.value).toBeFalsy();
  });
});
