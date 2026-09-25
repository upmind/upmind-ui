// -----------------------------------------------------------------------------
/**
 * @fileoverview useContract payment-method form — the stored-card enum and its
 * validate-before-request guard (integration, AC-8, R31/R35, D3/D4)
 *
 * ## Job To Be Done
 * The payment-method form's `paymentDetailsId` enum is sourced (D3) from
 * `usePaymentDetails().data`. This suite serves that module's OWN recorded
 * stored-cards list into the contract harness — the same cross-module recorded
 * capture the form draws from in production — and proves the enum carries the
 * real card ids (plus the shared `null` member), and that an id OUTSIDE the
 * enum is rejected before any PATCH: no request leaves and a 422 lands in the
 * form's error region.
 *
 * ## Why the brand is mocked here (and only here)
 * `usePaymentDetails().loadList()` gates on the brand's currency (a SETTING, not
 * journey data — ADR-021 "mock settings not data"). This file mocks `useBrand`
 * exactly as `payment-details.composables.int.test.ts` does, so the stored-card
 * query enables and the enum populates. The mock is file-scoped, so it never
 * reaches the other contract suites, which drive the real brand seam.
 *
 * ## Provenance
 * The stored-cards body is the payment-details module's recorded
 * `get-clients-id-payment-details-active-true-brand-id-country-id` capture,
 * loaded by `recorded.storedPaymentMethods()`; every asserted card id is read
 * back off that body — never a literal.
 *
 * ## What Breaks If These Fail
 * The payment-method form offers a card the client does not hold (or lets a
 * client submit an id that is not one of their stored cards), and the labs
 * editor renders a form that cannot round-trip.
 */

import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";
import { ContractStatusCodes } from "@upmind-automation/types";
import { useContract } from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import {
  installContractHandler,
  observeAllRequests,
  recorded,
  seedClientSession
} from "./contract.int-helpers";
import { server } from "./setup.integration";

// -----------------------------------------------------------------------------

const brandCurrency = {
  id: "e47d7382-4850-7931-56c8-1e642d59e063",
  code: "USD"
};

vi.mock("../../brand", () => ({
  useBrand: () => ({
    brandId: { value: "b1000000-0000-0000-0000-000000000001" },
    currency: { value: brandCurrency },
    currencyId: { value: brandCurrency.id },
    countryId: { value: undefined },
    ensureConfig: () => ({}),
    getConfig: () => ({}),
    getConfigValue: () => undefined,
    invalidate: () => undefined
  })
}));

type JsonSchema = {
  properties?: { paymentDetailsId?: { enum?: (string | null)[] } };
};

/** The real stored-card ids the recorded list carries. */
function recordedCardIds(): string[] {
  const body = recorded.storedPaymentMethods().response.body as {
    data?: Record<string, { id: string }> | { id: string }[];
  };
  return Object.values(body.data ?? {}).map(card => card.id);
}

/** Opens the manager over the recorded contract, with the recorded stored-cards
 * list served so the form enum populates, and the form opened. */
async function openWithCards() {
  await seedClientSession();
  installContractHandler(server);
  server?.use(
    http.get("*/clients/:id", () =>
      HttpResponse.json({ status: "ok", data: { custom_fields: [] } })
    )
  );
  const stored = recorded.storedPaymentMethods().response;
  server?.use(
    http.get("*/clients/:id/payment_details", () =>
      HttpResponse.json(stored.body as Record<string, unknown>, {
        status: stored.status
      })
    )
  );
  const row = recorded.one().data;
  const manager = useContract().as(ScopeActorTypes.CLIENT).withId(row.id);
  await manager.useActions().isReady();
  await manager.useActions().openPaymentMethod();
  await vi.waitFor(() => {
    const enumValues = (
      manager.useContext().paymentMethod.value?.schema as JsonSchema
    )?.properties?.paymentDetailsId?.enum;
    expect((enumValues ?? []).length).toBeGreaterThan(1);
  });
  return { manager, row };
}

/** Waits out `input`'s debounce until the open form's model holds the id. The
 * flush-on-submit path is proven on its own in
 * `contract.manager-members.int.test.ts`. */
async function awaitModel(
  manager: Awaited<ReturnType<typeof openWithCards>>["manager"],
  paymentDetailsId: string
): Promise<void> {
  await vi.waitFor(() => {
    expect(manager.useContext().paymentMethod.value?.model).toEqual(
      expect.objectContaining({ paymentDetailsId })
    );
  });
}

// -----------------------------------------------------------------------------

describe("useContract payment-method form — the stored-card enum (AC-8, D3)", () => {
  it("offers exactly the client's recorded stored-card ids, plus the shared null member", async () => {
    const { manager } = await openWithCards();
    const cardIds = recordedCardIds();
    const enumValues = (
      manager.useContext().paymentMethod.value?.schema as JsonSchema
    )?.properties?.paymentDetailsId?.enum;

    expect(cardIds.length).toBeGreaterThan(0);
    expect(enumValues).toBeDefined();
    expect(enumValues).toContain(null);
    expect([...enumValues!].filter(value => value !== null).sort()).toEqual(
      [...cardIds].sort()
    );
  });

  /**
   * The validate-before-request guard on the payment-method form: an id that is
   * NOT one of the client's stored cards is rejected before the PATCH fires, so
   * no request leaves and a 422 lands in the form's error region. Mutant:
   * `contract.payment-method-enum.must-fail.patch`.
   */
  it("makes NO PATCH and lands a 422 in the error region when I submit an id outside my stored cards", async () => {
    const { manager, row } = await openWithCards();
    const cardIds = recordedCardIds();
    const outOfEnumId = "00000000-0000-0000-0000-000000000000";
    expect(cardIds).not.toContain(outOfEnumId);

    await manager.useActions().input({ paymentDetailsId: outOfEnumId });
    await awaitModel(manager, outOfEnumId);
    const observed = observeAllRequests();

    await expect(manager.useActions().update()).rejects.toBeDefined();

    observed.stop();
    expect(
      observed
        .matching(`/contracts/${row.id}/payment_details`)
        .filter(request => request.method === "PATCH")
    ).toEqual([]);
    expect(manager.useMeta().hasError.value).toBe(true);
    const validationError = manager.useContext().error.value as
      | { code?: number; message?: string }
      | undefined;
    expect(validationError?.code).toBe(422);
    expect(validationError?.message).toBe("error.contract_validation_failed");
  });
});

