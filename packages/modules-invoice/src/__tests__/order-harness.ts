// -----------------------------------------------------------------------------
/**
 * @module invoice/__tests__/order-harness
 * @description Boots a signed-in client on the recorded traffic and mounts the order page in its short form: `UpmOrder` with one self-closing layout in its default slot, named for the raw template the page hands it; the layout skips an empty slot as develop's layouts do.
 */

import { mount } from "@vue/test-utils";
import { Comment, Fragment, Suspense, defineComponent, h } from "vue";
import { createI18n } from "vue-i18n";
import { createMemoryHistory, createRouter } from "vue-router";
import {
  mapSessionUser,
  useActiveSession,
  useRoutingEngine,
  useSessionStore
} from "@upmind-automation/headless";
import { UpmOrder } from "../index";
import {
  clearOutbound,
  installBootRoutes,
  recordedSession,
  serveRecordedOrders
} from "./recorded-orders";
import { every, filter, has, isEmpty, join, map, reject } from "lodash-es";
import type { OrderProps } from "../index";
import type { RawSlots, Slots, VNode } from "vue";

// -----------------------------------------------------------------------------

const BOOTED = 2000;

export const BOOT_BUDGET = 20000;

const settle = (ms = 0) => new Promise(resolve => setTimeout(resolve, ms));

function clearSessionCookies(): void {
  for (const pair of document.cookie.split(";")) {
    const name = pair.split("=")[0]?.trim();
    if (name && /^upm_.*_session$/.test(name)) {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    }
  }
}

async function seedClientSession(): Promise<void> {
  await useSessionStore().initStore();
  await useSessionStore()
    .useActions()
    .add(
      recordedSession.token as never,
      true,
      mapSessionUser(recordedSession.self as never)
    );

  await new Promise<void>(resolve => {
    const wait = () => {
      if (useActiveSession().useMeta().isAuthenticated.value) return resolve();
      setTimeout(wait, 20);
    };
    wait();
  });
}

export async function bootRecordedClient(): Promise<void> {
  clearOutbound();
  clearSessionCookies();
  installBootRoutes();
  serveRecordedOrders();
  await seedClientSession();
}

export function signOutRecordedClient(): void {
  useSessionStore().useActions().clear();
}

const Blank = defineComponent({ setup: () => () => h("div") });

const ORDER_SLOTS = [
  "order-summary",
  "order-payment-details",
  "order-products",
  "guest-registration",
  "order-details"
];

const isBlank = (vnode: VNode) =>
  vnode.type === Comment ||
  (vnode.type === Fragment && isEmpty(vnode.children));

/** Empty as develop's layouts judge a slot (its `isEmptySlot`): absent, no vnodes, or only comments and empty fragments. */
function isEmptySlot(name: string, slots: Slots): boolean {
  const vnodes = slots[name]?.();
  return isEmpty(vnodes) || every(vnodes, isBlank);
}

/** Every raw template the order page handed its default slot, in order. */
export const handed: unknown[] = [];

/** The page's layout: it lists every slot it receives, and draws a frame for each one that is not empty. */
const HostLayout = defineComponent({
  props: { template: { type: String, required: true } },
  setup(props, { slots }) {
    return () => {
      const received = filter(ORDER_SLOTS, name => has(slots, name));
      const drawn = reject(received, name => isEmptySlot(name, slots));

      return h(
        "div",
        { "data-template": props.template, "data-slots": join(received, " ") },
        map(drawn, name =>
          h("section", { "data-frame": name }, slots[name]?.())
        )
      );
    };
  }
});

export async function mountOrder(options: {
  route: string;
  /** The page's own slots on its layout; with none the layout is self-closing. */
  overrides?: RawSlots;
}): Promise<ReturnType<typeof mount>> {
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
      { path: "/", component: Blank },
      { path: "/orders/:oid", component: Blank }
    ]
  });

  await router.push(options.route);
  await router.isReady();

  const given: OrderProps = { storefrontRoute: { to: { path: "/" } } };
  handed.length = 0;

  const Host = defineComponent({
    setup() {
      useRoutingEngine().init(router);
      return () =>
        h(Suspense, null, {
          default: () =>
            h(UpmOrder, given, {
              default: ({ template }: { template?: unknown }) => {
                handed.push(template);
                return h(
                  HostLayout,
                  { template: String(template) },
                  options.overrides
                );
              }
            })
        });
    }
  });

  const wrapper = mount(Host, { global: { plugins: [i18n, router] } });
  await settle(BOOTED);
  return wrapper;
}

export function readableText(wrapper: ReturnType<typeof mount>): string {
  return wrapper.text().replace(/\s+/g, " ").trim();
}

/** Every slot the layout received, empty or not. */
export function slotsOf(wrapper: ReturnType<typeof mount>): string[] {
  const handed = wrapper.find("[data-template]").attributes("data-slots") ?? "";
  return handed.split(" ");
}

export function framesOf(wrapper: ReturnType<typeof mount>): string[] {
  return map(wrapper.findAll("[data-frame]"), frame =>
    frame.attributes("data-frame")
  );
}

export function layoutOf(
  wrapper: ReturnType<typeof mount>
): string | undefined {
  return wrapper.find("[data-template]").attributes("data-template");
}
