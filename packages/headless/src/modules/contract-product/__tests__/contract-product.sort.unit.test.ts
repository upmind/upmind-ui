// @vitest-environment happy-dom
// -----------------------------------------------------------------------------
/**
 * @fileoverview contract-product sort vocabulary (unit)
 *
 * ## Job To Be Done
 * Pin the sort vocabulary the products list declares to a consumer against the
 * orderings the platform was asked for in the recorded "Order my products"
 * reads, and the order the list starts in against the recorded default read.
 *
 * ## What Breaks If These Fail
 * A sort control offers an ordering the platform does not know or drops one it
 * does, or the list declares a start order other than the one it sends.
 */

import { afterEach, describe, expect, it } from "vitest";
import { useContractProducts } from "..";
import { SortDirection } from "../../query/query.types";
import { ScopeActorTypes } from "../../scope/scope.types";
import { resetContractProductScopes } from "./contract-product.int-helpers";
import defaultRead from "./scenarios/order-my-products-status/02/get-contracts-products-exclude-delegated-1-skip-count-1-split-count-1.json";
import orderStatusRead from "./scenarios/order-my-products-status/03/get-contracts-products-exclude-delegated-1-skip-count-1-split-count-1.json";
import orderBoughtRead from "./scenarios/order-my-products-when-i-bought-them/03/get-contracts-products-exclude-delegated-1-skip-count-1-split-count-1.json";
import orderNextDueRead from "./scenarios/order-my-products-when-they-next-fall-due/03/get-contracts-products-exclude-delegated-1-skip-count-1-split-count-1.json";
import orderCancelledRead from "./scenarios/order-my-products-when-they-were-cancelled/03/get-contracts-products-exclude-delegated-1-skip-count-1-split-count-1.json";
import { map, sortBy } from "lodash-es";

// -----------------------------------------------------------------------------

afterEach(() => resetContractProductScopes());

const orderOf = (recording: unknown): string => {
  const { path } = (recording as { request: { path: string } }).request;
  const order = new URL(path, "http://recorded.local").searchParams.get(
    "order"
  );
  if (!order) throw new Error("The recording carries no order param.");
  return order;
};

const sortSchema = () => {
  const schema = useContractProducts().as(ScopeActorTypes.CLIENT).useContext()
    .schemas.query.schema;
  const sort = schema.properties?.sort as {
    default: { field: string; dir: string }[];
    items: { properties: { field: { enum: string[] } } };
  };
  return sort;
};

describe("AC-1 — the sort vocabulary the list declares", () => {
  it("offers exactly the orderings the platform was asked for in the recorded order reads", () => {
    const asked = map(
      [orderStatusRead, orderBoughtRead, orderNextDueRead, orderCancelledRead],
      read => orderOf(read).replace(/^-/, "")
    );

    expect(sortBy(sortSchema().items.properties.field.enum)).toStrictEqual(
      sortBy(asked)
    );
  });

  it("starts in the order of the recorded default read", () => {
    const order = orderOf(defaultRead);

    expect(sortSchema().default).toStrictEqual([
      {
        field: order.replace(/^-/, ""),
        dir: order.startsWith("-") ? SortDirection.DESC : SortDirection.ASC
      }
    ]);
  });
});
