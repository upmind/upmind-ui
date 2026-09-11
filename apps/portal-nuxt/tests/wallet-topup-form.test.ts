// -----------------------------------------------------------------------------
/**
 * @module tests/wallet-topup-form
 * @description Gap doc §3 "Account credit": the top-up CTA and its modal
 * return (plan F12, §3 row "Wallet top-up"). Credit is held per CURRENCY, so
 * the picker offers the currencies this client already holds and the write
 * moves exactly one balance — worked out here from the seed rather than read
 * back off the toast. Legacy disabled the control with a reason where the
 * brand would not let a client add credit themselves, which is a gate, so it
 * is graded on both branches. `wallet.test.ts` grades what the balances SAY;
 * this grades what topping one up DOES.
 */

import { beforeEach, describe, expect, it } from "vitest";
import {
  InvoiceStatus,
  WalletTransactionTypes
} from "@upmind-automation/types";
import { assign, find, first, map } from "lodash-es";
import type { MockBrandFeatures, MockDataset } from "~/portal/mock/types";
import {
  MOCK_ACTION,
  MOCK_REFUSAL_MESSAGE,
  MOCK_TOAST_INTENT,
  dispatchMockAction,
  mockActionValue
} from "~/portal/mock/actions";
import * as walletSchemas from "~/portal/mock/contracts/client-wallet.schemas";
import {
  DATA_REF_ID,
  dataRef,
  resolveDataRefProps
} from "~/portal/mock/data-refs";
import { MOCK_RECEIPT_REASON } from "~/portal/mock/facades/facade";
import { usePortalAjv } from "~/portal/mock/forms/ajv";
import { walletTopUpContext } from "~/portal/mock/forms/billing-contexts";
import { FORM_ID } from "~/portal/mock/forms/ids";
import { resolveMockForm } from "~/portal/mock/forms/registry";
import { HOSTGRID_MOCK_DATASET } from "~/portal/mock/hostgrid";
import {
  MOCK_DATASET_ID,
  resetMockData,
  useMockData
} from "~/portal/mock/store";

const NO_CONTEXT = {};

const TOP_UP = mockActionValue(MOCK_ACTION.OPEN_FORM, FORM_ID.WALLET_TOPUP);

const AMOUNT = 25;

type ActionLike = {
  readonly value: string;
  readonly label: string;
  readonly disabledReason?: string;
};

function hostgrid(): MockDataset {
  return useMockData(MOCK_DATASET_ID.HOSTGRID);
}

function withFeatures(overrides: Partial<MockBrandFeatures>): MockDataset {
  const dataset: MockDataset = structuredClone(HOSTGRID_MOCK_DATASET);
  return assign(dataset, {
    features: assign({}, dataset.features, overrides)
  });
}

function headerActions(data: MockDataset): ActionLike[] {
  return resolveDataRefProps(
    { value: dataRef(DATA_REF_ID.WALLET_HEADER_ACTIONS) },
    data
  )?.value as ActionLike[];
}

function balanceOf(data: MockDataset, currency: string): number {
  const row = find(data.wallet.balances, { currency });
  if (row === undefined) throw new Error(`no ${currency} balance in the seed`);
  return row.amount;
}

function payload(model: unknown): string {
  return `${MOCK_ACTION.WALLET_TOPUP}:${JSON.stringify(model)}`;
}

describe("the top-up control, and the brand that will not have it", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  it("stands on the balances panel and opens the registered form", () => {
    const data = hostgrid();
    const action = first(headerActions(data));

    expect(data.features.walletTopUpEnabled).toBe(true);
    expect(action?.value).toBe(TOP_UP);
    expect(action?.label).toBeTruthy();
    expect(action?.disabledReason).toBeUndefined();
    expect(dispatchMockAction(data, NO_CONTEXT, TOP_UP)?.form).toEqual({
      id: FORM_ID.WALLET_TOPUP
    });
  });

  it("stays put but goes dead, with a reason, where the brand adds credit itself", () => {
    const data = withFeatures({ walletTopUpEnabled: false });
    const action = first(headerActions(data));

    expect(action?.value).toBe(TOP_UP);
    expect(action?.disabledReason).toBeTruthy();
  });
});

describe("the form offers the currencies this account already holds", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  it("is the wallet's own currency list, and opens on the first of them", () => {
    const data = hostgrid();
    const held = map(data.wallet.balances, "currency");
    const entry = resolveMockForm(data, FORM_ID.WALLET_TOPUP, undefined);

    expect(held.length).toBeGreaterThan(1);
    expect(walletTopUpContext(data).currencies).toEqual(held);
    expect(entry?.submit).toBe(MOCK_ACTION.WALLET_TOPUP);
    expect(entry?.schema).toEqual(
      walletSchemas.useSchema(walletTopUpContext(data))
    );
    expect(entry?.model).toEqual(
      walletSchemas.walletTopUpDefaults(walletTopUpContext(data))
    );
    expect(
      (entry?.schema as { properties?: Record<string, { enum?: string[] }> })
        .properties?.currency?.enum
    ).toEqual(held);
  });

  it("the schema refuses a top-up of nothing before it is ever sent", () => {
    const data = hostgrid();
    const currency = map(data.wallet.balances, "currency")[0] ?? "";
    const validate = usePortalAjv().compile(
      walletSchemas.useSchema(walletTopUpContext(data))
    );

    expect(validate({ currency, amount: AMOUNT })).toBe(true);
    expect(validate({ currency, amount: 0 })).toBe(false);
    expect(validate({ currency })).toBe(false);
    expect(validate({ currency: "XXX", amount: AMOUNT })).toBe(false);
  });
});

