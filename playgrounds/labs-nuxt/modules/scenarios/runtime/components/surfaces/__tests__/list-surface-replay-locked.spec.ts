/**
 * @fileoverview R6-23 locked surface refusal: a scenario driving the collection
 * locks every control that writes — the filter bar, the display controls
 * (sort select, column picker, view toggle), the sortable headers, the
 * pagination region, and every row action — while reading stays live.
 *
 * ## Job To Be Done
 * A replay is a playback. A hand that filters, sorts, paginates, or fires a row
 * action mid-track fights the script and desyncs the playhead from the url.
 * Every control that can write must refuse while `locked` is set.
 *
 * ## What Breaks If These Fail
 * The surface allows writes during a replay, causing the playhead to desync
 * from the scenario script.
 */

import { mount } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createI18n } from "vue-i18n";
import action from "@upmind-automation/i18n/core/action-en.json";
import text from "@upmind-automation/i18n/core/text-en.json";
import labsEn from "@upmind-automation/i18n/modules/labs-en.json";
import {
  declaringChannel,
  declaringCriteria
} from "../../../../testing/declared-table";
import { defaultRow, unverifiedRow } from "../../../../testing/recorded-emails";
import clientEmails from "../../../../useClientEmails/client-email.scenario";
import { ListSurface } from "../index";
import { getRow, getRows } from "./table-geometry";
import {
  CONTROL_TEST_VALUE,
  OVERFLOW_TRIGGER_TEST_VALUE
} from "../../__tests__/control-test-values";
import { filter, find, keys, map } from "lodash-es";
import type { DeclaringTableChannel } from "../../../composables/useTableChannel.types";
import type { SurfaceActions } from "../surface.types";

// -----------------------------------------------------------------------------

const { presentation } = clientEmails;

const rows = [defaultRow, unverifiedRow];

const OPEN_ROW = 1;

const i18n = createI18n({
  legacy: false,
  locale: "en",
  messages: { en: { action, labs: labsEn, text } }
});

function mountLockedList(
  table?: DeclaringTableChannel,
  actions: SurfaceActions = {},
  criteria?: Awaited<ReturnType<typeof declaringCriteria>>
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
      table,
      criteria,
      locked: true
    },
    global: { plugins: [i18n] }
  });
}

type Wrapper = ReturnType<typeof mountLockedList>;

const control = (wrapper: Wrapper, row: number, name: string) =>
  getRow(wrapper, row).find(`[data-test-value="${CONTROL_TEST_VALUE[name]}"]`);

async function openOverflow(wrapper: Wrapper, row: number, name: string) {
  await getRow(wrapper, row)
    .find(`[data-test-value="${OVERFLOW_TRIGGER_TEST_VALUE}"]`)
    .trigger("click");
  await new Promise(resolve => setTimeout(resolve, 0));
  return document.querySelector<HTMLElement>(
    `[role="menuitem"] [data-test-value="${CONTROL_TEST_VALUE[name]}"]`
  );
}

const orderingHeader = (wrapper: Wrapper) =>
  find(wrapper.findAll("th"), header =>
    header.find('[data-test-key="button"]').exists()
  )!;

afterEach(() => {
  document.body.innerHTML = "";
});

// -----------------------------------------------------------------------------

describe("R6-23 locked surface — filter bar refused", () => {
  it("disables all filter bar inputs when locked", async () => {
    const table = await declaringChannel("client-email", {
      total: rows.length
    });
    const criteria = await declaringCriteria("client-email");
    const wrapper = mountLockedList(table, {}, criteria);

    const filterBar = wrapper.find('[data-test-key="filters"]');
    expect(filterBar.exists()).toBe(true);

    const inputs = filterBar.findAll("input, select, button");
    expect(inputs.length).toBeGreaterThan(0);
    for (const input of inputs) {
      expect(input.attributes("disabled")).toBeDefined();
    }
  });
});

describe("R6-23 locked surface — display controls refused", () => {
  it("disables the sort control when locked", async () => {
    const table = await declaringChannel("client-email", {
      total: rows.length
    });
    const wrapper = mountLockedList(table);

    const displayRow = wrapper.find('[data-test-key="display-row"]');
    expect(displayRow.exists()).toBe(true);

    const sortButtons = displayRow.findAll("button");
    const sortControl = filter(
      sortButtons,
      btn =>
        btn.attributes("aria-haspopup") === "listbox" ||
        btn.attributes("aria-haspopup") === "menu"
    );

    expect(sortControl.length).toBeGreaterThan(0);
    for (const btn of sortControl) {
      expect(btn.attributes("disabled")).toBeDefined();
    }
  });

  it("disables the column picker when locked", async () => {
    const table = await declaringChannel("client-email", {
      total: rows.length
    });
    const wrapper = mountLockedList(table);

    const displayRow = wrapper.find('[data-test-key="display-row"]');
    const columnPicker = displayRow.find('[data-test-key="column-picker"]');

    if (columnPicker.exists()) {
      const button = columnPicker.find("button");
      expect(button.attributes("disabled")).toBeDefined();
    }
  });

  it("disables the view toggle when locked", async () => {
    const table = await declaringChannel("client-email", {
      total: rows.length
    });
    const wrapper = mountLockedList(table);

    const displayRow = wrapper.find('[data-test-key="display-row"]');
    const toggleButtons = displayRow.findAll('[role="radio"]');

    for (const btn of toggleButtons) {
      expect(btn.attributes("disabled")).toBeDefined();
    }
  });
});

