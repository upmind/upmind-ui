// -----------------------------------------------------------------------------
/**
 * @fileoverview useInvoice surface unit tests — settlement derivation + readiness
 *
 * ## Job To Be Done
 * Pin the settlement view useInvoice derives from a LOADED invoice — paid,
 * free, partially paid, awaiting a first payment — plus the loading / error /
 * availability signals, and the readiness promise. The HTTP + auth seams are
 * mocked; the real load lives in the integration suite.
 *
 * ## Contract
 * The meta view is read AFTER `isReady()` resolves — i.e. once the invoice has
 * loaded. These tests drive the loaded states directly, mirroring that order.
 *
 * ## What Breaks If These Fail
 * The panel re-prompts for payment on a settled invoice, shows a receipt for an
 * unpaid one, or never resolves ready.
 */

import { describe, expect, it, vi, beforeEach } from "vitest";

// -----------------------------------------------------------------------------

const H = vi.hoisted(() => {
  const box = <T>(v: T) => ({ value: v });
  return {
    // `[]` is the real default the query wrapper hands back before a load.
    data: box<unknown>([]),
    error: box<unknown>([]),
    isFetching: box(false),
    isLoading: box(false),
    isFetched: box(true),
    refetch: vi.fn(() => Promise.resolve()),
    isAuthenticated: box(true),
    ensureAuth: vi.fn(() => Promise.resolve(true))
  };
});

vi.mock("../invoices.service", () => ({
  default: {
    queryKey: ["invoices"],
    loadInvoice: () => ({
      data: H.data,
      error: H.error,
      isFetching: H.isFetching,
      isLoading: H.isLoading,
      isFetched: H.isFetched,
      refetch: H.refetch
    })
  }
}));

vi.mock("../../session-store", () => ({
  useActiveSession: () => ({
    useActions: () => ({ isReady: H.ensureAuth }),
    useMeta: () => ({ isAuthenticated: H.isAuthenticated }),
    useContext: () => ({ activeUser: { value: { id: "client-1" } } })
  })
}));

vi.mock("../../query", () => ({
  invalidateQueryByKey: () => vi.fn()
}));

type Loaded = {
  payments: unknown[];
  summary: { paidAmount: number; unpaidAmount: number };
};

function loaded(
  paidAmount: number,
  unpaidAmount: number,
  paymentCount: number
): Loaded {
  return {
    payments: Array.from({ length: paymentCount }, (_, i) => ({ id: `p${i}` })),
    summary: { paidAmount, unpaidAmount }
  };
}

async function freshInvoice() {
  const { useInvoice } = await import("../useInvoice");
  return useInvoice("invoice-1");
}

beforeEach(() => {
  H.data.value = [];
  H.error.value = [];
  H.isFetching.value = false;
  H.isLoading.value = false;
  H.isFetched.value = true;
  H.isAuthenticated.value = true;
  H.refetch.mockClear().mockResolvedValue(undefined);
  H.ensureAuth.mockClear().mockResolvedValue(true);
});

// -----------------------------------------------------------------------------

describe("useInvoice settlement derivation (loaded invoice)", () => {
  it("derives a paid state, available and complete, from payments with nothing owed (@INV-state-paid)", async () => {
    H.data.value = loaded(4, 0, 1);
    const meta = (await freshInvoice()).meta.value;

    expect(meta.isPaid).toBe(true);
    expect(meta.isFree).toBe(false);
    expect(meta.isPartiallyPaid).toBe(false);
    expect(meta.isPending).toBe(false);
    expect(meta.hasError).toBe(false);
    expect(meta.isEmpty).toBe(false);
    expect(meta.isAvailable).toBe(true);
    expect(meta.isComplete).toBe(true);
  });

  it("derives a free state from no payments and nothing owed (@INV-state-free)", async () => {
    H.data.value = loaded(0, 0, 0);
    const meta = (await freshInvoice()).meta.value;

    expect(meta.isFree).toBe(true);
    expect(meta.isPaid).toBe(false);
    expect(meta.isPending).toBe(false);
  });

  it("derives a partial state from a paid part and a remaining balance (@INV-state-partial)", async () => {
    H.data.value = loaded(50, 22, 1);
    const meta = (await freshInvoice()).meta.value;

    expect(meta.isPartiallyPaid).toBe(true);
    expect(meta.isPaid).toBe(false);
    expect(meta.isFree).toBe(false);
  });

  it("derives a first-payment-pending state from no payments and a balance (@INV-state-pending)", async () => {
    H.data.value = loaded(0, 72, 0);
    const meta = (await freshInvoice()).meta.value;

    expect(meta.isPending).toBe(true);
    expect(meta.isFree).toBe(false);
    expect(meta.isPaid).toBe(false);
  });

  it("reports a background refetch of a loaded invoice as loading, not complete", async () => {
    H.data.value = loaded(0, 72, 0);
    H.isFetched.value = false;
    H.isFetching.value = true;
    const meta = (await freshInvoice()).meta.value;

    expect(meta.isLoading).toBe(true);
    expect(meta.isFetching).toBe(true);
    expect(meta.isComplete).toBe(false);
  });
});

describe("useInvoice readiness (@INV-ready)", () => {
  it("resolves true once the fetch settles for an authenticated session", async () => {
    vi.useFakeTimers();
    try {
      H.isAuthenticated.value = true;
      H.isFetched.value = true;

      const invoice = await freshInvoice();
      const ready = invoice.isReady();
      await vi.advanceTimersByTimeAsync(100);

      await expect(ready).resolves.toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it("authenticates then refetches when the session is not yet ready", async () => {
    H.isAuthenticated.value = false;
    H.ensureAuth.mockResolvedValue(true);

    await expect((await freshInvoice()).isReady()).resolves.toBe(true);
    expect(H.ensureAuth).toHaveBeenCalledOnce();
    expect(H.refetch).toHaveBeenCalledOnce();
  });

  it("resolves false when authentication is refused", async () => {
    H.isAuthenticated.value = false;
    H.ensureAuth.mockResolvedValue(false);

    await expect((await freshInvoice()).isReady()).resolves.toBe(false);
    expect(H.refetch).not.toHaveBeenCalled();
  });

  it("resolves false when authentication throws", async () => {
    H.isAuthenticated.value = false;
    H.ensureAuth.mockRejectedValue(new Error("network"));

    await expect((await freshInvoice()).isReady()).resolves.toBe(false);
  });
});
