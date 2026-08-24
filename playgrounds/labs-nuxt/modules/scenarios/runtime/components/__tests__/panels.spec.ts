import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import { ContextPanel, MetaPanel } from "../index";

describe("@AC3 MetaPanel — generalised-Inspector meta-flags display", () => {
  it("lists every meta flag", () => {
    const wrapper = mount(MetaPanel, {
      props: { meta: { isOn: true, hasLabel: false } }
    });

    const badges = wrapper.findAll('[data-test-key="badge"]');
    expect(badges).toHaveLength(2);
    expect(wrapper.text()).toMatch(/Is On/i);
    expect(wrapper.text()).toMatch(/Has Label/i);
  });

  it("colours an '…invalid' key as danger, distinct from a real '…valid' key (word-boundary exclusion)", () => {
    const wrapper = mount(MetaPanel, {
      props: { meta: { isSomethingInvalid: true, isValid: true } }
    });

    const invalidBadge = wrapper
      .findAll('[data-test-key="badge"]')
      .find(b => /invalid/i.test(b.text()));
    const validBadge = wrapper
      .findAll('[data-test-key="badge"]')
      .find(b => b.text() === "Is Valid");

    expect(invalidBadge?.classes()).toContain("bg-danger");
    expect(validBadge?.classes()).toContain("bg-success");
    expect(invalidBadge?.classes()).not.toEqual(validBadge?.classes());
  });
});

describe("@AC3 ContextPanel — generalised-Inspector raw context display", () => {
  it("renders one collapsible entry per context key", () => {
    const wrapper = mount(ContextPanel, {
      props: { context: { firstName: "Ada", lastName: "Lovelace" } }
    });

    const collapsibles = wrapper.findAll('[data-test-key="collapsible"]');
    expect(collapsibles).toHaveLength(2);
  });
});
