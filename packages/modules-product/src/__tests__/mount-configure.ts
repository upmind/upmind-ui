// -----------------------------------------------------------------------------
/**
 * @module product/__tests__/mount-configure
 * @description The shared harness the recorded integration specs mount the product page through, in the page's short form: `UpmProductConfigure` with the brand template's layout, self-closing, in its slot; the layout skips an empty slot as develop's layouts do.
 */

import { mount } from "@vue/test-utils";
import { expect, vi } from "vitest";
import { Comment, defineComponent, Fragment, h, Suspense } from "vue";
import { createI18n } from "vue-i18n";
import { createMemoryHistory, createRouter } from "vue-router";
import {
  useBasket,
  useRoutingEngine,
  useSessionStore
} from "@upmind-automation/headless";
import { PRODUCT_TEMPLATE, UpmProductConfigure } from "../index";
import { assign, every, filter, has, isEmpty, map, reject } from "lodash-es";
import type { ConfigureProps, ProductTemplates } from "../index";
import type { RawSlots, Slots, VNode } from "vue";

// -----------------------------------------------------------------------------

const LAYOUT_SLOTS = [
  "product-details",
  "image",
  "configuration",
  "pricing",
  "actions",
  "errors",
  "total",
  "markdown",
  "terms"
];

const isBlank = (vnode: VNode) =>
  vnode.type === Comment ||
  (vnode.type === Fragment && isEmpty(vnode.children));

/** Empty as develop's layouts judge a slot (its `isEmptySlot`): absent, no vnodes, or only comments and empty fragments. */
function isEmptySlot(name: string, slots: Slots): boolean {
  const vnodes = slots[name]?.();
  return isEmpty(vnodes) || every(vnodes, isBlank);
}

/** One template's layout: it lists every slot it receives, and draws a frame for each one that is not empty. */
const layoutFor = (template: PRODUCT_TEMPLATE) =>
  defineComponent({
    setup(_props, { slots }) {
      return () => {
        const handed = filter(LAYOUT_SLOTS, name => has(slots, name));
        const drawn = reject(handed, name => isEmptySlot(name, slots));

        return h(
          "div",
          { "data-layout": template, "data-slots": handed.join(" ") },
          map(drawn, name =>
            h("section", { "data-frame": name }, slots[name]?.())
          )
        );
      };
    }
  });

const PRODUCT_LAYOUTS: ProductTemplates = {
  [PRODUCT_TEMPLATE.FULL]: layoutFor(PRODUCT_TEMPLATE.FULL),
  [PRODUCT_TEMPLATE.TWO_COLUMN_LTR]: layoutFor(PRODUCT_TEMPLATE.TWO_COLUMN_LTR),
  [PRODUCT_TEMPLATE.TWO_COLUMN_RTL]: layoutFor(PRODUCT_TEMPLATE.TWO_COLUMN_RTL),
  [PRODUCT_TEMPLATE.ENCLOSED]: layoutFor(PRODUCT_TEMPLATE.ENCLOSED),
  [PRODUCT_TEMPLATE.INSET]: layoutFor(PRODUCT_TEMPLATE.INSET)
};

export const BOOTED = 30000;

export const settle = (ms = 0) =>
  new Promise(resolve => setTimeout(resolve, ms));

export const PRODUCT_ROUTE = "product-configure";
export const CATALOGUE_ROUTE = "catalogue";

export function clearSessionCookies(): void {
  for (const pair of document.cookie.split(";")) {
    const name = pair.split("=")[0]?.trim();
    if (name && /^upm_.*_session$/.test(name)) {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    }
  }
}

const blank = { setup: () => () => h("div") };

export type MountOptions = {
  props?: Pick<ConfigureProps, "hideSlots" | "hideTerms">;
  /** The page's own slots on the layout; with none the layout is self-closing. */
  overrides?: RawSlots;
};

export function mountConfigure({ props = {}, overrides }: MountOptions = {}) {
  const i18n = createI18n({
    legacy: false,
    locale: "en",
    missingWarn: false,
    fallbackWarn: false,
    messages: { en: {} }
  });

  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: "/", component: blank },
      { path: "/order/product/:pid", name: PRODUCT_ROUTE, component: blank },
      { path: "/order/catalogue", name: CATALOGUE_ROUTE, component: blank }
    ]
  });

  const captured: unknown[] = [];

  const Host = defineComponent({
    errorCaptured(error) {
      captured.push(error);
      return false;
    },
    setup() {
      useRoutingEngine().init(router);
      return () =>
        h(Suspense, null, {
          default: () =>
            h(
              UpmProductConfigure,
              assign(
                {
                  storefrontRoute: { to: { name: CATALOGUE_ROUTE } },
                  catalogueRoute: { name: CATALOGUE_ROUTE }
                },
                props
              ),
              {
                default: ({ template }: { template: PRODUCT_TEMPLATE }) =>
                  h(PRODUCT_LAYOUTS[template], null, overrides)
              }
            ),
          fallback: () => h("div", { "data-test-key": "configure-pending" })
        });
    }
  });

  const wrapper = mount(Host, { global: { plugins: [i18n, router] } });

  return { wrapper, router, captured };
}

export function capturedMessages(harness: { captured: unknown[] }): string[] {
  return harness.captured.map(error =>
    error instanceof Error ? error.message : String(error)
  );
}

export type ConfigureHarness = ReturnType<typeof mountConfigure>;
export type ConfigureWrapper = ConfigureHarness["wrapper"];

export async function seedGuestSession(): Promise<void> {
  await useSessionStore().initStore();

  await vi.waitFor(
    () => {
      expect(useSessionStore().useMeta().hasGuestSession.value).toBe(true);
    },
    { timeout: 15000, interval: 100 }
  );
}

/** Boot the basket first: the surface resolves its product against it, and a race reports not-available. */
export async function seedBasket(): Promise<void> {
  const basket = useBasket();

  await vi.waitFor(
    () => {
      expect(basket.meta.value.isAvailable).toBe(true);
      expect(basket.meta.value.isLoading).toBe(false);
    },
    { timeout: 20000, interval: 100 }
  );
}

export async function bootAt(
  productId: string,
  until: (wrapper: ConfigureWrapper) => boolean,
  options?: MountOptions
) {
  const harness = mountConfigure(options);
  await harness.router.push({
    name: PRODUCT_ROUTE,
    params: { pid: productId }
  });

  await vi
    .waitFor(
      () => {
        expect(until(harness.wrapper)).toBe(true);
      },
      { timeout: BOOTED, interval: 50 }
    )
    .catch(() => undefined);

  await settle(150);
  return harness;
}

// -----------------------------------------------------------------------------

export function readableText(wrapper: ConfigureWrapper) {
  return wrapper.text().replace(/\s+/g, " ").trim();
}

export function fieldLabels(wrapper: ConfigureWrapper) {
  return wrapper.findAll("label").map(label => label.text().trim());
}

export function hasText(wrapper: ConfigureWrapper, needle: string) {
  return readableText(wrapper).includes(needle);
}

export function framesOf(wrapper: ConfigureWrapper) {
  return map(wrapper.findAll("[data-frame]"), frame =>
    frame.attributes("data-frame")
  );
}

/** Every slot the layout received, empty or not. */
export function slotsOf(wrapper: ConfigureWrapper) {
  const handed = wrapper.find("[data-layout]").attributes("data-slots") ?? "";
  return handed.split(" ");
}

export function layoutOf(wrapper: ConfigureWrapper) {
  return wrapper.find("[data-layout]").attributes("data-layout");
}
