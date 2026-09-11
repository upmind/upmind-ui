// @vitest-environment happy-dom
// -----------------------------------------------------------------------------
/**
 * @fileoverview The surfaces a `?init` deep link opens
 *
 * ## Job To Be Done
 * Prove the surface the deep link opens is the PAY surface over the invoice the
 * url named — the payment-details surface, with its engine reading that invoice
 * — and not the resuming-payment interstitial that does no work by design (R1).
 * And prove the upgrade half opens the declared placeholder rather than
 * something dressed as the migrations flow.
 *
 * ## What these beats do NOT grade
 * That a pay CONTROL is on screen and enabled. In this lane the payment surface
 * renders no control at all: the gateway list and the client's stored payment
 * details have NO recordings in any corpus, so those reads go unanswered and
 * the form has nothing to offer. The affordance-level half of AC2 ("I can pay
 * that invoice from where I am") is therefore unproven here — see the hand-off.
 * A text match on the "Pay now" wording is not a substitute: the surface's own
 * section heading carries that label whether a control renders or not.
 *
 * ## Provenance
 * The invoice body is the COMMITTED recording captured by
 * `pnpm fixtures:generate invoices`.
 *
 * @anchor init-deep-link.feature
 * @anchor AC2
 * @anchor AC7
 */

import { mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Suspense, defineComponent, h } from "vue";
import { createRouter, createWebHistory } from "vue-router";
import { QUERY_PARAMS } from "@upmind-automation/types";
import payOverlayPage from "../../../modules/scenarios/overlay-payment/overlay-payment.page.vue";
import upgradeOverlayPage from "../../../modules/scenarios/overlay-upgrade/overlay-upgrade.page.vue";
import {
  clearClientSession,
  hasTestKey,
  observeRequests,
  seedClientSession,
  serveInvoice,
  server
} from "../../funnels/__tests__/init-deep-link.harness";
import {
  BEAT_TIMEOUT,
  recordedInvoiceId
} from "../../funnels/__tests__/init-deep-link.recordings";
import {
  PAYMENT_OVERLAY_ID,
  UPGRADE_OVERLAY_ID
} from "../../funnels/labs.constants";
import { ROUTE } from "../../funnels/types";
import type { VueWrapper } from "@vue/test-utils";
import type { Component } from "vue";

// -----------------------------------------------------------------------------

let mounted: VueWrapper | undefined;

async function mountOverlay(
  page: Component,
  route: { name: string; path: string; url: string }
): Promise<VueWrapper> {
  const router = createRouter({
    history: createWebHistory(),
    routes: [
      {
        path: `/${ROUTE.ORDER}/:${QUERY_PARAMS.ORDER_ID}?`,
        name: ROUTE.ORDER,
        component: { template: "<div />" }
      },
      { path: route.path, name: route.name, component: page }
    ]
  });

  window.history.replaceState({}, "", route.url);
  await router.push(route.url);
  await router.isReady();

  const host = defineComponent({
    setup: () => () => h(Suspense, null, { default: () => h(page) })
  });

  mounted = mount(host, {
    attachTo: document.body,
    global: { plugins: [router] }
  });
  return mounted;
}

// -----------------------------------------------------------------------------

describe("the pay surface an ?init=pay deep link opens", () => {
  beforeEach(async () => {
    await seedClientSession();
  });

  afterEach(async () => {
    mounted?.unmount();
    mounted = undefined;
    document.body.innerHTML = "";
    server?.resetHandlers();
    await clearClientSession();
  });

  it(
    "renders the payment surface for the invoice the url named, with its engine reading that invoice (@AC2)",
    async () => {
      const invoiceId = recordedInvoiceId("unpaid");
      serveInvoice("unpaid");
      const observed = observeRequests();

      const wrapper = await mountOverlay(payOverlayPage as Component, {
        name: `${ROUTE.ORDER}--${PAYMENT_OVERLAY_ID}`,
        path: `/${ROUTE.ORDER}/:${QUERY_PARAMS.ORDER_ID}/${PAYMENT_OVERLAY_ID}`,
        url: `/${ROUTE.ORDER}/${invoiceId}/${PAYMENT_OVERLAY_ID}`
      });

      await vi.waitFor(
        () =>
          expect(hasTestKey(wrapper, "section", "payment-details")).toBe(true),
        { timeout: 10000 }
      );
      observed.stop();

      expect(observed.count(`/api/invoices/${invoiceId}`)).toBeGreaterThan(0);
      expect(observed.count(`/api/invoices/${recordedInvoiceId("paid")}`)).toBe(
        0
      );
      // R1 — the pay-init surface is NOT the resuming-payment interstitial,
      // which would park the payer on a spinner with no operation to resume.
      expect(hasTestKey(wrapper, "interstitial")).toBe(false);
    },
    BEAT_TIMEOUT
  );
});

describe("the upgrade surface an ?init=upgrade deep link opens", () => {
  beforeEach(async () => {
    await seedClientSession();
  });

  afterEach(async () => {
    mounted?.unmount();
    mounted = undefined;
    document.body.innerHTML = "";
    server?.resetHandlers();
    await clearClientSession();
  });

  it(
    "renders the declared placeholder rather than something dressed as the migrations flow (@AC7)",
    async () => {
      const wrapper = await mountOverlay(upgradeOverlayPage as Component, {
        name: `${ROUTE.CONTRACT_PRODUCT}--${UPGRADE_OVERLAY_ID}`,
        path: `/${ROUTE.CONTRACT_PRODUCT}/${UPGRADE_OVERLAY_ID}`,
        url: `/${ROUTE.CONTRACT_PRODUCT}/${UPGRADE_OVERLAY_ID}`
      });

      await vi.waitFor(
        () => expect(hasTestKey(wrapper, "interstitial")).toBe(true),
        { timeout: 10000 }
      );

      expect(hasTestKey(wrapper, "section", "payment-details")).toBe(false);
    },
    BEAT_TIMEOUT
  );
});
