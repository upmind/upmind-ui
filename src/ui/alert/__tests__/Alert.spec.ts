import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import Alert from "../Alert.ce.vue";

describe("Alert", () => {
  it("renders correctly", () => {
    const wrapper = mount(Alert);
    expect(wrapper.exists()).toBe(true);
    expect(wrapper.find('[role="alert"]').exists()).toBe(true);
  });
});
