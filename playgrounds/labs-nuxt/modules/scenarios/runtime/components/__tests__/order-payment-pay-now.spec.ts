// -----------------------------------------------------------------------------
/**
 * @fileoverview The labs pay-INIT overlay's "Pay now" wiring (`OrderPayment.vue`,
 * `modules/scenarios/overlay-payment`).
 *
 * ## Job To Be Done
 * `OrderPayment` is a labs duplicate of client-vue `Order.vue`'s payment slot: it
 * scopes the single-invoice pay engine to the overlay's own invoice
 * (`useInvoice().withId(invoiceId)`) and hands `UpmPaymentDetails` a "Pay now"
 * control. The control's `resolve` event IS the "Pay now" click. The overlay owes
 * one behaviour on it: send the invoice pay action, once, for the invoice the
 * overlay is for. The pay action carries no argument — it settles the current
 * model the pay engine already holds in context — so "the current model" is the
 * model of the `.withId(invoiceId)` cell whose `pay` fires.
 *
 * `pay` lives under that cell's `useActions()`; the scoped `useInvoice()` return
 * itself carries only `useActions` / `useContext` / `useInternals` / `useMeta`
 * and no top-level `pay`. A binding onto the bare return therefore resolves to
 * `undefined` and the click sends nothing — the defect this pins.
 *
 * ## What Breaks If These Fail
 * "Pay now" is inert: the payer clicks it and no PAY ever reaches the invoice
 * machine, so the overlay the `?init=pay` deep link opens can never take a
 * payment. Or it double-sends, charging twice for one click.
 *
 * Negative control: `order-payment-pay-now.must-fail.patch` (revert `@resolve`
 * to the bare `order.pay`).
 */

import { flushPromises, mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Suspense, defineComponent, h } from "vue";

// -----------------------------------------------------------------------------

const INVOICE_ID = "inv_fe3206";

const seam = vi.hoisted(() => ({
  invoiceId: "inv_fe3206",
  pay: vi.fn(),
  withIdCalls: [] as string[]
}));

vi.mock("@upmind-automation/headless", async () => {
  const real = await vi.importActual<Record<string, unknown>>(
    "@upmind-automation/headless"
  );
  const { ref, computed } = await import("vue");

  const actions = new Proxy(
    { pay: seam.pay, isReady: vi.fn(() => Promise.resolve()) } as Record<
      string,
      unknown
    >,
    {
      get: (target, key: string) =>
        key in target ? target[key] : (target[key] = vi.fn())
    }
  );
  // A payable, authenticated invoice — the state in which "Pay now" is offered.
  const FLAGS: Record<string, boolean> = {
    isAvailable: true,
    isAuthenticated: true,
    isPaymentDue: true
  };
  const refs = () =>
    new Proxy({} as Record<string, unknown>, {
      get: (target, key: string) =>
        key in target
          ? target[key]
          : (target[key] = ref(
              key === "model" || key === "invoice"
                ? { id: seam.invoiceId }
                : undefined
            ))
    });
  const metas = () =>
    new Proxy({} as Record<string, unknown>, {
      get: (target, key: string) =>
        key in target
          ? target[key]
          : (target[key] = computed(() => FLAGS[key] ?? false))
    });

  // The scoped return the overlay reads: four layers, no top-level `pay`.
  const cell = {
    useActions: () => actions,
    useContext: refs,
    useInternals: refs,
    useMeta: metas
  };
  const builder: Record<string, unknown> = {
    ...cell,
    as: () => builder,
    withId: (id: string) => {
      seam.withIdCalls.push(id);
      return cell;
    }
  };

  return {
    ...real,
    useInvoice: () => builder,
    useAuth: () => ({ as: () => ({ useMeta: metas }) })
  };
});

vi.mock("@upmind-automation/client-vue", async () => {
  const real = await vi.importActual<Record<string, unknown>>(
    "@upmind-automation/client-vue"
  );
  const { defineComponent, h } = await import("vue");

  // The real control's "Pay now" button emits `resolve`; the double does the
  // same so a click here exercises the overlay's binding, not the control.
  const UpmPaymentDetails = defineComponent({
    name: "UpmPaymentDetails",
    emits: ["resolve"],
    setup:
      (_props, { emit }) =>
      () =>
        h(
          "button",
          { "data-test-key": "pay-now", onClick: () => emit("resolve") },
          "Pay now"
        )
  });
  const UpmPaymentProcessing = defineComponent({
    name: "UpmPaymentProcessing",
    setup: () => () => h("div")
  });

  return { ...real, UpmPaymentDetails, UpmPaymentProcessing };
});

// -----------------------------------------------------------------------------

async function mountOverlay() {
  const { default: OrderPayment } =
    await import("../../../overlay-payment/OrderPayment.vue");
  // OrderPayment has an async setup; it renders only under a Suspense boundary,
  // the same one `overlay-payment.page.vue` gives it.
  const Host = defineComponent({
    setup: () => () =>
      h(Suspense, null, {
        default: () => h(OrderPayment, { invoiceId: INVOICE_ID })
      })
  });
  const wrapper = mount(Host, { attachTo: document.body });
  await flushPromises();
  return wrapper;
}

// -----------------------------------------------------------------------------

describe("the labs pay overlay's Pay now sends the invoice pay action", () => {
  beforeEach(() => {
    seam.pay.mockClear();
    seam.withIdCalls.length = 0;
  });

  it(
    "sends pay exactly once when the payer clicks Pay now",
    { timeout: 30000 },
    async () => {
      const wrapper = await mountOverlay();

      await wrapper.find('[data-test-key="pay-now"]').trigger("click");

      expect(seam.pay).toHaveBeenCalledTimes(1);
      wrapper.unmount();
    }
  );

  it(
    "settles the invoice the overlay is for — the pay engine is scoped to its id",
    { timeout: 30000 },
    async () => {
      const wrapper = await mountOverlay();

      await wrapper.find('[data-test-key="pay-now"]').trigger("click");

      expect(seam.withIdCalls).toContain(INVOICE_ID);
      wrapper.unmount();
    }
  );

  it(
    "sends nothing until the payer acts — no pay on mount",
    { timeout: 30000 },
    async () => {
      const wrapper = await mountOverlay();

      expect(seam.pay).not.toHaveBeenCalled();
      wrapper.unmount();
    }
  );
});
