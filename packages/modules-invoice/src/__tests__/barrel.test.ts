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
  "detailsTotalValueVariants"
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

describe("the template names", () => {
  it("leaves them to the host, which picks the layout for the brand's raw template", () => {
    expect(exported).not.toContain("ORDER_TEMPLATE");
  });
});
