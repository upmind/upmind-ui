// @vitest-environment happy-dom
// -----------------------------------------------------------------------------
/**
 * @fileoverview The invoice page shows a client their own invoice
 *
 * ## Job To Be Done
 * Prove the screen a pay deep link lands beside reads a real invoice and shows
 * the client the record itself — its own number and its own status — and that
 * the record on screen is the one the url named rather than whichever invoice
 * the page happens to hold.
 *
 * Both values are read off the surface's `data-test-value`, never its visible
 * text: the text is a TRANSLATED label, so matching it grades the English
 * catalogue instead of the record (P9, `code-tests-e2e.companion.md`).
 *
 * ## What Breaks If These Fail
 * The client cannot tell which invoice they are looking at, or whether it is
 * still owed. A page that renders its chrome and no record passes every
 * structural check while showing nothing a client can act on.
 *
 * ## Provenance
 * Both bodies are COMMITTED recordings captured by
 * `pnpm fixtures:generate invoices`; the numbers and statuses asserted are read
 * off those recordings rather than written here.
 *
 * @anchor init-deep-link.feature
 * @anchor AC1
 */

import { mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Suspense, defineComponent, h } from "vue";
import { createRouter, createWebHistory } from "vue-router";
import { QUERY_PARAMS } from "@upmind-automation/types";
import {
  appPlugins,
  clearClientSession,
  observeRequests,
  seedClientSession,
  serveInvoice,
  server,
  testValue
} from "../../funnels/__tests__/init-deep-link.harness";
import {
  BEAT_TIMEOUT,
  recordedInvoice,
  recordedInvoiceId,
  type InvoiceCase
} from "../../funnels/__tests__/init-deep-link.recordings";
import { ROUTE } from "../../funnels/types";
import type { VueWrapper } from "@vue/test-utils";
import type { Component } from "vue";
import type { Router } from "vue-router";

// -----------------------------------------------------------------------------

/** The page's own url word for the invoice it reads. */
const INVOICE_PARAM = QUERY_PARAMS.ORDER_ID;

let mounted: VueWrapper | undefined;
let router: Router | undefined;

type RecordedInvoice = { number: string; status: { code: string } };

async function mountInvoicePage(invoiceId: string): Promise<VueWrapper> {
  const page = (
    await import("../../../modules/scenarios/useInvoice/invoice.page.vue")
  ).default as Component;

  // ONE router per file, as the app has one: the routing engine binds the first
  // router it is handed (`init` is `??=`), and `setParam` writes
  // `?payment_success` through THAT router once an order settles. A router per
  // mount would leave it writing through the previous test's router, at a
  // location it no longer matches.
  router ??= createRouter({
    history: createWebHistory(),
    routes: [
      {
        path: `/${ROUTE.INVOICE}/:scopeSuffix(.*)*`,
        name: ROUTE.INVOICE,
        component: page,
        meta: { scenario: ROUTE.INVOICE }
      }
    ]
  });

  const url = `/${ROUTE.INVOICE}?${INVOICE_PARAM}=${invoiceId}`;
  window.history.replaceState({}, "", url);
  await router.push(url);
  await router.isReady();

  const host = defineComponent({
    setup: () => () => h(Suspense, null, { default: () => h(page) })
  });

  mounted = mount(host, {
    attachTo: document.body,
    global: { plugins: await appPlugins(router) }
  });
  return mounted;
}

/**
 * Mounts the page over the named recording and waits for the record itself to
 * reach the screen — the rendered value, not a timer.
 */
async function showInvoice(invoiceCase: InvoiceCase): Promise<{
  wrapper: VueWrapper;
  recorded: RecordedInvoice;
  invoiceId: string;
}> {
  const invoiceId = recordedInvoiceId(invoiceCase);
  const recorded = recordedInvoice<RecordedInvoice>(invoiceCase);
  serveInvoice(invoiceCase);

  const wrapper = await mountInvoicePage(invoiceId);
  await vi.waitFor(
    () =>
      expect(testValue(wrapper, "confirmation-invoice-number")).toBe(
        recorded.number
      ),
    { timeout: 10000 }
  );

  return { wrapper, recorded, invoiceId };
}

// -----------------------------------------------------------------------------

describe("the invoice page, read by the client who owns the invoice", () => {
  beforeEach(async () => {
    await seedClientSession();
  });

  afterEach(async () => {
    // Unmount BEFORE the session drops: clearing the query cache under a
    // mounted page re-renders it with no invoice, and its own computed reads
    // through the absent record.
    mounted?.unmount();
    mounted = undefined;
    document.body.innerHTML = "";
    server?.resetHandlers();
    await clearClientSession();
  });

  it(
    "shows that invoice's own number and status, read from the platform (@AC1)",
    async () => {
      const observed = observeRequests();
      const { wrapper, recorded, invoiceId } = await showInvoice("unpaid");
      observed.stop();

      expect(testValue(wrapper, "confirmation-invoice-number")).toBe(
        recorded.number
      );
      expect(testValue(wrapper, "invoice-status")).toBe(recorded.status.code);
      expect(observed.count(`/api/invoices/${invoiceId}`)).toBeGreaterThan(0);
    },
    BEAT_TIMEOUT
  );

  it(
    "shows the invoice the url names rather than any invoice it can read (@AC1)",
    async () => {
      const other = recordedInvoice<RecordedInvoice>("unpaid");
      const { wrapper, recorded } = await showInvoice("paid");

      expect(recorded.number).not.toBe(other.number);
      expect(testValue(wrapper, "confirmation-invoice-number")).toBe(
        recorded.number
      );
      expect(testValue(wrapper, "invoice-status")).toBe(recorded.status.code);
      expect(testValue(wrapper, "invoice-status")).not.toBe(other.status.code);
    },
    BEAT_TIMEOUT
  );
});
