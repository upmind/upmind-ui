// -----------------------------------------------------------------------------
/**
 * @fileoverview The 24 page templates this app hands the basket package.
 *
 * ## Job To Be Done
 * Each of the basket package's 24 page templates is filled from its own file, in
 * the records the host pages pass.
 *
 * ## What Breaks If These Fail
 * A basket-family page renders with no header, footer, layout or transition, on a green build.
 */

import { readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  BASKET_PRODUCT_TEMPLATE,
  BASKET_TEMPLATE,
  BILLING_TEMPLATE,
  CHECKOUT_TEMPLATE,
  PRODUCT_SETUP_TEMPLATE
} from "@upmind-automation/basket";
import { BASKET_TEMPLATES } from "../modules/basket/shell";
import { BASKET_PRODUCT_TEMPLATES } from "../modules/basket-product/shell";
import { BILLING_TEMPLATES } from "../modules/billing/shell";
import { CHECKOUT_TEMPLATES } from "../modules/checkout/shell";
import { PRODUCT_SETUP_TEMPLATES } from "../modules/product-setup/shell";
import { flatMap, uniq, values } from "lodash-es";
import type { Component } from "vue";

// -----------------------------------------------------------------------------

const PACKAGE_ROOT = resolve(process.cwd());

type Fill = {
  name: string;
  directory: string;
  arrangements: Record<string, string>;
  registered: Record<string, Component>;
  pins: Record<string, string>;
};

function templates(directory: string, names: string[]) {
  return names.map(
    name => `src/modules/${directory}/templates/${name}.template.vue`
  );
}

function pin(
  arrangements: Record<string, string>,
  directory: string,
  names: string[]
) {
  const members = values(arrangements);
  const files = templates(directory, names);

  return Object.fromEntries(
    members.map((member, index) => [member, files[index]])
  );
}

const FILLS: Fill[] = [
  {
    name: "basket",
    directory: "basket",
    arrangements: BASKET_TEMPLATE,
    registered: BASKET_TEMPLATES,
    pins: pin(BASKET_TEMPLATE, "basket", [
      "BasketFull",
      "BasketLTR",
      "BasketRTL",
      "BasketEnclosed",
      "BasketInset"
    ])
  },
  {
    name: "basket-product",
    directory: "basket-product",
    arrangements: BASKET_PRODUCT_TEMPLATE,
    registered: BASKET_PRODUCT_TEMPLATES,
    pins: pin(BASKET_PRODUCT_TEMPLATE, "basket-product", [
      "BasketProductFull",
      "BasketProductLTR",
      "BasketProductRTL",
      "BasketProductEnclosed",
      "BasketProductInset"
    ])
  },
  {
    name: "billing",
    directory: "billing",
    arrangements: BILLING_TEMPLATE,
    registered: BILLING_TEMPLATES,
    pins: pin(BILLING_TEMPLATE, "billing", [
      "BillingFull",
      "BillingLTR",
      "BillingRTL",
      "BillingEnclosed",
      "BillingInset"
    ])
  },
  {
    name: "checkout",
    directory: "checkout",
    arrangements: CHECKOUT_TEMPLATE,
    registered: CHECKOUT_TEMPLATES,
    pins: pin(CHECKOUT_TEMPLATE, "checkout", [
      "CheckoutFull",
      "CheckoutLTR",
      "CheckoutRTL",
      "CheckoutEnclosed",
      "CheckoutInset"
    ])
  },
  {
    name: "product-setup",
    directory: "product-setup",
    arrangements: PRODUCT_SETUP_TEMPLATE,
    registered: PRODUCT_SETUP_TEMPLATES,
    pins: pin(PRODUCT_SETUP_TEMPLATE, "product-setup", [
      "ProductSetupFull",
      "ProductSetupLTR",
      "ProductSetupRTL",
      "ProductSetupEnclosed"
    ])
  }
];

const APP_OWNED_TEMPLATE_COUNT = 24;

function fileOf(value: unknown): string | undefined {
  if (!value || typeof value !== "object") return undefined;

  const file = (value as { __file?: unknown }).__file;

  return typeof file === "string" ? file : undefined;
}

function templateFilesOnDisk(directory: string) {
  const root = join(PACKAGE_ROOT, "src/modules", directory, "templates");

  return readdirSync(root)
    .filter(entry => entry.endsWith(".template.vue"))
    .map(entry => join(root, entry));
}

// -----------------------------------------------------------------------------

describe.each(FILLS)("the $name templates this app owns", fill => {
  it("carries a component for every template the package draws", () => {
    const unfilled = Object.values(fill.arrangements).filter(
      template => !Object.hasOwn(fill.registered, template)
    );

    expect(
      unfilled,
      `${fill.name} draws template(s) this app's record holds nothing for, so ` +
        `that arrangement throws: ${unfilled.join(", ")}`
    ).toEqual([]);
  });

  it("records nothing beyond those templates", () => {
    const stray = Object.keys(fill.registered).filter(
      template => !Object.values(fill.arrangements).includes(template)
    );

    expect(
      stray,
      `${fill.name}'s record carries key(s) no template names: ${stray.join(", ")}`
    ).toEqual([]);
  });

  it.each(Object.entries(fill.pins))(
    "fills %s from the template file it belongs to",
    (template, file) => {
      const component = fill.registered[template];

      expect(
        fileOf(component),
        `${template} is filled with something carrying no source file to match on`
      ).toBeTruthy();
      expect(
        fileOf(component),
        `${template} is filled from a template other than ${file}`
      ).toBe(join(PACKAGE_ROOT, file));
    }
  );

  it("gives each arrangement a template of its own", () => {
    const filled = Object.values(fill.registered);

    expect(
      new Set(filled).size,
      `${fill.name} points two arrangements at one template, so one page variant is ` +
        `unreachable`
    ).toBe(filled.length);
  });

  it("registers every template file in its folder, and no orphan", () => {
    const onDisk = templateFilesOnDisk(fill.directory).sort();
    const registered = Object.values(fill.registered)
      .map(component => fileOf(component) ?? "")
      .sort();

    expect(registered).toEqual(onDisk);
  });
});

describe("the five families together", () => {
  it("fills all 24 app-owned page templates, each with its own component", () => {
    const filled = flatMap(FILLS, fill => values(fill.registered));

    expect(filled).toHaveLength(APP_OWNED_TEMPLATE_COUNT);
    expect(uniq(filled)).toHaveLength(APP_OWNED_TEMPLATE_COUNT);
  });
});
