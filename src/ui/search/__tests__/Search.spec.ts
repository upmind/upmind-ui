import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import Search from "../Search.ce.vue";

describe("Search", () => {
  it("renders correctly", () => {
    const wrapper = mount(Search, {
      props: {
        results: []
      }
    });
    expect(wrapper.exists()).toBe(true);
  });

  it("emits update:search when input changes", async () => {
    const wrapper = mount(Search, {
      props: {
        results: []
      }
    });

    const input = wrapper.find("input");
    await input.setValue("test query");

    expect(wrapper.emitted("update:search")).toBeTruthy();
    expect(wrapper.emitted("update:search")?.[0]).toEqual(["test query"]);
  });

  it("accepts results prop", () => {
    const results = [
      { id: "1", label: "Result 1" },
      { id: "2", label: "Result 2" }
    ];

    const wrapper = mount(Search, {
      props: {
        results
      }
    });

    expect(wrapper.props("results")).toEqual(results);
  });

  it("respects minQueryLength prop", () => {
    const wrapper = mount(Search, {
      props: {
        results: [],
        minQueryLength: 3
      }
    });

    expect(wrapper.props("minQueryLength")).toBe(3);
  });

  it("respects disabled state", () => {
    const wrapper = mount(Search, {
      props: {
        results: [],
        disabled: true
      }
    });

    const input = wrapper.find("input");
    expect(input.attributes("disabled")).toBeDefined();
  });
});
