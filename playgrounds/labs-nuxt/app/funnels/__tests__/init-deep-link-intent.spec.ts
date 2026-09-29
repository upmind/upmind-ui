// @vitest-environment happy-dom
// -----------------------------------------------------------------------------
/**
 * @fileoverview `?init` deep-link intent — what the link asks for, and what the
 * screen decides
 *
 * ## Job To Be Done
 * Prove the deep link a client follows from an Upmind email does the job on
 * arrival: a pay link on an invoice that is not paid reaches the pay surface, a
 * link on a settled invoice reaches nothing, an instruction nobody recognises is
 * ignored without failing, and in EVERY case the instruction leaves the address
 * bar and does not come back.
 *
 * Every beat runs the arriving route through the REAL funnel — the engine's own
 * `guard()` entry point — so the machine's arms, their conditions and their
 * assigns are what gets graded.
 *
 * ## What Breaks If These Fail
 * - A client who clicked "Pay now" in an email lands on an invoice with nothing
 *   open, and pays nobody.
 * - A spent instruction rides the url, so the surface re-opens on the next
 *   thing the client does — or a bookmarked/shared link keeps re-firing it.
 * - The gate narrows to the UNPAID status group, and every cancelled, draft,
 *   refunded or replaced invoice legacy let a client pay silently stops
 *   offering it. That drop passes every other assertion in this file, which is
 *   why the cancelled beat exists.
 * - The readiness wait loses its bound, and an invoice that never loads leaves
 *   the client on a page that never resolves.
 *
 * ## Provenance
 * Every invoice body is a COMMITTED recording, captured by
 * `pnpm fixtures:generate invoices`. No body is authored here.
 *
 * @anchor init-deep-link.feature
 * @anchor AC2
 * @anchor AC3
 * @anchor AC4
 * @anchor AC5
 * @anchor AC8
 * @anchor AC9
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { QUERY_PARAMS } from "@upmind-automation/types";
import { InitIntent, PAYMENT_OVERLAY_ID } from "../labs.constants";
import { ROUTE } from "../types";
import {
  clearClientSession,
  driveFunnel,
  observeRequests,
  seedClientSession,
  serveInvoice,
  server
} from "./init-deep-link.harness";
import {
  BEAT_TIMEOUT,
  BOUND_BEAT_TIMEOUT,
  INTENT_READINESS_BOUND_MS,
  arriveAt,
  initParamInUrl,
  recordedInvoiceId
} from "./init-deep-link.recordings";
import { endsWith, includes, keys } from "lodash-es";

// -----------------------------------------------------------------------------

const payLinkTo = (invoiceId: string, intent: string = InitIntent.PAY) =>
  arriveAt(ROUTE.ORDER, {
    params: { [QUERY_PARAMS.ORDER_ID]: invoiceId },
    query: { [QUERY_PARAMS.INIT]: intent }
  });

const payOverlayName = `--${PAYMENT_OVERLAY_ID}`;

const expectInstructionSpent = (): Promise<void> =>
  vi.waitFor(() => expect(initParamInUrl()).toBeUndefined(), {
    timeout: 2000
  });

// -----------------------------------------------------------------------------

describe("a pay deep link on an invoice that is not paid", () => {
  beforeEach(async () => {
    await seedClientSession();
  });

  afterEach(async () => {
    server?.resetHandlers();
    await clearClientSession();
  });

  it(
    "reaches the pay surface over that invoice, carrying the invoice's own id (@AC2)",
    async () => {
      const invoiceId = recordedInvoiceId("unpaid");
      serveInvoice("unpaid");
      const observed = observeRequests();

      const target = await driveFunnel(payLinkTo(invoiceId));
      observed.stop();

      expect(endsWith(String(target.name), payOverlayName)).toBe(true);
      expect(target.params?.[QUERY_PARAMS.ORDER_ID]).toBe(invoiceId);
      expect(observed.count(`/api/invoices/${invoiceId}`)).toBeGreaterThan(0);
      expect(keys(target.query ?? {})).not.toContain(QUERY_PARAMS.INIT);
    },
    BEAT_TIMEOUT
  );

  it(
    "still reaches it when the invoice is cancelled rather than paid, because legacy gated on paid alone (@AC9)",
    async () => {
      const invoiceId = recordedInvoiceId("cancelled");
      serveInvoice("cancelled");
      const observed = observeRequests();

      const target = await driveFunnel(payLinkTo(invoiceId));
      observed.stop();

      expect(endsWith(String(target.name), payOverlayName)).toBe(true);
      expect(observed.count(`/api/invoices/${invoiceId}`)).toBeGreaterThan(0);
      await expectInstructionSpent();
    },
    BEAT_TIMEOUT
  );

  it(
    "decides nothing until the invoice has loaded, then opens (@AC3)",
    async () => {
      const invoiceId = recordedInvoiceId("unpaid");
      const replay = serveInvoice("unpaid");
      replay.hold();

      const settled = vi.fn();
      const running = driveFunnel(payLinkTo(invoiceId)).then(target => {
        settled();
        return target;
      });

      await vi.waitFor(() => expect(replay.reads()).toBeGreaterThan(0), {
        timeout: 10000
      });
      expect(settled).not.toHaveBeenCalled();

      replay.release();
      const target = await running;

      expect(settled).toHaveBeenCalled();
      expect(endsWith(String(target.name), payOverlayName)).toBe(true);
    },
    BEAT_TIMEOUT
  );

  it(
    "opens nothing when the invoice never finishes loading, refusing within the readiness bound (@AC3)",
    async () => {
      const invoiceId = recordedInvoiceId("unpaid");
      const replay = serveInvoice("unpaid");
      replay.hold();

      const started = Date.now();
      const target = await driveFunnel(payLinkTo(invoiceId));
      const waited = Date.now() - started;
      const readsWhileHeld = replay.reads();
      replay.release();

      expect(target.name).toBe(ROUTE.ORDER);
      expect(readsWhileHeld).toBeGreaterThan(0);
      expect(waited).toBeLessThanOrEqual(INTENT_READINESS_BOUND_MS);
      await expectInstructionSpent();
    },
    BOUND_BEAT_TIMEOUT
  );
});

describe("a pay deep link the screen refuses", () => {
  beforeEach(async () => {
    await seedClientSession();
  });

  afterEach(async () => {
    server?.resetHandlers();
    await clearClientSession();
  });

  it(
    "opens nothing on an invoice that is already paid, having read that invoice to decide, and still spends the instruction (@AC4)",
    async () => {
      const invoiceId = recordedInvoiceId("paid");
      serveInvoice("paid");
      const observed = observeRequests();

      const target = await driveFunnel(payLinkTo(invoiceId));
      observed.stop();

      expect(target.name).toBe(ROUTE.ORDER);
      expect(observed.count(`/api/invoices/${invoiceId}`)).toBeGreaterThan(0);
      await expectInstructionSpent();
    },
    BEAT_TIMEOUT
  );

  it(
    "ignores an instruction nobody recognises without failing, and still spends it (@AC8)",
    async () => {
      const invoiceId = recordedInvoiceId("unpaid");
      serveInvoice("unpaid");

      const target = await driveFunnel(
        payLinkTo(invoiceId, "reticulate-splines")
      );

      expect(target.name).toBe(ROUTE.ORDER);
      expect(target.params?.[QUERY_PARAMS.ORDER_ID]).toBe(invoiceId);
      await expectInstructionSpent();
    },
    BEAT_TIMEOUT
  );

  it(
    "opens nothing when the link names no invoice, and still spends the instruction (@AC8)",
    async () => {
      serveInvoice("unpaid");

      const target = await driveFunnel(
        arriveAt(ROUTE.ORDER, {
          query: { [QUERY_PARAMS.INIT]: InitIntent.PAY }
        })
      );

      expect(target.name).toBe(ROUTE.ORDER);
      expect(target.params?.[QUERY_PARAMS.ORDER_ID]).toBeUndefined();
      await expectInstructionSpent();
    },
    BEAT_TIMEOUT
  );

  it(
    "opens nothing over an invoice that cannot be read, and still spends the instruction (@AC8)",
    async () => {
      serveInvoice("not-found");

      const target = await driveFunnel(
        payLinkTo("00000000-0000-0000-0000-000000000000")
      );

      expect(target.name).toBe(ROUTE.ORDER);
      await expectInstructionSpent();
    },
    BOUND_BEAT_TIMEOUT
  );

  it(
    "opens nothing at all on a page the client reached without an instruction (@AC8)",
    async () => {
      const invoiceId = recordedInvoiceId("unpaid");
      serveInvoice("unpaid");

      const target = await driveFunnel(
        arriveAt(ROUTE.ORDER, {
          params: { [QUERY_PARAMS.ORDER_ID]: invoiceId }
        })
      );

      expect(target.name).toBe(ROUTE.ORDER);
      expect(initParamInUrl()).toBeUndefined();
    },
    BEAT_TIMEOUT
  );
});

describe("the deep-link instruction is spent once acted on", () => {
  beforeEach(async () => {
    await seedClientSession();
  });

  afterEach(async () => {
    server?.resetHandlers();
    await clearClientSession();
  });

  it(
    "leaves the address bar, is absent from the surface it opened, and is not written back by the next url write (@AC5)",
    async () => {
      const invoiceId = recordedInvoiceId("unpaid");
      serveInvoice("unpaid");

      const target = await driveFunnel(payLinkTo(invoiceId));

      await expectInstructionSpent();
      expect(keys(target.query ?? {})).not.toContain(QUERY_PARAMS.INIT);

      const { usePlaygroundUrlState } =
        await import("~/composables/usePlaygroundUrlState");
      usePlaygroundUrlState().write({ view: "table" });

      await vi.waitFor(
        () => expect(includes(window.location.search, "view=table")).toBe(true),
        { timeout: 2000 }
      );
      expect(initParamInUrl()).toBeUndefined();
    },
    BEAT_TIMEOUT
  );

  it(
    "does not remount the page it cleared the instruction from (@AC5)",
    async () => {
      const invoiceId = recordedInvoiceId("unpaid");
      serveInvoice("unpaid");
      const before = window.history.length;

      await driveFunnel(payLinkTo(invoiceId));

      await expectInstructionSpent();
      expect(window.history.length).toBe(before);
    },
    BEAT_TIMEOUT
  );

  it(
    "opens the same surface, and spends the instruction again, on a second pass over the same route object (@AC5)",
    async () => {
      const invoiceId = recordedInvoiceId("unpaid");
      serveInvoice("unpaid");
      const route = payLinkTo(invoiceId);

      const first = await driveFunnel(route);
      await expectInstructionSpent();

      // Re-arm the url with the instruction the first pass spent. The guard
      // reads the route object, which still carries it — so a second clear is
      // the witness that the machine ran again rather than the bench replaying
      // the first answer.
      payLinkTo(invoiceId);
      expect(initParamInUrl()).toBe(InitIntent.PAY);

      const second = await driveFunnel(route);
      await expectInstructionSpent();

      expect(second.name).toBe(first.name);
      expect(endsWith(String(second.name), payOverlayName)).toBe(true);
      expect(keys(second.query ?? {})).not.toContain(QUERY_PARAMS.INIT);
    },
    BEAT_TIMEOUT
  );
});
