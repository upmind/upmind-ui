import { mount } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import { computed } from "vue";
import { ContractStatusCodes, InvoiceStatus } from "@upmind-automation/types";
import { assign, find } from "lodash-es";
import type { ListModuleItem } from "~/portal/modules/list/types";
import type { MenuItem } from "~/portal/modules/menu/types";
import type { SpecModuleItem } from "~/portal/modules/spec/types";
import { MOCK_ACTION, dispatchMockAction } from "~/portal/mock/actions";
import { setupDefaults } from "~/portal/mock/contracts/contract-product-provisioning.schemas";
import {
  DATA_REF_ID,
  dataRef,
  resolveDataRefProps
} from "~/portal/mock/data-refs";
import { HOSTGRID_MOCK_DATASET } from "~/portal/mock/hostgrid";
import { ACTIVE_MOCK_DATA } from "~/portal/mock/injection";
import {
  MOCK_DATASET_ID,
  resetMockData,
  useMockData
} from "~/portal/mock/store";
import ListModule from "~/portal/modules/list/List.vue";
import { LIST_MODULE_VARIANT } from "~/portal/modules/list/types";
import { LIST_MODULE_ID } from "~/portal/registry";
import PortalSlotContent from "~/portal/shell/PortalSlotContent.vue";

/**
 * Phase D — the products pillar (plan §5): the route position reaches the
 * selectors through `DataRouteContext`, so one structural composition serves
 * every group and product; the action-area nav is gated as legacy gated it
 * (Setup only while pending); list rows link to their destinations. Paired
 * blind with tests/product-pages.must-fail.patch.
 */

function resolveRef(
  id: (typeof DATA_REF_ID)[keyof typeof DATA_REF_ID],
  context: Record<string, string>
) {
  return resolveDataRefProps(
    { value: dataRef(id) },
    HOSTGRID_MOCK_DATASET,
    context
  )?.value;
}

describe("group listing — the context names the group and the status tab", () => {
  it("filters the running products to the route's group, rows linking to detail", () => {
    // No status in the route reads as Active, the listing's default.
    const items = resolveRef(DATA_REF_ID.GROUP_PRODUCT_ITEMS, {
      groupSlug: "products"
    }) as ListModuleItem[];

    // Newest first by `createdAt` is the order the listing opens in; the
    // hand-authored rows lead, and the generated tail behind them is what
    // gives the panel its three pages.
    expect(items.map(item => item.id).slice(0, 5)).toEqual([
      "prod-team",
      "prod-analytics",
      "prod-seats",
      "prod-archive",
      "prod-workshop"
    ]);
    expect(items[1]?.to).toBe("/products/prod-analytics");
  });

  it("the Cancelled tab narrows the same list — legacy's Cancelled route, as query state", () => {
    const cancelled = resolveRef(DATA_REF_ID.GROUP_PRODUCT_ITEMS, {
      groupSlug: "products",
      status: "cancelled"
    }) as ListModuleItem[];

    expect(cancelled.map(item => item.id).slice(0, 5)).toEqual([
      "prod-starter",
      "prod-solo",
      "prod-cdn",
      "prod-reports",
      "prod-trial"
    ]);
    expect(cancelled[0]?.status?.label).toBe("Cancelled");
  });

  it("the All tab carries both, which is what legacy's All route showed", () => {
    const all = resolveRef(DATA_REF_ID.GROUP_PRODUCT_ITEMS, {
      groupSlug: "products",
      status: "all"
    }) as ListModuleItem[];

    // One list, both statuses: the cancelled rows sit among the running ones
    // in date order rather than in a tab of their own.
    expect(all.map(item => item.id)).toContain("prod-team");
    expect(all.map(item => item.id)).toContain("prod-starter");
  });

  it("the tab rail names the status in the route's query, so the URL stays shareable", () => {
    const tabs = resolveRef(DATA_REF_ID.GROUP_PRODUCT_TABS, {
      groupSlug: "products"
    }) as { value: string; label: string; action?: string }[];

    // All leads the rail as the widest view, but Active is what the listing
    // OPENS on — so the selected tab is deliberately not the first one.
    expect(tabs.map(tab => tab.label)).toEqual(["All", "Active", "Cancelled"]);
    expect(
      resolveRef(DATA_REF_ID.GROUP_PRODUCT_STATUS, { groupSlug: "products" })
    ).toBe("active");
    expect(tabs[2]?.action).toBe("navigate:/products?status=cancelled");
    // The rail switches the list below it, so it owns no panel of its own.
    expect(tabs.every(tab => !("content" in tab))).toBe(true);

    expect(
      resolveRef(DATA_REF_ID.GROUP_PRODUCT_STATUS, { groupSlug: "products" })
    ).toBe("active");
  });

  it("a contextless resolution yields no products — never every group's", () => {
    const items = resolveRef(
      DATA_REF_ID.GROUP_PRODUCT_ITEMS,
      {}
    ) as ListModuleItem[];

    expect(items).toEqual([]);
  });
});

