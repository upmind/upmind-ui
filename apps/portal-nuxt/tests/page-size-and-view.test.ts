// -----------------------------------------------------------------------------
/**
 * @module tests/page-size-and-view
 * @description The two listing controls legacy kept outside the filter band:
 * how many rows a panel shows (`set-page-size:<id>:<n>`, the pager's own
 * select) and how it is laid out (`set-view:<grid|table>`, remembered in
 * `localStorage` as legacy remembered it in user meta). A resize recomputes
 * the whole pagination descriptor and clamps the page it can no longer reach;
 * the preference outlives a reload, tolerates a storage that refuses, and
 * ignores a value it does not recognise.
 */

import { Select } from "@upmind/ui";
import { mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { nextTick } from "vue";
import { map } from "lodash-es";
import type { PaginationModuleState } from "~/portal/modules/pagination/types";
import {
  LIST_VIEW,
  useListViewPreference
} from "~/composables/useListViewPreference";
import {
  MOCK_ACTION,
  dispatchMockAction,
  mockActionValue
} from "~/portal/mock/actions";
import {
  PAGED_COLLECTION_ID,
  invoicesCollection,
  pagedCollectionHandle
} from "~/portal/mock/collection-defs";
import {
  DATA_REF_ID,
  dataRef,
  resolveDataRefProps
} from "~/portal/mock/data-refs";
import {
  MOCK_DATASET_ID,
  resetMockData,
  useMockData
} from "~/portal/mock/store";
import { LIST_MODULE_VARIANT } from "~/portal/modules/list/types";
import PaginationModule from "~/portal/modules/pagination/Pagination.vue";

const PRODUCTS_CONTEXT = { groupSlug: "products" };
const VIEW_STORAGE_KEY = "upmind-portal-list-view";

function pageSizeValue(id: string, size: number): string {
  return `${mockActionValue(MOCK_ACTION.SET_PAGE_SIZE, id)}:${size}`;
}

function pagerState(
  id: (typeof DATA_REF_ID)[keyof typeof DATA_REF_ID],
  context: Record<string, string> = {}
): PaginationModuleState {
  return resolveDataRefProps(
    { value: dataRef(id) },
    useMockData(MOCK_DATASET_ID.HOSTGRID),
    context
  )?.value as PaginationModuleState;
}

describe("set-page-size — the panel resizes and its descriptor follows", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  it("recomputes limit, pages and the page's last index", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);
    const { pagination } = invoicesCollection.resolve(data, {}).useContext();
    const total = pagination.value.total;

    expect(pagination.value.limit).toBe(10);
    expect(pagination.value.pages).toBe(Math.ceil(total / 10));
    expect(pagination.value.to).toBe(10);

    dispatchMockAction(
      data,
      {},
      pageSizeValue(PAGED_COLLECTION_ID.INVOICES, 25)
    );

    expect(pagination.value.limit).toBe(25);
    expect(pagination.value.pages).toBe(Math.ceil(total / 25));
    expect(pagination.value.from).toBe(1);
    expect(pagination.value.to).toBe(25);
    expect(
      invoicesCollection.resolve(data, {}).useContext().data.value
    ).toHaveLength(25);
  });

  it("clamps to the LAST page the bigger size still has", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);
    const instance = invoicesCollection.resolve(data, {});
    const { pagination } = instance.useContext();

    const lastPage = pagination.value.pages;
    expect(lastPage).toBeGreaterThan(4);
    for (let turn = 1; turn < lastPage; turn += 1)
      instance.useActions().nextPage();
    expect(pagination.value.page).toBe(lastPage);

    dispatchMockAction(
      data,
      {},
      pageSizeValue(PAGED_COLLECTION_ID.INVOICES, 25)
    );

    // Not back to 1 — the reader keeps the deepest page the new size reaches.
    expect(pagination.value.pages).toBeLessThan(lastPage);
    expect(pagination.value.page).toBe(pagination.value.pages);
    expect(pagination.value.to).toBe(pagination.value.total);
  });

  it("keeps a page the bigger size still holds", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);
    const instance = invoicesCollection.resolve(data, {});
    const { pagination } = instance.useContext();

    instance.useActions().nextPage();
    expect(pagination.value.page).toBe(2);

    dispatchMockAction(
      data,
      {},
      pageSizeValue(PAGED_COLLECTION_ID.INVOICES, 25)
    );
    expect(pagination.value.page).toBe(2);
    expect(pagination.value.from).toBe(26);
  });

  it("an unknown panel and a size-less payload stay silent no-ops", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);
    const { pagination } = invoicesCollection.resolve(data, {}).useContext();

    expect(
      dispatchMockAction(
        data,
        {},
        `${MOCK_ACTION.SET_PAGE_SIZE}:no-such-panel:25`
      )
    ).toBeUndefined();
    expect(
      dispatchMockAction(data, {}, MOCK_ACTION.SET_PAGE_SIZE)
    ).toBeUndefined();
    expect(pagination.value.limit).toBe(10);
  });
});

