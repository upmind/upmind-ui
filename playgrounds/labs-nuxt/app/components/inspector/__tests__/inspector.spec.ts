import { mount } from "@vue/test-utils";
import { afterEach, describe, expect, it } from "vitest";
import { Inspector, useInspector } from "../index";

afterEach(() => {
  useInspector().clear();
});

describe("@AC3 Inspector — Meta section delegates to MetaPanel", () => {
  it("renders a registered section's real meta through MetaPanel's badges", () => {
    useInspector().add({
      key: "inspector-spec",
      factory: () => ({
        name: "Client emails",
        meta: { isLoading: false, hasError: true }
      })
    });

    const wrapper = mount(Inspector);

    const badges = wrapper.findAll('[data-test-key="badge"]');
    expect(badges).toHaveLength(2);
    expect(wrapper.text()).toMatch(/Is Loading/i);
    expect(wrapper.text()).toMatch(/Has Error/i);
  });

  it("excludes an '…invalid' meta key from the 'valid' badge colour when mounted through Inspector", () => {
    useInspector().add({
      key: "inspector-spec-invalid",
      factory: () => ({
        name: "Client emails",
        meta: { isSomethingInvalid: true, isValid: true }
      })
    });

    const wrapper = mount(Inspector);

    const invalidBadge = wrapper
      .findAll('[data-test-key="badge"]')
      .find(b => /invalid/i.test(b.text()));
    const validBadge = wrapper
      .findAll('[data-test-key="badge"]')
      .find(b => b.text() === "Is Valid");

    expect(invalidBadge?.classes()).toContain("bg-accent-danger");
    expect(validBadge?.classes()).toContain("bg-accent-success");
  });
});
