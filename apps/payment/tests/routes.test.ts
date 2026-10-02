// -----------------------------------------------------------------------------
/**
 * @fileoverview The payment route record
 *
 * ## Job To Be Done
 * The pay route loads the pay page, which hands the invoice id to the organism as a prop.
 *
 * ## What Breaks If These Fail
 * The standalone app boots to a 404, or pays against no invoice id.
 */

import { describe, expect, it, vi } from "vitest";
import { createApp, h } from "vue";
import { RouterView, createMemoryHistory, createRouter } from "vue-router";
import { PAYMENT_PARAM, PAYMENT_ROUTE, paymentRoutes } from "../src/routes";
import type { Component } from "vue";

// -----------------------------------------------------------------------------

const { organismProps } = vi.hoisted(() => ({
  organismProps: [] as Array<Record<string, unknown>>
}));

// The probe declares the real organism's own props, so a name the organism does not declare never reaches it.
vi.mock("@upmind-automation/payment", async importOriginal => {
  const actual =
    await importOriginal<typeof import("@upmind-automation/payment")>();
  const { defineComponent, h: render } = await import("vue");
  const declared = (actual.UpmPayment as { props?: Record<string, unknown> })
    .props;

  return Object.assign({}, actual, {
    UpmPayment: defineComponent({
      props: declared,
      setup(props) {
        organismProps.push(props);
        return () => render("div");
      }
    })
  });
});

const INVOICE_ID = "52098d3d-e409-1748-650c-31578626e347";

// A cold CI import of the payment package outruns vitest's 5000ms default.
const COLD_IMPORT_TIMEOUT_MS = 30_000;

type LazyPage = () => Promise<{ default: Component }>;

function routerFor() {
  return createRouter({
    history: createMemoryHistory(),
    routes: paymentRoutes
  });
}

function payRecord() {
  return routerFor().resolve(`/pay/${INVOICE_ID}`).matched.at(-1);
}

// -----------------------------------------------------------------------------

describe("paymentRoutes", () => {
  it("mounts the pay record under this app's own base", () => {
    const router = routerFor();

    expect(
      router.resolve({
        name: PAYMENT_ROUTE.PAY,
        params: { [PAYMENT_PARAM.INVOICE_ID]: INVOICE_ID }
      }).path
    ).toBe(`/pay/${INVOICE_ID}`);
    expect(router.resolve(`/invoices/${INVOICE_ID}`).matched).toEqual([]);
  });

  it(
    "gives the pay record a page that loads to a component",
    async () => {
      const load = payRecord()?.components?.default as LazyPage | undefined;

      expect(load, "the pay record has no page to load").toBeTypeOf("function");
      expect((await load?.())?.default).toBeTruthy();
    },
    COLD_IMPORT_TIMEOUT_MS
  );

  it("names the invoice id with the param the published constant declares", () => {
    const router = routerFor();

    expect(router.resolve(`/pay/${INVOICE_ID}`).params).toEqual({
      [PAYMENT_PARAM.INVOICE_ID]: INVOICE_ID
    });
  });

  it("hands the invoice id to the page as a prop, not as a router lookup", () => {
    expect(payRecord()?.props?.default).toBe(true);
  });

  it(
    "hands the pay link's invoice id through the page to the organism",
    async () => {
      const router = routerFor();
      await router.push(`/pay/${INVOICE_ID}`);

      const app = createApp({ render: () => h(RouterView) }).use(router);
      app.mount(document.createElement("div"));
      const received = organismProps.at(-1);
      app.unmount();

      expect(received, "the pay page did not mount the organism").toBeTruthy();
      expect(received?.[PAYMENT_PARAM.INVOICE_ID]).toBe(INVOICE_ID);
    },
    COLD_IMPORT_TIMEOUT_MS
  );

  it("matches nothing when no invoice id is supplied", () => {
    const router = routerFor();

    expect(router.resolve("/pay").matched).toEqual([]);
  });

  it("contributes exactly one record, so the app acquires no extra pages", () => {
    expect(paymentRoutes).toHaveLength(1);
  });
});
