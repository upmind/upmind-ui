// -----------------------------------------------------------------------------
/**
 * @module domain/__tests__/mount-dac
 * @description Mounts the domain search page in its short form on the recorded guest boot: `UpmDac` with the template's layout, self-closing, in its default slot; the layout skips an empty slot as develop's layouts do.
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
import { DOMAIN_TEMPLATE, UpmDac } from "../index";
import { every, filter, has, isEmpty, map, reject } from "lodash-es";
import type { DomainTemplates } from "../index";
import type { RawSlots, Slots, VNode } from "vue";

// -----------------------------------------------------------------------------

const LAYOUT_SLOTS = ["hero", "search", "tabs", "results", "hint", "resolve"];

export const BOOT_BUDGET = 60000;

const isBlank = (vnode: VNode) =>
  vnode.type === Comment ||
  (vnode.type === Fragment && isEmpty(vnode.children));

/** Empty as develop's layouts judge a slot (its `isEmptySlot`): absent, no vnodes, or only comments and empty fragments. */
function isEmptySlot(name: string, slots: Slots): boolean {
  const vnodes = slots[name]?.();
  return isEmpty(vnodes) || every(vnodes, isBlank);
}

/** One template's layout: it lists every slot it receives, and draws a frame for each one that is not empty. */
const layoutFor = (template: DOMAIN_TEMPLATE) =>
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

const DOMAIN_LAYOUTS: DomainTemplates = {
  [DOMAIN_TEMPLATE.FULL]: layoutFor(DOMAIN_TEMPLATE.FULL)
};

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
      expect(basket.meta.value.isLoading).toBe(false);
    },
    { timeout: 20000, interval: 100 }
  );
}

/** Mounts the domain search as its page does; `overrides` are the page's own slots on its layout. */
export async function mountDac(
  until: (wrapper: ReturnType<typeof mount>) => boolean,
  overrides?: RawSlots
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
      { path: "/order/domains", component: blank }
    ]
  });

  await router.push("/order/domains");
  await router.isReady();

  const Host = defineComponent({
    setup() {
      useRoutingEngine().init(router);
      return () =>
        h(Suspense, null, {
          default: () =>
            h(UpmDac, null, {
              default: ({ template }: { template: keyof DomainTemplates }) =>
                h(DOMAIN_LAYOUTS[template], null, overrides)
            }),
          fallback: () => h("div", { "data-test-key": "page-pending" })
        });
    }
  });

  const wrapper = mount(Host, { global: { plugins: [i18n, router] } });

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

export type DacWrapper = Awaited<ReturnType<typeof mountDac>>;

/** Every slot the layout received, empty or not. */
export function slotsOf(wrapper: DacWrapper): string[] {
  const handed = wrapper.find("[data-layout]").attributes("data-slots") ?? "";
  return handed.split(" ");
}

export function framesOf(wrapper: DacWrapper) {
  return map(wrapper.findAll("[data-frame]"), frame =>
    frame.attributes("data-frame")
  );
}

export function layoutOf(wrapper: DacWrapper) {
  return wrapper.find("[data-layout]").attributes("data-layout");
}
