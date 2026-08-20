// -----------------------------------------------------------------------------
/**
 * @module surfaces/__tests__/list-surface-toolbar-row.spec
 * @description T3.9 — what steers the list, after the rulings that replaced
 * `D4` (`G3` · `G4` · `G5` · `H1`; `tasks.md` §2 — the supersession, not a
 * regression). `D4`'s ONE row is dead: the facets, the refinements they produced
 * and the display row are the cluster that steers the list, and the
 * collection's own action is not among them at all. Four claims:
 *   1. the surface draws all three, inside one cluster that is neither the
 *      surface root nor a wrapper around the table. `R6-16` supersedes `G5`'s
 *      standalone refinements row — the chips ride INLINE on the display row,
 *      after Results — so no document order between them is claimed here
 *      (`evidence/r6-live/claim-09-r6-16-display-row.round-1.md`);
 *   2. Add-new has LEFT the surface — the list still owns the handoff, the page
 *      header renders the control (`G4`);
 *   3. the ordering control sits on the display row in BOTH views, and writes
 *      through the same channel a column header writes (`G3` · `E9`);
 *   4. the count is on the display row's Results label and nowhere else — the
 *      refinements row carries chips and Clear all only (`H1`).
 *
 * ## What breaks if these fail
 * The stacked chrome comes back as one flowing row: a tally nobody can trust
 * beside a create action beside a view choice, and four rulings undone in the
 * one place they are all visible at once.
 */

import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import { computed, ref } from "vue";
import { createI18n } from "vue-i18n";
import { internalKits } from "@upmind-automation/headless/testing";
import action from "@upmind-automation/i18n/core/action-en.json";
import text from "@upmind-automation/i18n/core/text-en.json";
import labsEn from "@upmind-automation/i18n/modules/labs-en.json";
import { declaringChannel } from "../../../../testing/declared-table";
import { defaultRow, unverifiedRow } from "../../../../testing/recorded-emails";
import clientEmails from "../../../../useClientEmails/client-email.scenario";
import { CONTROL_TEST_VALUE } from "../../__tests__/control-test-values";
import { RESOLVED_HANDOFFS } from "../../__tests__/resolved-handoffs";
import DisplayRow from "../../DisplayRow.vue";
import FilterBar from "../../FilterBar.vue";
import RefinementsRow from "../../RefinementsRow.vue";
import { ListSurface, ListViewTypes } from "../index";
import { every, find, map } from "lodash-es";
import type { ModulePortCriteria } from "../../../composables/useModulePort.types";
import type { DeclaringTableChannel } from "../../../composables/useTableChannel.types";
import type {
  ControlledTableChannel,
  TableModel
} from "@upmind-automation/scenario-harness";

const { useQuerySchema, useQueryUischema } =
  await internalKits["client-email"]();

// -----------------------------------------------------------------------------

const { presentation } = clientEmails;

const rows = [defaultRow, unverifiedRow];

/** Two declared leaves narrowing, so the refinements row has chips to draw. */
const NARROWED = {
  filters: { verified: { eq: false }, email: { like: "mock" } }
};

/** The ordering the collection is already at — what a direction flip reverses. */
const LIVE_SORT = { field: "email", dir: "asc" };

const SORT_CONTROL = '[data-test-key="sort"]';

const ADD = `[data-test-value="${CONTROL_TEST_VALUE.add}"]`;

const messages = { en: { action, labs: labsEn, text } };

const i18n = () => createI18n({ legacy: false, locale: "en", messages });

/**
 * The channel the surface reads, DECLARING its ordering vocabulary: that
 * vocabulary is the module's own query-schema `sort` enum and no declaration
 * restates it (`R6-28`), so a channel that cannot declare offers no ordering
 * anywhere.
 */
const channelOn = (
  emit: ControlledTableChannel["emit"] = vi.fn(),
  sort: TableModel["sort"] = [LIVE_SORT]
) =>
  declaringChannel("client-email", {
    emit,
    sort,
    total: rows.length + 1
  });

function liveCriteria(model: Record<string, unknown>): ModulePortCriteria {
  const live = ref(model);

  return {
    schema: useQuerySchema(),
    uischema: useQueryUischema(),
    model: computed(() => live.value),
    set: vi.fn()
  };
}

async function mountList(
  options: {
    criteria?: Record<string, unknown> | false;
    table?: DeclaringTableChannel;
  } = {}
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
      table: options.table ?? (await channelOn()),
      criteria:
        options.criteria === false
          ? undefined
          : liveCriteria(options.criteria ?? NARROWED),
      handoffs: RESOLVED_HANDOFFS
    },
    global: { plugins: [i18n()] }
  });
}

type Wrapper = Awaited<ReturnType<typeof mountList>>;

/** The nearest element holding both — the cluster they are drawn in. */
function sharedAncestor(one: Element, two: Element): HTMLElement {
  let candidate = one.parentElement;
  while (candidate && !candidate.contains(two))
    candidate = candidate.parentElement;

  return candidate as HTMLElement;
}

const rowsOf = (wrapper: Wrapper) => [
  wrapper.findComponent(FilterBar).element,
  wrapper.findComponent(RefinementsRow).element,
  wrapper.findComponent(DisplayRow).element
];

/**
 * Which view is drawn is url state now (`AC9.1`/K8) — one writer, process-wide
 * and outliving any single mount — so a case that switches view hands it back,
 * rather than leaving the next mount booting into the previous case's choice.
 */
