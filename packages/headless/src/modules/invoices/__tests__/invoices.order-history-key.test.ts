/**
 * @fileoverview invoices — the order history lives under the invoices cache root
 *
 * ## Job To Be Done
 * Prove the order-history list read is keyed under `"invoices"` (design 8.4),
 * so the pay refresh that invalidates `["invoices"]` with `exact: false`
 * reaches the order history and the order reads again after a payment.
 *
 * ## What Breaks If These Fail
 * A client pays an order and the order history keeps showing it unpaid until
 * a manual reload.
 */

import { afterEach, describe, expect, it } from "vitest";
import { queryClient } from "../../query/client";
import { openCell, resetCells } from "./invoices.unit-helpers";
import { filter, includes, map } from "lodash-es";

afterEach(resetCells);

/** Every cached query key that names the order-history context. */
const orderHistoryKeys = () =>
  filter(map(queryClient.getQueryCache().findAll(), "queryKey"), key =>
    includes(JSON.stringify(key), '"new_contract"')
  );

// FE-3237 AC20
describe("AC-3: the order history refreshes with the invoices", () => {
  it("keys the order-history read under the invoices root", () => {
    openCell();
    const keys = orderHistoryKeys();
    expect(keys).not.toHaveLength(0);
    expect(map(keys, key => key[0])).toEqual(map(keys, () => "invoices"));
  });
});
