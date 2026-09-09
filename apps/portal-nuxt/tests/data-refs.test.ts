import { mount } from "@vue/test-utils";
import { afterEach, describe, expect, it } from "vitest";
import { computed, nextTick } from "vue";
import { ContractStatusCodes } from "@upmind-automation/types";
import { filter } from "lodash-es";
import type { ResolvedSlot } from "~/portal/resolve";
import type { PortalConfig } from "~/portal/types";
import { hostgridConfig } from "~/portal/config/hostgrid";
import {
  DATA_REF_ID,
  dataRef,
  isDataRef,
  resolveDataRefProps
} from "~/portal/mock/data-refs";
import { useMockContractProduct } from "~/portal/mock/facades";
import { HOSTGRID_MOCK_DATASET } from "~/portal/mock/hostgrid";
import { ACTIVE_MOCK_DATA } from "~/portal/mock/injection";
import {
  MOCK_DATASET_ID,
  resetMockData,
  useMockData
} from "~/portal/mock/store";
import { LIST_MODULE_ID } from "~/portal/registry";
import { resolve } from "~/portal/resolve";
import PortalSlotContent from "~/portal/shell/PortalSlotContent.vue";
import { PAGE_KEY } from "~/portal/types";

/**
 * The data-ref seam (mock/data-refs.ts, plan Phase C): a config prop names
 * live mock data; PortalSlotContent resolves it against the active shape's
 * dataset inside a computed, so a store mutation re-renders the module. The
 * module still renders only what it is given. Paired blind with
 * tests/data-refs.must-fail.patch.
 */
describe("resolveDataRefProps — the pure resolution", () => {
  it("passes literal props through untouched and resolves refs via selectors", () => {
    const resolved = resolveDataRefProps(
      {
        emptyTitle: "Nothing here",
        items: dataRef(DATA_REF_ID.ACTIVE_PRODUCT_ITEMS)
      },
      HOSTGRID_MOCK_DATASET
    );

    expect(resolved?.emptyTitle).toBe("Nothing here");
    const items = resolved?.items as ReadonlyArray<{ title: string }>;
    expect(items[0]?.title).toBe("Team Plan");
  });

  it("resolves a ref to undefined when the shape has no dataset", () => {
    const resolved = resolveDataRefProps(
      { items: dataRef(DATA_REF_ID.ACTIVE_PRODUCT_ITEMS) },
      undefined
    );

    expect(resolved?.items).toBeUndefined();
  });
});

describe("PortalSlotContent — refs resolve against the provided dataset and stay live", () => {
  afterEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  function pendingListSlot(): ResolvedSlot {
    return {
      status: "module",
      id: LIST_MODULE_ID,
      variant: "cards",
      props: {
        items: dataRef(DATA_REF_ID.ACTIVE_PRODUCT_ITEMS),
        emptyTitle: "Nothing to set up"
      }
    };
  }

  it("feeds the module the selector output, and a store mutation re-renders it", async () => {
    // The dataset arrives by PROVIDE (mock/injection.ts) — the layout and the
    // page host own it in the app. Never a Nuxt-global sniff: `typeof
    // useRoute` reads "undefined" in the real build, which starved every ref
    // and crashed the list module in the browser while jsdom stayed green.
    const wrapper = mount(PortalSlotContent, {
      props: { resolvedSlot: pendingListSlot() },
      global: {
        provide: {
          [ACTIVE_MOCK_DATA as symbol]: computed(() =>
            useMockData(MOCK_DATASET_ID.HOSTGRID)
          )
        }
      }
    });

    expect(wrapper.text()).toContain("Team Plan");
    expect(wrapper.text()).toContain("Action Needed");

    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);
    // Every product awaiting activation, not just the first: the panel says
    // "Action Needed" for each of them, so one confirmation cannot clear it.
    for (const product of filter(data.products, {
      status: ContractStatusCodes.AWAITING_ACTIVATION
    })) {
      useMockContractProduct(data, product.id).useActions().completeSetup();
    }
    await nextTick();

    expect(wrapper.text()).toContain("Team Plan");
    expect(wrapper.text()).not.toContain("Action Needed");
  });
});

describe("the dashboard feeds from the store, never literals", () => {
  function dashboardItemProps(config: PortalConfig) {
    const { content } = resolve(config, { pageKeys: [PAGE_KEY.DASHBOARD] });
    // The RESOLVER threads props opaquely, so at this level a ref is still a
    // ref — which is exactly the assertion: the config authored refs.
    const rows = [...content.rows, ...content.aside];
    return rows
      .flatMap(row => row.slots)
      .flatMap(slot => (slot.status === "module" ? [slot.props] : []))
      .flatMap(props => (props?.items === undefined ? [] : [props.items]));
  }

  it("every dashboard list/metric items prop is a data ref", () => {
    const itemProps = dashboardItemProps(hostgridConfig);
    expect(itemProps.length).toBeGreaterThan(1);
    for (const value of itemProps) {
      expect(isDataRef(value)).toBe(true);
    }
  });
});
