// -----------------------------------------------------------------------------
/**
 * @module tests/wallet
 * @description Plan Phase 2, gap doc §3 Account credit: credit is held per
 * CURRENCY, so the balances table has a row for each one the client holds —
 * two on the brand that trades in two, one on the brand that trades in one.
 * The credit-limit panel belongs to the account that has a limit and nowhere
 * else, and what is left of it is the allowance less what is spent — worked
 * out here, from the seed. Behind both stand the FILED periods: a client reads
 * what each statement opened and closed on, and the per-movement ledger the
 * ninth closure retired is graded as absent rather than merely unused.
 */

import { beforeEach, describe, expect, it } from "vitest";
import { filter, find, map, size, sortBy, uniq, values } from "lodash-es";
import type { DataRefId } from "~/portal/mock/data-refs";
import type { DataRouteContext } from "~/portal/mock/injection";
import type { MockDataset } from "~/portal/mock/types";
import type { ListModuleItem } from "~/portal/modules/list/types";
import type { SpecModuleItem } from "~/portal/modules/spec/types";
import type { PageKey } from "~/portal/types";
import { hostgridConfig } from "~/portal/config/hostgrid";
import { PAGED_COLLECTION_ID } from "~/portal/mock/collection-defs";
import {
  DATA_REF_ID,
  dataRef,
  isDataRef,
  resolveDataRef,
  resolveDataRefProps
} from "~/portal/mock/data-refs";
import { useMockWallet } from "~/portal/mock/facades";
import { formatMoney } from "~/portal/mock/money";
import {
  MOCK_DATASET_ID,
  resetMockData,
  useMockData
} from "~/portal/mock/store";
import { resolve } from "~/portal/resolve";
import { PAGE_KEY } from "~/portal/types";

function resolveRef<T>(
  data: MockDataset,
  id: DataRefId,
  context: DataRouteContext = {}
): T {
  return resolveDataRefProps({ value: dataRef(id) }, data, context)?.value as T;
}

/** The gate a page row's presence hangs on — the config's own wiring. */
function gateOf(pageKey: PageKey, refId: DataRefId) {
  const row = find(
    resolve(hostgridConfig, { pageKeys: [pageKey] }).content.rows,
    candidate => isDataRef(candidate.visible) && candidate.visible.id === refId
  );
  if (row === undefined || !isDataRef(row.visible)) {
    throw new Error(`no row gated on ${refId}`);
  }
  return row.visible;
}

describe("wallet balances — one row per currency the client holds credit in", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
    resetMockData(MOCK_DATASET_ID.HOSTGRID_MINIMAL);
  });

  it("renders the brand that trades in two currencies as two rows, already worded", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);

    const rows = resolveRef<ListModuleItem[]>(
      data,
      DATA_REF_ID.WALLET_BALANCE_ITEMS
    );

    expect(data.wallet.balances.length).toBeGreaterThan(1);
    expect(rows).toHaveLength(data.wallet.balances.length);
    expect(uniq(map(rows, "id"))).toHaveLength(rows.length);
    expect(map(rows, "title")).toEqual(map(data.wallet.balances, "currency"));
    expect(map(rows, row => map(row.cells, "value"))).toEqual(
      map(data.wallet.balances, balance => [balance.formatted])
    );
  });

  it("renders the brand that trades in one as one row", () => {
    const bare = useMockData(MOCK_DATASET_ID.HOSTGRID_MINIMAL);

    const rows = resolveRef<ListModuleItem[]>(
      bare,
      DATA_REF_ID.WALLET_BALANCE_ITEMS
    );

    expect(bare.wallet.balances).toHaveLength(1);
    expect(rows).toHaveLength(1);
    expect(map(rows, row => map(row.cells, "value"))).toEqual(
      map(bare.wallet.balances, balance => [balance.formatted])
    );
  });
});

