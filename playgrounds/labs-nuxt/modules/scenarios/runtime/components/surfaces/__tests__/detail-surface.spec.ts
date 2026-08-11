import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import { ContextPanel } from "../../index";
import { DetailSurface } from "../index";

const model = { id: 1, name: "Ada" };

function mountDetail() {
  return mount(DetailSurface, {
    props: {
      snapshot: { actions: [], context: { model }, meta: {} },
      actions: {}
    }
  });
}

describe("@AC3 detail — DetailSurface renders context.model read-only (D-2)", () => {
  it("has no editable form on initial render", () => {
    const wrapper = mountDetail();

    expect(wrapper.findComponent({ name: "UpmForm" }).exists()).toBe(false);
  });

  it("exposes no edit control — editing is Form-Flow's job, not Detail's", () => {
    const wrapper = mountDetail();

    expect(wrapper.find('[data-test-value="edit"]').exists()).toBe(false);
  });

  it("renders context.model read-only via ContextPanel", () => {
    const wrapper = mountDetail();

    const panel = wrapper.findComponent(ContextPanel);
    expect(panel.exists()).toBe(true);
    expect(panel.props("context")).toEqual(model);
  });
});
