// -----------------------------------------------------------------------------
/**
 * @fileoverview The page templates this package hands the catalogue, domain and basket pages.
 *
 * ## Job To Be Done
 * Every template `catalogue`, `domain` and `basket` can draw has a real component
 * in the record the host pages pass.
 *
 * ## What Breaks If These Fail
 * A page is handed a record with a gap, and the arrangement it names throws.
 */

import { describe, expect, it } from "vitest";
import {
  BASKET_PRODUCT_TEMPLATE,
  BASKET_TEMPLATE,
  BILLING_TEMPLATE,
  CHECKOUT_TEMPLATE,
  PRODUCT_SETUP_TEMPLATE
} from "@upmind-automation/basket";
import { CATALOGUE_TEMPLATE } from "@upmind-automation/catalogue";
import { DOMAIN_TEMPLATE } from "@upmind-automation/domain";
import { BASKET_TEMPLATES } from "../modules/basket";
import { BASKET_PRODUCT_TEMPLATES } from "../modules/basket-product";
import { BILLING_TEMPLATES } from "../modules/billing";
import { CATALOGUE_TEMPLATES } from "../modules/catalogue";
import { CHECKOUT_TEMPLATES } from "../modules/checkout";
import { DOMAIN_TEMPLATES } from "../modules/domain";
import { PRODUCT_SETUP_TEMPLATES } from "../modules/product-setup";
import { difference, get, keys, map, uniq, values } from "lodash-es";

// -----------------------------------------------------------------------------

const HOSTED = [
  {
    name: "catalogue",
    record: CATALOGUE_TEMPLATES,
    templates: values(CATALOGUE_TEMPLATE)
  },
  {
    name: "domain",
    record: DOMAIN_TEMPLATES,
    templates: [DOMAIN_TEMPLATE.FULL]
  },
  {
    name: "basket",
    record: BASKET_TEMPLATES,
    templates: values(BASKET_TEMPLATE)
  },
  {
    name: "basket-product",
    record: BASKET_PRODUCT_TEMPLATES,
    templates: values(BASKET_PRODUCT_TEMPLATE)
  },
  {
    name: "billing",
    record: BILLING_TEMPLATES,
    templates: values(BILLING_TEMPLATE)
  },
  {
    name: "checkout",
    record: CHECKOUT_TEMPLATES,
    templates: values(CHECKOUT_TEMPLATE)
  },
  {
    name: "product-setup",
    record: PRODUCT_SETUP_TEMPLATES,
    templates: values(PRODUCT_SETUP_TEMPLATE)
  }
];

// -----------------------------------------------------------------------------

describe.each(HOSTED)("the templates $name draws", hosted => {
  it("names templates for a host to pass", () => {
    expect(hosted.templates.length).toBeGreaterThan(0);
  });

  it("has every template in the record the host pages pass", () => {
    for (const template of hosted.templates) {
      expect(
        Object.hasOwn(hosted.record, template),
        `${hosted.name} draws ${template} and the record holds no component ` +
          `for it, so that arrangement throws`
      ).toBe(true);
    }
  });

  it("holds a real component behind every template", () => {
    for (const template of hosted.templates) {
      const component: unknown = get(hosted.record, template);

      expect(component, `${hosted.name}'s ${template} is empty`).toBeTruthy();
      expect(
        typeof component === "object" || typeof component === "function",
        `${hosted.name}'s ${template} is a ${typeof component}, not a component`
      ).toBe(true);
    }
  });

  it("holds no entry for a template it does not draw", () => {
    const extra = difference(keys(hosted.record), hosted.templates);

    expect(
      extra,
      `${hosted.name}'s record holds ${extra.join(", ")}, which no page asks for`
    ).toEqual([]);
  });

  it("gives each template its own component", () => {
    const components = map(hosted.templates, template =>
      get(hosted.record, template)
    );

    expect(uniq(components)).toHaveLength(components.length);
  });
});
