// -----------------------------------------------------------------------------
/**
 * @fileoverview The pricing atoms this package publishes
 *
 * ## Job To Be Done
 * Each atom renders the API's own figures from its published props alone.
 *
 * ## What Breaks If These Fail
 * A price atom puts a figure on screen the API never sent, or strikes through a price the customer pays.
 */

import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import { createI18n } from "vue-i18n";
import {
  CurrentPrice,
  ExPrice,
  Pricing,
  PricingSkeleton,
  PricingTotal,
  Promotion
} from "../index";
import {
  amountOf,
  recordedFractionalPrice,
  recordedOtherWholePrice,
  recordedWholePrice,
  recordedZeroPrice
} from "./recorded-prices";

// -----------------------------------------------------------------------------

const FREE = "Nothing to pay";
const PER_MONTH = "a month";
const SAVE = "Save";

const messages = {
  en: {
    text: { free: FREE, total: "Total", product_cycle_per_month: PER_MONTH },
    action: { save_value: `${SAVE} {value}` }
  }
};

function harness() {
  return {
    global: {
      plugins: [
        createI18n({
          legacy: false,
          locale: "en",
          missingWarn: false,
          fallbackWarn: false,
          messages
        })
      ]
    }
  };
}

const shown = (html: string) => html.replace(/\s+/g, " ").trim();

const withoutZeroMinorUnits = (figure: string) => figure.replace(/\.00$/, "");

function currentPrice(props: {
  currentPrice: string;
  monthlyFromCurrentPrice?: string;
  free?: boolean;
  is?: string;
  cycle?: number;
  useMonthlyFromPrice?: boolean;
  loading?: boolean;
  dataAttrs?: Record<`data-${string}`, string | number | boolean>;
}) {
  return mount(CurrentPrice, { props, ...harness() });
}

function exPrice(props: {
  regularPrice: string;
  monthlyFromRegularPrice: string;
  discounted: boolean;
  useMonthlyFromPrice?: boolean;
  loading?: boolean;
}) {
  return mount(ExPrice, { props, ...harness() });
}

const SAVING_PERCENT = "25%";

function promotion(props: {
  meta?: { discounted?: boolean; mixed?: boolean };
  price?: { savingAmount: number; savingPrice: string; savingPercent: string };
  disabled?: boolean;
  size?: "sm" | "md";
}) {
  return mount(Promotion, {
    props: {
      id: "recorded-promotion-absent",
      code: "SAVE",
      name: "Spring sale",
      title: "Spring sale",
      ...props
    },
    ...harness()
  });
}

function detail(name: string, figure: string) {
  return {
    id: name,
    name,
    title: name,
    meta: {},
    price: {
      currentAmount: amountOf(figure),
      currentPrice: figure,
      regularAmount: amountOf(figure),
      regularPrice: figure,
      savingAmount: 0,
      savingPrice: "",
      savingPercent: ""
    }
  };
}

function pricingTotal(pricing: ReturnType<typeof detail>[], footer?: boolean) {
  return mount(PricingTotal, { props: { pricing, footer }, ...harness() });
}

// -----------------------------------------------------------------------------