describe("credit limit — the account that has one, and what is left of it", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
    resetMockData(MOCK_DATASET_ID.HOSTGRID_MINIMAL);
  });

  it("shows the panel only where the brand granted a limit", () => {
    const granted = useMockData(MOCK_DATASET_ID.HOSTGRID);
    const bare = useMockData(MOCK_DATASET_ID.HOSTGRID_MINIMAL);
    const gate = gateOf(
      PAGE_KEY.BILLING_CREDIT,
      DATA_REF_ID.WALLET_HAS_CREDIT_LIMIT
    );

    expect(granted.wallet.creditLimit).toBeDefined();
    expect(bare.wallet.creditLimit).toBeUndefined();
    expect(resolveDataRef(gate, granted)).toBe(true);
    expect(resolveDataRef(gate, bare)).toBe(false);
    expect(
      resolveRef<SpecModuleItem[]>(
        bare,
        DATA_REF_ID.WALLET_CREDIT_LIMIT_SPEC_ITEMS
      )
    ).toEqual([]);
  });

  it("leaves the allowance less what is spent — the meter and the panel agreeing with the seed", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);
    const limit = data.wallet.creditLimit;
    if (limit === undefined) throw new Error("seed grants no credit limit");
    // The test's own arithmetic over the seed — nothing downstream computes it.
    const remaining = formatMoney(
      limit.allowance.amount - limit.used.amount,
      limit.allowance.currency
    );

    const rows = resolveRef<SpecModuleItem[]>(
      data,
      DATA_REF_ID.WALLET_CREDIT_LIMIT_SPEC_ITEMS
    );
    const view = useMockWallet(data).useContext().data.value;

    expect(find(rows, { id: "allowance" })?.value).toBe(
      limit.allowance.formatted
    );
    expect(find(rows, { id: "used" })?.value).toBe(limit.used.formatted);
    expect(find(rows, { id: "remaining" })?.value).toBe(remaining);
    expect(view.creditLimit?.remaining.formatted).toBe(remaining);
    expect(view.creditLimit?.remaining.amount).toBe(
      limit.allowance.amount - limit.used.amount
    );
    // The meter reads the figures, never a display string.
    expect(resolveRef<number>(data, DATA_REF_ID.WALLET_CREDIT_ALLOWANCE)).toBe(
      limit.allowance.amount
    );
    expect(resolveRef<number>(data, DATA_REF_ID.WALLET_CREDIT_USED)).toBe(
      limit.used.amount
    );
  });
});

describe("the credit page shows statements and no movement ledger", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  it("keeps the filed periods and declares no per-movement panel at all", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);
    const rows = resolveRef<ListModuleItem[]>(
      data,
      DATA_REF_ID.WALLET_CREDIT_STATEMENT_ITEMS
    );
    const gate = gateOf(
      PAGE_KEY.BILLING_CREDIT,
      DATA_REF_ID.WALLET_HAS_CREDIT_STATEMENTS
    );

    expect(rows.length).toBeGreaterThan(0);
    expect(resolveDataRef(gate, data)).toBe(true);

    // The staff-only ledger is gone in every part it was assembled from —
    // its refs, its pager and its collection id.
    expect(
      filter(values(DATA_REF_ID), id => /wallet-transaction/i.test(id))
    ).toEqual([]);
    expect(
      filter(values(PAGED_COLLECTION_ID), id => /wallet/i.test(id))
    ).toEqual([]);
  });

  it("states each period's figures as the facade holds them, closing into the next one's opening", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);
    const filed = sortBy(
      useMockWallet(data).useContext().data.value.statements ?? [],
      period => period.fromDate
    );
    const rows = resolveRef<ListModuleItem[]>(
      data,
      DATA_REF_ID.WALLET_CREDIT_STATEMENT_ITEMS
    );
    const shown = map(rows, row => find(filed, { id: row.id }));

    expect(size(filed)).toBeGreaterThan(1);
    expect(shown).not.toContain(undefined);
    expect(map(rows, row => map(row.cells, "value"))).toEqual(
      map(shown, period => [
        period?.opening.formatted,
        period?.credits.formatted,
        period?.debits.formatted,
        period?.closing.formatted
      ])
    );

    // What one period closed on is what the next one opened on — the figures
    // chain, so neither end is a display string standing alone.
    const chained = map(filed, (period, index) => {
      const next = filed[index + 1];
      if (next === undefined) return true;
      return period.closing.formatted === next.opening.formatted;
    });
    expect(uniq(chained)).toEqual([true]);
  });
});
