import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import { ListSurface } from "../index";
import type { ControlledTableChannel } from "@upmind-automation/scenario-harness";

const rows = [
  { id: 1, address: "a@x.com" },
  { id: 2, address: "b@x.com" }
];

function mountList(table: ControlledTableChannel) {
  return mount(ListSurface, {
    props: {
      snapshot: { actions: [], context: { data: rows }, meta: {} },
      actions: {},
      table
    }
  });
}

function fakeTable(
  overrides: Partial<ReturnType<ControlledTableChannel["read"]>> = {},
  emit = vi.fn()
): ControlledTableChannel {
  return {
    read: () => ({
      filter: {},
      sort: [],
      pagination: { page: 1, perPage: 10, total: rows.length },
      ...overrides
    }),
    emit
  };
}

describe("@AC2 ListSurface — controlled-table consumed, never owned", () => {
  it("emits a sort intent to channel.emit() when a column header is activated", async () => {
    const emit = vi.fn();
    const wrapper = mountList(fakeTable({}, emit));

    await wrapper.findAll("th button")[0].trigger("click");

    expect(emit).toHaveBeenCalledTimes(1);
    const intent = emit.mock.calls[0][0];
    expect(intent.type).toBe("sort");
    expect(intent.sort[0].field).toBe("id");
  });

  it("emits a filter intent to channel.emit() when the filter model changes", async () => {
    const emit = vi.fn();
    const wrapper = mountList(fakeTable({}, emit));

    const addressFilter = wrapper.findAll('input[data-test-key="input"]')[1];
    await addressFilter.setValue("b@x.com");

    expect(emit).toHaveBeenCalledWith({
      type: "filter",
      model: { address: "b@x.com" }
    });
  });

  it("emits a paginate intent to channel.emit() when the next page is activated", async () => {
    const emit = vi.fn();
    const wrapper = mountList(
      fakeTable({ pagination: { page: 1, perPage: 1, total: 2 } }, emit)
    );

    await wrapper.find('[data-test-key="next"]').trigger("click");

    expect(emit).toHaveBeenCalledWith({
      type: "paginate",
      page: 2,
      perPage: 1
    });
  });

  it("renders its filter/sort/pagination display from channel.read(), never from an owned state field", async () => {
    const wrapper = mountList(
      fakeTable({
        filter: { address: "existing@x.com" },
        pagination: { page: 1, perPage: 10, total: 2 }
      })
    );

    const initialInput = wrapper.findAll('input[data-test-key="input"]')[1];
    expect((initialInput.element as HTMLInputElement).value).toBe(
      "existing@x.com"
    );

    // A brand-new `table` prop, never anything ListSurface mutates itself —
    // if it cached the model into its own ref at setup time, this would not
    // change the rendered output.
    await wrapper.setProps({
      table: fakeTable({
        filter: { address: "second@x.com" },
        pagination: { page: 2, perPage: 1, total: 2 }
      })
    });

    const updatedInput = wrapper.findAll('input[data-test-key="input"]')[1];
    expect((updatedInput.element as HTMLInputElement).value).toBe(
      "second@x.com"
    );
    expect(wrapper.find("p").text()).toBe("Page 2 of 2");
  });
});
