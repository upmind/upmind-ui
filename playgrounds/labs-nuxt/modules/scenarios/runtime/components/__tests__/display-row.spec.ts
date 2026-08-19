// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/components/__tests__/display-row.spec
 * @description T3.7 — the data surface's own line: what it is showing, how it
 * is ordered and which way it is drawn (`G3` · `E9` · `H1` · `AC5.1` · `AC5.3`).
 * Three claims:
 *   1. the ordering control sits with the data in BOTH views — table view is not
 *      "click a header or nothing" (`E9`);
 *   2. the toolbar's ordering and a column header are ONE ordering: both paths
 *      write the same sort through the same channel (`AC5.1`, `P1-R9`);
 *   3. Results carries the count the refinements row gave up (`H1`), read from
 *      the seam's own total and the rows actually drawn;
 *   4. what it offers to order BY is the query schema's own `sort.field` enum
 *      and nothing else — never the Status composite, which is two flags the
 *      API orders on neither of (`R6-6`/`R6-6b`);
 *   5. the whole ordering cluster stands at the display row's scale, not the
 *      page's — it sat a control-height taller than the toggle beside it and
 *      threw the section out (`R6-1`).
 *
 * The one-ordering claim is measured through the real `ListSurface`, because
 * two write paths can only be proven to be one where both exist.
 */

import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import { computed, ref } from "vue";
import { createI18n } from "vue-i18n";
import { internalKits } from "@upmind-automation/headless/testing";
import action from "@upmind-automation/i18n/core/action-en.json";
import form from "@upmind-automation/i18n/core/form-en.json";
import text from "@upmind-automation/i18n/core/text-en.json";
import labsEn from "@upmind-automation/i18n/modules/labs-en.json";
import { Select } from "@upmind-automation/upmind-ui";
import {
  declaringChannel,
  declaringCriteria,
  declaringSchemas
} from "../../../testing/declared-table";
import { defaultRow, unverifiedRow } from "../../../testing/recorded-emails";
import { receivedEmailRows } from "../../../testing/recorded-received-email";
import { TRANSLATED } from "../../../testing/rendered";
import clientEmails from "../../../useClientEmails/client-email.scenario";
import receivedEmails from "../../../useClientReceivedEmails/client-email-history.scenario";
import DisplayRow from "../DisplayRow.vue";
import { ListSurface, ListViewTypes } from "../surfaces";
import { RESOLVED_HANDOFFS } from "./resolved-handoffs";
import {
  filter,
  find,
  first,
  forEach,
  get,
  isEmpty,
  map,
  omit,
  reject,
  slice,
  sortBy,
  split
} from "lodash-es";
import type { ModulePortCriteria } from "../../composables/useModulePort.types";
import type { DeclaringTableChannel } from "../../composables/useTableChannel.types";
import type { SortField } from "../SortControl.types";
import type { ControlledTableChannel } from "@upmind-automation/scenario-harness";
import type { DOMWrapper, VueWrapper } from "@vue/test-utils";

const { useQuerySchema, useQueryUischema } =
  await internalKits["client-email"]();

// -----------------------------------------------------------------------------

const rows = [defaultRow, unverifiedRow];

const TOTAL = 3;

/** The wire fields the module's query schema will actually answer `order=` on. */
const SCHEMA_SORT_FIELDS = get(useQuerySchema(), [
  "properties",
  "sort",
  "items",
  "properties",
  "field",
  "enum"
]) as string[];

const SORT_CONTROL = '[data-test-key="sort"]';

/**
 * The ordering already on the collection. The toolbar's direction control flips
 * a LIVE sort — with none, there is no direction to reverse and the control is
 * inert — so both write paths are exercised from the same live state.
 */
const LIVE_SORT = { field: "email", dir: "asc" };
const VIEW_TOGGLE = (view: ListViewTypes) => `[data-test-value="${view}"]`;

const messages = { en: { action, form, labs: labsEn, text } };

const translate = createI18n({ legacy: false, locale: "en", messages }).global
  .t;

