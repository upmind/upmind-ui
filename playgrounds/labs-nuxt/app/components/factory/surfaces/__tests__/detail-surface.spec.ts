import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import { DetailSurface } from "../index";

const model = { id: 1, name: "Ada" };

function mountDetail() {
  const edit = vi.fn();
  const wrapper = mount(DetailSurface, {
    props: {
      snapshot: { actions: ["edit"], context: { model }, meta: {} },
      actions: { edit }
    }
  });
  return { wrapper, edit };
}

describe("@AC3 DetailSurface — readonly model, progressive edit", () => {
  it("has no editable form on initial render", () => {
    const { wrapper } = mountDetail();

    expect(wrapper.findComponent({ name: "UpmForm" }).exists()).toBe(false);
  });

  it("flips to an editable form when its edit control is activated", async () => {
    const { wrapper } = mountDetail();

    await wrapper.find('[data-test-value="edit"]').trigger("click");

    expect(wrapper.findComponent({ name: "UpmForm" }).exists()).toBe(true);
  });
});
