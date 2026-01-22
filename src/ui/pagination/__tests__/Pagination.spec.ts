import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import Pagination from "../Pagination.ce.vue";

describe("Pagination", () => {
  it("renders correctly", () => {
    const wrapper = mount(Pagination, {
      props: {
        total: 10,
        page: 1,
        pages: 1,
        limit: 10,
        siblingCount: 1,
        showEdges: true,
        defaultPage: 1
      }
    });
    expect(wrapper.exists()).toBe(true);
  });
});