describe("CurrentPrice, the figure a customer is asked to pay", () => {
  it("shows the figure the API formatted, trimming only a zero-decimal tail", () => {
    const wrapper = currentPrice({ currentPrice: recordedWholePrice });

    expect(wrapper.text()).toBe(withoutZeroMinorUnits(recordedWholePrice));
    expect(wrapper.attributes("data-test-value")).toBe(
      withoutZeroMinorUnits(recordedWholePrice)
    );
  });

  it("keeps the minor units the API sent when they are not zero", () => {
    const wrapper = currentPrice({ currentPrice: recordedFractionalPrice });

    expect(wrapper.text()).toBe(recordedFractionalPrice);
  });

  it("says the price is free rather than printing a zero figure", () => {
    const wrapper = currentPrice({ currentPrice: recordedZeroPrice });

    expect(wrapper.text()).toBe(FREE);
    expect(wrapper.text()).not.toContain(recordedZeroPrice);
  });

  it("draws no figure at all when the API sent none", () => {
    const wrapper = currentPrice({ currentPrice: "" });

    expect(wrapper.text()).toBe("");
  });

  it("shows the monthly-from figure, per month, when that setting is on", () => {
    const wrapper = currentPrice({
      currentPrice: recordedWholePrice,
      monthlyFromCurrentPrice: recordedOtherWholePrice,
      useMonthlyFromPrice: true,
      cycle: 12
    });

    expect(shown(wrapper.text())).toContain(
      withoutZeroMinorUnits(recordedOtherWholePrice)
    );
    expect(shown(wrapper.text())).toContain(PER_MONTH);
  });

  it("shows the full-term figure, with no per-month wording, when it is off", () => {
    const wrapper = currentPrice({
      currentPrice: recordedWholePrice,
      monthlyFromCurrentPrice: recordedOtherWholePrice,
      useMonthlyFromPrice: false,
      cycle: 12
    });

    expect(wrapper.text()).toBe(withoutZeroMinorUnits(recordedWholePrice));
    expect(wrapper.text()).not.toContain(PER_MONTH);
  });

  it("holds the figure back behind a placeholder while it is loading", () => {
    const wrapper = currentPrice({
      currentPrice: recordedWholePrice,
      loading: true
    });

    expect(wrapper.text()).toBe("");
    expect(wrapper.find("[aria-hidden='true']").exists()).toBe(true);
  });

  it("renders the element the host asked for, and a span by default", () => {
    expect(
      currentPrice({ currentPrice: recordedWholePrice }).element.tagName
    ).toBe("SPAN");
    expect(
      currentPrice({ currentPrice: recordedWholePrice, is: "div" }).element
        .tagName
    ).toBe("DIV");
  });

  it("passes a host's data attributes through to the element it renders", () => {
    const wrapper = currentPrice({
      currentPrice: recordedWholePrice,
      dataAttrs: { "data-cycle": "annual" }
    });

    expect(wrapper.attributes("data-cycle")).toBe("annual");
  });
});

describe("ExPrice, the price a discount replaced", () => {
  it("strikes through the regular figure when the price is discounted", () => {
    const wrapper = exPrice({
      regularPrice: recordedWholePrice,
      monthlyFromRegularPrice: recordedOtherWholePrice,
      discounted: true
    });

    expect(wrapper.element.tagName).toBe("DEL");
    expect(wrapper.text()).toBe(withoutZeroMinorUnits(recordedWholePrice));
  });

  it("draws nothing at all when the price is not discounted", () => {
    const wrapper = exPrice({
      regularPrice: recordedWholePrice,
      monthlyFromRegularPrice: recordedOtherWholePrice,
      discounted: false
    });

    expect(wrapper.find("[data-test-key='ex-price']").exists()).toBe(false);
    expect(wrapper.text()).toBe("");
  });

  it("strikes through the monthly-from figure when that setting is on", () => {
    const wrapper = exPrice({
      regularPrice: recordedWholePrice,
      monthlyFromRegularPrice: recordedOtherWholePrice,
      discounted: true,
      useMonthlyFromPrice: true
    });

    expect(wrapper.text()).toBe(withoutZeroMinorUnits(recordedOtherWholePrice));
  });

  it("strikes through the full-term figure when that setting is off", () => {
    const wrapper = exPrice({
      regularPrice: recordedWholePrice,
      monthlyFromRegularPrice: recordedOtherWholePrice,
      discounted: true,
      useMonthlyFromPrice: false
    });

    expect(wrapper.text()).toBe(withoutZeroMinorUnits(recordedWholePrice));
  });

  it("holds the figure back behind a placeholder while it is loading", () => {
    const wrapper = exPrice({
      regularPrice: recordedWholePrice,
      monthlyFromRegularPrice: recordedOtherWholePrice,
      discounted: true,
      loading: true
    });

    expect(wrapper.text()).toBe("");
    expect(wrapper.find("[aria-hidden='true']").exists()).toBe(true);
  });
});

