// -----------------------------------------------------------------------------
/**
 * @fileoverview @AC2/@AC3 the list surface reads its table from the channel and
 * its COLUMNS and CONTROLS from the scenario's declaration (G3a/G3d).
 *
 * ## Job To Be Done
 * After Phase 2 there is no renderer-side action vocabulary left: a column
 * exists because `useClientEmails/scenario.ts` declared it, a control exists
 * because the same file declared it, and it fires the live member of the
 * composable's action map that the declaration named — in the placement the
 * declaration chose. The rows are the capture run's own records, so what is
 * exercised is the shape the real API publishes.
 *
 * ## What Breaks If These Fail
 * The surface goes back to knowing one module's action names and sniffing its
 * columns off row keys — the two things that made a second scenario cost a
 * renderer edit — or the controlled table starts owning state the module owns.
 */

import { mount } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  defaultRow,
  unverifiedRow
} from "../../../../../../tests/support/recorded-emails";
import clientEmails from "../../../../useClientEmails/scenario";
import {
  ActionPlacementTypes,
  type ScenarioAction
} from "../../../scenario.types";
import {
  CONTROL_TEST_VALUE,
  OVERFLOW_TRIGGER_TEST_VALUE
} from "../../__tests__/control-test-values";
import { ListSurface } from "../index";
import { filter, keys, map } from "lodash-es";
import type { SurfaceActions } from "../surface.types";
import type { ControlledTableChannel } from "@upmind-automation/scenario-harness";

// -----------------------------------------------------------------------------

const { presentation } = clientEmails;

/** Row 0: the account's own default address. Row 1: the one the run created. */
const rows = [defaultRow, unverifiedRow];

/** The row every declared action is offered on — no rule withholds one here. */
const OPEN_ROW = 1;

const declaredIn = (placement: ActionPlacementTypes) =>
  map(
    filter(presentation.rowActions as ScenarioAction[], { placement }),
    "name"
  );