const inCardView = async (wrapper: Wrapper, read: () => void) => {
  await wrapper
    .find(`[data-test-value="${ListViewTypes.CARD}"]`)
    .trigger("click");
  read();
  await wrapper
    .find(`[data-test-value="${ListViewTypes.TABLE}"]`)
    .trigger("click");
};

const follows = (one: Element, two: Element) =>
  Boolean(one.compareDocumentPosition(two) & Node.DOCUMENT_POSITION_FOLLOWING);

/** The header the surface offers an ordering ON — found, never counted. */
const orderingHeader = (wrapper: Wrapper) =>
  find(wrapper.findAll("th"), header =>
    header.find('[data-test-key="button"]').exists()
  )!;

// -----------------------------------------------------------------------------

describe("T3.9 the facets, the refinements and the display row are ONE cluster (R6-16)", () => {
  it("draws all three, each as its own component", async () => {
    const wrapper = await mountList();

    expect(wrapper.findComponent(FilterBar).exists()).toBe(true);
    expect(wrapper.findComponent(RefinementsRow).exists()).toBe(true);
    expect(wrapper.findComponent(DisplayRow).exists()).toBe(true);
  });

  it("puts the facets ahead of everything they narrowed", async () => {
    const [facets, refinements, display] = rowsOf(await mountList());

    expect(follows(facets!, display!)).toBe(true);
    expect(follows(facets!, refinements!)).toBe(true);
  });

  it("keeps them in ONE cluster that is not merely the surface root", async () => {
    const wrapper = await mountList();
    const [facets, , display] = rowsOf(wrapper);
    const cluster = sharedAncestor(facets!, display!);

    expect(cluster).not.toBe(wrapper.element);
    expect(wrapper.element.contains(cluster)).toBe(true);
    expect(every(rowsOf(wrapper), row => cluster.contains(row))).toBe(true);
  });

  it("holds none of the table it steers, and precedes it", async () => {
    const wrapper = await mountList();
    const [facets, , display] = rowsOf(wrapper);
    const cluster = sharedAncestor(facets!, display!);

    expect(cluster.querySelector("table")).toBeNull();
    expect(follows(cluster, wrapper.find("table").element)).toBe(true);
  });

  it("offers no facets and no refinements where the module publishes no criteria", async () => {
    const wrapper = await mountList({ criteria: false });

    expect(wrapper.findComponent(FilterBar).exists()).toBe(false);
    expect(wrapper.find('[data-test-key="refinement"]').exists()).toBe(false);
    expect(wrapper.find("table").exists()).toBe(true);
  });
});

describe("T3.9 the collection's own action has LEFT the surface (G4)", () => {
  it("draws no Add control anywhere in the list", async () => {
    const wrapper = await mountList();

    expect(wrapper.find(ADD).exists()).toBe(false);
  });

  it("draws none in card view either", async () => {
    const wrapper = await mountList();

    await inCardView(wrapper, () =>
      expect(wrapper.find(ADD).exists()).toBe(false)
    );
  });

  it("still resolves the handoff the collection's action opens — the list kept the editor", async () => {
    const wrapper = await mountList();

    expect(wrapper.find(ADD).exists()).toBe(false);
    expect(wrapper.findComponent(DisplayRow).exists()).toBe(true);
  });
});

describe("T3.9 ordering sits on the display row, in both views (G3 · E9)", () => {
  it("offers it in table view, where the headers already are", async () => {
    const wrapper = await mountList();
    const display = wrapper.findComponent(DisplayRow);

    expect(display.find(SORT_CONTROL).exists()).toBe(true);
  });

  it("offers it in card view, where there are no headers to click", async () => {
    const wrapper = await mountList();

    await inCardView(wrapper, () =>
      expect(
        wrapper.findComponent(DisplayRow).find(SORT_CONTROL).exists()
      ).toBe(true)
    );
  });

  it("writes the same intent as the column header it shares its channel with", async () => {
    const fromToolbar = vi.fn();
    const toolbar = await mountList({ table: await channelOn(fromToolbar) });
    await toolbar
      .find(`${SORT_CONTROL} [data-test-key="button"]`)
      .trigger("click");

    const fromHeader = vi.fn();
    const header = await mountList({ table: await channelOn(fromHeader) });
    await orderingHeader(header).trigger("click");

    expect(fromToolbar).toHaveBeenCalledTimes(1);
    expect(fromToolbar.mock.calls[0]![0]).toEqual(fromHeader.mock.calls[0]![0]);
  });
});

describe("T3.9 the count is on Results, and nowhere else (H1)", () => {
  it("reads the drawn rows against the collection's total, on the display row", async () => {
    const wrapper = await mountList();

    expect(wrapper.findComponent(DisplayRow).text()).toContain(
      i18n().global.t("labs.results_showing", {
        count: rows.length,
        total: rows.length + 1
      })
    );
  });

  it("leaves the refinements row carrying chips and Clear all alone", async () => {
    const wrapper = await mountList();
    const refinements = wrapper.findComponent(RefinementsRow);

    expect(
      map(refinements.findAll('[data-test-key="refinement"]'), chip =>
        chip.attributes("data-test-value")
      )
    ).toEqual(["email.like", "verified.eq"]);
    expect(/\d/.test(refinements.text())).toBe(false);
  });
});
