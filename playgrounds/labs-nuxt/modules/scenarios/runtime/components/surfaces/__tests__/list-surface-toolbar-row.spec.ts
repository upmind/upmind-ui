// -----------------------------------------------------------------------------
/**
 * @fileoverview @AC2 the list has ONE toolbar row: what steers it and what acts
 * on it sit together (D4 · D3).
 *
 * ## Job To Be Done
 * The operator's page stacked three lines — filters, then the Table/Cards
 * toggle, then Add new — over a table that had not started yet. The ruling is
 * one row: the filter bar grows into it and the toggle and the collection's
 * controls trail it. What is measurable in jsdom is the STRUCTURE that produces
 * that row: the bar and the controls share one container, that container is not
 * merely the surface root (which is what "separate lines" means), and it holds
 * none of the table it steers.
 *
 * ## What Breaks If These Fail
 * The stacked lines come back — three rows of chrome before a single record —
 * or the bar drifts out of the list it belongs to and steers a table it no
 * longer sits with.
 */

import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import { computed, ref } from "vue";
import {
  useQuerySchema,
  useQueryUischema
} from "@upmind-automation/headless/testing/client-email/internal-kit";
import {
  defaultRow,
  unverifiedRow
} from "../../../../../../tests/support/recorded-emails";
import clientEmails from "../../../../useClientEmails/scenario";
import { CONTROL_TEST_VALUE } from "../../__tests__/control-test-values";
import { RESOLVED_HANDOFFS } from "../../__tests__/resolved-handoffs";
import FilterBar from "../../FilterBar.vue";
import { ListSurface, ListViewTypes } from "../index";
import { compact, map } from "lodash-es";
import type { ModulePortCriteria } from "../../../composables/useModulePort.types";
import type { ControlledTableChannel } from "@upmind-automation/scenario-harness";

// -----------------------------------------------------------------------------

const { presentation } = clientEmails;

const rows = [defaultRow, unverifiedRow];

const table: ControlledTableChannel = {
  read: () => ({
    filter: {},
    sort: [],
    pagination: { page: 1, perPage: 10, total: rows.length }
  }),
  emit: vi.fn()
};

/** The module's OWN query pair, as the playground hands the bar its criteria. */
function liveCriteria(): ModulePortCriteria {
  const model = ref<Record<string, unknown>>({});
  return {
    schema: useQuerySchema(),
    uischema: useQueryUischema(),
    model: computed(() => model.value),
    set: vi.fn()
  };
}

function mountList(
  criteria?: ModulePortCriteria,
  channel: ControlledTableChannel = table
) {
  return mount(ListSurface, {
    attachTo: document.body,
    props: {
      snapshot: {
        actions: ["remove"],
        context: { data: rows },
        meta: { isEmpty: false, isFiltered: false }
      },
      actions: { remove: vi.fn() },
      presentation,
      table: channel,
      criteria,
      handoffs: RESOLVED_HANDOFFS
    }
  });
}

/** The toolbar's own sort control, by the test key it carries. */
const SORT_CONTROL = '[data-test-key="sort"]';

/** A channel already carrying a sort — what the control flips the direction of. */
const sortedTable = (emit: ControlledTableChannel["emit"]) => ({
  read: () => ({
    ...table.read(),
    sort: [{ field: "email", dir: "asc" }]
  }),
  emit
});

type Wrapper = ReturnType<typeof mountList>;

/** The nearest element holding both — the ROW they are drawn on, whatever it is called. */
function sharedRow(one: Element, two: Element): HTMLElement {
  let candidate = one.parentElement;
  while (candidate && !candidate.contains(two))
    candidate = candidate.parentElement;
  return candidate as HTMLElement;
}

const viewToggle = (wrapper: Wrapper) =>
  wrapper.find(`[data-test-value="${ListViewTypes.CARD}"]`).element;

const addControl = (wrapper: Wrapper) =>
  wrapper.find(`[data-test-value="${CONTROL_TEST_VALUE.add}"]`).element;

// -----------------------------------------------------------------------------

