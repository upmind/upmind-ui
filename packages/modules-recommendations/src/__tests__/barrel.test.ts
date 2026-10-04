// -----------------------------------------------------------------------------
/**
 * @fileoverview The curated public barrel
 *
 * ## Job To Be Done
 * Prove the barrel still publishes the moved module's two organisms, no
 * `headless` symbol, and no template name: the page owns its template names,
 * and the organisms take no template prop.
 *
 * ## What Breaks If These Fail
 * A consumer of the moved module loses a name, a `headless` symbol becomes a
 * contract nobody chose, or the package picks a page layout again.
 */

import { describe, expect, it } from "vitest";
import * as foundation from "@upmind-automation/foundation";
import * as headless from "@upmind-automation/headless";
import * as product from "@upmind-automation/product";
import * as barrel from "../index";
import { keys } from "lodash-es";

// -----------------------------------------------------------------------------

const CARRIED_OVER = ["UpmRecommendations", "UpmProductRecommendations"];

const ORGANISMS = [
  ["UpmRecommendations", barrel.UpmRecommendations],
  ["UpmProductRecommendations", barrel.UpmProductRecommendations]
] as const;

const HEADLESS_SYMBOLS = [
  "useRecommendations",
  "useProductRecommendations",
  "useBasket",
  "useConfig"
];

const exported = Object.keys(barrel)
  .filter(name => name !== "default")
  .sort();

// -----------------------------------------------------------------------------

describe("the recommendations package's curated public barrel", () => {
  it("publishes every name the module published before the move", () => {
    expect(exported).toEqual(expect.arrayContaining(CARRIED_OVER));
  });

  it("re-exports no headless symbol, so each has one import path", () => {
    const leaked = HEADLESS_SYMBOLS.filter(name => exported.includes(name));

    expect(leaked).toEqual([]);
  });

  it("re-exports nothing at all from the packages below it", () => {
    const upstream = new Set([
      ...Object.keys(headless),
      ...Object.keys(foundation),
      ...Object.keys(product)
    ]);
    const passedThrough = exported.filter(name => upstream.has(name));

    expect(
      passedThrough,
      `a lower package's symbols are published from here: ${passedThrough.join(", ")}`
    ).toEqual([]);
  });
});

describe("the template names the page owns", () => {
  it("publishes no template name", () => {
    const templateNames = exported.filter(name => /template/i.test(name));

    expect(templateNames).toEqual([]);
  });

  it.each(ORGANISMS)(
    "%s takes the page's props and no template prop",
    (_name, organism) => {
      const declared = keys(organism.props);

      expect(declared).toContain("configureRoute");
      expect(declared).not.toContain("template");
    }
  );
});
