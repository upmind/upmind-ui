// -----------------------------------------------------------------------------
/**
 * @fileoverview The header's basket button and its brand gate.
 *
 * ## Job To Be Done
 * The header's basket button obeys the brand's basket-action setting.
 *
 * ## What Breaks If These Fail
 * A brand gets a basket shortcut it turned off, or every brand loses it, silently.
 */

import { RouterLinkStub, mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent } from "vue";
import { createI18n } from "vue-i18n";

const brand = vi.hoisted(() => ({ basketActionIsHidden: false }));
const basket = vi.hoisted(() => ({ count: 0 }));
const session = vi.hoisted(() => ({ isAuthenticated: false }));

vi.mock("@upmind-automation/headless", async importOriginal => {
  const real = await importOriginal<Record<string, unknown>>();
  const { computed, ref: reactiveRef } = await import("vue");

  return {
    ...real,
    useConfig: () => ({
      ui: { basketAction: { isHidden: brand.basketActionIsHidden } },
      data: {},
      meta: computed(() => ({}))
    }),
    useRoutingEngine: () => ({ meta: computed(() => ({ isResolved: true })) }),
    useActiveSession: () => ({
      useMeta: () => ({
        isAuthenticated: computed(() => session.isAuthenticated)
      })
    }),
    useBasket: () => ({
      count: reactiveRef(basket.count),
      meta: computed(() => ({
        isAvailable: true,
        isLoading: false,
        isProcessing: false
      }))
    })
  };
});

const { default: BasketAction } = await import("../BasketAction.vue");
const { default: BasketFullTemplate } =
  await import("../../templates/BasketFull.template.vue");
const { useHeader } = await import("../../../../components/header/useHeader");

// -----------------------------------------------------------------------------

const BASKET_ROUTE = { name: "basket" };

const i18n = createI18n({
  legacy: false,
  locale: "en",
  messages: { en: { cart: { basket_count: "{count} item | {count} items" } } }
});

function mountAction(props: Record<string, unknown>) {
  return mount(BasketAction, {
    props,
    global: {
      plugins: [i18n],
      stubs: { RouterLink: RouterLinkStub, transition: false }
    }
  });
}

function headerMeta() {
  let meta: { showBasket: boolean } | undefined;

  mount(
    defineComponent({
      setup() {
        const header = useHeader();
        meta = header.meta.value;
        return () => null;
      }
    })
  );

  return meta as { showBasket: boolean };
}

function mountPage() {
  return mount(BasketFullTemplate, {
    shallow: true,
    global: { renderStubDefaultSlot: true }
  });
}

beforeEach(() => {
  brand.basketActionIsHidden = false;
  basket.count = 0;
  session.isAuthenticated = false;
  useHeader({ noBasket: false });
});

// -----------------------------------------------------------------------------

describe("the brand setting the header cannot read for itself", () => {
  it("hides the basket in the header when the brand switches it off", () => {
    brand.basketActionIsHidden = true;
    mountPage();

    expect(headerMeta().showBasket).toBe(false);
  });

  it("shows it when the brand leaves it on", () => {
    brand.basketActionIsHidden = false;
    mountPage();

    expect(headerMeta().showBasket).toBe(true);
  });

  it("follows the page, rather than latching on the first one", () => {
    brand.basketActionIsHidden = true;
    mountPage();
    expect(headerMeta().showBasket).toBe(false);

    brand.basketActionIsHidden = false;
    mountPage();
    expect(headerMeta().showBasket).toBe(true);
  });
});

describe("the button the header renders", () => {
  it("renders nothing while the header says not to show the basket", () => {
    useHeader({ noBasket: true });

    expect(mountAction({ basketRoute: BASKET_ROUTE }).find("a").exists()).toBe(
      false
    );
  });

  it("renders the shortcut when the header says to show it", () => {
    useHeader({ noBasket: false });

    const wrapper = mountAction({ basketRoute: BASKET_ROUTE });

    expect(wrapper.findComponent(RouterLinkStub).exists()).toBe(true);
    expect(wrapper.findComponent(RouterLinkStub).props("to")).toEqual(
      BASKET_ROUTE
    );
  });

  it("renders nothing without a basket route, however the header is set", () => {
    useHeader({ noBasket: false });

    expect(mountAction({}).findComponent(RouterLinkStub).exists()).toBe(false);
  });

  it("carries the basket count once there is something in it", () => {
    useHeader({ noBasket: false });
    basket.count = 3;

    const wrapper = mountAction({ basketRoute: BASKET_ROUTE });

    expect(wrapper.find('[data-test-key="basket-action-count"]').text()).toBe(
      "3"
    );
  });

  it("shows no count on an empty basket", () => {
    useHeader({ noBasket: false });
    basket.count = 0;

    expect(
      mountAction({ basketRoute: BASKET_ROUTE })
        .find('[data-test-key="basket-action-count"]')
        .exists()
    ).toBe(false);
  });
});

describe("the whole chain, brand setting to rendered header", () => {
  it("removes the shortcut for a brand that hid it", () => {
    brand.basketActionIsHidden = true;
    mountPage();

    expect(
      mountAction({ basketRoute: BASKET_ROUTE })
        .findComponent(RouterLinkStub)
        .exists()
    ).toBe(false);
  });

  it("keeps it for a brand that did not", () => {
    brand.basketActionIsHidden = false;
    mountPage();

    expect(
      mountAction({ basketRoute: BASKET_ROUTE })
        .findComponent(RouterLinkStub)
        .exists()
    ).toBe(true);
  });
});
