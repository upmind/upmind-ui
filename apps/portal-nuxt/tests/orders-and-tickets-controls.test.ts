// -----------------------------------------------------------------------------
/**
 * @module tests/orders-and-tickets-controls
 * @description The four listing affordances legacy had and the rebuild had
 * not (gap doc §3 Orders, §5 Support, §2 Listing): the orders panel is
 * searchable and sortable like every other ledger; the tickets panel leads
 * with the one thing a client comes to it to do; an empty products or orders
 * panel offers the CTA that fills it, but only where the brand sells; and a
 * client who owns exactly one product is taken straight to it.
 */

import { flushPromises, mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Suspense, computed, defineComponent, h } from "vue";
import { gatesOffDataset } from "./support/counter-dataset";
import { assign, find } from "lodash-es";
import type { DataRouteContext } from "~/portal/mock/injection";
import type { MockDataset } from "~/portal/mock/types";
import type { PageKey } from "~/portal/types";
import { hostgridConfig } from "~/portal/config/hostgrid";
import PortalContent from "~/portal/content/PortalContent.vue";
import { dispatchMockAction } from "~/portal/mock/actions";
import {
  DATA_REF_ID,
  dataRef,
  resolveDataRefProps
} from "~/portal/mock/data-refs";
import { HOSTGRID_MOCK_DATASET } from "~/portal/mock/hostgrid";
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

const { pageState } = vi.hoisted(() => ({
  pageState: { datasetId: "hostgrid-minimal" }
}));

vi.mock("~/composables/usePortalConfig", async () => {
  const { computed } = await import("vue");
  const { hostgridConfig } = await import("~/portal/config/hostgrid");
  return {
    usePortalConfig: () => ({
      activeConfig: computed(() => hostgridConfig),
      activeConfigId: computed(() => "hostgrid"),
      activeDatasetId: computed(() => pageState.datasetId)
    })
  };
});

type ResolvedModule = {
  readonly status: string;
  readonly id: string;
  readonly props?: Record<string, unknown>;
};

/** Every module the page resolves to, wherever it sits — header, controls, slots, footer. */
function collectModules(node: unknown, found: ResolvedModule[] = []) {
  if (Array.isArray(node)) {
    for (const entry of node) collectModules(entry, found);
    return found;
  }
  if (!node || typeof node !== "object") return found;
  const record = node as Record<string, unknown>;
  if (record.status === "module") found.push(record as ResolvedModule);
  for (const value of Object.values(record)) collectModules(value, found);
  return found;
}

function pageModules(pageKey: PageKey): ResolvedModule[] {
  return collectModules(
    resolve(hostgridConfig, { pageKeys: [pageKey] }).content.rows
  );
}

function mountPage(
  pageKey: PageKey,
  data: MockDataset,
  context: DataRouteContext = {}
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

/** The shipped seeds with nothing bought yet — the state the CTA exists for. */
function withNothingBought(base: MockDataset): MockDataset {
  return assign(structuredClone(base), { products: [], orders: [] });
}

describe("tickets — the panel leads with opening a new one", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  it("declares a header action that navigates to the new-ticket page", () => {
    const cta = find(
      pageModules(PAGE_KEY.SUPPORT_TICKETS),
      module => module.props?.label === "Open new ticket"
    );

    expect(cta).toBeDefined();
    expect(cta!.id).toBe("button");

    const value = cta!.props?.value as string;
    expect(value.startsWith("navigate:")).toBe(true);

    // The verb is live, and the page it names is a real one in this config.
    const result = dispatchMockAction(
      useMockData(MOCK_DATASET_ID.HOSTGRID),
      {},
      value
    );
    expect(result?.to).toBe("/support/tickets/new");
    expect(
      resolve(hostgridConfig, { pageKeys: [PAGE_KEY.SUPPORT_TICKET_NEW] })
        .content.rows.length
    ).toBeGreaterThan(0);
  });

  it("puts it in the panel header, beside the title", () => {
    const wrapper = mountPage(
      PAGE_KEY.SUPPORT_TICKETS,
      useMockData(MOCK_DATASET_ID.HOSTGRID)
    );
    const header = wrapper.find('[data-slot="card-action"]');

    expect(header.exists()).toBe(true);
    expect(header.text()).toContain("Open new ticket");
  });
});

