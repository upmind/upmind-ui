// -----------------------------------------------------------------------------
/**
 * @fileoverview useContract — the template members ruling R37 restores, and the
 * failed-load settlement decision D43 (integration)
 *
 * ## Job To Be Done
 * Prove over the recorded corpus that the per-contract manager publishes each
 * template member: `useContext().context` carries the contract it read,
 * `.title` its name, `.lookups` the client's stored cards read on open,
 * `.errors` a failed read's message and `.validationErrors` the field errors of
 * a refused model; that a failed load settles on the top-level `error` node
 * (D43) — `hasError` true, `isLoading` false, `isReady()` false at once — and
 * that `reset()` leaves it for a fresh read; and that the ONE payment-method
 * form keeps the template action names (`input`, `clear`, `update`) with
 * `isProcessing` and `onDone` reporting the write.
 *
 * ## Why the brand is mocked here
 * `usePaymentDetails().loadList()` gates on the brand's currency (a SETTING, not
 * journey data — ADR-021 "mock settings not data"), exactly as
 * `contract.payment-method-enum.int.test.ts` mocks it, so the stored-card
 * lookup and the form enum populate.
 *
 * ## What Breaks If These Fail
 * The labs contract page cannot title the contract, draw the stored cards,
 * render a refused model's errors, or gate its submit; a failed read hangs the
 * page on a spinner; the force handle cannot redial out of a failed read.
 */

import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";
import { useContract } from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import {
  installContractHandler,
  observeAllRequests,
  recorded,
  seedClientSession
} from "./contract.int-helpers";
import { server } from "./setup.integration";
import type { Contract, ContractContext } from "../contract.types";

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

type ContractRow = Record<string, unknown> & {
  id: string;
  name: string | null;
  payment_details_id: string;
};

const OUT_OF_ENUM_ID = "00000000-0000-0000-0000-000000000000";

function recordedCardIds(): string[] {
  const body = recorded.storedPaymentMethods().response.body as {
    data?: Record<string, { id: string }> | { id: string }[];
  };
  return Object.values(body.data ?? {}).map(card => card.id);
}

function installLookupHandlers(): void {
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
}

function managerFor(id: string) {
  return useContract().as(ScopeActorTypes.CLIENT).withId(id);
}

async function openManager() {
  await seedClientSession();
  installContractHandler(server);
  installLookupHandlers();
  const row = recorded.one().data as ContractRow;
  const manager = managerFor(row.id);
  await manager.useActions().isReady();
  return { manager, row };
}

async function openForm() {
  const opened = await openManager();
  await opened.manager.useActions().openPaymentMethod();
  await vi.waitFor(() => {
    const enumValues = (
      opened.manager.useContext().paymentMethod.value?.schema as JsonSchema
    )?.properties?.paymentDetailsId?.enum;
    expect((enumValues ?? []).length).toBeGreaterThan(1);
  });
  return opened;
}

function otherCard(row: ContractRow): string {
  const other = recordedCardIds().find(id => id !== row.payment_details_id);
  expect(other).toBeDefined();
  return other!;
}

async function openFailingManager() {
  await seedClientSession();
  installLookupHandlers();
  const row = recorded.one().data as ContractRow;
  const failure = recorded.withdrawRejected().response;
  server?.use(
    http.get("*/contracts/:id", () =>
      HttpResponse.json(failure.body as Record<string, unknown>, {
        status: failure.status
      })
    )
  );
  const manager = managerFor(row.id);
  const message = (failure.body as { error: { message: string } }).error
    .message;
  return { manager, row, message };
}

function gate(): { wait: Promise<void>; open: () => void } {
  let open = (): void => undefined;
  const wait = new Promise<void>(resolve => {
    open = resolve;
  });
  return { wait, open };
}

