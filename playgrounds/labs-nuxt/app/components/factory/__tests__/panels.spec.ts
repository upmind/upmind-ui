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
});

describe("@AC3 ContextPanel — generalised-Inspector raw context display", () => {
  it("renders one collapsible entry per context key", () => {
    const wrapper = mount(ContextPanel, {
      props: { context: { firstName: "Ada", lastName: "Lovelace" } }
    });

    expect(wrapper.text()).toMatch(/first ?name/i);
    expect(wrapper.text()).toMatch(/last ?name/i);
  });
});
