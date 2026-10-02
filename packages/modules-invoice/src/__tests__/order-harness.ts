// -----------------------------------------------------------------------------
/**
 * @module invoice/__tests__/order-harness
 * @description Boots a signed-in client on the recorded traffic and mounts the order page in its short form: `UpmOrder` with the template's layout, self-closing, in its default slot; the layout skips an empty slot as develop's layouts do.
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
import { ORDER_TEMPLATE, UpmOrder } from "../index";
import {
  clearOutbound,
  installBootRoutes,
  recordedSession,
  serveRecordedOrders
} from "./recorded-orders";
import {
  every,
  filter,
  has,
  isEmpty,
  isUndefined,
  map,
  reject
} from "lodash-es";
import type { OrderProps, OrderTemplates } from "../index";
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

/** One template's layout: it lists every slot it receives, and draws a frame for each one that is not empty. */
function hostTemplate(template: ORDER_TEMPLATE) {
  return defineComponent({
    setup(_props, { slots }) {
      return () => {
        const handed = filter(ORDER_SLOTS, name => has(slots, name));
        const drawn = reject(handed, name => isEmptySlot(name, slots));

        return h(
          "div",
          { "data-template": template, "data-slots": handed.join(" ") },
          map(drawn, name =>
            h("section", { "data-frame": name }, slots[name]?.())
          )
        );
      };
    }
  });
}

const HOST_TEMPLATES: OrderTemplates = {
  [ORDER_TEMPLATE.FULL]: hostTemplate(ORDER_TEMPLATE.FULL),
  [ORDER_TEMPLATE.TWO_COLUMN_LTR]: hostTemplate(ORDER_TEMPLATE.TWO_COLUMN_LTR),
  [ORDER_TEMPLATE.TWO_COLUMN_RTL]: hostTemplate(ORDER_TEMPLATE.TWO_COLUMN_RTL),
  [ORDER_TEMPLATE.ENCLOSED]: hostTemplate(ORDER_TEMPLATE.ENCLOSED),
  [ORDER_TEMPLATE.INSET]: hostTemplate(ORDER_TEMPLATE.INSET)
};

export async function mountOrder(options: {
  route: string;
  template?: ORDER_TEMPLATE;
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
  if (!isUndefined(options.template)) given.template = options.template;

  const Host = defineComponent({
    setup() {
      useRoutingEngine().init(router);
      return () =>
        h(Suspense, null, {
          default: () =>
            h(UpmOrder, given, {
              default: ({ template }: { template: ORDER_TEMPLATE }) =>
                h(HOST_TEMPLATES[template], null, options.overrides)
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
