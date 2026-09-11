import { mount } from "@vue/test-utils";
import { Package } from "lucide-vue-next";
import { afterEach, describe, expect, it } from "vitest";
import { computed, defineComponent } from "vue";
import type { MockDataset } from "~/portal/mock/types";
import { dispatchMockAction } from "~/portal/mock/actions";
import {
  dataRef,
  isDataRef,
  resolveDataRefProps
} from "~/portal/mock/data-refs";
import { useMockDetail } from "~/portal/mock/detail";
import { HOSTGRID_MOCK_DATASET } from "~/portal/mock/hostgrid";
import { ACTIVE_MOCK_DATA } from "~/portal/mock/injection";
import { MOCK_DATASET_ID, resetMockData } from "~/portal/mock/store";
import Banner from "~/portal/modules/banner/Banner.vue";
import { BANNER_VARIANT } from "~/portal/modules/banner/types";
import ButtonModule from "~/portal/modules/button/Button.vue";
import { BUTTON_MODULE_VARIANT } from "~/portal/modules/button/types";
import Menu from "~/portal/modules/menu/Menu.vue";
import { MENU_VARIANT } from "~/portal/modules/menu/types";
import Notifications from "~/portal/modules/notifications/Notifications.vue";

/**
 * The guards each module and seam owes its own data (review round, 2026-08-26).
 * Every case here is one a green suite previously admitted: a titled alert with
 * no body, a link that also fired a store mutation, a dated notification that
 * rendered undated, a hand-built data ref reaching an absent selector, and a
 * detail heading echoing an id that names nothing. Paired blind with
 * tests/module-render-guards.must-fail.patch.
 */

describe("banner — an empty message is nothing to announce", () => {
  it("renders neither form when the data-fed message resolves empty", () => {
    const notice = mount(Banner, {
      props: {
        variant: BANNER_VARIANT.NOTICE,
        title: "Needs attention",
        message: ""
      }
    });
    const band = mount(Banner, {
      props: {
        variant: BANNER_VARIANT.BANNER,
        label: "Announcement",
        message: "   "
      }
    });

    expect(notice.find("*").exists()).toBe(false);
    expect(band.find("*").exists()).toBe(false);
  });

  it("still renders once the message has content", () => {
    const notice = mount(Banner, {
      props: {
        variant: BANNER_VARIANT.NOTICE,
        title: "Needs attention",
        message: "INV-0088 is awaiting payment"
      }
    });

    expect(notice.text()).toContain("INV-0088 is awaiting payment");
  });
});

describe("button — a destination navigates and nothing else", () => {
  it("a control with `to` emits no action on click", async () => {
    const wrapper = mount(ButtonModule, {
      props: {
        variant: BUTTON_MODULE_VARIANT.SINGLE,
        label: "Place new order",
        to: "/products/order",
        value: "place-order:cat-pro"
      }
    });

    // A `to` renders the control through NuxtLink, so the handler sits on the
    // root element rather than a `button` — the negative control proves the
    // click does reach it.
    await wrapper.trigger("click");

    expect(wrapper.emitted("select")).toBeUndefined();
  });

  it("the same control without `to` still dispatches", async () => {
    const wrapper = mount(ButtonModule, {
      props: {
        variant: BUTTON_MODULE_VARIANT.SINGLE,
        label: "Add card",
        value: "add-payment-method"
      }
    });

    await wrapper.find("button").trigger("click");

    expect(wrapper.emitted("select")).toEqual([["add-payment-method"]]);
  });
});

describe("notifications — every item keeps its date", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders the selector's own time label and its machine datetime", async () => {
    const wrapper = mount(Notifications, {
      props: {
        items: [
          {
            id: "n1",
            title: "Invoice INV-0088 is due",
            time: "2026-08-19",
            datetime: "2026-08-19T08:00:00Z"
          }
        ],
        count: 1,
        label: "Alerts",
        markReadLabel: "Mark all read",
        markReadAction: "mark-notifications-read",
        emptyTitle: "No notifications",
        viewAllTo: "/account/notifications",
        viewAllLabel: "View all"
      }
    });

    await wrapper.find("button").trigger("click");

    const time = document.querySelector("time");
    expect(time?.textContent?.trim()).toBe("2026-08-19");
    expect(time?.getAttribute("datetime")).toBe("2026-08-19T08:00:00Z");
  });
});