describe("Promotion, the saving a customer is told about", () => {
  const saving = {
    savingAmount: 3,
    savingPrice: "3.00",
    savingPercent: SAVING_PERCENT
  };

  it("says nothing unless the price it sits beside is discounted", () => {
    expect(promotion({ price: saving }).text()).toBe("");
    expect(
      promotion({ meta: { discounted: false }, price: saving }).text()
    ).toBe("");
  });

  it("says nothing when no saving figure arrived with it", () => {
    expect(promotion({ meta: { discounted: true } }).text()).toBe("");
  });

  it("shows the saving the API worked out, not one it worked out itself", () => {
    const wrapper = promotion({ meta: { discounted: true }, price: saving });

    expect(wrapper.text()).toBe(`${SAVE} ${SAVING_PERCENT}`);
  });

  it("marks a promotion the customer cannot use apart from a live one", () => {
    const live = promotion({ meta: { discounted: true }, price: saving });
    const dead = promotion({
      meta: { discounted: true },
      price: saving,
      disabled: true
    });

    expect(live.attributes("class")).toContain("promo");
    expect(dead.attributes("class")).not.toContain("promo");
    expect(dead.attributes("class")).toContain("warning");
  });

  it("takes its size from the host rather than one fixed size", () => {
    const small = promotion({ meta: { discounted: true }, price: saving });
    const medium = promotion({
      meta: { discounted: true },
      price: saving,
      size: "md"
    });

    expect(small.attributes("class")).not.toBe(medium.attributes("class"));
  });
});

describe("PricingTotal, the bottom line of the pricing list", () => {
  it("shows the figure the API formatted, and mirrors it for a locator", () => {
    const wrapper = pricingTotal([detail("hosting", recordedWholePrice)]);
    const total = wrapper.find("[data-test-key='total-price']");

    expect(total.text()).toBe(withoutZeroMinorUnits(recordedWholePrice));
    expect(total.attributes("data-test-value")).toBe(
      withoutZeroMinorUnits(recordedWholePrice)
    );
  });

  it("keeps the minor units the API sent when they are not zero", () => {
    const wrapper = pricingTotal([detail("hosting", recordedFractionalPrice)]);

    expect(wrapper.find("[data-test-key='total-price']").text()).toBe(
      recordedFractionalPrice
    );
  });

  it("re-presents each row's own figure and never adds them together", () => {
    const wrapper = pricingTotal([
      detail("hosting", recordedWholePrice),
      detail("extra", recordedOtherWholePrice)
    ]);

    const totals = wrapper
      .findAll("[data-test-key='total-price']")
      .map(node => node.text());
    const summed = String(
      amountOf(recordedWholePrice) + amountOf(recordedOtherWholePrice)
    );

    expect(totals).toEqual([
      withoutZeroMinorUnits(recordedWholePrice),
      withoutZeroMinorUnits(recordedOtherWholePrice)
    ]);
    expect(shown(wrapper.text())).not.toContain(summed);
  });

  it("draws nothing when the API priced nothing", () => {
    expect(pricingTotal([]).text()).toBe("");
  });

  it("renders a different row when the host asks for the footer variant", () => {
    const row = (footer?: boolean) =>
      pricingTotal([detail("hosting", recordedWholePrice)], footer)
        .get("div")
        .attributes("class");

    expect(row()).not.toBe(row(true));
    expect(row(true)).toContain("hidden");
    expect(row()).not.toContain("hidden");
  });
});

describe("the pricing list's published surface", () => {
  it("draws real markup from the pricing skeleton", () => {
    const wrapper = mount(PricingSkeleton, harness());

    expect(wrapper.html().trim()).not.toBe("");
    expect(wrapper.findAll("[aria-hidden='true']").length).toBeGreaterThan(0);
  });

  it("publishes a list that takes the product and its config meta", () => {
    const declared = Object.keys(
      (Pricing as { props?: Record<string, unknown> }).props ?? {}
    );

    expect(declared).toContain("product");
    expect(declared).toContain("meta");
    expect(Pricing).not.toBe(PricingTotal);
  });
});
