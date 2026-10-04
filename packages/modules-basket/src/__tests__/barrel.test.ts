// -----------------------------------------------------------------------------
/**
 * @fileoverview The curated public barrel.
 *
 * ## Job To Be Done
 * The barrel publishes the moved modules' names, minus two, and no lower package's.
 *
 * ## What Breaks If These Fail
 * A dropped name breaks the old import path, or a `headless` composable gains a second one.
 */

import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import * as foundation from "@upmind-automation/foundation";
import * as headless from "@upmind-automation/headless";
import * as payment from "@upmind-automation/payment";
import * as product from "@upmind-automation/product";
import * as barrel from "../index";

// -----------------------------------------------------------------------------

const LEGACY_VALUES = [
  "UpmBasket",
  "UpmBasketAction",
  "UpmBasketUnavailable",
  "UpmCurrency",
  "UpmBasketSummary",
  "BASKET_TEMPLATE",
  "UpmBasketProductEdit",
  "UpmPromotionBadge",
  "UpmBasketProductCards",
  "BASKET_PRODUCT_TEMPLATE",
  "UpmBillingForm",
  "UpmBilling",
  "BILLING_TEMPLATE",
  "UpmCheckout",
  "CHECKOUT_TEMPLATE",
  "UpmProductSetup",
  "PRODUCT_SETUP_TEMPLATE"
];

const LEGACY_TYPES = [
  "BillingProps",
  "BillingFormProps",
  "CheckoutContentProps",
  "CheckoutHeroProps",
  "CheckoutProductSetupProps",
  "CheckoutBillingProps",
  "CheckoutPricingProps",
  "GuestEmailProps",
  "ProductSetupProps",
  "ProductSetupFormProps"
];

const WITHHELD = ["UpmPromotionBadge", "UpmBasketAction"];

const HEADLESS_COMPOSABLES = [
  "useBasket",
  "useBasketProducts",
  "useProductSetup",
  "useRoutingEngine",
  "useConfig"
];

const exported = Object.keys(barrel)
  .filter(name => name !== "default")
  .sort();

// -----------------------------------------------------------------------------

const PACKAGE_ROOT = resolve(process.cwd());
const SOURCE_ROOT = join(PACKAGE_ROOT, "src");

function fileOf(value: unknown): string | undefined {
  if (!value || typeof value !== "object") return undefined;

  const file = (value as { __file?: unknown }).__file;
  return typeof file === "string" ? file : undefined;
}

const barrelSource = readFileSync(join(SOURCE_ROOT, "index.ts"), "utf8");

function publishedTypeNames(source: string): string[] {
  const found = new Set<string>();

  for (const block of source.matchAll(/export\s+type\s*\{([^}]*)\}/g)) {
    for (const member of block[1].split(",")) {
      const name = member
        .trim()
        .split(/\s+as\s+/)
        .pop()
        ?.trim();
      if (name) found.add(name);
    }
  }

  for (const block of source.matchAll(/export\s*\{([^}]*)\}/g)) {
    for (const member of block[1].split(",")) {
      const inline = /^\s*type\s+(.+)$/.exec(member);
      const name = inline?.[1]
        .split(/\s+as\s+/)
        .pop()
        ?.trim();
      if (name) found.add(name);
    }
  }

  for (const alias of source.matchAll(/export\s+type\s+(\w+)\s*=/g)) {
    found.add(alias[1]);
  }

  return [...found].sort();
}

const publishedTypes = publishedTypeNames(barrelSource);

// -----------------------------------------------------------------------------

describe("what the five moved modules published before the move", () => {
  it("still publishes every legacy value except the two withheld", () => {
    const owed = LEGACY_VALUES.filter(name => !WITHHELD.includes(name));
    const dropped = owed.filter(name => !exported.includes(name));

    expect(
      dropped,
      `names the pre-move modules published and this barrel no longer does: ` +
        dropped.join(", ")
    ).toEqual([]);
  });

  it("still publishes every legacy type", () => {
    const dropped = LEGACY_TYPES.filter(name => !publishedTypes.includes(name));

    expect(
      dropped,
      `types the pre-move modules published and this barrel no longer does: ` +
        dropped.join(", ")
    ).toEqual([]);
  });

  it("renames none of them", () => {
    const owed = LEGACY_VALUES.filter(name => !WITHHELD.includes(name));

    for (const name of owed) {
      expect(exported, `${name} was renamed rather than moved`).toContain(name);
    }
  });

  it.each(WITHHELD)("withholds %s, and says so by not publishing it", name => {
    expect(exported).not.toContain(name);
  });
});

describe("the basket package's curated public barrel", () => {
  it("publishes no component from outside this package at all", () => {
    const foreign = Object.entries(barrel)
      .map(([name, value]) => ({ name, file: fileOf(value) }))
      .filter(entry => entry.file && !entry.file.startsWith(`${SOURCE_ROOT}/`))
      .map(entry => `${entry.name} (${entry.file})`);

    expect(
      foreign,
      `these are republished from another package: ${foreign.join(", ")}`
    ).toEqual([]);
  });

  it("re-exports no headless composable, so each has one import path", () => {
    const leaked = HEADLESS_COMPOSABLES.filter(name => exported.includes(name));

    expect(leaked).toEqual([]);
  });

  it("re-exports nothing from headless, foundation, product or payment", () => {
    const upstream = new Set([
      ...Object.keys(headless),
      ...Object.keys(foundation),
      ...Object.keys(product),
      ...Object.keys(payment)
    ]);
    const passedThrough = exported.filter(name => upstream.has(name));

    expect(
      passedThrough,
      `a lower package's symbols are published from here: ${passedThrough.join(", ")}`
    ).toEqual([]);
  });
});