describe("adding credit moves one balance, one ledger and one invoice", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  it("raises exactly the currency it was asked for, by exactly the amount", () => {
    const data = hostgrid();
    const [moved, untouched] = map(data.wallet.balances, "currency");
    const labels = map(data.wallet.balances, "currency");
    const amounts = map(data.wallet.balances, "amount");
    const expected = balanceOf(data, moved ?? "") + AMOUNT;
    const before = balanceOf(data, untouched ?? "");

    const result = dispatchMockAction(
      data,
      NO_CONTEXT,
      payload({ currency: moved, amount: AMOUNT })
    );

    expect(result?.toast?.intent).toBe(MOCK_TOAST_INTENT.SUCCESS);
    expect(balanceOf(data, moved ?? "")).toBe(expected);
    expect(balanceOf(data, untouched ?? "")).toBe(before);
    expect(data.wallet.balances).toHaveLength(2);
    // Read by POSITION, not by label: a write that relabels a row would
    // otherwise be looked up as the row it renamed itself into, and a write
    // that discards the standing balance would land on the same total.
    expect(map(data.wallet.balances, "currency")).toEqual(labels);
    expect(data.wallet.balances[1]?.amount).toBe(amounts[1]);
    expect(data.wallet.balances[0]?.amount).toBe((amounts[0] ?? 0) + AMOUNT);
  });

  it("records the movement as an ADD, newest first, with the total it left behind", () => {
    const data = hostgrid();
    const currency = map(data.wallet.balances, "currency")[1] ?? "";
    const before = data.wallet.transactions.length;

    dispatchMockAction(data, NO_CONTEXT, payload({ currency, amount: AMOUNT }));

    const added = first(data.wallet.transactions);
    expect(data.wallet.transactions).toHaveLength(before + 1);
    expect(added?.type).toBe(WalletTransactionTypes.ADD);
    expect(added?.amount.amount).toBe(AMOUNT);
    expect(added?.amount.currency).toBe(currency);
    expect(added?.balanceAfter.amount).toBe(balanceOf(data, currency));
    expect(added?.balanceAfter.currency).toBe(currency);
  });

  it("mints a paid invoice for it, at the top of the ledger", () => {
    const data = hostgrid();
    const currency = map(data.wallet.balances, "currency")[0] ?? "";
    const before = map(data.invoices, "id");

    dispatchMockAction(data, NO_CONTEXT, payload({ currency, amount: AMOUNT }));

    const minted = first(data.invoices);
    expect(data.invoices).toHaveLength(before.length + 1);
    expect(before).not.toContain(minted?.id);
    expect(minted?.status).toBe(InvoiceStatus.PAID);
    expect(minted?.total.amount).toBe(AMOUNT);
    expect(minted?.total.currency).toBe(currency);
    expect(minted?.unpaidAmount.amount).toBe(0);
  });

  it("the facade refuses a top-up of nothing too, and moves nothing at all", () => {
    const data = hostgrid();
    const currency = map(data.wallet.balances, "currency")[0] ?? "";
    const balances = map(data.wallet.balances, "amount");
    const ledger = data.wallet.transactions.length;
    const invoices = data.invoices.length;

    const result = dispatchMockAction(
      data,
      NO_CONTEXT,
      payload({ currency, amount: 0 })
    );

    expect(result?.toast?.intent).toBe(MOCK_TOAST_INTENT.WARNING);
    expect(result?.toast?.title).toContain(
      MOCK_REFUSAL_MESSAGE[MOCK_RECEIPT_REASON.EMPTY_AMOUNT]
    );
    expect(map(data.wallet.balances, "amount")).toEqual(balances);
    expect(data.wallet.transactions).toHaveLength(ledger);
    expect(data.invoices).toHaveLength(invoices);
  });

  it("a half-typed payload is not a write", () => {
    const data = hostgrid();
    const balances = map(data.wallet.balances, "amount");
    const ledger = data.wallet.transactions.length;

    expect(
      dispatchMockAction(
        data,
        NO_CONTEXT,
        `${MOCK_ACTION.WALLET_TOPUP}:{"currency":`
      )
    ).toBeUndefined();
    expect(map(data.wallet.balances, "amount")).toEqual(balances);
    expect(data.wallet.transactions).toHaveLength(ledger);
  });
});
