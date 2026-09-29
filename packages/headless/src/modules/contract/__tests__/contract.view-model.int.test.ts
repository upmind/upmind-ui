/**
 * @fileoverview useContracts / useContract — the fields a contract page draws
 * (R38 items 8, 10 and 14)
 *
 * ## Job To Be Done
 * Drive the real `useContracts()` collection and `useContract()` manager over
 * the RECORDED staging captures and prove each list row publishes the fields
 * its columns bind — as the LANDED view model shapes them, never the wire
 * record (R38 item 10): the ISO next-due and purchase dates PLUS their
 * `useDate` display descriptors (`dateNextDue` / `datePurchased`) a
 * `TableCellDate` draws, the translated billing-cycle LABEL (never the raw
 * month count — "One time" for a one-time contract, GAP-02), and the
 * wire-formatted price. And that the contract I open lists every product on it
 * by name and state, each with its own id on that contract, so the page can
 * open it in `useContractProduct`.
 *
 * ## What Breaks If These Fail
 * The contracts list shows the raw month count instead of a cycle label, an
 * empty or wire-reaching date column, or an empty price column; or the
 * contract page cannot list its products or opens the wrong product.
 */

import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";
import { useContract, useContracts } from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import {
  installBackgroundStubs,
  recorded,
  seedClientSession
} from "./contract.int-helpers";
import { server } from "./setup.integration";
import { every, filter, find, includes, keyBy, keys, map } from "lodash-es";
import type { Contract } from "../contract.types";

// -----------------------------------------------------------------------------

type RecordedRow = {
  id: string;
  next_due_date: string | null;
  billing_cycle_months: number;
  start_date: string;
  total_amount_formatted: string;
};

type RecordedProduct = {
  id: string;
  name: string;
  product?: { name: string };
};

describe("useContracts — each row carries the fields its columns bind (R38 items 8, 10)", () => {
  // @proves contract.feature:477
  it("Each of my contracts shows when it next bills, how often, when I bought it and what it costs", async () => {
    const captured = recorded.list();
    const rows = captured.data as unknown as RecordedRow[];
    const oneTimeRow = find(rows, row => row.billing_cycle_months === 0);
    const subscriptionRow = find(rows, row => row.billing_cycle_months > 0);
    expect(oneTimeRow).toBeDefined();
    expect(subscriptionRow).toBeDefined();
    expect(filter(rows, row => row.next_due_date !== null)).not.toEqual([]);

    await seedClientSession();
    installBackgroundStubs();
    server?.use(
      http.get("*/contracts", () =>
        HttpResponse.json(captured, { status: 200 })
      )
    );

    const collection = useContracts().as(ScopeActorTypes.CLIENT);
    await collection.useActions().isReady();
    const context = collection.useContext();
    await vi.waitFor(() => {
      expect(context.data.value.length).toBe(rows.length);
    });

    // The ISO fields and the wire-formatted price map straight through.
    expect(
      map(context.data.value, contract => ({
        id: contract.id,
        nextDueDate: contract.nextDueDate,
        billingCycleMonths: contract.billingCycleMonths,
        purchaseDate: contract.purchaseDate,
        totalAmountFormatted: contract.totalAmountFormatted
      }))
    ).toEqual(
      map(rows, row => ({
        id: row.id,
        nextDueDate: row.next_due_date,
        billingCycleMonths: row.billing_cycle_months,
        purchaseDate: row.start_date,
        totalAmountFormatted: row.total_amount_formatted
      }))
    );

    const byId = keyBy(context.data.value, contract => contract.id);

    // Billing cycle renders the cycle's own TRANSLATED LABEL, never the raw
    // month count (R38 item 10, GAP-02) — legacy's `getBillingCycleName`, whose
    // i18n key each recorded cycle resolves to when translations are not loaded:
    // one-time reads "one time", a monthly cycle "monthly", a 24-month cycle
    // "biennially". Every recorded row is asserted against its cycle's expected
    // label EXACTLY, so any drift in the label mapping — a wrong key, a dropped
    // one-time special case, or the raw number — is caught.
    const EXPECTED_CYCLE_LABEL: Record<number, string> = {
      0: "term.one_time",
      1: "term.monthly",
      24: "term.biennially"
    };
    for (const contract of context.data.value) {
      const expected = EXPECTED_CYCLE_LABEL[contract.billingCycleMonths];
      expect(
        expected,
        `every recorded cycle needs an expected label; add ${contract.billingCycleMonths}`
      ).toBeDefined();
      expect(contract.billingCycleLabel).toBe(expected);
      expect(contract.billingCycleLabel).not.toBe(
        String(contract.billingCycleMonths)
      );
    }
    const oneTime = byId[oneTimeRow!.id];
    const subscription = byId[subscriptionRow!.id];

    // Each date column draws a `useDate` descriptor beside the ISO — a
    // `{ date }` a `TableCellDate` renders — never the raw string. A purchased
    // date always has one; a one-time contract's next-due descriptor is empty
    // (GAP-03), and a subscription's carries its formatted date.
    expect(oneTime.datePurchased?.date).toEqual(expect.any(String));
    expect(oneTime.datePurchased!.date!.length).toBeGreaterThan(0);
    expect(oneTime.dateNextDue?.date ?? null).toBeNull();

    expect(subscription.datePurchased?.date).toEqual(expect.any(String));
    expect(subscription.dateNextDue?.date).toEqual(expect.any(String));
    expect(subscription.dateNextDue!.date!.length).toBeGreaterThan(0);
  });
});

describe("useContract — the contract I open lists its products (R38 item 14)", () => {
  // @proves contract.feature:485
  it("The contract I have open lists its products, each by its own id", async () => {
    await seedClientSession();
    installBackgroundStubs();
    const row = recorded.one().data as {
      id: string;
      products: RecordedProduct[];
    };
    expect(row.products.length).toBeGreaterThan(1);
    server?.use(
      http.get("*/contracts/:id", ({ params }) => {
        if (String(params.id) !== row.id) return undefined;
        return HttpResponse.json(recorded.one(), { status: 200 });
      })
    );

    const manager = useContract().as(ScopeActorTypes.CLIENT).withId(row.id);
    await manager.useActions().isReady();

    // R34: each product is a LIST ITEM — its id, its own name and its catalogue
    // product's name — never a full `ContractProduct` view model. Each product
    // loads itself through `useContractProduct`.
    const products: Contract["products"] =
      manager.useContext().contract.value?.products ?? [];
    expect(
      map(products, product => ({
        id: product.id,
        name: product.name,
        product: product.product ? { name: product.product.name } : undefined
      }))
    ).toEqual(
      map(row.products, product => ({
        id: product.id,
        name: product.name,
        product: product.product ? { name: product.product.name } : undefined
      }))
    );
    // The row carries NOTHING MORE than the R34 list-item fields — no `status`,
    // `meta` or `contractId` from the old full view model.
    expect(
      every(products, product =>
        every(keys(product), key => includes(["id", "name", "product"], key))
      )
    ).toBe(true);
  });
});