describe("product detail — the context names the product", () => {
  it("the spec carries the billing facts, and none the billboard states", () => {
    const items = resolveRef(DATA_REF_ID.PRODUCT_SPEC_ITEMS, {
      groupSlug: "products",
      productId: "prod-analytics"
    }) as SpecModuleItem[];

    const byId = new Map(items.map(item => [item.id, item.value]));
    expect(byId.get("next-due")).toBe("2026-09-05");
    expect(byId.get("tax")).toBe("inc. VAT");
    // The billboard directly above says what the product is and where it
    // stands, so the spec repeats none of it.
    expect(byId.has("name")).toBe(false);
    expect(byId.has("category")).toBe(false);
    expect(byId.has("status")).toBe(false);
  });

  it("the area nav is gated as legacy gated it — Setup only while pending", () => {
    const pendingNav = resolveRef(DATA_REF_ID.PRODUCT_AREA_NAV_ITEMS, {
      groupSlug: "products",
      productId: "prod-team"
    }) as MenuItem[];
    const activeNav = resolveRef(DATA_REF_ID.PRODUCT_AREA_NAV_ITEMS, {
      groupSlug: "products",
      productId: "prod-analytics"
    }) as MenuItem[];

    expect(pendingNav.map(item => item.label)).toEqual([
      "Setup",
      "Overview",
      "Billing",
      "Tickets",
      "Settings",
      "Delegates"
    ]);
    expect(activeNav.map(item => item.label)).not.toContain("Setup");
    expect(pendingNav[0]?.to).toBe("/products/prod-team/setup");
  });

  it("the tickets area lists only this product's tickets", () => {
    const analytics = resolveRef(DATA_REF_ID.PRODUCT_TICKET_ITEMS, {
      productId: "prod-analytics"
    }) as ListModuleItem[];
    const seats = resolveRef(DATA_REF_ID.PRODUCT_TICKET_ITEMS, {
      productId: "prod-seats"
    }) as ListModuleItem[];

    expect(analytics.map(item => item.id)).toContain("tkt-207");
    // No ticket names this product, so its area lists nothing.
    expect(seats).toEqual([]);
  });
});

describe("list module — an item's `to` renders as a link", () => {
  it("renders the linked title as an anchor and the bare title as text", () => {
    const wrapper = mount(ListModule, {
      props: {
        variant: LIST_MODULE_VARIANT.COMPACT,
        emptyTitle: "Empty",
        items: [
          { id: "linked", title: "Linked row", to: "/products/prod-analytics" },
          { id: "bare", title: "Bare row" }
        ]
      }
    });

    const link = wrapper.find('a[href="/products/prod-analytics"]');
    expect(link.exists()).toBe(true);
    expect(link.text()).toBe("Linked row");
    expect(wrapper.text()).toContain("Bare row");
  });
});