describe("the pager's page-size select", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  it("offers 10 / 25 / 50 and emits the panel's own verb", async () => {
    const state = pagerState(
      DATA_REF_ID.GROUP_PRODUCTS_PAGER,
      PRODUCTS_CONTEXT
    );
    const wrapper = mount(PaginationModule, {
      props: { state, label: "Products pages" }
    });

    expect(map(state.pageSizeOptions, option => option.value)).toEqual([
      "10",
      "25",
      "50"
    ]);
    expect(state.pageSizeValue).toBe("10");
    expect(state.pageSizeAction).toBe(
      mockActionValue(
        MOCK_ACTION.SET_PAGE_SIZE,
        PAGED_COLLECTION_ID.GROUP_PRODUCTS
      )
    );

    const select = wrapper.findComponent(Select);
    expect(select.props("items")).toEqual(state.pageSizeOptions);
    expect(select.props("modelValue")).toBe("10");

    await select.vm.$emit("update:modelValue", "25");
    expect(wrapper.emitted("select")).toEqual([[`${state.pageSizeAction}:25`]]);
  });

  it("the decorative pager offers no size control at all", () => {
    const wrapper = mount(PaginationModule, {
      props: { total: 24, itemsPerPage: 3, label: "Progress weeks" }
    });

    expect(wrapper.findComponent(Select).exists()).toBe(false);
  });

  it("a resize dispatched from the pager reaches the panel it names", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);
    const { pagination } = pagedCollectionHandle(
      PAGED_COLLECTION_ID.GROUP_PRODUCTS,
      data,
      PRODUCTS_CONTEXT
    ).useContext();
    const state = pagerState(
      DATA_REF_ID.GROUP_PRODUCTS_PAGER,
      PRODUCTS_CONTEXT
    );

    dispatchMockAction(data, PRODUCTS_CONTEXT, `${state.pageSizeAction}:50`);

    expect(pagination.value.limit).toBe(50);
    expect(
      pagerState(DATA_REF_ID.GROUP_PRODUCTS_PAGER, PRODUCTS_CONTEXT)
        .pageSizeValue
    ).toBe("50");
  });
});

describe("set-view — the listing layout the client chose", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
    dispatchMockAction(
      useMockData(MOCK_DATASET_ID.HOSTGRID),
      {},
      "set-view:grid"
    );
  });

  afterEach(() => {
    dispatchMockAction(
      useMockData(MOCK_DATASET_ID.HOSTGRID),
      {},
      "set-view:grid"
    );
  });

  it("flips the preference, and the products listing's variant follows it", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);
    const { view } = useListViewPreference();
    const variant = () =>
      resolveDataRefProps(
        { value: dataRef(DATA_REF_ID.GROUP_PRODUCT_VIEW) },
        data,
        PRODUCTS_CONTEXT
      )?.value;

    expect(view.value).toBe(LIST_VIEW.GRID);
    expect(variant()).toBe(LIST_MODULE_VARIANT.CARDS);

    dispatchMockAction(
      data,
      {},
      mockActionValue(MOCK_ACTION.SET_VIEW, LIST_VIEW.TABLE)
    );

    expect(view.value).toBe(LIST_VIEW.TABLE);
    expect(variant()).toBe(LIST_MODULE_VARIANT.TABLE);

    dispatchMockAction(
      data,
      {},
      mockActionValue(MOCK_ACTION.SET_VIEW, LIST_VIEW.GRID)
    );
    expect(variant()).toBe(LIST_MODULE_VARIANT.CARDS);
  });

  it("ignores a layout it does not offer", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);
    const { view } = useListViewPreference();

    dispatchMockAction(data, {}, `${MOCK_ACTION.SET_VIEW}:carousel`);
    expect(view.value).toBe(LIST_VIEW.GRID);

    dispatchMockAction(data, {}, MOCK_ACTION.SET_VIEW);
    expect(view.value).toBe(LIST_VIEW.GRID);
  });

  it("writes the chosen layout to storage under one key", async () => {
    localStorage.clear();
    useListViewPreference().setView(LIST_VIEW.TABLE);
    await nextTick();

    expect(Object.keys(localStorage)).toEqual([VIEW_STORAGE_KEY]);
    expect(localStorage.getItem(VIEW_STORAGE_KEY)).toContain(LIST_VIEW.TABLE);
  });
});

describe("set-view — the preference across a reload", () => {
  afterEach(() => {
    localStorage.clear();
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  async function freshPreference() {
    vi.resetModules();
    const module = await import("~/composables/useListViewPreference");
    return { module, preference: module.useListViewPreference() };
  }

  it("opens on the grid legacy opened on when nothing is stored", async () => {
    localStorage.clear();
    const { module, preference } = await freshPreference();

    expect(preference.view.value).toBe(module.LIST_VIEW.GRID);
    expect(module.DEFAULT_LIST_VIEW).toBe(module.LIST_VIEW.GRID);
  });

  it("reads back what a previous session chose", async () => {
    localStorage.clear();
    localStorage.setItem(VIEW_STORAGE_KEY, LIST_VIEW.TABLE);
    const { preference } = await freshPreference();

    expect(preference.view.value).toBe(LIST_VIEW.TABLE);
  });

  it("falls back when the stored value names no layout it has", async () => {
    localStorage.clear();
    localStorage.setItem(VIEW_STORAGE_KEY, "sideways");
    const { module, preference } = await freshPreference();

    expect(preference.view.value).toBe(module.DEFAULT_LIST_VIEW);
    preference.setView(module.LIST_VIEW.TABLE);
    expect(preference.view.value).toBe(module.LIST_VIEW.TABLE);
  });

  it("still works when the browser refuses to store anything", async () => {
    localStorage.clear();
    const refusing = {
      getItem: () => {
        throw new Error("storage disabled");
      },
      setItem: () => {
        throw new Error("storage disabled");
      },
      removeItem: () => {
        throw new Error("storage disabled");
      },
      key: () => null,
      clear: () => undefined,
      length: 0
    };
    vi.stubGlobal("localStorage", refusing);

    const { module, preference } = await freshPreference();

    expect(preference.view.value).toBe(module.DEFAULT_LIST_VIEW);
    expect(() => preference.setView(module.LIST_VIEW.TABLE)).not.toThrow();
    expect(preference.view.value).toBe(module.LIST_VIEW.TABLE);
  });
});
