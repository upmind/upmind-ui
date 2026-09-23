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
import { ContractContextTypes, useContract } from "..";
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
  const manager = useContract()
    .as(ScopeActorTypes.CLIENT)
    .for(ContractContextTypes.CONTRACT, row.id);
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
   * `contract.mutations.validation.must-fail.patch`.
   */
  it("makes NO PATCH and lands a 422 in the error region when I submit an id outside my stored cards", async () => {
    const { manager, row } = await openWithCards();
    const cardIds = recordedCardIds();
    const outOfEnumId = "00000000-0000-0000-0000-000000000000";
    expect(cardIds).not.toContain(outOfEnumId);

    await manager.useActions().set({ paymentDetailsId: outOfEnumId });
    const observed = observeAllRequests();

    await expect(
      manager.useActions().submitPaymentMethod()
    ).rejects.toBeDefined();

    observed.stop();
    expect(
      observed
        .matching(`/contracts/${row.id}/payment_details`)
        .filter(request => request.method === "PATCH")
    ).toEqual([]);
    expect(manager.useMeta().hasError.value).toBe(true);
    expect(
      (manager.useContext().error.value as { code?: number } | undefined)?.code
    ).toBe(422);
  });
});
