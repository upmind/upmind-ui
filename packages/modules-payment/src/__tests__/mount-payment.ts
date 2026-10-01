// -----------------------------------------------------------------------------
/**
 * @module payment/__tests__/mount-payment
 * @description The shared harness the recorded integration specs mount `UpmPayment` through.
 */

import { flushPromises, mount } from "@vue/test-utils";
import { expect, vi } from "vitest";
import { Suspense, defineComponent, h } from "vue";
import { createI18n } from "vue-i18n";
import { createMemoryHistory, createRouter } from "vue-router";
import {
  mapSessionUser,
  useActiveSession,
  useRoutingEngine,
  useSessionStore
} from "@upmind-automation/headless";
import { UpmPayment } from "../index";
import { recordedSession } from "./recorded-pool";

// -----------------------------------------------------------------------------

export const BOOTED = 2000;

export const settle = (ms = 0) =>
  new Promise(resolve => setTimeout(resolve, ms));

export function clearSessionCookies(): void {
  for (const pair of document.cookie.split(";")) {
    const name = pair.split("=")[0]?.trim();
    if (name && /^upm_.*_session$/.test(name)) {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    }
  }
}

export async function seedClientSession(): Promise<void> {
  await useSessionStore().initStore();
  await useSessionStore()
    .useActions()
    .add(
      recordedSession.token as never,
      true,
      mapSessionUser(recordedSession.self as never)
    );

  await vi.waitFor(() => {
    expect(useActiveSession().useMeta().isAuthenticated.value).toBe(true);
  });
}

export function mountPayment(id: string) {
  const i18n = createI18n({
    legacy: false,
    locale: "en",
    missingWarn: false,
    fallbackWarn: false,
    messages: { en: {} }
  });
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: "/", component: { setup: () => () => h("div") } }]
  });

  const Host = defineComponent({
    props: { invoiceId: { type: String, required: true } },
    emits: ["resolve"],
    setup(props, { emit }) {
      useRoutingEngine().init(router);
      return () =>
        h(
          Suspense,
          { onResolve: () => emit("resolve") },
          { default: () => h(UpmPayment, { invoiceId: props.invoiceId }) }
        );
    }
  });

  return mount(Host, {
    props: { invoiceId: id },
    global: { plugins: [i18n, router] }
  });
}

export type PaymentWrapper = ReturnType<typeof mountPayment>;

export async function resolved(wrapper: PaymentWrapper): Promise<void> {
  await vi.waitFor(
    () => {
      expect(
        wrapper.emitted("resolve"),
        "the payment surface never finished its async setup"
      ).toBeTruthy();
    },
    { timeout: BOOTED }
  );
  await flushPromises();
}

export async function mountResolved(id: string): Promise<PaymentWrapper> {
  const wrapper = mountPayment(id);
  await resolved(wrapper);
  return wrapper;
}

// -----------------------------------------------------------------------------

export function paymentForm(wrapper: PaymentWrapper) {
  const found = wrapper.find('[data-test-value="payment-details"]');
  return found.exists() ? found.element : undefined;
}

export function gatewayTiles(wrapper: PaymentWrapper) {
  return wrapper
    .findAll('[data-test-key="gateway"]')
    .map(tile => tile.attributes("data-test-value") ?? "");
}

export function payControl(wrapper: PaymentWrapper) {
  return wrapper.find('[data-test-key="button-complete-checkout"]');
}

export function amountShown(wrapper: PaymentWrapper) {
  const found = wrapper.find('[data-test-key="pay-amount-value"]');
  if (!found.exists()) return undefined;
  return found.attributes("data-test-value") ?? found.text();
}

export function readableText(wrapper: PaymentWrapper) {
  return wrapper.text().replace(/\s+/g, " ").trim();
}

// `v-show` hides by an inline `display: none` on the component's root, which may sit above the form.
export function hiddenByStyle(element: Element | undefined): boolean {
  for (let node = element; node; node = node.parentElement ?? undefined) {
    if (node instanceof HTMLElement && node.style.display === "none") {
      return true;
    }
  }
  return false;
}

export function processingScreen(): Element | undefined {
  return (
    document.body.querySelector('[data-test-key="interstitial"]') ?? undefined
  );
}
