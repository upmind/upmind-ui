// -----------------------------------------------------------------------------
/**
 * @module catalogue/__tests__/mount-catalogue
 * @description Mounts the catalogue page in its short form on the recorded guest boot: `UpmCatalogue` with the page's layout, self-closing, in its default slot, under the Suspense boundary the app's route view gives a page; the layout keeps the slot's scope and skips an empty slot as develop's layouts do.
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
import { UpmCatalogue } from "../index";
import { every, filter, has, isEmpty, map, reject } from "lodash-es";
import type { RawSlots, Slots, VNode } from "vue";
import type { LocationQueryRaw } from "vue-router";

// -----------------------------------------------------------------------------

const LAYOUT_SLOTS = [
  "content-header",
  "content",
  "aside-footer",
  "content-footer"
];

export const BOOT_BUDGET = 60000;

const isBlank = (vnode: VNode) =>
  vnode.type === Comment ||
  (vnode.type === Fragment && isEmpty(vnode.children));

/** Empty as develop's layouts judge a slot (its `isEmptySlot`): absent, no vnodes, or only comments and empty fragments. */
function isEmptySlot(name: string, slots: Slots): boolean {
  const vnodes = slots[name]?.();
  return isEmpty(vnodes) || every(vnodes, isBlank);
}

/** The page's layout: it keeps the scope the organism's default slot hands it, lists every slot it receives, and draws a frame for each one that is not empty. */
const Layout = defineComponent({
  props: ["scope"],
  setup(_props, { slots }) {
    return () => {
      const handed = filter(LAYOUT_SLOTS, name => has(slots, name));
      const drawn = reject(handed, name => isEmptySlot(name, slots));

      return h(
        "div",
        { "data-layout": "", "data-slots": handed.join(" ") },
        map(drawn, name =>
          h("section", { "data-frame": name }, slots[name]?.())
        )
      );
    };
  }
});

const blank = { setup: () => () => h("div") };

export const CATALOGUE_ROUTE = "catalogue";

export async function seedGuestSession(): Promise<void> {
  await useSessionStore().initStore();

  await vi.waitFor(
    () => {
      expect(useSessionStore().useMeta().hasGuestSession.value).toBe(true);
    },
    { timeout: 15000, interval: 100 }
  );
}

export async function seedBasket(): Promise<void> {
  const basket = useBasket();

  await vi.waitFor(
    () => {
      expect(basket.meta.value.isLoading).toBe(false);
    },
    { timeout: 20000, interval: 100 }
  );
}

export type CatalogueVisit = {
  query?: LocationQueryRaw;
  /** A teleported block needs its target in the document. */
  attachTo?: Element;
};

/** Mounts the catalogue as its page does; `overrides` are the page's own slots on its layout. */
export async function mountCatalogue(
  until: (wrapper: ReturnType<typeof mount>) => boolean,
  overrides?: RawSlots,
  visit: CatalogueVisit = {}
) {
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
      { path: "/order/shop", name: CATALOGUE_ROUTE, component: blank },
      { path: "/order/product/:pid", name: "product", component: blank }
    ]
  });

  await router.push({ name: CATALOGUE_ROUTE, query: visit.query });
  await router.isReady();

  const Host = defineComponent({
    setup() {
      useRoutingEngine().init(router);
      return () =>
        h(Suspense, null, {
          default: () =>
            h(
              UpmCatalogue,
              {
                categoryRoute: { name: CATALOGUE_ROUTE },
                configureRoute: { name: "product" }
              },
              {
                default: (scope: Record<string, unknown>) =>
                  h(Layout, { scope }, overrides)
              }
            ),
          fallback: () => h("div", { "data-test-key": "page-pending" })
        });
    }
  });

  const wrapper = mount(Host, {
    attachTo: visit.attachTo,
    global: { plugins: [i18n, router] }
  });

  await vi
    .waitFor(
      () => {
        expect(until(wrapper)).toBe(true);
      },
      { timeout: 20000, interval: 50 }
    )
    .catch(() => undefined);

  return wrapper;
}

export type CatalogueWrapper = Awaited<ReturnType<typeof mountCatalogue>>;

export function readableText(wrapper: CatalogueWrapper) {
  return wrapper.text().replace(/\s+/g, " ").trim();
}

/** Every slot the layout received, empty or not. */
export function slotsOf(wrapper: CatalogueWrapper): string[] {
  const handed = wrapper.find("[data-layout]").attributes("data-slots") ?? "";
  return handed.split(" ");
}

export function framesOf(wrapper: CatalogueWrapper) {
  return map(wrapper.findAll("[data-frame]"), frame =>
    frame.attributes("data-frame")
  );
}

/** The scope the organism's default slot handed the page, as it was handed. */
export function slotScopeOf(
  wrapper: CatalogueWrapper
): Record<string, unknown> {
  return wrapper.findComponent(Layout).props("scope");
}