const i18n = (installed: typeof messages.en = messages.en) =>
  createI18n({ legacy: false, locale: "en", messages: { en: installed } });

/** Each module's own option-key PREFIX, read off the uischema it declares. */
const PREFIX = get(
  (await declaringSchemas("client-email")).sortUischema,
  "i18n"
) as string;
const HISTORY_PREFIX = get(
  (await declaringSchemas("client-email-history")).sortUischema,
  "i18n"
) as string;

/** What the shipped catalogue answers `<prefix>.<field>` with. */
const catalogueLabel = (prefix: string, field: string) =>
  get(form, [...slice(split(prefix, "."), 1), field]) as string;

/** The other module's own ordering vocabulary, off its own query schema. */
const HISTORY_SORT_FIELDS = get(
  (await declaringSchemas("client-email-history")).schema,
  ["properties", "sort", "items", "properties", "field", "enum"]
) as string[];

/** The ordering as the SURFACE offers it — read off the control, never a fixture. */
const offeredIn = (wrapper: VueWrapper) =>
  (wrapper.findComponent(Select).props("items") ?? []) as SortField[];

/**
 * The header the surface offers an ordering ON. Found rather than counted: a
 * declared column carries the control only where its own scope names a field
 * the schema orders by, and the star column at position 0 (`R6-34`) names none.
 */
const orderingHeader = (wrapper: VueWrapper) =>
  find(wrapper.findAll("th"), header =>
    header.find('[data-test-key="button"]').exists()
  ) as DOMWrapper<Element>;

/**
 * The ordering as the SURFACE hands it over. There is no declared sort channel
 * any more (`R6-28`) — the schema's own `sort.field` enum is the vocabulary — so
 * the fixture is built from that enum rather than from a second list.
 */
const FIELDS: SortField[] = map(SCHEMA_SORT_FIELDS, field => ({
  value: field,
  label: field
}));

/**
 * The Status column's own label. It is a presentation COMPOSITE — the badge cell
 * over two `meta` flags — so it names no wire field and must never be offerable.
 */
const COMPOSITE_LABEL = translate(
  get(
    find(clientEmails.presentation.table.elements, { type: "TableCellBadges" }),
    "i18n"
  ) as string
);

function mountRow(overrides: Record<string, unknown> = {}) {
  return mount(DisplayRow, {
    attachTo: document.body,
    props: {
      count: rows.length,
      total: TOTAL,
      fields: FIELDS,
      sort: [],
      view: ListViewTypes.TABLE,
      hasCardView: true,
      ...overrides
    },
    global: { plugins: [i18n()] }
  });
}

// --- the surface, for the one-ordering claim --------------------------------

/**
 * The surface's channel DECLARES: `declared()` is the real `useTableChannel`'s,
 * over the module's own query schema and sort uischema, so the ordering the
 * surface offers is the one the module declares rather than one this spec
 * supplied. `read`/`emit` stay the harness-shaped double.
 */
const declaredChannel = await declaringChannel("client-email", {
  sort: [LIVE_SORT],
  total: TOTAL
});

const channelOn = (
  emit: ControlledTableChannel["emit"]
): DeclaringTableChannel => ({ ...declaredChannel, emit });

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
  emit: ControlledTableChannel["emit"],
  installed: typeof messages.en = messages.en
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
      presentation: clientEmails.presentation,
      table: channelOn(emit),
      criteria: liveCriteria(),
      handoffs: RESOLVED_HANDOFFS
    },
    global: { plugins: [i18n(installed)] }
  });
}

const historyChannel = await declaringChannel("client-email-history", {
  total: receivedEmailRows.length
});
const historyCriteria = await declaringCriteria("client-email-history");

/** The OTHER module's list, whose ordering wording is its own (AC11). */
function mountHistory() {
  return mount(ListSurface, {
    attachTo: document.body,
    props: {
      snapshot: {
        actions: [],
        context: { data: slice(receivedEmailRows, 0, 2) },
        meta: { isEmpty: false, isFiltered: false }
      },
      actions: {},
      presentation: receivedEmails.presentation,
      table: historyChannel,
      criteria: historyCriteria
    },
    global: { plugins: [i18n()] }
  });
}