function mountList(
  table?: ControlledTableChannel,
  actions: SurfaceActions = {}
) {
  return mount(ListSurface, {
    attachTo: document.body,
    props: {
      snapshot: {
        actions: keys(actions),
        context: { data: rows },
        meta: { isEmpty: false, isFiltered: false }
      },
      actions,
      presentation,
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

type Wrapper = ReturnType<typeof mountList>;

const control = (
  wrapper: Wrapper,
  selector: string,
  row: number,
  name: string
) =>
  wrapper
    .findAll(selector)
    [row].find(`[data-test-value="${CONTROL_TEST_VALUE[name]}"]`);

/** Opens the row's overflow and returns the menu item the declaration put there. */
async function openOverflow(
  wrapper: Wrapper,
  selector: string,
  row: number,
  name: string
) {
  await wrapper
    .findAll(selector)
    [row].find(`[data-test-value="${OVERFLOW_TRIGGER_TEST_VALUE}"]`)
    .trigger("click");
  await new Promise(resolve => setTimeout(resolve, 0));
  return document.querySelector<HTMLElement>(
    `[role="menuitem"] [data-test-value="${CONTROL_TEST_VALUE[name]}"]`
  );
}

async function fireOverflow(
  wrapper: Wrapper,
  selector: string,
  row: number,
  name: string
) {
  const item = await openOverflow(wrapper, selector, row, name);
  item?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  await wrapper.vm.$nextTick();
}

afterEach(() => {
  document.body.innerHTML = "";
});

// -----------------------------------------------------------------------------

describe("@AC2 ListSurface — controlled-table consumed, never owned", () => {
  it("emits a sort intent naming the DECLARED column, not a row key", async () => {
    const emit = vi.fn();
    const wrapper = mountList(fakeTable({}, emit));

    await wrapper.findAll("th")[0].trigger("click");

    expect(emit).toHaveBeenCalledTimes(1);
    const intent = emit.mock.calls[0][0];
    expect(intent.type).toBe("sort");
    expect(intent.sort[0].field).toBe("email");
  });

  it("renders NO filter input in the table header — the FilterBar is the ONE filter surface (P1-R15)", () => {
    const wrapper = mountList(fakeTable({ filter: { email: "b@x.com" } }));

    expect(wrapper.find("thead input").exists()).toBe(false);
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

  it("renders its sort/pagination display from channel.read(), never from an owned state field", async () => {
    const wrapper = mountList(
      fakeTable({ pagination: { page: 1, perPage: 10, total: 2 } })
    );

    expect(wrapper.find("p").text()).toBe("Page 1 of 1");

    // A brand-new `table` prop, never anything ListSurface mutates itself —
    // if it cached the model into its own ref at setup time, this would not
    // change the rendered output.
    await wrapper.setProps({
      table: fakeTable({ pagination: { page: 2, perPage: 1, total: 2 } })
    });

    expect(wrapper.find("p").text()).toBe("Page 2 of 2");
  });
});

describe("@AC3 list-actions — a declared action fires the live map member it named", () => {
  it("fires actions.remove with the row id from that row's control", async () => {
    const actions = { remove: vi.fn() };
    const wrapper = mountList(undefined, actions);

    await control(wrapper, "li", OPEN_ROW, "remove").trigger("click");

    expect(actions.remove).toHaveBeenCalledTimes(1);
    expect(actions.remove).toHaveBeenCalledWith(rows[OPEN_ROW].id);
  });

  it("fires actions.setDefault with the row id from that row's overflow", async () => {
    const actions = { setDefault: vi.fn() };
    const wrapper = mountList(undefined, actions);

    await fireOverflow(wrapper, "li", OPEN_ROW, "setDefault");

    expect(actions.setDefault).toHaveBeenCalledTimes(1);
    expect(actions.setDefault).toHaveBeenCalledWith(rows[OPEN_ROW].id);
  });

  it("fires actions.verify with the row id from that row's overflow", async () => {
    const actions = { verify: vi.fn() };
    const wrapper = mountList(undefined, actions);

    await fireOverflow(wrapper, "li", OPEN_ROW, "verify");

    expect(actions.verify).toHaveBeenCalledTimes(1);
    expect(actions.verify).toHaveBeenCalledWith(rows[OPEN_ROW].id);
  });

  it("fires actions.ensure from the declared collection-level control", async () => {
    const actions = { ensure: vi.fn() };
    const wrapper = mountList(undefined, actions);

    await wrapper
      .find(`[data-test-value="${CONTROL_TEST_VALUE.ensure}"]`)
      .trigger("click");

    expect(actions.ensure).toHaveBeenCalledTimes(1);
  });

  it("degrades to a read-only row list — never blank — when no table channel is present", () => {
    const wrapper = mountList(undefined, {
      remove: vi.fn(),
      setDefault: vi.fn(),
      verify: vi.fn(),
      ensure: vi.fn()
    });

    expect(wrapper.find("table").exists()).toBe(false);
    expect(wrapper.findAll("li")).toHaveLength(rows.length);
    expect(wrapper.text()).toContain(defaultRow.email);
    expect(wrapper.text()).toContain(unverifiedRow.email);
  });
});

describe("@AC3 list-actions (table-backed) — the real client-emails canary path", () => {
  it("fires actions.remove with the row id from the table row's control", async () => {
    const actions = { remove: vi.fn() };
    const wrapper = mountList(fakeTable(), actions);

    expect(wrapper.find("table").exists()).toBe(true);
    await control(wrapper, "tbody tr", OPEN_ROW, "remove").trigger("click");

    expect(actions.remove).toHaveBeenCalledTimes(1);
    expect(actions.remove).toHaveBeenCalledWith(rows[OPEN_ROW].id);
  });

  it("fires actions.setDefault with the row id from the table row's overflow", async () => {
    const actions = { setDefault: vi.fn() };
    const wrapper = mountList(fakeTable(), actions);

    await fireOverflow(wrapper, "tbody tr", OPEN_ROW, "setDefault");

    expect(actions.setDefault).toHaveBeenCalledTimes(1);
    expect(actions.setDefault).toHaveBeenCalledWith(rows[OPEN_ROW].id);
  });

  it("fires actions.verify with the row id from the table row's overflow", async () => {
    const actions = { verify: vi.fn() };
    const wrapper = mountList(fakeTable(), actions);

    await fireOverflow(wrapper, "tbody tr", OPEN_ROW, "verify");

    expect(actions.verify).toHaveBeenCalledTimes(1);
    expect(actions.verify).toHaveBeenCalledWith(rows[OPEN_ROW].id);
  });

  it("fires actions.ensure from the collection-level control alongside a table channel", async () => {
    const actions = { ensure: vi.fn() };
    const wrapper = mountList(fakeTable(), actions);

    expect(wrapper.find("table").exists()).toBe(true);
    await wrapper
      .find(`[data-test-value="${CONTROL_TEST_VALUE.ensure}"]`)
      .trigger("click");

    expect(actions.ensure).toHaveBeenCalledTimes(1);
  });
});

describe("@AC3 the declaration is the ONLY source of columns and controls (C15)", () => {
  it("draws the declared columns, in declaration order, and nothing else", () => {
    const wrapper = mountList(fakeTable(), { remove: vi.fn() });
    const headers = map(wrapper.findAll("thead th"), th => th.text());

    // The trailing header is the action column, which no element declares.
    expect(headers.slice(0, presentation.row.elements.length)).toEqual([
      "Email address",
      "Status",
      "Date bounced"
    ]);
    expect(headers).toHaveLength(presentation.row.elements.length + 1);
  });

  it("renders no cell for a row property the declaration never declared", () => {
    const wrapper = mountList(fakeTable());

    expect(wrapper.find("tbody").text()).not.toContain(defaultRow.id);
  });

  it("places each action where the declaration placed it, not where the renderer prefers", async () => {
    const actions = { remove: vi.fn(), setDefault: vi.fn(), verify: vi.fn() };
    const wrapper = mountList(undefined, actions);

    const overflowed = declaredIn(ActionPlacementTypes.OVERFLOW);

    for (const name of declaredIn(ActionPlacementTypes.VISIBLE)) {
      expect(control(wrapper, "li", OPEN_ROW, name).exists()).toBe(true);
    }
    for (const name of overflowed) {
      expect(control(wrapper, "li", OPEN_ROW, name).exists()).toBe(false);
    }

    // One open, every item — re-clicking the trigger per action would close it.
    await openOverflow(wrapper, "li", OPEN_ROW, overflowed[0]);
    for (const name of overflowed) {
      expect(
        document.querySelector(
          `[role="menuitem"] [data-test-value="${CONTROL_TEST_VALUE[name]}"]`
        )
      ).toBeTruthy();
    }
  });

  it("offers no control at all when the scenario declared no presentation", () => {
    const wrapper = mount(ListSurface, {
      attachTo: document.body,
      props: {
        snapshot: {
          actions: ["remove"],
          context: { data: rows },
          meta: { isEmpty: false, isFiltered: false }
        },
        actions: { remove: vi.fn() }
      }
    });

    expect(
      wrapper.find(`[data-test-value="${CONTROL_TEST_VALUE.remove}"]`).exists()
    ).toBe(false);
  });
});