describe("@AC2 filters, the view toggle and the collection's controls are ONE row (D4)", () => {
  it("draws all three inside a single container", () => {
    const wrapper = mountList(liveCriteria());
    const bar = wrapper.findComponent(FilterBar);

    expect(bar.exists()).toBe(true);
    const row = sharedRow(bar.element, addControl(wrapper));

    expect(row.contains(viewToggle(wrapper))).toBe(true);
  });

  it("shares more than the surface root — a shared root IS the stacked lines", () => {
    const wrapper = mountList(liveCriteria());
    const row = sharedRow(
      wrapper.findComponent(FilterBar).element,
      addControl(wrapper)
    );

    expect(row).not.toBe(wrapper.element);
    expect(wrapper.element.contains(row)).toBe(true);
  });

  it("keeps the table out of that row — it is a toolbar, not a wrapper", () => {
    const wrapper = mountList(liveCriteria());
    const row = sharedRow(
      wrapper.findComponent(FilterBar).element,
      addControl(wrapper)
    );

    expect(row.querySelector("table")).toBeNull();
    expect(wrapper.find("table").exists()).toBe(true);
  });

  it("still draws one row where the module publishes no criteria at all", () => {
    const wrapper = mountList();

    expect(wrapper.findComponent(FilterBar).exists()).toBe(false);
    const row = sharedRow(viewToggle(wrapper), addControl(wrapper));

    expect(row).not.toBe(wrapper.element);
    expect(row.querySelector("table")).toBeNull();
  });
});

describe("@AC2 card view can sort, from the toolbar (E9)", () => {
  it("offers a sort control where there are no headers to click", async () => {
    const wrapper = mountList(liveCriteria());

    expect(wrapper.find(SORT_CONTROL).exists()).toBe(false);
    await wrapper
      .find(`[data-test-value="${ListViewTypes.CARD}"]`)
      .trigger("click");

    expect(wrapper.find(SORT_CONTROL).exists()).toBe(true);
  });

  it("offers exactly the fields the scenario declared sortable, in its order", async () => {
    const wrapper = mountList(liveCriteria());
    await wrapper
      .find(`[data-test-value="${ListViewTypes.CARD}"]`)
      .trigger("click");

    const offered = map(wrapper.findAll(`${SORT_CONTROL} option`), option =>
      option.attributes("value")
    );

    expect(offered).toEqual(
      compact(map(presentation.row?.elements, "options.sortable"))
    );
  });

  it("writes through the SAME channel the headers write — one source of truth", async () => {
    const emit = vi.fn();
    const wrapper = mountList(liveCriteria(), sortedTable(emit));
    await wrapper
      .find(`[data-test-value="${ListViewTypes.CARD}"]`)
      .trigger("click");

    await wrapper
      .find(`${SORT_CONTROL} [data-test-key="button"]`)
      .trigger("click");

    expect(emit).toHaveBeenCalledTimes(1);
    const intent = emit.mock.calls[0][0];
    expect(intent.type).toBe("sort");
    expect(intent.sort[0]).toEqual({ field: "email", dir: "desc" });
  });

  it("offers no sort at all where the module owns no table state", async () => {
    const wrapper = mount(ListSurface, {
      attachTo: document.body,
      props: {
        snapshot: {
          actions: ["remove"],
          context: { data: rows },
          meta: { isEmpty: false, isFiltered: false }
        },
        actions: { remove: vi.fn() },
        presentation,
        handoffs: RESOLVED_HANDOFFS
      }
    });

    expect(wrapper.find(SORT_CONTROL).exists()).toBe(false);
  });
});

describe("@AC2 the toolbar belongs to the LIST (D4)", () => {
  it("draws the bar inside the surface, never on a line of its own above it", () => {
    const wrapper = mountList(liveCriteria());

    expect(
      wrapper.element.contains(wrapper.findComponent(FilterBar).element)
    ).toBe(true);
  });

  it("precedes the rows it steers", () => {
    const wrapper = mountList(liveCriteria());
    const row = sharedRow(
      wrapper.findComponent(FilterBar).element,
      addControl(wrapper)
    );

    expect(
      row.compareDocumentPosition(wrapper.find("table").element) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });
});