describe("R6-23 locked surface — sortable headers refused", () => {
  it("disables the header sort button when locked", async () => {
    const table = await declaringChannel("client-email", {
      total: rows.length
    });
    const wrapper = mountLockedList(table);

    const header = orderingHeader(wrapper);
    expect(header).toBeTruthy();

    const sortButton = header.find('[data-test-key="button"]');
    expect(sortButton.exists()).toBe(true);
    expect(sortButton.attributes("disabled")).toBeDefined();
  });

  it("refuses the sort write when header is clicked while locked", async () => {
    const emit = vi.fn();
    const table = await declaringChannel("client-email", {
      emit,
      total: rows.length
    });
    const wrapper = mountLockedList(table);

    await orderingHeader(wrapper).trigger("click");

    expect(emit).not.toHaveBeenCalled();
  });
});

describe("R6-23 locked surface — pagination region refused", () => {
  it("marks the pagination region aria-disabled when locked", async () => {
    const table = await declaringChannel("client-email", {
      total: rows.length,
      perPage: 1
    });
    const wrapper = mountLockedList(table);

    const pagination = wrapper.find('[data-test-key="pagination-region"]');
    expect(pagination.exists()).toBe(true);
    expect(pagination.attributes("aria-disabled")).toBe("true");
  });

  it("marks the pagination region inert when locked", async () => {
    const table = await declaringChannel("client-email", {
      total: rows.length,
      perPage: 1
    });
    const wrapper = mountLockedList(table);

    const pagination = wrapper.find('[data-test-key="pagination-region"]');
    expect(pagination.attributes("inert")).toBeDefined();
  });

  it("carries data-test-value=locked on the pagination region when locked", async () => {
    const table = await declaringChannel("client-email", {
      total: rows.length,
      perPage: 1
    });
    const wrapper = mountLockedList(table);

    const pagination = wrapper.find('[data-test-key="pagination-region"]');
    expect(pagination.attributes("data-test-value")).toBe("locked");
  });

  it("names the lock reason in the pagination region title when locked", async () => {
    const table = await declaringChannel("client-email", {
      total: rows.length,
      perPage: 1
    });
    const wrapper = mountLockedList(table);

    const pagination = wrapper.find('[data-test-key="pagination-region"]');
    expect(pagination.attributes("title")).toBe(
      i18n.global.t("labs.replay_locked")
    );
  });
});

describe("R6-23 locked surface — row actions refused", () => {
  it("disables the visible row action control when locked", async () => {
    const actions = { remove: vi.fn() };
    const table = await declaringChannel("client-email", {
      total: rows.length
    });
    const wrapper = mountLockedList(table, actions);

    const removeControl = control(wrapper, OPEN_ROW, "remove");
    expect(removeControl.exists()).toBe(true);

    const button = removeControl.element.closest("button");
    expect(button).toBeTruthy();
    expect(button?.disabled).toBe(true);
  });

  it("disables the overflow trigger when locked", async () => {
    const actions = { setDefault: vi.fn(), verify: vi.fn() };
    const table = await declaringChannel("client-email", {
      total: rows.length
    });
    const wrapper = mountLockedList(table, actions);

    const overflowTrigger = getRow(wrapper, OPEN_ROW).find(
      `[data-test-value="${OVERFLOW_TRIGGER_TEST_VALUE}"]`
    );
    expect(overflowTrigger.exists()).toBe(true);

    const button = overflowTrigger.element.closest("button");
    expect(button).toBeTruthy();
    expect(button?.disabled).toBe(true);
  });

  it("refuses the row action call when clicked while locked", async () => {
    const actions = { remove: vi.fn() };
    const table = await declaringChannel("client-email", {
      total: rows.length
    });
    const wrapper = mountLockedList(table, actions);

    await control(wrapper, OPEN_ROW, "remove").trigger("click");

    expect(actions.remove).not.toHaveBeenCalled();
  });
});
