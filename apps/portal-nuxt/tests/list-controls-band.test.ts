// -----------------------------------------------------------------------------
/**
 * @module tests/list-controls-band
 * @description The wired proof for the control band: a searchable panel puts
 * its refinements on a full-measure line UNDER the description — the search
 * field on the left, then the order and the status rail on the right, the rail
 * on the far edge — and a dispatched search re-renders the list below it
 * narrowed, because the band, the pager and the list all read one instance.
 * Every piece degrades on its own, and the `actions` position beside the title
 * keeps working for the panels that use it.
 *
 * Paired blind with tests/list-controls-band.must-fail.patch.
 */

import { mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { computed, nextTick } from "vue";
import type { VueWrapper } from "@vue/test-utils";
import type { DataRouteContext } from "~/portal/mock/injection";
import type { MockDataset } from "~/portal/mock/types";
import type { PageKey } from "~/portal/types";
import { hostgridConfig } from "~/portal/config/hostgrid";
import PortalContent from "~/portal/content/PortalContent.vue";
import { dispatchMockAction } from "~/portal/mock/actions";
import {
  ACTIVE_MOCK_DATA,
  ACTIVE_ROUTE_CONTEXT
} from "~/portal/mock/injection";
import {
  MOCK_DATASET_ID,
  resetMockData,
  useMockData
} from "~/portal/mock/store";
import { resolve } from "~/portal/resolve";
import { PAGE_KEY } from "~/portal/types";

const BAND = '[data-slot="portal-row-controls"]';
const HEADER = '[data-slot="card-header"]';
const HEADER_ACTIONS = '[data-slot="card-action"]';
const SORT = '[data-test-key="portal-list-controls-sort"]';
const LIST_ITEM = '[data-test-key="portal-list-item"]';
const TAB = '[role="tab"]';

function mountPage(
  pageKey: PageKey,
  data: MockDataset,
  context: DataRouteContext
) {
  return mount(PortalContent, {
    props: {
      rows: resolve(hostgridConfig, { pageKeys: [pageKey] }).content.rows,
      asideLabel: "Page aside"
    },
    global: {
      provide: {
        [ACTIVE_MOCK_DATA as symbol]: computed(() => data),
        [ACTIVE_ROUTE_CONTEXT as symbol]: computed(() => context)
      }
    }
  });
}

/** The band's two positions, in the order the renderer lays them out. */
function bandSides(wrapper: VueWrapper) {
  const sides = wrapper.find(BAND).element.children;
  return {
    start: sides.item(0)?.innerHTML ?? "",
    end: sides.item(1)?.innerHTML ?? ""
  };
}

describe("panel control band — search left, order and filters right", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  afterEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  it("puts the band UNDER the description and above the list", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);
    const wrapper = mountPage(PAGE_KEY.BILLING_INVOICES, data, {});
    const html = wrapper.html();

    expect(wrapper.find(BAND).exists()).toBe(true);
    // The description belongs to the header block, and the header closes
    // before the band opens — the band is not a second row of the heading.
    expect(wrapper.find(HEADER).find(BAND).exists()).toBe(false);
    expect(html.indexOf("Unpaid invoices stay payable")).toBeLessThan(
      html.indexOf('data-slot="portal-row-controls"')
    );
    expect(html.indexOf('data-slot="portal-row-controls"')).toBeLessThan(
      html.indexOf('data-test-key="portal-list-item"')
    );
    // Nothing was left behind beside the title.
    expect(wrapper.find(HEADER_ACTIONS).exists()).toBe(false);
  });

  it("seats the search field left, and the order then the rail right", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);
    const wrapper = mountPage(PAGE_KEY.BILLING_INVOICES, data, {});
    const { start, end } = bandSides(wrapper);

    expect(start).toContain("portal-list-controls-search");
    expect(start).not.toContain('role="tab"');
    expect(start).not.toContain("portal-list-controls-sort");

    expect(end).toContain("portal-list-controls-sort");
    expect(end).toContain('role="tab"');
    // The order first, the tabs on the far edge.
    expect(end.indexOf("portal-list-controls-sort")).toBeLessThan(
      end.indexOf('role="tab"')
    );
    expect(wrapper.findAll(TAB)).toHaveLength(4);
  });

  it("a dispatched search re-renders the list below it, narrowed", async () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);
    const wrapper = mountPage(PAGE_KEY.BILLING_INVOICES, data, {});

    expect(wrapper.findAll(LIST_ITEM).length).toBeGreaterThan(1);

    dispatchMockAction(data, {}, "collection-search:invoices:INV-0094");
    await nextTick();

    expect(wrapper.findAll(LIST_ITEM)).toHaveLength(1);
    expect(wrapper.text()).toContain("INV-0094");
  });

  it("the group listing carries the same band, beside its own three tabs", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);
    const wrapper = mountPage(PAGE_KEY.GROUP_LISTING, data, {
      groupSlug: "products"
    });
    const { start, end } = bandSides(wrapper);

    expect(start).toContain("portal-list-controls-search");
    expect(end).toContain('role="tab"');
    expect(end).toContain("portal-list-controls-sort");
    expect(wrapper.findAll(TAB)).toHaveLength(3);
  });

  it("a dispatched product search narrows the group listing", async () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);
    const context: DataRouteContext = { groupSlug: "products" };
    const wrapper = mountPage(PAGE_KEY.GROUP_LISTING, data, context);

    // The needs-setup billboard above the listing carries rows of its own.
    const listing = () =>
      wrapper
        .findAll('[data-test-key="portal-section"]')
        .find(section =>
          section.text().includes("Manage each from its own page.")
        );
    expect(listing()?.findAll(LIST_ITEM).length).toBeGreaterThan(1);

    dispatchMockAction(
      data,
      context,
      "collection-search:group-products:archive storage"
    );
    await nextTick();

    expect(listing()?.findAll(LIST_ITEM)).toHaveLength(1);
    expect(wrapper.text()).toContain("Archive Storage");
  });

  it("a sort-less collection keeps its band and its rail, with no select", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);
    const wrapper = mountPage(PAGE_KEY.SUPPORT_TICKETS, data, {});
    const { start, end } = bandSides(wrapper);

    expect(start).toContain("portal-list-controls-search");
    expect(end).toContain('role="tab"');
    // Tickets declare no sort options, so that half renders nothing at all.
    expect(wrapper.find(SORT).exists()).toBe(false);
    expect(wrapper.findAll(TAB)).toHaveLength(2);
  });
});