// -----------------------------------------------------------------------------

describe("T3.7 the ordering control sits with the data, in BOTH views (G3 · E9)", () => {
  it("offers it in table view, where the headers are", () => {
    const wrapper = mountRow({ view: ListViewTypes.TABLE });

    expect(wrapper.find(SORT_CONTROL).exists()).toBe(true);
  });

  it("offers it in card view, where there are no headers to click", () => {
    const wrapper = mountRow({ view: ListViewTypes.CARD });

    expect(wrapper.find(SORT_CONTROL).exists()).toBe(true);
  });

  it("offers exactly the fields it was handed, in declaration order", () => {
    const wrapper = mountRow();

    expect(map(wrapper.findComponent(Select).props("items"), "value")).toEqual(
      map(FIELDS, "value")
    );
  });

  it("offers no ordering at all where the module owns no table state", () => {
    const wrapper = mountRow({ fields: [] });

    expect(wrapper.find(SORT_CONTROL).exists()).toBe(false);
  });

  it("draws the ordering beside the view toggle, on one line", () => {
    const wrapper = mountRow();
    const toggle = wrapper.find(VIEW_TOGGLE(ListViewTypes.CARD)).element;

    expect(wrapper.find(SORT_CONTROL).exists()).toBe(true);
    expect(wrapper.element.contains(toggle)).toBe(true);
  });
});

describe("T3.7 the ordering offers REAL columns, never a composite (R6-6 · R6-6b)", () => {
  /**
   * Read off the SURFACE, never off `mountRow`: the display row is handed its
   * offer list, so asserting against a list this spec supplied would only prove
   * the fixture. What is on trial is where the surface gets it from.
   */
  const offered = () =>
    (mountList(vi.fn()).findComponent(Select).props("items") ??
      []) as SortField[];

  it("offers exactly the wire fields the query schema answers `order=` on", () => {
    expect(sortBy(map(offered(), "value"))).toEqual(sortBy(SCHEMA_SORT_FIELDS));
  });

  it("never offers Status — a badge composite over two flags is not a column", () => {
    expect(map(offered(), "label")).not.toContain(COMPOSITE_LABEL);
    expect(
      filter(map(offered(), "value"), field => /status/i.test(field))
    ).toEqual([]);
  });
});

describe("the ordering is offered in the client's own words (AC2)", () => {
  it("is offered under a prefix the module declares, not one this spec supplies", () => {
    expect(PREFIX).toMatch(/^form\./);
  });

  it.each(SCHEMA_SORT_FIELDS)(
    "offers %s under the copy the catalogue answers its prefix with",
    field => {
      const option = find(offeredIn(mountList(vi.fn())), { value: field });

      expect(option?.label).not.toBe(field);
      expect(TRANSLATED.has(option?.label as string)).toBe(true);
      expect(option?.label).toBe(catalogueLabel(PREFIX, field));
    }
  );

  it("words the two that read as their own wire names today — default and created_at", () => {
    const offered = offeredIn(mountList(vi.fn()));

    forEach(["default", "created_at"], field =>
      expect(find(offered, { value: field })?.label).toBe(
        catalogueLabel(PREFIX, field)
      )
    );
  });
});

describe("an ordering whose wording has not arrived is still offered (AC6)", () => {
  it("offers every declared field, named by its wire name rather than left blank", () => {
    const stripped = {
      ...messages.en,
      form: omit(form, slice(split(PREFIX, "."), 1))
    };

    const offered = offeredIn(mountList(vi.fn(), stripped));

    expect(sortBy(map(offered, "value"))).toEqual(sortBy(SCHEMA_SORT_FIELDS));
    expect(filter(offered, option => isEmpty(option.label))).toEqual([]);
    expect(map(offered, "label")).toEqual(map(offered, "value"));
  });
});

