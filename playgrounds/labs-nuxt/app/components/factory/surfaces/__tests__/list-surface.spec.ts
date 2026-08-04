import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import { LIST_SURFACE_ACTION, ListSurface } from "../index";
import type { SurfaceActions } from "../surface.types";
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

function mountListWithActions(
  actions: SurfaceActions,
  table?: ControlledTableChannel
) {
  return mount(ListSurface, {
    attachTo: document.body,
    props: {
      snapshot: {
        actions: Object.keys(actions),
        context: { data: rows },
        meta: {}
      },
      actions,
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

describe("@AC3 list-actions — ListSurface fires the live action map", () => {
  it("fires actions.remove with the row id from that row's delete control", async () => {
    const actions = { [LIST_SURFACE_ACTION.DELETE]: vi.fn() };
    const wrapper = mountListWithActions(actions);

    const rowsInDom = wrapper.findAll("li");
    await rowsInDom[1]
      .find(`[data-test-value="${LIST_SURFACE_ACTION.DELETE}"]`)
      .trigger("click");

    expect(actions[LIST_SURFACE_ACTION.DELETE]).toHaveBeenCalledTimes(1);
    expect(actions[LIST_SURFACE_ACTION.DELETE]).toHaveBeenCalledWith(
      rows[1].id
    );
  });

  it("fires actions.setDefault with the row id from that row's set-default control", async () => {
    const actions = { [LIST_SURFACE_ACTION.SET_DEFAULT]: vi.fn() };
    const wrapper = mountListWithActions(actions);

    const rowsInDom = wrapper.findAll("li");
    await rowsInDom[0].find('[data-test-value="set-default"]').trigger("click");

    expect(actions[LIST_SURFACE_ACTION.SET_DEFAULT]).toHaveBeenCalledTimes(1);
    expect(actions[LIST_SURFACE_ACTION.SET_DEFAULT]).toHaveBeenCalledWith(
      rows[0].id
    );
  });

  it("fires actions.verify with the row id from that row's resend control", async () => {
    const actions = { [LIST_SURFACE_ACTION.RESEND]: vi.fn() };
    const wrapper = mountListWithActions(actions);

    const rowsInDom = wrapper.findAll("li");
    await rowsInDom[1]
      .find(`[data-test-value="${LIST_SURFACE_ACTION.RESEND}"]`)
      .trigger("click");

    expect(actions[LIST_SURFACE_ACTION.RESEND]).toHaveBeenCalledTimes(1);
    expect(actions[LIST_SURFACE_ACTION.RESEND]).toHaveBeenCalledWith(
      rows[1].id
    );
  });

  it("fires actions.ensure from the collection-level add control", async () => {
    const actions = { [LIST_SURFACE_ACTION.ADD]: vi.fn() };
    const wrapper = mountListWithActions(actions);

    await wrapper
      .find(`[data-test-value="${LIST_SURFACE_ACTION.ADD}"]`)
      .trigger("click");

    expect(actions[LIST_SURFACE_ACTION.ADD]).toHaveBeenCalledTimes(1);
  });

  it("degrades to a read-only row list — never blank — when no table channel is present", () => {
    const actions = {
      [LIST_SURFACE_ACTION.DELETE]: vi.fn(),
      [LIST_SURFACE_ACTION.SET_DEFAULT]: vi.fn(),
      [LIST_SURFACE_ACTION.RESEND]: vi.fn(),
      [LIST_SURFACE_ACTION.ADD]: vi.fn()
    };
    const wrapper = mountListWithActions(actions);

    expect(wrapper.find("table").exists()).toBe(false);
    const rowsInDom = wrapper.findAll("li");
    expect(rowsInDom).toHaveLength(rows.length);
    expect(wrapper.text()).toMatch(/a@x\.com/);
    expect(wrapper.text()).toMatch(/b@x\.com/);
  });
});

describe("@AC3 list-actions (table-backed) — the real client-emails canary path", () => {
  it("fires actions.remove with the row id from the table row's delete control", async () => {
    const actions = { [LIST_SURFACE_ACTION.DELETE]: vi.fn() };
    const wrapper = mountListWithActions(actions, fakeTable());

    expect(wrapper.find("table").exists()).toBe(true);
    const dataRows = wrapper.findAll("tbody tr");
    await dataRows[1]
      .find(`[data-test-value="${LIST_SURFACE_ACTION.DELETE}"]`)
      .trigger("click");

    expect(actions[LIST_SURFACE_ACTION.DELETE]).toHaveBeenCalledTimes(1);
    expect(actions[LIST_SURFACE_ACTION.DELETE]).toHaveBeenCalledWith(
      rows[1].id
    );
  });

  it("fires actions.setDefault with the row id from the table row's set-default control", async () => {
    const actions = { [LIST_SURFACE_ACTION.SET_DEFAULT]: vi.fn() };
    const wrapper = mountListWithActions(actions, fakeTable());

    const dataRows = wrapper.findAll("tbody tr");
    await dataRows[0].find('[data-test-value="set-default"]').trigger("click");

    expect(actions[LIST_SURFACE_ACTION.SET_DEFAULT]).toHaveBeenCalledTimes(1);
    expect(actions[LIST_SURFACE_ACTION.SET_DEFAULT]).toHaveBeenCalledWith(
      rows[0].id
    );
  });

  it("fires actions.verify with the row id from the table row's resend control", async () => {
    const actions = { [LIST_SURFACE_ACTION.RESEND]: vi.fn() };
    const wrapper = mountListWithActions(actions, fakeTable());

    const dataRows = wrapper.findAll("tbody tr");
    await dataRows[1]
      .find(`[data-test-value="${LIST_SURFACE_ACTION.RESEND}"]`)
      .trigger("click");

    expect(actions[LIST_SURFACE_ACTION.RESEND]).toHaveBeenCalledTimes(1);
    expect(actions[LIST_SURFACE_ACTION.RESEND]).toHaveBeenCalledWith(
      rows[1].id
    );
  });

  it("fires actions.ensure from the collection-level add control alongside a table channel", async () => {
    const actions = { [LIST_SURFACE_ACTION.ADD]: vi.fn() };
    const wrapper = mountListWithActions(actions, fakeTable());

    expect(wrapper.find("table").exists()).toBe(true);
    await wrapper
      .find(`[data-test-value="${LIST_SURFACE_ACTION.ADD}"]`)
      .trigger("click");

    expect(actions[LIST_SURFACE_ACTION.ADD]).toHaveBeenCalledTimes(1);
  });
});