describe("menu — every rail names its own navigation landmark", () => {
  const ITEMS = [
    { to: "/billing/orders", label: "My orders", icon: Package },
    { to: "/billing/invoices", label: "My invoices", icon: Package }
  ];

  afterEach(() => {
    Reflect.deleteProperty(globalThis, "useRoute");
  });

  it("the vertical rail is a nav landmark carrying its own name, not the surrounding region's", () => {
    Object.assign(globalThis, {
      useRoute: () => ({ path: "/billing/orders" })
    });

    const wrapper = mount(Menu, {
      props: { items: ITEMS, navLabel: "Section navigation" }
    });

    const nav = wrapper.find("nav");
    expect(nav.exists()).toBe(true);
    expect(nav.attributes("aria-label")).toBe("Section navigation");
    expect(nav.text()).toContain("My invoices");
  });

  it("the horizontal variant keeps naming its own landmark too", () => {
    Object.assign(globalThis, { useRoute: () => ({ path: "/" }) });

    const wrapper = mount(Menu, {
      props: {
        items: ITEMS,
        variant: MENU_VARIANT.HORIZONTAL,
        navLabel: "Client portal navigation"
      }
    });

    expect(
      wrapper.find("[aria-label='Client portal navigation']").exists()
    ).toBe(true);
  });
});

describe("the action seam — navigation needs no dataset", () => {
  it("a seedless shape still follows a config-authored destination", () => {
    expect(
      dispatchMockAction(undefined, {}, "navigate:/billing/orders")
    ).toEqual({ to: "/billing/orders" });
  });

  it("every other verb is inert without a dataset, rather than throwing", () => {
    expect(
      dispatchMockAction(undefined, {}, "pay-invoice:inv-88")
    ).toBeUndefined();
    expect(
      dispatchMockAction(undefined, {}, "mark-notifications-read")
    ).toBeUndefined();
  });
});

describe("data refs — a ref names a selector that exists", () => {
  it("a ref built by hand with no known id is rejected, not dispatched", () => {
    expect(isDataRef({ kind: "portal-data-ref" })).toBe(false);
    expect(isDataRef({ kind: "portal-data-ref", id: "not-a-selector" })).toBe(
      false
    );
    expect(isDataRef(dataRef("unread-notification-count"))).toBe(true);
  });

  it("a prop carrying the malformed ref passes through untouched instead of crashing the render", () => {
    const props = { value: { kind: "portal-data-ref", id: "not-a-selector" } };

    expect(() =>
      resolveDataRefProps(props, HOSTGRID_MOCK_DATASET, {})
    ).not.toThrow();
  });
});

describe("detail pages — the heading names the record, never the raw id", () => {
  function mountDetail(id: string, dataset: MockDataset) {
    Object.assign(globalThis, { useRoute: () => ({ params: { id } }) });

    const harness = defineComponent({
      setup() {
        const { heading, routeContext } = useMockDetail(
          data => data.invoices,
          invoice => `Invoice ${invoice.number}`,
          "Invoice"
        );
        return { heading, routeContext };
      },
      template: `<span>{{ heading }}</span>`
    });

    return mount(harness, {
      global: {
        provide: { [ACTIVE_MOCK_DATA]: computed(() => dataset) }
      }
    });
  }

  afterEach(() => {
    Reflect.deleteProperty(globalThis, "useRoute");
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  it("uses the document's own number, matching the spec row beneath it", () => {
    const wrapper = mountDetail("inv-88", HOSTGRID_MOCK_DATASET);

    expect(wrapper.text()).toBe("Invoice INV-0088");
    expect(wrapper.text()).not.toContain("inv-88");
  });

  it("falls back to the page's plain name for an id the dataset does not hold", () => {
    const wrapper = mountDetail("does-not-exist", HOSTGRID_MOCK_DATASET);

    expect(wrapper.text()).toBe("Invoice");
    expect(wrapper.text()).not.toContain("does-not-exist");
  });
});
