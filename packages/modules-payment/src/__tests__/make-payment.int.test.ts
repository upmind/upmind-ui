// @vitest-environment happy-dom
// Not jsdom: node's undici fetch rejects jsdom's AbortSignal (vitest #8374).
// -----------------------------------------------------------------------------
/**
 * @fileoverview The make-payment API boundary, driven from an invoice id prop
 *
 * ## Job To Be Done
 * Given an invoice id prop, the organism reads and charges that invoice, and keeps its form through the charge.
 *
 * ## What Breaks If These Fail
 * A customer's money lands against the wrong invoice, or the card form is torn down mid-charge.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useFormRenderers } from "@upmind-automation/foundation";
import { useSessionStore } from "@upmind-automation/headless";
import { paymentRenderers } from "../index";
import {
  BOOTED,
  clearSessionCookies,
  hiddenByStyle,
  mountResolved,
  payControl,
  paymentForm,
  processingScreen,
  seedClientSession,
  settle
} from "./mount-payment";
import {
  chargedProvider,
  installBootRoutes,
  otherInvoiceId,
  recordedAmount,
  recordedInvoiceId,
  recordedProviders,
  replayRecordedRefusal,
  server,
  slug
} from "./recorded-pool";
import { clone } from "lodash-es";
import type { PaymentWrapper } from "./mount-payment";

// -----------------------------------------------------------------------------

const invoiceId = recordedInvoiceId as string;

const GATEWAYS = 1;

let outbound: string[] = [];
let charges: Array<Record<string, unknown>> = [];
let chargeAnswers: number[] = [];

server?.events.on("request:start", ({ request }) => {
  const url = new URL(request.url);
  outbound.push(`${request.method} ${url.pathname}${url.search}`);

  if (request.method === "POST" && url.pathname.endsWith("/payments")) {
    request
      .clone()
      .json()
      .then(body => charges.push(body as Record<string, unknown>))
      .catch(() => charges.push({ unparsable: true }));
  }
});

server?.events.on("response:mocked", ({ request, response }) => {
  const url = new URL(request.url);
  if (request.method === "POST" && url.pathname.endsWith("/payments")) {
    chargeAnswers.push(response.status);
  }
});

let mounted: PaymentWrapper | undefined;

async function booted(id = invoiceId) {
  const wrapper = await mountResolved(id);
  mounted = wrapper;
  await settle(BOOTED);
  return wrapper;
}

function done(wrapper: PaymentWrapper) {
  wrapper.unmount();
  mounted = undefined;
}

async function selectChargedGateway(wrapper: PaymentWrapper) {
  const tiles = wrapper.findAll('[data-test-key="gateway"]');
  const tile = tiles.find(
    candidate =>
      slug(candidate.attributes("data-test-value") ?? "") ===
      slug(chargedProvider as string)
  );

  expect(
    tile,
    `the recorded provider ${chargedProvider} was not offered; offered: ${tiles
      .map(candidate => candidate.attributes("data-test-value"))
      .join(", ")}`
  ).toBeTruthy();
  await tile?.trigger("click");
  await settle(600);
}

async function pressPay(wrapper: PaymentWrapper) {
  const button = payControl(wrapper);
  expect(
    button.exists(),
    "no pay control appeared after choosing a method"
  ).toBe(true);
  await button.trigger("click");
}

async function payNow(wrapper: PaymentWrapper) {
  await pressPay(wrapper);
  await settle(50);
}

// -----------------------------------------------------------------------------

describe("the make-payment boundary, given an invoice id", () => {
  beforeEach(async () => {
    outbound = [];
    charges = [];
    chargeAnswers = [];
    clearSessionCookies();
    installBootRoutes();
    await seedClientSession();
  });

  // Every test shares one invoice cell: a test that failed before `done` still lets its charge land first.
  afterEach(async () => {
    if (mounted) {
      await settle(1200);
      done(mounted);
    }
    useSessionStore().useActions().clear();
    vi.restoreAllMocks();
  });

  it("goes to the picked invoice's own resources, and to no others", async () => {
    const wrapper = await booted();

    const invoiceCalls = outbound.filter(entry =>
      /\/api\/invoices\//.test(entry)
    );
    const gatewayCalls = outbound.filter(entry => /\/gateways/.test(entry));
    const invoiceWrites = outbound.filter(entry =>
      /^(POST|PATCH|PUT) .*\/api\/invoices\//.test(entry)
    );

    expect(
      invoiceCalls.length,
      `never asked for an invoice at all: ${outbound.join("\n  ")}`
    ).toBeGreaterThan(0);
    expect(
      invoiceCalls.filter(entry => !entry.includes(invoiceId)),
      `asked for an invoice its prop never named: ${invoiceCalls.join("\n  ")}`
    ).toEqual([]);
    expect(
      outbound.filter(entry => entry.includes(String(otherInvoiceId)))
    ).toEqual([]);

    expect(
      gatewayCalls.length,
      `never asked which methods can pay it: ${outbound.join("\n  ")}`
    ).toBeGreaterThan(0);
    expect(
      gatewayCalls.filter(entry => entry.includes(`invoice_id=${invoiceId}`)),
      `gateway list not scoped to the invoice: ${gatewayCalls.join("\n  ")}`
    ).not.toEqual([]);

    expect(
      invoiceWrites,
      `paid through the invoice resource: ${invoiceWrites.join("\n  ")}`
    ).toEqual([]);
    expect(charges, "charged before the customer asked").toEqual([]);

    done(wrapper);
  });

  it("never unmounts the payment form, from its first appearance through the charge", async () => {
    const wrapper = await booted();
    const whenShown = paymentForm(wrapper);

    await selectChargedGateway(wrapper);
    const afterSelect = paymentForm(wrapper);

    await payNow(wrapper);
    const duringCharge = paymentForm(wrapper);
    await settle(1200);
    const afterCharge = paymentForm(wrapper);

    expect(
      whenShown,
      "the payment form never appeared once the invoice was available"
    ).toBeTruthy();
    expect(
      afterSelect,
      "the payment form was replaced when a method was chosen"
    ).toBe(whenShown);
    expect(
      duringCharge,
      "the payment form was torn down while the charge was in flight"
    ).toBe(whenShown);
    expect(
      afterCharge,
      "the payment form was torn down when the charge came back"
    ).toBe(whenShown);

    done(wrapper);
  });

  it("charges the invoice the prop named, and no other", async () => {
    const wrapper = await booted();
    await selectChargedGateway(wrapper);
    await payNow(wrapper);
    await settle(1200);

    expect(
      charges,
      `no charge was issued: ${outbound.join("\n  ")}`
    ).not.toEqual([]);
    for (const charge of charges) {
      expect(charge).toMatchObject({ invoice_id: invoiceId });
    }

    done(wrapper);
  });

  it("shows the processing screen over the still-mounted form once the charge starts, and scrolls to the top", async () => {
    const scrollTo = vi
      .spyOn(window, "scrollTo")
      .mockImplementation(() => undefined);
    const wrapper = await booted();
    await selectChargedGateway(wrapper);
    const whenChosen = paymentForm(wrapper);

    expect(
      scrollTo,
      "the page scrolled before any charge started"
    ).not.toHaveBeenCalled();

    await pressPay(wrapper);
    // The processing window closes within a few replayed round trips, so poll every millisecond.
    await vi.waitFor(
      () => {
        expect(
          processingScreen(),
          "the processing screen never appeared once the charge started"
        ).toBeTruthy();
      },
      { interval: 1, timeout: 1000 }
    );
    const duringProcessing = paymentForm(wrapper);

    expect(
      duringProcessing,
      "the payment form was torn down while the charge was processing"
    ).toBe(whenChosen);
    expect(
      hiddenByStyle(duringProcessing),
      "the payment form stayed on screen beside the processing screen"
    ).toBe(true);
    expect(scrollTo).toHaveBeenCalledWith(0, 0);

    await settle(1200);
    done(wrapper);
  });

  it("leaves the customer the pay form when the API refuses the charge", async () => {
    replayRecordedRefusal();

    const wrapper = await booted();
    const whenShown = paymentForm(wrapper);
    await selectChargedGateway(wrapper);
    await payNow(wrapper);
    await settle(1500);
    const afterRefusal = paymentForm(wrapper);

    expect(
      chargeAnswers.filter(status => status >= 400),
      `the API never refused a charge: ${chargeAnswers.join(", ")}`
    ).not.toEqual([]);
    expect(
      afterRefusal,
      "the payment form was taken away after the API refused the charge"
    ).toBe(whenShown);
    expect(
      hiddenByStyle(afterRefusal),
      "the payment form stayed hidden after the API refused the charge"
    ).toBe(false);
    expect(
      payControl(wrapper).exists(),
      "the refused customer was offered no way to pay again"
    ).toBe(true);

    done(wrapper);
  });

  it("shows the customer the figure the amount service returned", async () => {
    const wrapper = await booted();

    const shown = wrapper.find('[data-test-key="pay-amount-value"]');

    expect(shown.exists()).toBe(true);
    expect(shown.attributes("data-test-value") ?? shown.text()).toContain(
      recordedAmount
    );

    done(wrapper);
  });

  it("offers the customer the providers the recording carries, and no others", async () => {
    const wrapper = await booted();

    const offered = wrapper
      .findAll('[data-test-key="gateway"]')
      .map(tile => tile.attributes("data-test-value"))
      .filter((value): value is string => Boolean(value))
      .map(slug);
    const known = recordedProviders.map(slug);

    expect(offered.length).toBeGreaterThan(0);
    expect(
      offered.filter(value => value !== "paylater" && !known.includes(value)),
      `offered a provider the recording does not carry: ${offered.join(", ")}`
    ).toEqual([]);

    done(wrapper);
  });

  it("takes the gateway tiles from the registered renderer, not from a bare field", async () => {
    const gateways = paymentRenderers[GATEWAYS];
    if (!gateways) throw new Error(`no renderer entry at index ${GATEWAYS}`);

    const wrapper = await booted();
    const tiles = wrapper.findAll('[data-test-key="gateway"]');
    const drawnByRenderer = wrapper
      .findComponent(gateways.renderer)
      .findAll('[data-test-key="gateway"]');

    expect(clone(useFormRenderers().renderers.value)).toContain(gateways);
    expect(tiles.length).toBeGreaterThan(0);
    expect(drawnByRenderer).toHaveLength(tiles.length);

    done(wrapper);
  });
});