async function awaitModel(
  manager: ReturnType<typeof managerFor>,
  paymentDetailsId: string
): Promise<void> {
  await vi.waitFor(() => {
    expect(manager.useContext().paymentMethod.value?.model).toEqual(
      expect.objectContaining({ paymentDetailsId })
    );
  });
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

function capturePaymentMethodWrites(row: ContractRow, held?: Promise<void>) {
  const bodies: unknown[] = [];
  server?.use(
    http.patch(`*/contracts/${row.id}/payment_details`, async ({ request }) => {
      bodies.push(await request.clone().json());
      if (held) await held;
      return HttpResponse.json(recorded.paymentMethodSet(), { status: 200 });
    })
  );
  return { bodies };
}

// -----------------------------------------------------------------------------

describe("useContract — the contract I have open (context members, R37)", () => {
  // @proves contract.feature:259
  it("The contract I have open carries everything the manager read about it", async () => {
    const { manager, row } = await openManager();
    const context = manager.useContext().context.value as ContractContext;

    expect(context.contractId).toBe(row.id);
    expect(context.rawContract?.id).toBe(row.id);
    expect(context.contract?.id).toBe(row.id);
  });

  // @proves contract.feature:265
  it("The contract I have open shows me its name", async () => {
    const { manager, row } = await openManager();
    expect(manager.useContext().title.value ?? null).toBe(row.name ?? null);
  });

  // @proves contract.feature:271
  it("My stored payment methods are loaded ready for the payment-method form", async () => {
    const { manager } = await openManager();
    const cardIds = recordedCardIds();
    expect(cardIds.length).toBeGreaterThan(0);

    await vi.waitFor(() => {
      const stored = manager.useContext().lookups.value?.storedPaymentMethods;
      expect((stored ?? []).map(card => card.id).sort()).toEqual(
        [...cardIds].sort()
      );
    });
  });
});

describe("useContract — the single read is addressed by `.withId(id)` (D95)", () => {
  // @proves contract.feature:361
  it("The contract I manage is the one I addressed by id", async () => {
    await seedClientSession();
    installContractHandler(server);
    installLookupHandlers();
    const row = recorded.one().data as ContractRow;
    const failure = recorded.withdrawRejected().response;
    server?.use(
      http.get(`*/contracts/${OUT_OF_ENUM_ID}`, () =>
        HttpResponse.json(failure.body as Record<string, unknown>, {
          status: failure.status
        })
      )
    );
    const observed = observeAllRequests();

    const addressed = managerFor(row.id);
    const other = managerFor(OUT_OF_ENUM_ID);

    expect(await addressed.useActions().isReady()).toBe(true);
    expect(addressed.useContext().contract.value?.id).toBe(row.id);
    expect(observed.matching(`/contracts/${row.id}`).length).toBeGreaterThan(0);

    await vi.waitFor(() => expect(other.useMeta().hasError.value).toBe(true));
    expect(other.useContext().contract.value?.id).not.toBe(row.id);
    observed.stop();
  });
});

describe("useContract — a read that fails settles on the error node (D43)", () => {
  // @proves contract.feature:277
  it("When reading my contract fails I am shown why", async () => {
    const { manager, message } = await openFailingManager();
    await vi.waitFor(() => expect(manager.useMeta().hasError.value).toBe(true));
    expect(manager.useContext().errors.value).toBe(message);
  });

  // @proves contract.feature:283
  it("A failed read of my contract stops loading and settles on an error instead of hanging", async () => {
    const { manager } = await openFailingManager();
    await vi.waitFor(() => expect(manager.useMeta().hasError.value).toBe(true));
    expect(manager.useMeta().isLoading.value).toBe(false);
  });

  // @proves contract.feature:289
  it("A failed read tells me at once that my contract is not ready", async () => {
    const { manager } = await openFailingManager();
    const ready = await settledWithin(
      manager.useActions().isReady(),
      5000,
      "never-settled" as unknown as boolean
    );
    expect(ready).toBe(false);
  });

  // @proves contract.feature:295
  it("A reset after a failed read reads my contract again", async () => {
    const { manager, row } = await openFailingManager();
    await vi.waitFor(() => expect(manager.useMeta().hasError.value).toBe(true));

    const held = gate();
    const envelope = recorded.one();
    server?.use(
      http.get("*/contracts/:id", async () => {
        await held.wait;
        return HttpResponse.json(envelope as Record<string, unknown>, {
          status: 200
        });
      })
    );

    const reset = manager.useActions().reset();
    await vi.waitFor(() =>
      expect(manager.useMeta().isLoading.value).toBe(true)
    );
    held.open();
    await reset;

    await vi.waitFor(() =>
      expect(manager.useContext().contract.value?.id).toBe(row.id)
    );
    expect(manager.useMeta().isLoading.value).toBe(false);
    expect(manager.useMeta().hasError.value).toBe(false);
  });
});

describe("useContract — the one payment-method form keeps the template action names (R37)", () => {
  // @proves contract.feature:302
  it("A stored card I choose in the payment-method form is taken in and checked", async () => {
    const { manager, row } = await openForm();
    const card = otherCard(row);

    await manager.useActions().input({ paymentDetailsId: card });

    await awaitModel(manager, card);
    await vi.waitFor(() => expect(manager.useMeta().isValid.value).toBe(true));
  });

  // @proves contract.feature:308
  it("Close the payment-method form without changing how my contract is paid for", async () => {
    const { manager, row } = await openForm();
    const firstDraw = manager.useContext().paymentMethod.value;
    const card = otherCard(row);
    await manager.useActions().input({ paymentDetailsId: card });
    await awaitModel(manager, card);
    await vi.waitFor(() => expect(manager.useMeta().isValid.value).toBe(true));
    const observed = observeAllRequests();

    manager.useActions().clear();

    await vi.waitFor(() =>
      expect(manager.useMeta().isPaymentMethodOpen.value).toBe(false)
    );
    expect(
      observed.matching(`/contracts/${row.id}/payment_details`)
    ).toHaveLength(0);
    observed.stop();

    await manager.useActions().openPaymentMethod();
    await vi.waitFor(() => {
      const reopened = manager.useContext().paymentMethod.value;
      expect(reopened?.schema).toEqual(firstDraw?.schema);
      expect(reopened?.uischema).toEqual(firstDraw?.uischema);
      expect(reopened?.model).toEqual(firstDraw?.model);
    });
    expect(
      manager.useContext().paymentMethod.value?.model?.paymentDetailsId
    ).not.toBe(card);
  });

  // @proves contract.feature:315
  it("Submit the payment-method form with the card I hand it", async () => {
    const { manager, row } = await openForm();
    const card = otherCard(row);
    const writes = capturePaymentMethodWrites(row);

    const result = await manager
      .useActions()
      .update({ paymentDetailsId: card });

    expect(writes.bodies).toEqual([{ payment_details_id: card }]);
    expect((result as Contract).id).toBe(row.id);
  });

  // @proves contract.feature:342
  it("A card I choose and submit straight away is the one that is sent", async () => {
    const { manager, row } = await openForm();
    const card = otherCard(row);
    const writes = capturePaymentMethodWrites(row);

    void manager.useActions().input({ paymentDetailsId: card });
    const result = await manager.useActions().update();

    expect(writes.bodies).toEqual([{ payment_details_id: card }]);
    expect((result as Contract).id).toBe(row.id);
  });

  // @proves contract.feature:322
  it("While my payment-method change is being sent I am told it is in progress", async () => {
    const { manager, row } = await openForm();
    const card = otherCard(row);
    const held = gate();
    capturePaymentMethodWrites(row, held.wait);
    await manager.useActions().input({ paymentDetailsId: card });
    await awaitModel(manager, card);
    await vi.waitFor(() => expect(manager.useMeta().isValid.value).toBe(true));
    expect(manager.useMeta().isProcessing.value).toBe(false);

    const submitted = manager.useActions().update();

    await vi.waitFor(() =>
      expect(manager.useMeta().isProcessing.value).toBe(true)
    );
    held.open();
    await submitted;
    await vi.waitFor(() =>
      expect(manager.useMeta().isProcessing.value).toBe(false)
    );
  });

  // @proves contract.feature:329
  it("When my payment-method change finishes I am told it is done", async () => {
    const { manager, row } = await openForm();
    const card = otherCard(row);
    const held = gate();
    capturePaymentMethodWrites(row, held.wait);
    await manager.useActions().input({ paymentDetailsId: card });
    await awaitModel(manager, card);
    await vi.waitFor(() => expect(manager.useMeta().isValid.value).toBe(true));

    const submitted = manager.useActions().update();
    await vi.waitFor(() =>
      expect(manager.useMeta().isProcessing.value).toBe(true)
    );
    const done = manager.useActions().onDone();

    expect(
      await settledWithin(
        done.then(() => "settled"),
        500,
        "pending"
      )
    ).toBe("pending");

    held.open();
    await submitted;
    expect(await settledWithin(done, 5000, false)).toBe(true);
  });

  // @proves contract.feature:348
  it("With no payment-method change under way I am not told a change is done", async () => {
    const { manager } = await openForm();
    expect(manager.useMeta().isProcessing.value).toBe(false);

    const done = manager.useActions().onDone();

    expect(
      await settledWithin(
        done.then(() => "settled"),
        1000,
        "pending"
      )
    ).toBe("pending");
  });

  // @proves contract.feature:335
  it("A payment-method choice outside my stored cards is not sent and tells me why", async () => {
    const { manager, row } = await openForm();
    expect(recordedCardIds()).not.toContain(OUT_OF_ENUM_ID);
    const writes = capturePaymentMethodWrites(row);

    await expect(
      manager.useActions().update({ paymentDetailsId: OUT_OF_ENUM_ID })
    ).rejects.toBeDefined();

    expect(writes.bodies).toEqual([]);
    const fieldErrors = manager.useContext().validationErrors.value ?? [];
    expect(fieldErrors.length).toBeGreaterThan(0);
    expect(
      fieldErrors.some(error =>
        String(error.instancePath).includes("paymentDetailsId")
      )
    ).toBe(true);
  });
});