describe("empty listings — the CTA that fills them, behind the store gate", () => {
  it("offers 'Place new order' where the brand sells, and nothing where it does not", () => {
    const selling = resolveDataRefProps(
      { value: dataRef(DATA_REF_ID.PLACE_ORDER_ACTION) },
      HOSTGRID_MOCK_DATASET,
      {}
    )?.value as { value: string; label: string } | undefined;

    expect(HOSTGRID_MOCK_DATASET.features.showStore).toBe(true);
    expect(selling?.label).toBe("Place new order");
    expect(
      dispatchMockAction(
        useMockData(MOCK_DATASET_ID.HOSTGRID),
        {},
        selling!.value
      )?.to
    ).toBeTruthy();

    const notSelling = gatesOffDataset();
    expect(notSelling.features.showStore).toBe(false);
    expect(
      resolveDataRefProps(
        { value: dataRef(DATA_REF_ID.PLACE_ORDER_ACTION) },
        notSelling,
        {}
      )?.value
    ).toBeUndefined();
  });

  it("leaves both panels without it when the brand hides its store", () => {
    const notSelling = withNothingBought(gatesOffDataset());

    expect(
      mountPage(PAGE_KEY.GROUP_LISTING, notSelling, {
        groupSlug: "products",
        status: "all"
      }).text()
    ).not.toContain("Place new order");
    expect(mountPage(PAGE_KEY.BILLING_ORDERS, notSelling).text()).not.toContain(
      "Place new order"
    );
  });
});

describe("a client who owns exactly one product lands on it", () => {
  afterEach(() => {
    Reflect.deleteProperty(globalThis, "navigateTo");
    Reflect.deleteProperty(globalThis, "useRoute");
    Reflect.deleteProperty(globalThis, "definePageMeta");
    Reflect.deleteProperty(globalThis, "defineNuxtRouteMiddleware");
    pageState.datasetId = MOCK_DATASET_ID.HOSTGRID_MINIMAL;
  });

  async function openProducts(datasetId: string) {
    pageState.datasetId = datasetId;
    const navigateTo = vi.fn();
    const route = {
      params: { slug: ["products"] },
      path: "/products",
      query: {}
    };
    const useRoute = () => route;
    Object.assign(globalThis, {
      navigateTo,
      useRoute,
      // Nuxt's compile-time macros; the page and the middleware call them.
      definePageMeta: () => undefined,
      defineNuxtRouteMiddleware: (handler: unknown) => handler
    });

    // The redirect is route middleware (`middleware/catch-all-redirect.ts`),
    // run before the page renders — so it runs here before the mount.
    const redirect = (await import("~/middleware/catch-all-redirect")).default;
    await redirect(route, route);

    const page = await import("~/pages/[...slug].vue");
    const host = defineComponent({
      render: () => h(Suspense, null, { default: () => h(page.default) })
    });
    const wrapper = mount(host);
    await flushPromises();
    return { wrapper, navigateTo };
  }

  it("redirects /products to that product's own page", async () => {
    const sole = useMockData(MOCK_DATASET_ID.HOSTGRID_MINIMAL).products;
    expect(sole).toHaveLength(1);

    const { navigateTo } = await openProducts(MOCK_DATASET_ID.HOSTGRID_MINIMAL);

    expect(navigateTo).toHaveBeenCalled();
    // The area it opens on, not the root — the root only redirects again.
    expect(navigateTo.mock.calls[0]?.[0]).toBe(
      `/${sole[0]!.groupSlug}/${sole[0]!.id}/overview`
    );
  });

  it("leaves a client with a shelf full of them on the listing", async () => {
    expect(
      useMockData(MOCK_DATASET_ID.HOSTGRID).products.length
    ).toBeGreaterThan(1);

    const { wrapper, navigateTo } = await openProducts(
      MOCK_DATASET_ID.HOSTGRID
    );

    expect(navigateTo).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain("Products");
  });
});
