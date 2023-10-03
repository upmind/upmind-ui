import { describe, it, expect } from "vitest";

import { mount } from "@vue/test-utils";
import Toggle from "../components/Toggle.vue";

describe("Toggle", () => {
  it("renders properly", () => {
    const wrapper = mount(Toggle, {});
    expect(wrapper.text()).toContain("Hello Vitest");
  });
});
