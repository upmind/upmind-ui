/**
 * @fileoverview useContractProduct — the open-gate flags a page reads before
 * it offers the cancellation or the consolidation form (integration,
 * AC-11/AC-9, D27/D28)
 *
 * ## Job To Be Done
 * Prove that `useMeta().hasCancellationOptions` and `useMeta().canConsolidate`
 * report whether each form is offered, per the legacy rules operator-review
 * D27 and D28 port, and that each flag agrees with what `openCancellation` /
 * `openConsolidation` actually do. Every product is the recorded product read,
 * with one real field replaced per row.
 *
 * ## What Breaks If These Fail
 * A page offers a cancellation or consolidation control that opens an empty
 * dialog, or hides a form legacy offers the client.
 */

import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import {
  CancellationRequestStatusCodes,
  ContractStatusCodes,
  InvoiceConsolidationTypes
} from "@upmind-automation/types";
import { useContractProduct } from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import {
  installProductHandler,
  recorded,
  seedClientSession
} from "./contract-product.int-helpers";
import { server } from "./setup.integration";

type ProductRow = Record<string, unknown> & {
  id: string;
  contract_id: string;
  contract?: Record<string, unknown> & { client?: Record<string, unknown> };
  product?: Record<string, unknown>;
};

function baseRow(): ProductRow {
  return recorded.one().data as ProductRow;
}

function recordedPendingRequest(): Record<string, unknown> {
  const request = (
    recorded.pendingRequest().data as {
      contract?: { cancellation_request?: Record<string, unknown> };
    }
  ).contract?.cancellation_request;
  expect((request?.status as { code?: string } | undefined)?.code).toBe(
    CancellationRequestStatusCodes.REQUEST_CANCELLATION_REQUEST
  );
  return request as Record<string, unknown>;
}

function withClientConsolidation(
  row: ProductRow,
  value: InvoiceConsolidationTypes
): ProductRow {
  return {
    ...row,
    contract: {
      ...(row.contract ?? {}),
      client: {
        ...(row.contract?.client ?? {}),
        invoice_consolidation_enabled: value
      }
    }
  };
}

async function openManager(row: ProductRow) {
  await seedClientSession();
  installProductHandler(server, row);
  server?.use(
    http.get("*/clients/:id", () =>
      HttpResponse.json({ status: "ok", data: { custom_fields: [] } })
    )
  );
  const manager = useContractProduct()
    .as(ScopeActorTypes.CLIENT)
    .withId(row.id);
  await manager.useActions().isReady();
  return manager;
}

/**
 * - `@proves contract-product.feature:781` — an active subscription
 * - `@proves contract-product.feature:782` — auto-renew off, no end date
 * - `@proves contract-product.feature:783` — already set to expire
 * - `@proves contract-product.feature:784` — a cancellation booked for a future date
 * - `@proves contract-product.feature:785` — a cancellation request already pending
 * - `@proves contract-product.feature:786` — still being imported
 * - `@proves contract-product.feature:787` — a cancelled subscription
 */
describe("useContractProduct — I am told whether the cancellation form is offered before I open it (AC-11)", () => {
  const stopped = () =>
    recorded.softCancelled().data as {
      renew: boolean;
      calculated_cancel_date: string;
    };

  it.each([
    ["an active subscription", () => baseRow(), true],
    [
      "a subscription with auto-renew off and no end date",
      () => ({ ...baseRow(), renew: false, calculated_cancel_date: null }),
      true
    ],
    [
      "a subscription already set to expire",
      () => ({
        ...baseRow(),
        renew: stopped().renew,
        calculated_cancel_date: stopped().calculated_cancel_date
      }),
      false
    ],
    [
      "a product with a cancellation booked for a future date",
      () => ({
        ...baseRow(),
        contract_request: {
          status: {
            code: CancellationRequestStatusCodes.REQUEST_SCHEDULED_FUTURE_CANCELLATION
          }
        }
      }),
      false
    ],
    [
      "a product with a cancellation request already pending",
      () => ({
        ...baseRow(),
        contract_request: recordedPendingRequest()
      }),
      false
    ],
    [
      "a subscription still being imported",
      () => ({ ...baseRow(), staged_import: true }),
      false
    ],
    [
      "a cancelled subscription",
      () => ({
        ...baseRow(),
        status: { code: ContractStatusCodes.CANCELLED }
      }),
      false
    ]
  ])(
    "AC-11 %s: hasCancellationOptions reports the form's offer, and matches whether openCancellation opens it",
    async (_case, build, offered) => {
      const manager = await openManager(build());
      const meta = manager.useMeta();

      expect(meta.hasCancellationOptions.value).toBe(offered);

      await manager.useActions().openCancellation();

      expect(meta.isCancellationOpen.value).toBe(offered);
      expect(Boolean(manager.useContext().cancellation.value)).toBe(offered);
    }
  );
});

/**
 * - `@proves contract-product.feature:801` — my account consolidates
 * - `@proves contract-product.feature:802` — my account follows its default
 * - `@proves contract-product.feature:803` — my account never consolidates
 * - `@proves contract-product.feature:804` — no consolidation setting on the product
 * - `@proves contract-product.feature:805` — a one-off purchase
 * - `@proves contract-product.feature:806` — still being imported
 * - `@proves contract-product.feature:807` — a cancelled subscription
 */
describe("useContractProduct — I am told whether the consolidation form is offered before I open it (AC-9)", () => {
  const consolidating = () =>
    withClientConsolidation(baseRow(), InvoiceConsolidationTypes.ENABLED);

  it.each([
    ["a subscription, and my account consolidates", consolidating, true],
    [
      "a subscription, and my account follows its default",
      () =>
        withClientConsolidation(baseRow(), InvoiceConsolidationTypes.INHERIT),
      true
    ],
    [
      "a subscription, and my account never consolidates",
      () =>
        withClientConsolidation(baseRow(), InvoiceConsolidationTypes.DISABLED),
      false
    ],
    [
      "a subscription whose product carries no consolidation setting",
      () => {
        const row = consolidating();
        return {
          ...row,
          product: {
            ...(row.product ?? {}),
            invoice_consolidation_enabled: null
          }
        };
      },
      false
    ],
    [
      "a one-off purchase",
      () => ({ ...consolidating(), billing_cycle_months: 0 }),
      false
    ],
    [
      "a subscription still being imported",
      () => ({ ...consolidating(), staged_import: true }),
      false
    ],
    [
      "a cancelled subscription",
      () => ({
        ...consolidating(),
        status: { code: ContractStatusCodes.CANCELLED }
      }),
      false
    ]
  ])(
    "AC-9 %s: canConsolidate reports the form's offer, and matches whether openConsolidation opens it",
    async (_case, build, offered) => {
      const manager = await openManager(build());
      const meta = manager.useMeta();

      expect(meta.canConsolidate.value).toBe(offered);

      await manager.useActions().openConsolidation();

      expect(meta.isConsolidationOpen.value).toBe(offered);
      expect(Boolean(manager.useContext().consolidation.value)).toBe(offered);
    }
  );
});
