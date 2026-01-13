import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import Switch from "../Switch.vue";

describe("Switch", () => {
  it("renders correctly", () => {
    const wrapper = mount(Switch);
    expect(wrapper.exists()).toBe(true);
    expect(wrapper.find('[role="switch"]').exists()).toBe(true);
  });

  it("toggles state", async () => {
    const wrapper = mount(Switch, {
      props: {
        checked: false
      }
    });

    await wrapper.find('[role="switch"]').trigger("click");
    expect(wrapper.emitted("update:checked")).toBeTruthy();
  });

  it("respects disabled state", async () => {
    const wrapper = mount(Switch, {
      props: {
        disabled: true,
        checked: false
      }
    });

    const switchEl = wrapper.find('[role="switch"]');
    expect(switchEl.attributes("data-disabled")).toBeDefined();

    // Attempt to click - should not emit
    await switchEl.trigger("click");
    expect(wrapper.emitted("update:checked")).toBeFalsy();
  });

  it("renders with checked state", () => {
    const wrapper = mount(Switch, {
      props: {
        checked: true
      }
    });

    const switchEl = wrapper.find('[role="switch"]');
    expect(switchEl.attributes("data-state")).toBe("checked");
    expect(switchEl.attributes("aria-checked")).toBe("true");
  });

  it("renders with unchecked state", () => {
    const wrapper = mount(Switch, {
      props: {
        checked: false
      }
    });

    const switchEl = wrapper.find('[role="switch"]');
    expect(switchEl.attributes("data-state")).toBe("unchecked");
    expect(switchEl.attributes("aria-checked")).toBe("false");
  });
});
