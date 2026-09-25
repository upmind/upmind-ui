// @vitest-environment happy-dom
// -----------------------------------------------------------------------------
/**
 * @fileoverview The `?init` bench proves itself, before any story code is graded
 *
 * ## Job To Be Done
 * Show that the five pieces the FE-3136 read-backs stand on actually work
 * against recorded bytes: the replay server answers, the per-case override pins
 * the case the pool matcher cannot select, the seeded client session lets the
 * real `useInvoice` fire at all, the observer captures the outbound URL, and a
 * drive of the funnel runs the machine EVERY time rather than echoing the route
 * it was handed.
 *
 * ## What Breaks If These Fail
 * Every read-back downstream passes for the wrong reason — an unseeded caller
 * fires no request, so "nothing opened" and "no read happened" are
 * indistinguishable from a correct refusal; and an echoing drive makes every
 * refusal beat in the suite green without the guard ever running.
 *
 * @anchor init-deep-link.feature
 * @anchor harness
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { QUERY_PARAMS } from "@upmind-automation/types";
import { InitIntent } from "../labs.constants";
import { ROUTE } from "../types";
import {
  clearClientSession,
  driveFunnel,
  expectNoRequestTo,
  observeRequests,
  seedClientSession,
  serveInvoice,
  server
} from "./init-deep-link.harness";
import {
  BEAT_TIMEOUT,
  arriveAt,
  initParamInUrl,
  recordedInvoice,
  recordedInvoiceId
} from "./init-deep-link.recordings";

// -----------------------------------------------------------------------------

const payLinkTo = (invoiceId: string) =>
  arriveAt(ROUTE.ORDER, {
    params: { [QUERY_PARAMS.ORDER_ID]: invoiceId },
    query: { [QUERY_PARAMS.INIT]: InitIntent.PAY }
  });

// -----------------------------------------------------------------------------

describe("the ?init read-back bench — H1–H5 against recorded bytes", () => {
  beforeEach(async () => {
    await seedClientSession();
  });

  afterEach(async () => {
    server?.resetHandlers();
    await clearClientSession();
  });

  it(
    "serves the recorded unpaid invoice to the real useInvoice, and observes the read going out at that invoice's own id",
    async () => {
      const invoiceId = recordedInvoiceId("unpaid");
      const recorded = recordedInvoice<{ id: string; number: string }>(
        "unpaid"
      );
      serveInvoice("unpaid");
      const observed = observeRequests();

      const { useInvoice } = await import("@upmind-automation/headless");
      const { data } = useInvoice().withId(invoiceId).useContext();

      await vi.waitFor(() => expect(data.value?.id).toBe(invoiceId), {
        timeout: 10000
      });
      observed.stop();

      expect(data.value?.number).toBe(recorded.number);
      expect(observed.count(`/api/invoices/${invoiceId}`)).toBeGreaterThan(0);
    },
    BEAT_TIMEOUT
  );

  it(
    "pins the case the replay pool cannot select, so the paid and unpaid beats read different invoices",
    async () => {
      const paidId = recordedInvoiceId("paid");
      const unpaidId = recordedInvoiceId("unpaid");
      expect(paidId).not.toBe(unpaidId);

      serveInvoice("paid");
      const { useInvoice } = await import("@upmind-automation/headless");
      const invoice = useInvoice().withId(paidId);

      await vi.waitFor(
        () => expect(invoice.useContext().data.value?.id).toBe(paidId),
        { timeout: 10000 }
      );

      expect(invoice.useMeta().isPaid.value).toBe(true);
    },
    BEAT_TIMEOUT
  );

  it(
    "fires no request at all without a session, so a refusal is never confused with an unseeded caller",
    async () => {
      await clearClientSession();
      serveInvoice("unpaid");
      const observed = observeRequests();

      const { useInvoice } = await import("@upmind-automation/headless");
      useInvoice().withId(recordedInvoiceId("unpaid")).useContext();
      await expectNoRequestTo(observed, "/api/invoices/");
      observed.stop();
    },
    BEAT_TIMEOUT
  );

  it(
    "runs the machine on a drive it refuses, so a refusal is never the bench echoing the route back",
    async () => {
      const paidId = recordedInvoiceId("paid");
      serveInvoice("paid");
      const observed = observeRequests();

      const refused = await driveFunnel(payLinkTo(paidId));
      observed.stop();

      expect(refused.name).toBe(ROUTE.ORDER);
      expect(observed.count(`/api/invoices/${paidId}`)).toBeGreaterThan(0);
      await vi.waitFor(() => expect(initParamInUrl()).toBeUndefined(), {
        timeout: 2000
      });
    },
    BEAT_TIMEOUT
  );
});
