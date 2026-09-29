// -----------------------------------------------------------------------------
/**
 * @fileoverview useContract — the payment-method form across the contract's
 * standing (integration, AC-8, R13, R35)
 *
 * ## Job To Be Done
 * Drive the REAL manager over the recorded contract capture and prove the
 * payment-method form as a client meets it on the labs `useContract` page: it
 * opens drawn in full from its OWN `useContext().paymentMethod` slot, offering
 * the client's stored cards and starting on the card the contract pays with; it
 * submits a different stored card on an active, a cancelled and a lapsed
 * contract alike (R13); and it is refused on a contract held for fraud, where
 * nothing is sent.
 *
 * ## Why the brand is mocked here
 * `usePaymentDetails().loadList()` gates on the brand's currency (a SETTING, not
 * journey data — ADR-021 "mock settings not data"), exactly as
 * `contract.payment-method-enum.int.test.ts` mocks it.
 *
 * ## Provenance
 * The contract row, the stored cards and the PATCH answer are the module's
 * recorded captures. Only the contract's `status.code` is swapped for the
 * cancelled, lapsed and fraud rows — the named-control practice D91 accepts.
 *
 * ## What Breaks If These Fail
 * The payment-method dialog opens empty or on the wrong card; a client on a
 * cancelled or lapsed contract loses the one change legacy still offers them;
 * or a contract held for fraud accepts a payment-method change.
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
import type { Contract } from "../contract.types";

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

type UiSchema = { elements?: { scope?: string }[] };

type ContractRow = Record<string, unknown> & {
  id: string;
  payment_details_id: string;
};

function recordedCardIds(): string[] {
  const body = recorded.storedPaymentMethods().response.body as {
    data?: Record<string, { id: string }> | { id: string }[];
  };
  return Object.values(body.data ?? {}).map(card => card.id);
}

function rowWithStatus(code?: ContractStatusCodes): ContractRow {
  const base = recorded.one().data as ContractRow;
  return code ? { ...base, status: { code } } : base;
}

async function openManager(code?: ContractStatusCodes) {
  await seedClientSession();
  const row = rowWithStatus(code);
  installContractHandler(server, row);
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
  const manager = useContract().as(ScopeActorTypes.CLIENT).withId(row.id);
  await manager.useActions().isReady();
  await vi.waitFor(() =>
    expect(
      manager.useContext().lookups.value?.storedPaymentMethods?.length ?? 0
    ).toBeGreaterThan(0)
  );
  return { manager, row };
}

function otherCard(row: ContractRow): string {
  const card = recordedCardIds().find(id => id !== row.payment_details_id);
  expect(card).toBeDefined();
  return card!;
}

function capturePaymentMethodWrites(row: ContractRow) {
  const bodies: unknown[] = [];
  server?.use(
    http.patch(`*/contracts/${row.id}/payment_details`, async ({ request }) => {
      bodies.push(await request.clone().json());
      return HttpResponse.json(recorded.paymentMethodSet(), { status: 200 });
    })
  );
  return { bodies };
}

async function submitOtherCardThroughForm(code?: ContractStatusCodes) {
  const { manager, row } = await openManager(code);
  const card = otherCard(row);
  const writes = capturePaymentMethodWrites(row);

  await manager.useActions().openPaymentMethod();
  expect(manager.useMeta().isPaymentMethodOpen.value).toBe(true);
  await manager.useActions().input({ paymentDetailsId: card });
  await vi.waitFor(() => expect(manager.useMeta().isValid.value).toBe(true));
  const result = await manager.useActions().update();

  expect(writes.bodies).toEqual([{ payment_details_id: card }]);
  expect((result as Contract).id).toBe(row.id);
}

async function settledWithin<T>(
  work: Promise<T>,
  ms: number,
  fallback: T
): Promise<T> {
  return Promise.race([
    work,
    new Promise<T>(resolve => setTimeout(() => resolve(fallback), ms))
  ]);
}

// -----------------------------------------------------------------------------

describe("useContract — the payment-method form opens drawn in full (R35)", () => {
  // @proves contract.feature:373
  it("The payment-method form never opens empty", async () => {
    const { manager, row } = await openManager();

    await manager.useActions().openPaymentMethod();

    const form = manager.useContext().paymentMethod.value;
    const offered = (form?.schema as JsonSchema | undefined)?.properties
      ?.paymentDetailsId?.enum;
    expect([...(offered ?? [])].filter(id => id !== null).sort()).toEqual(
      [...recordedCardIds()].sort()
    );
    expect(
      ((form?.uischema as UiSchema | undefined)?.elements ?? []).some(
        element => element.scope === "#/properties/paymentDetailsId"
      )
    ).toBe(true);
    expect(form?.model?.paymentDetailsId).toBe(row.payment_details_id);
  });
});

describe("useContract — the payment-method form works whatever the contract's standing (AC-8, R13)", () => {
  // @proves contract.feature:380
  // @proves contract.feature:387
  it("I change how my contract is paid for through the payment-method form, whatever its standing", async () => {
    await submitOtherCardThroughForm();
  });

  // @proves contract.feature:388
  it("submits a different stored card through the form on a cancelled contract", async () => {
    await submitOtherCardThroughForm(ContractStatusCodes.CANCELLED);
  });

  // @proves contract.feature:389
  it("submits a different stored card through the form on a lapsed contract", async () => {
    await submitOtherCardThroughForm(ContractStatusCodes.CLOSED);
  });
});

describe("useContract — the payment-method form is refused on fraud (R13)", () => {
  // @proves contract.feature:392
  it("The payment-method form is refused on a contract held for fraud", async () => {
    const { manager, row } = await openManager(ContractStatusCodes.FRAUD);
    const card = otherCard(row);
    const observed = observeAllRequests();

    await manager.useActions().openPaymentMethod();
    expect(manager.useMeta().isPaymentMethodOpen.value).toBe(false);
    expect(manager.useContext().paymentMethod.value).toBeFalsy();

    await settledWithin(
      manager
        .useActions()
        .setPaymentMethod({ paymentDetailsId: card })
        .catch(() => false),
      2000,
      false
    );

    expect(
      observed
        .matching(`/contracts/${row.id}/payment_details`)
        .filter(request => request.method === "PATCH")
    ).toEqual([]);
    observed.stop();
  });
});
