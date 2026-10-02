// -----------------------------------------------------------------------------
/**
 * @fileoverview The configure surface's own logic
 *
 * ## Job To Be Done
 * `Config` needs a product config, `ConfigErrors` links errors to fields, `UpmProductNotFound` draws the miss.
 *
 * ## What Breaks If These Fail
 * A customer gets an empty form, an error link that lands nowhere, or a blank page.
 */

import { mount } from "@vue/test-utils";
import { afterEach, describe, expect, it } from "vitest";
import { defineComponent, h, nextTick } from "vue";
import { createI18n } from "vue-i18n";
import { createMemoryHistory, createRouter } from "vue-router";
import {
  Config,
  ConfigErrors,
  ConfigSkeleton,
  UpmProductNotFound
} from "../index";
import type { ErrorObject } from "ajv";

// -----------------------------------------------------------------------------

const CATALOGUE = "catalogue";
const UNAVAILABLE = "error.product_not_available";
const SERVICE_UNAVAILABLE = 503;

const messages = {
  en: {
    error: { product_not_valid: "Some details are missing" },
    text: { check_required_fields_desc: "Please complete them" }
  }
};

const i18n = () =>
  createI18n({
    legacy: false,
    locale: "en",
    missingWarn: false,
    fallbackWarn: false,
    messages
  });

const blank = defineComponent({ setup: () => () => h("div") });

function router() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [{ path: "/", name: CATALOGUE, component: blank }]
  });
}

function missingField(field: string, within: string): ErrorObject {
  return {
    keyword: "required",
    instancePath: `/${within}`,
    schemaPath: "#/required",
    params: { missingProperty: field },
    message: `must have required property ${field}`
  };
}

function configErrors(props: { errors?: ErrorObject[]; visible?: boolean }) {
  return mount(ConfigErrors, {
    props,
    global: { plugins: [i18n()], stubs: { RouterLink: true } }
  });
}

function notFound(props: { open?: boolean; modal?: boolean }) {
  return mount(UpmProductNotFound, {
    props: { storefrontRoute: { to: { name: CATALOGUE } }, ...props },
    attachTo: document.body,
    global: { plugins: [i18n(), router()] }
  });
}

const ALERT = "[data-test-key='product-incomplete-alert']";
const INTERSTITIAL = "[data-test-key='interstitial']";

// -----------------------------------------------------------------------------

describe("Config, asked to draw a form it has no product config for", () => {
  it("reports the product as unavailable instead of drawing an empty form", () => {
    let reported: { message?: string; code?: unknown } = {};

    try {
      mount(Config, {
        props: { meta: { ui: {}, data: {}, with: () => ({}) } },
        global: { plugins: [i18n()] }
      });
    } catch (error) {
      reported = error as { message?: string; code?: unknown };
    }

    expect(reported.message).toBe(UNAVAILABLE);
    expect(reported.code).toBe(SERVICE_UNAVAILABLE);
  });
});

describe("ConfigErrors, reporting a configuration a customer must fix", () => {
  it("says nothing until the surface asks for the errors to be shown", () => {
    const wrapper = configErrors({
      errors: [missingField("domain", "domain")]
    });

    expect(wrapper.find(ALERT).exists()).toBe(false);
    expect(wrapper.text()).toBe("");
  });

  it("still says nothing when the surface explicitly withholds them", () => {
    const wrapper = configErrors({
      errors: [missingField("domain", "domain")],
      visible: false
    });

    expect(wrapper.find(ALERT).exists()).toBe(false);
  });

  it("raises an alert a screen reader announces when they are shown", () => {
    const wrapper = configErrors({
      errors: [missingField("domain", "domain")],
      visible: true
    });

    expect(wrapper.find(ALERT).exists()).toBe(true);
    expect(wrapper.find(ALERT).attributes("role")).toBe("alert");
    expect(wrapper.text()).toContain(messages.en.error.product_not_valid);
  });

  it("lists one entry per error, each in the engine's own words", () => {
    const errors = [
      missingField("domain", "domain"),
      missingField("host", "server")
    ];

    const wrapper = configErrors({ errors, visible: true });
    const items = wrapper.findAll("li").map(item => item.text());

    expect(items).toHaveLength(errors.length);
    for (const error of errors) {
      expect(items.some(item => item.includes(error.message ?? ""))).toBe(true);
    }
  });

  it("derives each link from the field its own error names", () => {
    const wrapper = configErrors({
      errors: [
        missingField("domain", "domain"),
        missingField("host", "server")
      ],
      visible: true
    });

    const hrefs = wrapper.findAll("a").map(link => link.attributes("href"));

    expect(hrefs).toHaveLength(2);
    expect(new Set(hrefs).size).toBe(2);
    expect(hrefs[0]).toContain("domain");
    expect(hrefs[1]).toContain("server");
    expect(hrefs[1]).toContain("host");
  });

  it("raises the alert without a list when it was given no errors", () => {
    const wrapper = configErrors({ errors: [], visible: true });

    expect(wrapper.find(ALERT).exists()).toBe(true);
    expect(wrapper.findAll("li")).toHaveLength(0);
  });

  it("survives a surface that reports its errors as absent rather than empty", () => {
    const wrapper = configErrors({ visible: true });

    expect(wrapper.find(ALERT).exists()).toBe(true);
    expect(wrapper.findAll("li")).toHaveLength(0);
  });
});

describe("ConfigSkeleton, what a customer sees while the config loads", () => {
  it("draws real placeholder markup", () => {
    const wrapper = mount(ConfigSkeleton, { global: { plugins: [i18n()] } });

    expect(wrapper.html().trim()).not.toBe("");
    expect(wrapper.findAll("[aria-hidden='true']").length).toBeGreaterThan(0);
  });
});

describe("UpmProductNotFound, the surface a missing product lands on", () => {
  const settled = async () => {
    await nextTick();
    await nextTick();
  };

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("puts the interstitial in front of the customer by default", async () => {
    const wrapper = notFound({});
    await settled();

    expect(document.body.querySelector(INTERSTITIAL)).not.toBeNull();
    wrapper.unmount();
  });

  it("withholds it entirely when the host closes it", async () => {
    const wrapper = notFound({ open: false });
    await settled();

    expect(document.body.querySelector(INTERSTITIAL)).toBeNull();
    wrapper.unmount();
  });

  it("renders inline, inside its own tree, when the host asks for no modal", async () => {
    const wrapper = notFound({ modal: false });
    await settled();

    expect(wrapper.find(INTERSTITIAL).exists()).toBe(true);
    wrapper.unmount();
  });

  it("teleports out of its own tree when it is a modal", async () => {
    const wrapper = notFound({ modal: true });
    await settled();

    expect(wrapper.find(INTERSTITIAL).exists()).toBe(false);
    expect(document.body.querySelector(INTERSTITIAL)).not.toBeNull();
    wrapper.unmount();
  });

  it("draws nothing inline either, once the host closes it", async () => {
    const wrapper = notFound({ modal: false, open: false });
    await settled();

    expect(wrapper.find(INTERSTITIAL).exists()).toBe(false);
    expect(wrapper.text()).toBe("");
    wrapper.unmount();
  });
});
