// -----------------------------------------------------------------------------
/**
 * @module basket/__tests__/mount-page
 * @description Mounts a basket-family page in its short form on the recorded guest boot: the organism with a self-closing layout in its default slot, marked with the template the organism hands; the layout sets its slot options and skips an empty slot as develop's layouts do.
 */

import { mount } from "@vue/test-utils";
import { expect, vi } from "vitest";
import { Comment, defineComponent, Fragment, h, Suspense } from "vue";
import { createI18n } from "vue-i18n";
import { createMemoryHistory, createRouter } from "vue-router";
import {
  mapSessionUser,
  useActiveSession,
  useBasket,
  useRoutingEngine,
  useSessionStore
} from "@upmind-automation/headless";
import { every, filter, has, isEmpty, join, map, reject } from "lodash-es";
import type { Component, RawSlots, Slots, VNode } from "vue";

// -----------------------------------------------------------------------------

export const BOOT_BUDGET = 60000;

// happy-dom ships no `Element.animate`; the basket lists' auto-animate throws without it.
(Element.prototype as unknown as { animate: () => unknown }).animate ??=
  () => ({
    cancel: () => undefined,
    finished: Promise.resolve(),
    addEventListener: () => undefined
  });

export const ROUTES = {
  CATALOGUE: "catalogue",
  BASKET: "basket",
  EDIT: "basket-product-edit",
  BILLING: "billing",
  CHECKOUT: "checkout",
  SETUP: "product-setup"
} as const;

const isBlank = (vnode: VNode) =>
  vnode.type === Comment ||
  (vnode.type === Fragment && isEmpty(vnode.children));

/** The options a layout sets on its slots, by slot name. */
export type SlotOptions = Record<string, Record<string, unknown>>;

/** Empty as develop's layouts judge a slot (its `isEmptySlot`): absent, no vnodes, or only comments and empty fragments. */
function isEmptySlot(
  name: string,
  slots: Slots,
  options: Record<string, unknown>
): boolean {
  const vnodes = slots[name]?.(options);
  return isEmpty(vnodes) || every(vnodes, isBlank);
}

/** A page's layout: it lists every slot it receives, sets `options` on each, and draws a frame for each one that is not empty. */
export function layoutFor(
  names: string[],
  options: SlotOptions = {}
): Component {
  return defineComponent({
    setup(_props, { slots }) {
      return () => {
        const handed = filter(names, name => has(slots, name));
        const drawn = reject(handed, name =>
          isEmptySlot(name, slots, options[name] ?? {})
        );

        return h(
          "div",
          { "data-layout": "", "data-slots": join(handed, " ") },
          map(drawn, name =>
            h(
              "section",
              { "data-frame": name },
              slots[name]?.(options[name] ?? {})
            )
          )
        );
      };
    }
  });
}

const blank = { setup: () => () => h("div") };

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
      expect(basket.meta.value.isAvailable).toBe(true);
      expect(basket.meta.value.isLoading).toBe(false);
    },
    { timeout: 20000, interval: 100 }
  );
}

/** Signs the recorded client in and loads the basket it claimed, as the basket route's `bid` does. */
export async function seedClientBasket(
  client: { token: unknown; self: unknown },
  basketId: string
): Promise<void> {
  await useSessionStore().initStore();
  await useSessionStore()
    .useActions()
    .add(client.token as never, true, mapSessionUser(client.self as never));

  await vi.waitFor(
    () => {
      expect(useActiveSession().useMeta().isAuthenticated.value).toBe(true);
    },
    { timeout: 15000, interval: 100 }
  );

  expect(await useBasket().setTargetBasket(basketId)).toBe(true);
  await seedBasket();
}

export type PageOptions = {
  organism: Component;
  props?: Record<string, unknown>;
  layout: Component;
  path: string;
  until: (wrapper: ReturnType<typeof mount>) => boolean;
  /** The page's own slots on its layout; with none the layout is self-closing. */
  overrides?: RawSlots;
};

const mounted: Array<{ wrapper: ReturnType<typeof mount>; host: Element }> = [];

/** Unmounts every page this file mounted, so no page renders past its test. */
export function unmountPages(): void {
  for (const { wrapper, host } of mounted.splice(0)) {
    wrapper.unmount();
    host.remove();
  }
}

/** Mounts `organism` as its page does, on `path`, and waits until `until` holds. */
export async function mountPage(options: PageOptions) {
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
      { path: "/order/shop", name: ROUTES.CATALOGUE, component: blank },
      { path: "/order/basket/:bid?", name: ROUTES.BASKET, component: blank },
      {
        path: "/order/basket/:bid?/edit/:bpid",
        name: ROUTES.EDIT,
        component: blank
      },
      { path: "/order/billing", name: ROUTES.BILLING, component: blank },
      { path: "/order/checkout", name: ROUTES.CHECKOUT, component: blank },
      { path: "/order/basket/setup", name: ROUTES.SETUP, component: blank }
    ]
  });

  await router.push(options.path);
  await router.isReady();

  const Host = defineComponent({
    setup() {
      useRoutingEngine().init(router);
      return () =>
        h(Suspense, null, {
          default: () =>
            h(options.organism, options.props ?? {}, {
              default: ({ template }: { template?: string }) =>
                h(
                  options.layout,
                  { "data-template": String(template) },
                  options.overrides
                )
            }),
          fallback: () => h("div", { "data-test-key": "page-pending" })
        });
    }
  });

  // Attached, so a block that teleports into another block's anchor finds it.
  const host = document.body.appendChild(document.createElement("div"));
  const wrapper = mount(Host, {
    attachTo: host,
    global: { plugins: [i18n, router] }
  });
  mounted.push({ wrapper, host });

  await vi
    .waitFor(
      () => {
        expect(options.until(wrapper)).toBe(true);
      },
      { timeout: 20000, interval: 50 }
    )
    .catch(() => undefined);

  return wrapper;
}

export type PageWrapper = Awaited<ReturnType<typeof mountPage>>;

export function readableText(wrapper: PageWrapper) {
  return wrapper.text().replace(/\s+/g, " ").trim();
}

/** Every slot the layout received, empty or not. */
export function slotsOf(wrapper: PageWrapper): string[] {
  const handed = wrapper.find("[data-layout]").attributes("data-slots") ?? "";
  return handed.split(" ");
}

export function framesOf(wrapper: PageWrapper) {
  return map(wrapper.findAll("[data-frame]"), frame =>
    frame.attributes("data-frame")
  );
}

/** The template the organism handed its default slot, as the brand sent it. */
export function templateOf(wrapper: PageWrapper) {
  return wrapper.find("[data-layout]").attributes("data-template");
}

export const inFrame = (wrapper: PageWrapper, name: string) =>
  wrapper.find(`[data-frame="${name}"]`);
