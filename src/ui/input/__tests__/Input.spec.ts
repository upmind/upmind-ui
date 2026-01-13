import { describe, it, expect, vi } from "vitest";
import { mount } from "@vue/test-utils";
import Input from "../Input.ce.vue";

// Mock IMask
vi.mock("imask", () => ({
  default: vi.fn(() => ({
    on: vi.fn(),
    off: vi.fn(),
    destroy: vi.fn(),
    updateValue: vi.fn(),
    updateOptions: vi.fn(),
    get value() {
      return "";
    },
    set value(v) {}
  }))
}));

describe("Input", () => {
  it("renders correctly", () => {
    const wrapper = mount(Input, {
      props: {
        id: "test-input"
      },
      global: {
        stubs: {
          InputItems: true
        }
      }
    });
    expect(wrapper.find("input").exists()).toBe(true);
    // Loose check for existence to avoid fragility
    expect(wrapper.find("input").attributes("data-testid")).toBeDefined();
  });

  it("emits update:modelValue on input", async () => {
    const wrapper = mount(Input, {
      props: {
        modelValue: ""
      },
      global: {
        stubs: {
          InputItems: true
        }
      }
    });

    const input = wrapper.find("input");
    await input.setValue("test value");

    // Check if emit happened
    expect(wrapper.emitted("update:modelValue")).toBeTruthy();
    expect(wrapper.emitted("update:modelValue")?.[0]).toEqual(["test value"]);
  });

  it("respects disabled state", async () => {
    const wrapper = mount(Input, {
      props: {
        disabled: true
      },
      global: {
        stubs: {
          InputItems: true
        }
      }
    });

    const input = wrapper.find("input");
    expect(input.attributes("disabled")).toBeDefined();
  });

  it("renders with placeholder", () => {
    const wrapper = mount(Input, {
      props: {
        placeholder: "Enter text here"
      },
      global: {
        stubs: {
          InputItems: true
        }
      }
    });

    const input = wrapper.find("input");
    expect(input.attributes("placeholder")).toBe("Enter text here");
  });

  it("supports different input types", () => {
    const wrapper = mount(Input, {
      props: {
        type: "email"
      },
      global: {
        stubs: {
          InputItems: true
        }
      }
    });

    const input = wrapper.find("input");
    expect(input.attributes("type")).toBe("email");
  });

  it("renders prepend slot content", () => {
    const wrapper = mount(Input, {
      slots: {
        prepend: '<span class="prepend-icon">$</span>'
      },
      global: {
        stubs: {
          InputItems: true
        }
      }
    });

    expect(wrapper.find(".prepend-icon").exists()).toBe(true);
    expect(wrapper.find(".prepend-icon").text()).toBe("$");
  });

  it("renders append slot content", () => {
    const wrapper = mount(Input, {
      slots: {
        append: '<span class="append-icon">@</span>'
      },
      global: {
        stubs: {
          InputItems: true
        }
      }
    });

    expect(wrapper.find(".append-icon").exists()).toBe(true);
    expect(wrapper.find(".append-icon").text()).toBe("@");
  });
});
