// -----------------------------------------------------------------------------
/**
 * @fileoverview The curated public barrel
 *
 * ## Job To Be Done
 * Prove the barrel still publishes the names the moved module published, and no `headless` symbol.
 *
 * ## What Breaks If These Fail
 * A consumer of the moved module loses a name, or a `headless` symbol becomes a contract nobody chose.
 */

import { describe, expect, it } from "vitest";
import * as foundation from "@upmind-automation/foundation";
import * as headless from "@upmind-automation/headless";
import * as barrel from "../index";

// -----------------------------------------------------------------------------

const CARRIED_OVER = [
  "UpmOrder",
  "UpmOrderProducts",
  "detailsSkeletonItemVariants",
  "detailsSkeletonRootVariants",
  "detailsSkeletonRowVariants",
  "detailsSkeletonTotalRowVariants",
  "detailsTotalLabelVariants",
  "detailsTotalRootVariants",
  "detailsTotalValueVariants",
  "ORDER_TEMPLATE"
];

const HEADLESS_SYMBOLS = ["useOrder", "useInvoice", "PAYMENT_STATE"];

const exported = Object.keys(barrel)
  .filter(name => name !== "default")
  .sort();

// -----------------------------------------------------------------------------

describe("the invoice package's curated public barrel", () => {
  it("publishes every name the order module published before the move", () => {
    expect(exported).toEqual(expect.arrayContaining(CARRIED_OVER));
  });

  it("re-exports no headless symbol, so each has one import path", () => {
    const leaked = HEADLESS_SYMBOLS.filter(name => exported.includes(name));

    expect(leaked).toEqual([]);
  });

  it("re-exports nothing at all from headless or foundation", () => {
    const upstream = new Set([
      ...Object.keys(headless),
      ...Object.keys(foundation)
    ]);
    const passedThrough = exported.filter(name => upstream.has(name));

    expect(
      passedThrough,
      `a lower package's symbols are published from here: ${passedThrough.join(", ")}`
    ).toEqual([]);
  });
});

describe("the template constant a consumer switches on", () => {
  it("carries the five page templates by their published values", () => {
    expect(barrel.ORDER_TEMPLATE.FULL).toBe("full");
    expect(barrel.ORDER_TEMPLATE.TWO_COLUMN_LTR).toBe("two-column-ltr");
    expect(barrel.ORDER_TEMPLATE.TWO_COLUMN_RTL).toBe("two-column-rtl");
    expect(barrel.ORDER_TEMPLATE.ENCLOSED).toBe("enclosed");
    expect(barrel.ORDER_TEMPLATE.INSET).toBe("inset");
  });

  it("carries no template beyond those five", () => {
    expect(Object.values(barrel.ORDER_TEMPLATE).sort()).toEqual([
      "enclosed",
      "full",
      "inset",
      "two-column-ltr",
      "two-column-rtl"
    ]);
  });
});