// -----------------------------------------------------------------------------

/** Settles the REAL manager over the contract with the recorded stored-cards
 * list served (so the form enum can populate on open), leaving the
 * payment-method form CLOSED. */
async function settleWithCards(row?: Record<string, unknown> & { id: string }) {
  await seedClientSession();
  const served = row ?? recorded.one().data;
  installContractHandler(server, served);
  server?.use(
    http.get("*/clients/:id", () =>
      HttpResponse.json({ status: "ok", data: { custom_fields: [] } })
    )
  );
  const stored = recorded.storedPaymentMethods().response;
  server?.use(
    http.get("*/clients/:id/payment_details", () =>
      HttpResponse.json(stored.body as Record<string, unknown>, {
        status: stored.status
      })
    )
  );
  const manager = useContract().as(ScopeActorTypes.CLIENT).withId(served.id);
  await manager.useActions().isReady();
  return { manager, row: served };
}

async function awaitEnum(
  manager: Awaited<ReturnType<typeof settleWithCards>>["manager"]
): Promise<void> {
  await vi.waitFor(() => {
    const enumValues = (
      manager.useContext().paymentMethod.value?.schema as JsonSchema
    )?.properties?.paymentDetailsId?.enum;
    expect((enumValues ?? []).length).toBeGreaterThan(1);
  });
}

describe("useContract — the payment-method form reports whether it is open and whether its model is valid (AC-8, R31/R35)", () => {
  it("is closed and not valid before I open it, open once I do, and closed again when I cancel the form", async () => {
    const { manager } = await settleWithCards();
    const meta = manager.useMeta();

    expect(meta.isPaymentMethodOpen.value).toBe(false);
    expect(meta.isValid.value).toBe(false);

    await manager.useActions().openPaymentMethod();
    await awaitEnum(manager);
    expect(meta.isPaymentMethodOpen.value).toBe(true);

    await manager.useActions().clear();
    expect(meta.isPaymentMethodOpen.value).toBe(false);
  });

  it("reports the open form valid for a stored-card id and invalid for one outside my stored cards, staying open either way", async () => {
    const { manager } = await settleWithCards();
    const meta = manager.useMeta();
    await manager.useActions().openPaymentMethod();
    await awaitEnum(manager);
    const cardIds = recordedCardIds();
    const outOfEnumId = "00000000-0000-0000-0000-000000000000";
    expect(cardIds).not.toContain(outOfEnumId);

    await manager.useActions().input({ paymentDetailsId: cardIds[0]! });
    await vi.waitFor(() => {
      expect(meta.isValid.value).toBe(true);
    });
    expect(meta.isPaymentMethodOpen.value).toBe(true);

    await manager.useActions().input({ paymentDetailsId: outOfEnumId });
    await vi.waitFor(() => {
      expect(meta.hasError.value).toBe(true);
    });
    expect(meta.isValid.value).toBe(false);
    expect(meta.isPaymentMethodOpen.value).toBe(true);
  });

  it("closes the form after a successful submit", async () => {
    const { manager, row } = await settleWithCards();
    const current = (row as { payment_details_id: string }).payment_details_id;
    const other = recordedCardIds().find(id => id !== current);
    expect(other).toBeDefined();
    server?.use(
      http.patch(`*/contracts/${row.id}/payment_details`, () =>
        HttpResponse.json(recorded.paymentMethodSet(), { status: 200 })
      )
    );
    await manager.useActions().openPaymentMethod();
    await awaitEnum(manager);
    await manager.useActions().input({ paymentDetailsId: other! });
    await awaitModel(manager, other!);
    expect(manager.useMeta().isPaymentMethodOpen.value).toBe(true);

    await manager.useActions().update();

    await vi.waitFor(() => {
      expect(manager.useMeta().isPaymentMethodOpen.value).toBe(false);
    });
  });

  it("still opens the form and validates a stored-card id on a cancelled contract (R13)", async () => {
    const base = recorded.one().data as Record<string, unknown> & {
      id: string;
    };
    const cancelled = {
      ...base,
      status: { code: ContractStatusCodes.CANCELLED }
    };
    const { manager } = await settleWithCards(cancelled);
    const meta = manager.useMeta();

    await manager.useActions().openPaymentMethod();
    await awaitEnum(manager);
    expect(meta.isPaymentMethodOpen.value).toBe(true);

    await manager
      .useActions()
      .input({ paymentDetailsId: recordedCardIds()[0]! });
    await vi.waitFor(() => {
      expect(meta.isValid.value).toBe(true);
    });
  });
});