describe("the OTHER module words its ordering as its own (AC11)", () => {
  it("offers every field of its own schema, each from the shipped catalogue", () => {
    const offered = offeredIn(mountHistory());

    expect(sortBy(map(offered, "value"))).toEqual(sortBy(HISTORY_SORT_FIELDS));
    expect(reject(offered, option => TRANSLATED.has(option.label))).toEqual([]);
  });

  it("dates a sent email by when it was SENT, never by when an address was added", () => {
    const dated = find(offeredIn(mountHistory()), { value: "created_at" });

    expect(dated?.label).toBe(catalogueLabel(HISTORY_PREFIX, "created_at"));
    expect(dated?.label).not.toBe(catalogueLabel(PREFIX, "created_at"));
  });
});

describe("T3.7 the ordering stands at the row's own scale (R6-1)", () => {
  const PICKER = `${SORT_CONTROL} [role="combobox"]`;
  const DIRECTION = `${SORT_CONTROL} [data-test-key="button"]`;
  const TOGGLE = '[data-test-key="toggle-group-item"]';

  /** What sets a control's height: its own padding and its type scale. */
  const density = (element: Element) =>
    sortBy(
      filter(reject(split(element.className, /\s+/), isEmpty), token =>
        /^(p[xy]?-|text-(xs|sm|base|lg|xl)$)/.test(token)
      )
    );

  it("draws the field picker at the density of the direction control beside it", () => {
    const wrapper = mountRow();

    expect(density(wrapper.find(PICKER).element)).toEqual(
      density(wrapper.find(DIRECTION).element)
    );
  });

  it("draws it at the density of the view toggle it shares the line with", () => {
    const wrapper = mountRow();

    expect(density(wrapper.find(PICKER).element)).toEqual(
      density(wrapper.find(TOGGLE).element)
    );
  });
});

describe("T3.7 the view choice is the surface's, not the page's (AC5.6)", () => {
  it("asks for the other renderer rather than switching itself", async () => {
    const wrapper = mountRow();

    await wrapper.find(VIEW_TOGGLE(ListViewTypes.CARD)).trigger("click");

    expect(first(wrapper.emitted("update:view"))).toEqual([ListViewTypes.CARD]);
  });

  it("offers no toggle where the scenario declared no second row", () => {
    const wrapper = mountRow({ hasCardView: false });

    expect(wrapper.find(VIEW_TOGGLE(ListViewTypes.CARD)).exists()).toBe(false);
  });
});

describe("T3.7 Results says how many of how many (H1 · AC4.5 · AC5.3)", () => {
  it("reads the drawn rows against the collection's own total", () => {
    const wrapper = mountRow();

    expect(wrapper.text()).toContain(translate("labs.results"));
    expect(wrapper.text()).toContain(
      translate("labs.results_showing", { count: rows.length, total: TOTAL })
    );
  });

  it("says only what is on screen where the module publishes no total", () => {
    const wrapper = mountRow({ total: undefined });

    expect(wrapper.text()).toContain(
      translate("labs.results_shown", { count: rows.length })
    );
  });
});

describe("T3.7 one ordering, two ways to reach it (AC5.1 · P1-R9)", () => {
  it("writes the same intent from the toolbar as from a column header", async () => {
    const fromToolbar = vi.fn();
    const toolbar = mountList(fromToolbar);
    await toolbar
      .find(`${SORT_CONTROL} [data-test-key="button"]`)
      .trigger("click");

    const fromHeader = vi.fn();
    const header = mountList(fromHeader);
    await orderingHeader(header).trigger("click");

    expect(fromToolbar).toHaveBeenCalledTimes(1);
    expect(fromHeader).toHaveBeenCalledTimes(1);
    expect(fromToolbar.mock.calls[0][0]).toEqual(fromHeader.mock.calls[0][0]);
  });

  it("orders through the channel the headers read, never a second state", async () => {
    const emit = vi.fn();
    const wrapper = mountList(emit);

    await wrapper
      .find(`${SORT_CONTROL} [data-test-key="button"]`)
      .trigger("click");

    const intent = emit.mock.calls[0][0];
    expect(intent.type).toBe("sort");
    expect(intent.sort).toEqual([{ field: LIVE_SORT.field, dir: "desc" }]);
  });
});
