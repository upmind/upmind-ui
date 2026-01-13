import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import RadioGroup from "../RadioGroup.vue";
import RadioGroupItem from "../RadioGroupItem.vue";

describe("RadioGroup", () => {
  it("renders correctly", () => {
    const wrapper = mount(RadioGroup, {
      slots: {
        default: `
              <RadioGroupItem value="option1" id="opt1" />
              <RadioGroupItem value="option2" id="opt2" />
            `
      },
      global: {
        components: {
          RadioGroupItem
        }
      }
    });
    expect(wrapper.exists()).toBe(true);
    expect(wrapper.attributes("role")).toBe("radiogroup");
    expect(wrapper.find('[role="radio"]').exists()).toBe(true);
  });

  it("emits update:modelValue when selection changes", async () => {
    const wrapper = mount(RadioGroup, {
      props: {
        modelValue: "option1"
      },
      slots: {
        default: `
              <RadioGroupItem value="option1" id="opt1" />
              <RadioGroupItem value="option2" id="opt2" />
            `
      },
      global: {
        components: {
          RadioGroupItem
        }
      }
    });

    const radioItems = wrapper.findAll('[role="radio"]');
    await radioItems[1].trigger("click");

    expect(wrapper.emitted("update:modelValue")).toBeTruthy();
  });

  it("respects disabled state", () => {
    const wrapper = mount(RadioGroup, {
      props: {
        disabled: true
      },
      slots: {
        default: `
              <RadioGroupItem value="option1" id="opt1" />
            `
      },
      global: {
        components: {
          RadioGroupItem
        }
      }
    });

    const radioGroup = wrapper.find('[role="radiogroup"]');
    expect(radioGroup.attributes("data-disabled")).toBeDefined();
  });
});
