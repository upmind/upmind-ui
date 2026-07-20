import { mount } from "@vue/test-utils";
import { describe, it, expect } from "vitest";
import { defineComponent, h } from "vue";
import { useTestAttrs } from "../useTestAttrs";

describe("useTestAttrs", () => {
  it("preserves a numeric 0 override instead of dropping it to the cascade", () => {
    // A parent passing data-test-value: 0 (e.g. Interstitial's first action,
    // whose index is 0) must win over the component's own value cascade. A
    // truthiness check would treat 0 as absent and fall through.
    const attrs = useTestAttrs({
      key: "button",
      value: "some-label",
      dataAttrs: {
        "data-test-key": "interstitial-action",
        "data-test-value": 0
      }
    });

    expect(attrs["data-test-key"]).toBe("interstitial-action");
    expect(attrs["data-test-value"]).toBe(0);
  });

  it('renders data-test-value="0" when a numeric 0 override is bound', () => {
    const Host = defineComponent({
      setup() {
        const attrs = useTestAttrs({
          key: "button",
          value: "some-label",
          dataAttrs: { "data-test-value": 0 }
        });
        return () => h("div", attrs);
      }
    });

    const wrapper = mount(Host);

    expect(wrapper.attributes("data-test-value")).toBe("0");
  });
});