describe("the action seam — module emits run the store and name the next step", () => {
  afterEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
    Reflect.deleteProperty(globalThis, "navigateTo");
  });

  it("confirming the setup blueprint activates the context's product and lands on its detail", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);
    const fields =
      find(data.products, { id: "prod-team" })?.provisioning.fields ?? [];
    const answers = assign(setupDefaults(fields), {
      admin_email: "ops@fieldnotes.app"
    });
    const result = dispatchMockAction(
      data,
      { groupSlug: "products", productId: "prod-team" },
      `${MOCK_ACTION.PRODUCT_SETUP_SAVE}:prod-team:${JSON.stringify(answers)}`
    );

    expect(find(data.products, { id: "prod-team" })?.status).toBe(
      ContractStatusCodes.ACTIVE
    );
    expect(result?.to).toBe("/products/prod-team");
  });

  it("place-order creates the order, its unpaid invoice and the pending product, then lands back on the listing saying so", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);
    const ordersBefore = data.orders.length;

    const result = dispatchMockAction(data, {}, "place-order:cat-workshop");

    expect(data.orders).toHaveLength(ordersBefore + 1);
    const order = data.orders[0];
    expect(order?.productNames).toEqual(["Team Workshop Day"]);
    expect(find(data.invoices, { orderId: order?.id })?.status).toBe(
      InvoiceStatus.UNPAID
    );
    expect(data.products[0]?.status).toBe(
      ContractStatusCodes.AWAITING_ACTIVATION
    );
    expect(result?.to).toBe(
      `/${data.products[0]?.groupSlug}?orderComplete=${order?.id}`
    );
  });

  it("an unauthored value is a quiet no-op — chrome buttons emit their labels", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);
    const before = JSON.stringify(data.orders) + JSON.stringify(data.products);

    const result = dispatchMockAction(data, {}, "Support");

    expect(result).toBeUndefined();
    expect(JSON.stringify(data.orders) + JSON.stringify(data.products)).toBe(
      before
    );
  });

  it("a clicked list action reaches the store through PortalSlotContent", async () => {
    const navigateTo = vi.fn();
    Object.assign(globalThis, { navigateTo });
    const wrapper = mount(PortalSlotContent, {
      props: {
        resolvedSlot: {
          status: "module",
          id: LIST_MODULE_ID,
          variant: "cards",
          props: {
            items: dataRef(DATA_REF_ID.ACTIVE_PRODUCT_ITEMS),
            emptyTitle: "Nothing to set up"
          }
        }
      },
      global: {
        provide: {
          [ACTIVE_MOCK_DATA as symbol]: computed(() =>
            useMockData(MOCK_DATASET_ID.HOSTGRID)
          )
        }
      }
    });

    const setupButton = wrapper
      .findAll("button")
      .find(button => button.text() === "Complete setup");
    expect(setupButton).toBeDefined();
    await setupButton?.trigger("click");

    // The card leads INTO the product; its root lands on the Setup tab while
    // setup is owed, so nothing is activated from the card itself.
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);
    expect(find(data.products, { id: "prod-team" })?.status).toBe(
      ContractStatusCodes.AWAITING_ACTIVATION
    );
    expect(navigateTo).toHaveBeenCalledWith("/products/prod-team");
  });

  it("the catalogue ref scopes to the route's group", () => {
    const items = resolveDataRefProps(
      { value: dataRef(DATA_REF_ID.GROUP_CATALOGUE_ITEMS) },
      HOSTGRID_MOCK_DATASET,
      { groupSlug: "products" }
    )?.value as ReadonlyArray<{ id: string }>;
    const otherGroup = resolveDataRefProps(
      { value: dataRef(DATA_REF_ID.GROUP_CATALOGUE_ITEMS) },
      HOSTGRID_MOCK_DATASET,
      { groupSlug: "domains" }
    )?.value as ReadonlyArray<{ id: string }>;

    expect(items.map(item => item.id).slice(0, 5)).toEqual([
      "cat-pro",
      "cat-support",
      "cat-seats",
      "cat-archive",
      "cat-workshop"
    ]);
    // A group the brand does not sell for lists nothing — never every group's.
    expect(otherGroup).toEqual([]);
  });
});
