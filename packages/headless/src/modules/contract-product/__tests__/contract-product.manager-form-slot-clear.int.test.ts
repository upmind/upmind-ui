/**
 * @fileoverview useContractProduct — a form's context slot is empty once the
 * product is read again (integration, FE-3029 Verify repair)
 *
 * ## Job To Be Done
 * Prove over the recorded corpus that `useContext().cancellation` and
 * `useContext().consolidation` hold no form after the manager reads the
 * product again: after a submitted form's write lands, after `refresh()`, and
 * after `reset()` — even though the client never closed the form; that
 * `useMeta().isCancellationOpen` / `.isConsolidationOpen` then report the form
 * closed; and that opening the form again fills its slot with a whole
 * `{ schema, uischema, model }`, so no dialog opens empty.
 *
 * ## What Breaks If These Fail
 * A page that draws each form from its own slot keeps a dead form, with the
 * old model, beside the re-shown control that opens the form.
 */

import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";
import { InvoiceConsolidationTypes } from "@upmind-automation/types";
import { useContractProduct } from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import {
  ContractProductCancelOption,
  ContractProductFormTypes
} from "../contract-product.types";
import {
  installProductHandler,
  recorded,
  seedClientSession
} from "./contract-product.int-helpers";
import { server } from "./setup.integration";

type Row = { id: string; contract_id: string };

async function openManager() {
  await seedClientSession();
  const handler = installProductHandler(server);
  const row = recorded.one().data as unknown as Row;
  const manager = useContractProduct()
    .as(ScopeActorTypes.CLIENT)
    .withId(row.id);
  await manager.useActions().isReady();
  return { manager, row, handler };
}

type Manager = Awaited<ReturnType<typeof openManager>>["manager"];

async function open(manager: Manager, form: ContractProductFormTypes) {
  const actions = manager.useActions();
  if (form === ContractProductFormTypes.CANCELLATION) {
    await actions.openCancellation();
  } else {
    await actions.openConsolidation();
  }
}

async function openForm(form: ContractProductFormTypes) {
  const opened = await openManager();
  await open(opened.manager, form);
  return opened;
}

function slot(manager: Manager, form: ContractProductFormTypes) {
  const context = manager.useContext();
  return form === ContractProductFormTypes.CANCELLATION
    ? context.cancellation.value
    : context.consolidation.value;
}

function isOpen(manager: Manager, form: ContractProductFormTypes) {
  const meta = manager.useMeta();
  return form === ContractProductFormTypes.CANCELLATION
    ? meta.isCancellationOpen.value
    : meta.isConsolidationOpen.value;
}

async function expectClosedThenDrawnInFull(
  manager: Manager,
  form: ContractProductFormTypes
) {
  expect(slot(manager, form)).toBeUndefined();
  expect(isOpen(manager, form)).toBe(false);

  await open(manager, form);

  expect(isOpen(manager, form)).toBe(true);
  const reopened = slot(manager, form);
  expect(reopened?.schema).toBeTruthy();
  expect(reopened?.uischema).toBeTruthy();
  expect(reopened?.model).toBeTruthy();
}

async function rereadDropsForm(
  reread: "refresh" | "reset",
  form: ContractProductFormTypes
) {
  const { manager, handler } = await openForm(form);
  expect(slot(manager, form)).toBeTruthy();
  const readsBefore = handler.reads();

  await manager.useActions()[reread]();

  await settledAfterReread(manager, handler.reads, readsBefore);
  await expectClosedThenDrawnInFull(manager, form);
}

async function settledAfterReread(
  manager: Manager,
  reads: () => number,
  readsBefore: number
) {
  await vi.waitFor(() => {
    expect(reads()).toBeGreaterThan(readsBefore);
    expect(manager.useMeta().isLoading.value).toBe(false);
    expect(manager.useMeta().isAvailable.value).toBe(true);
  });
}

describe("useContractProduct — a submitted form leaves no form behind once its change lands", () => {
  // @proves contract-product.feature:943
  it("A cancellation I submit leaves no cancellation form behind", async () => {
    const { manager, row, handler } = await openForm(
      ContractProductFormTypes.CANCELLATION
    );
    server?.use(
      http.post(`*/contracts/${row.contract_id}/cancel/request`, () =>
        HttpResponse.json(recorded.cancellationRequested(), { status: 200 })
      )
    );
    await manager.useActions().set(ContractProductFormTypes.CANCELLATION, {
      option: ContractProductCancelOption.HARD
    });
    expect(manager.useContext().cancellation.value).toBeTruthy();
    const readsBefore = handler.reads();

    await manager.useActions().submitCancellation();

    await settledAfterReread(manager, handler.reads, readsBefore);
    await expectClosedThenDrawnInFull(
      manager,
      ContractProductFormTypes.CANCELLATION
    );
  });

  // @proves contract-product.feature:951
  it("A consolidation choice I submit leaves no consolidation form behind", async () => {
    const { manager, row, handler } = await openForm(
      ContractProductFormTypes.CONSOLIDATION
    );
    server?.use(
      http.put(
        `*/contracts/${row.contract_id}/products/${row.id}/properties`,
        () => HttpResponse.json(recorded.consolidationSet(), { status: 200 })
      )
    );
    await manager.useActions().set(ContractProductFormTypes.CONSOLIDATION, {
      invoiceConsolidationEnabled: InvoiceConsolidationTypes.ENABLED
    });
    expect(manager.useContext().consolidation.value).toBeTruthy();
    const readsBefore = handler.reads();

    await manager.useActions().submitConsolidation();

    await settledAfterReread(manager, handler.reads, readsBefore);
    await expectClosedThenDrawnInFull(
      manager,
      ContractProductFormTypes.CONSOLIDATION
    );
  });
});

describe("useContractProduct — reading my product again drops a form I left open", () => {
  // @proves contract-product.feature:959
  it("A refresh of my product drops the cancellation form I left open", () =>
    rereadDropsForm("refresh", ContractProductFormTypes.CANCELLATION));

  // @proves contract-product.feature:967
  it("A reset of my product drops the cancellation form I left open", () =>
    rereadDropsForm("reset", ContractProductFormTypes.CANCELLATION));

  // @proves contract-product.feature:975
  it("A refresh of my product drops the consolidation form I left open", () =>
    rereadDropsForm("refresh", ContractProductFormTypes.CONSOLIDATION));

  // @proves contract-product.feature:983
  it("A reset of my product drops the consolidation form I left open", () =>
    rereadDropsForm("reset", ContractProductFormTypes.CONSOLIDATION));
});
