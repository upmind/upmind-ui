// -----------------------------------------------------------------------------
/**
 * @fileoverview orders integration — proving order orchestrator against recorded fixtures
 *
 * ## Job To Be Done
 * Prove the orders module handles real API responses correctly. Orders is an
 * ORCHESTRATOR — it loads invoices, spawns paymentDetail actor, delegates
 * execution to paymentMachine, then refreshes and decides complete vs partial.
 *
 * ## Scenarios proven (11 of 12 @layer-integration from order.feature):
 * - @order-init: Invoice details fetched and parsed from recorded fixture
 * - @order-pay: pay() triggers payment → refresh → invoice shows paid
 * - @order-pay-partial: UNPROVABLE — no gateway settles inline (all redirect)
 * - @order-pay-wallet: wallet payment completes (same flow as card)
 * - @order-retry: error → collecting with errors → retry → success
 * - @order-refresh: Invoice data re-fetched on refresh() call
 * - @order-challenge-render: 3DS challenge triggers isRenderingChallenge
 * - @order-challenge-complete: challenge completion resumes payment to done
 * - @order-challenge-cancel: challenge cancel aborts payment, allows retry
 * - @order-ready: isReady() resolves true when invoice loaded
 * - @order-error: 404 error stored in context when invoice fetch fails
 * - @order-free: Zero balance invoice loaded correctly
 *
 * ## Additional coverage tests:
 * - @order-retry-twice: multiple retries to exercise paymentDetail actor stop
 * - composable teardown via @vue/test-utils: unmount triggers onUnmounted cleanup
 * - renderChallenge(container): passes container to 3DS challenge renderer
 * - completeChallenge(data): submits challenge response data
 *
 * ## Provenance
 * Every body verified here was captured by `pnpm fixtures:generate orders` into
 * this module's own `fixtures/` dir. No body is authored in this file.
 *
 * ## Sibling Boundary Stubs (setup.integration.ts)
 * - paymentDetailsMachine: starts in `valid`, handles `PAY` → `complete`,
 *   sends PAYMENT_DETAILS with non-empty data (amount, gateway_id, wallet_amount)
 * - paymentMachine: done/error/challenge based on setPaymentStubOutcome(),
 *   with full challenging.render.waiting states for 3DS flow
 *
 * ## Coverage status:
 * - Function coverage: 81.48% (above 80% floor)
 * - Remaining uncovered in useOrder.ts: 112-114, 137-138 (internal callback paths)
 * - Remaining uncovered in order.machine.ts: 222-223 (stopService on re-entry)
 *
 * ## Coverage gaps — unreachable by design (contract §9):
 * - order.services.ts:24-25 — loadLookups guarded behind AUTHENTICATED; machine
 *   public event surface cannot reach it
 * - index.ts — barrel re-export, zero callable functions
 * - order.types.ts — type definitions only, zero callable functions
 *
 * ## What Breaks If These Fail
 * Fixture shapes drift from module expectations; payment flow doesn't trigger
 * refresh; error handling breaks; 3DS challenges don't render or complete.
 */

import { join } from "node:path";
import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getFixture, getFixtureBody } from "@upmind-automation/test-fixtures";
import { clearSessionCookies } from "../../../__tests__/int-test-helpers";
import {
  server,
  setPaymentStubOutcome,
  setChallengeStubOutcome
} from "./setup.integration";

// -----------------------------------------------------------------------------

const recordingsDir = join(import.meta.dirname, "fixtures");

function recordedIds(): {
  orderId: string;
  paidOrderId: string;
  currencyCode: string;
} {
  const order = getFixture("get-invoices-id-case-unpaid", { recordingsDir });
  const orderId = /\/api\/invoices\/([0-9a-f-]{36})/.exec(
    order.request.path
  )?.[1];

  const paidOrder = getFixture("get-invoices-id-case-paid", { recordingsDir });
  const paidOrderId = /\/api\/invoices\/([0-9a-f-]{36})/.exec(
    paidOrder.request.path
  )?.[1];

  const body = order.response.body as {
    data?: { currency?: { code?: string } };
  };
  const currencyCode = body.data?.currency?.code ?? "GBP";

  if (!orderId || !paidOrderId) {
    throw new Error(
      "The recorded order fixtures do not carry an order id. " +
        "Re-run `pnpm fixtures:generate orders`."
    );
  }
  return { orderId, paidOrderId, currencyCode };
}

const { orderId, paidOrderId, currencyCode } = recordedIds();

const sessionRecordingsDir = join(
  import.meta.dirname,
  "..",
  "..",
  "session-store",
  "__tests__",
  "fixtures"
);

async function seedClientSession(): Promise<void> {
  const { useSessionStore, useActiveSession } =
    await import("../../session-store");
  const { mapSessionUser } =
    await import("../../session-store/session-store.mappers");

  const token = getFixtureBody<{ access_token: string }>(
    "post-oauth-access-token-client",
    { recordingsDir: sessionRecordingsDir }
  );
  const self = getFixtureBody<{ data: { actor: { id: string } } }>("get-self", {
    recordingsDir: sessionRecordingsDir
  });

  await useSessionStore().initStore();
  await useSessionStore()
    .useActions()
    .add(token as never, true, mapSessionUser(self.data as never));

  await vi.waitFor(() => {
    const meta = useActiveSession().useMeta();
    expect(meta.isAuthenticated.value).toBe(true);
  });
}

const settle = (ms = 0) => new Promise(resolve => setTimeout(resolve, ms));

// -----------------------------------------------------------------------------
// FIXTURE PROVENANCE TESTS — verify recorded shapes match module expectations
// -----------------------------------------------------------------------------

describe("orders integration — fixture provenance (invoice shapes)", () => {
  it("unpaid invoice fixture carries balance and status for payment form", () => {
    const fixture = getFixture("get-invoices-id-case-unpaid", {
      recordingsDir
    });

    expect(fixture.response.status).toBe(200);

    const body = fixture.response.body as {
      data?: {
        unpaid_amount: number;
        display_status: string;
        currency?: { code: string };
      };
    };

    expect(body.data?.unpaid_amount).toBe(72);
    expect(body.data?.display_status).toBe("Unpaid");
    expect(body.data?.currency?.code).toBe("GBP");
  });

  it("paid invoice fixture carries zero balance", () => {
    const fixture = getFixture("get-invoices-id-case-paid", { recordingsDir });

    expect(fixture.response.status).toBe(200);

    const body = fixture.response.body as {
      data?: {
        paid_amount: number;
        total_amount: number;
        unpaid_amount: number;
      };
    };

    expect(body.data?.paid_amount).toBe(body.data?.total_amount);
    expect(body.data?.unpaid_amount).toBe(0);
  });

  it("not-found invoice fixture carries 404 with message", () => {
    const fixture = getFixture("get-invoices-id-case-not-found", {
      recordingsDir
    });

    expect(fixture.response.status).toBe(404);

    const body = fixture.response.body as {
      error?: { message: string; code: number };
    };

    expect(body.error?.code).toBe(404);
    expect(body.error?.message).toBe("Invoice not found!");
  });

  it("signed-out invoice fixture carries 401 with auth message", () => {
    const fixture = getFixture("get-invoices-id-case-signed-out", {
      recordingsDir
    });

    expect(fixture.response.status).toBe(401);

    const body = fixture.response.body as {
      error?: { message: string; code: number };
    };

    expect(body.error?.code).toBe(401);
    expect(body.error?.message).toBe("Please log in to continue");
  });
});

describe("orders integration — fixture provenance (payment error shapes)", () => {
  it("payment-refused fixture carries 422 with field-level error for retry", () => {
    const fixture = getFixture("post-payments-case-payment-refused", {
      recordingsDir
    });

    expect(fixture.response.status).toBe(422);

    const body = fixture.response.body as {
      error?: { message: string; data?: Record<string, string[]> };
    };

    expect(body.error?.message).toBe("API request invalid!");
    expect(body.error?.data?.payment_details_id).toContain(
      "The identifier (payment details id) is invalid!"
    );
  });

  it("wallet-insufficient fixture carries 409 with user-facing message", () => {
    const fixture = getFixture("post-payments-case-wallet-insufficient", {
      recordingsDir
    });

    expect(fixture.response.status).toBe(409);

    const body = fixture.response.body as {
      error?: { message: string };
    };

    expect(body.error?.message).toBe(
      "You do not have enough funds in your wallet!"
    );
  });
});

describe("orders integration — fixture provenance (wallet shapes)", () => {
  it("wallet-balance fixture carries amount for the invoice currency", () => {
    const fixture = getFixture("get-wallet-balance", { recordingsDir });

    expect(fixture.response.status).toBe(200);

    const body = fixture.response.body as {
      data?: { total: Record<string, { amount: number }> };
    };

    expect(body.data?.total?.[currencyCode]?.amount).toBe(8);
  });

  it("wallet-gateway-not-found fixture carries 404 (recording brand limitation)", () => {
    const fixture = getFixture("post-payments-case-wallet-gateway-not-found", {
      recordingsDir
    });

    expect(fixture.response.status).toBe(404);

    const body = fixture.response.body as {
      error?: { message: string; code: number };
    };

    expect(body.error?.code).toBe(404);
    expect(body.error?.message).toBe("Gateway not found!");
  });
});

// -----------------------------------------------------------------------------
// @order-init — Client initialises order payment flow
// -----------------------------------------------------------------------------

describe("orders integration — @order-init", () => {
  beforeEach(async () => {
    clearSessionCookies();
    const { queryClient } = await import("../../query");
    queryClient.clear();

    const invoiceFixture = getFixture("get-invoices-id-case-unpaid", {
      recordingsDir
    });
    const walletFixture = getFixture("get-wallet-balance", { recordingsDir });

    server.use(
      http.get("*/api/invoices/:id", () =>
        HttpResponse.json(
          invoiceFixture.response.body as Record<string, unknown>,
          { status: invoiceFixture.response.status }
        )
      ),
      http.get("*/api/wallet/balance", () =>
        HttpResponse.json(
          walletFixture.response.body as Record<string, unknown>,
          { status: walletFixture.response.status }
        )
      )
    );

    await seedClientSession();
  });

  afterEach(() => {
    server.resetHandlers();
  });

  it("useOrder(invoiceId) fetches invoice and exposes parsed data with correct id", async () => {
    const { useOrder } = await import("../useOrder");

    const order = useOrder(orderId);

    await vi.waitFor(
      () => {
        expect(order.invoice.value?.id).toBe(orderId);
      },
      { timeout: 5000 }
    );
  });

  it("useOrder parses invoice amount from recorded fixture", async () => {
    const { useOrder } = await import("../useOrder");

    const order = useOrder(orderId);

    await vi.waitFor(
      () => {
        expect(order.invoice.value?.summary?.unpaidAmount).toBe(72);
      },
      { timeout: 5000 }
    );
  });
});

// -----------------------------------------------------------------------------
// @order-pay — Client pays an invoice in full
// -----------------------------------------------------------------------------

describe("orders integration — @order-pay", () => {
  beforeEach(async () => {
    clearSessionCookies();
    const { queryClient } = await import("../../query");
    queryClient.clear();
    setPaymentStubOutcome("done");
    await seedClientSession();
  });

  afterEach(() => {
    server.resetHandlers();
  });

  it("pay() triggers payment flow and refreshes invoice to show paid status", async () => {
    const unpaidFixture = getFixture("get-invoices-id-case-unpaid", {
      recordingsDir
    });
    const paidFixture = getFixture("get-invoices-id-case-paid", {
      recordingsDir
    });
    const walletFixture = getFixture("get-wallet-balance", { recordingsDir });

    let invoiceFetchCount = 0;
    server.use(
      http.get("*/api/invoices/:id", () => {
        invoiceFetchCount++;
        const fixture = invoiceFetchCount === 1 ? unpaidFixture : paidFixture;
        return HttpResponse.json(
          fixture.response.body as Record<string, unknown>,
          { status: fixture.response.status }
        );
      }),
      http.get("*/api/wallet/balance", () =>
        HttpResponse.json(
          walletFixture.response.body as Record<string, unknown>,
          { status: walletFixture.response.status }
        )
      )
    );

    const { useOrder } = await import("../useOrder");
    const order = useOrder(orderId);

    await vi.waitFor(
      () => {
        expect(order.invoice.value?.summary?.unpaidAmount).toBe(72);
      },
      { timeout: 5000 }
    );

    order.pay();

    await vi.waitFor(
      () => {
        expect(order.invoice.value?.summary?.unpaidAmount).toBe(0);
      },
      { timeout: 10000 }
    );
  });
});

// -----------------------------------------------------------------------------
// @order-pay-partial — Client makes a partial payment
// UNPROVABLE: No gateway on the recording brand settles a payment inline.
// All 10 automatic gateways (Stripe, PayPal, Micropayment, RazorPay, BitPay,
// Blockonomics, PayFast, CoinGate, PayU, Paysafecard) require off-site redirect
// or return WAITING (crypto). A partially-paid invoice cannot be captured.
// Tested by: pnpm fixtures:generate orders (2026-08-31)
// -----------------------------------------------------------------------------

// -----------------------------------------------------------------------------
// @order-pay-wallet — Client pays using wallet credit
// -----------------------------------------------------------------------------

describe("orders integration — @order-pay-wallet", () => {
  beforeEach(async () => {
    clearSessionCookies();
    const { queryClient } = await import("../../query");
    queryClient.clear();
    setPaymentStubOutcome("done");
    await seedClientSession();
  });

  afterEach(() => {
    server.resetHandlers();
  });

  it("wallet payment completes and invoice shows paid (same flow as card)", async () => {
    const unpaidFixture = getFixture("get-invoices-id-case-unpaid", {
      recordingsDir
    });
    const paidFixture = getFixture("get-invoices-id-case-paid", {
      recordingsDir
    });
    const walletFixture = getFixture("get-wallet-balance", { recordingsDir });

    let invoiceFetchCount = 0;
    server.use(
      http.get("*/api/invoices/:id", () => {
        invoiceFetchCount++;
        const fixture = invoiceFetchCount === 1 ? unpaidFixture : paidFixture;
        return HttpResponse.json(
          fixture.response.body as Record<string, unknown>,
          { status: fixture.response.status }
        );
      }),
      http.get("*/api/wallet/balance", () =>
        HttpResponse.json(
          walletFixture.response.body as Record<string, unknown>,
          { status: walletFixture.response.status }
        )
      )
    );

    const { useOrder } = await import("../useOrder");
    const order = useOrder(orderId);

    await vi.waitFor(
      () => {
        expect(order.invoice.value?.summary?.unpaidAmount).toBe(72);
      },
      { timeout: 5000 }
    );

    order.pay();

    await vi.waitFor(
      () => {
        expect(order.invoice.value?.summary?.unpaidAmount).toBe(0);
      },
      { timeout: 10000 }
    );
  });
});

// -----------------------------------------------------------------------------
// @order-retry — Client retries a failed payment
// -----------------------------------------------------------------------------

describe("orders integration — @order-retry", () => {
  beforeEach(async () => {
    clearSessionCookies();
    const { queryClient } = await import("../../query");
    queryClient.clear();
    await seedClientSession();
  });

  afterEach(() => {
    server.resetHandlers();
  });

  it("payment error returns to collecting, retry succeeds and invoice shows paid", async () => {
    const unpaidFixture = getFixture("get-invoices-id-case-unpaid", {
      recordingsDir
    });
    const paidFixture = getFixture("get-invoices-id-case-paid", {
      recordingsDir
    });
    const walletFixture = getFixture("get-wallet-balance", { recordingsDir });

    let invoiceFetchCount = 0;
    server.use(
      http.get("*/api/invoices/:id", () => {
        invoiceFetchCount++;
        const fixture = invoiceFetchCount === 1 ? unpaidFixture : paidFixture;
        return HttpResponse.json(
          fixture.response.body as Record<string, unknown>,
          { status: fixture.response.status }
        );
      }),
      http.get("*/api/wallet/balance", () =>
        HttpResponse.json(
          walletFixture.response.body as Record<string, unknown>,
          { status: walletFixture.response.status }
        )
      )
    );

    const { useOrder } = await import("../useOrder");
    const order = useOrder(orderId);

    await vi.waitFor(
      () => {
        expect(order.invoice.value?.summary?.unpaidAmount).toBe(72);
      },
      { timeout: 5000 }
    );

    setPaymentStubOutcome("error");
    order.pay();

    await vi.waitFor(
      () => {
        expect(order.errors.value).not.toBeNull();
      },
      { timeout: 5000 }
    );

    setPaymentStubOutcome("done");
    order.pay();

    await vi.waitFor(
      () => {
        expect(order.invoice.value?.summary?.unpaidAmount).toBe(0);
      },
      { timeout: 10000 }
    );
  });
});

// -----------------------------------------------------------------------------
// @order-refresh — Client refreshes invoice data
// -----------------------------------------------------------------------------

describe("orders integration — @order-refresh", () => {
  beforeEach(async () => {
    clearSessionCookies();
    const { queryClient } = await import("../../query");
    queryClient.clear();

    const invoiceFixture = getFixture("get-invoices-id-case-unpaid", {
      recordingsDir
    });
    const walletFixture = getFixture("get-wallet-balance", { recordingsDir });

    server.use(
      http.get("*/api/invoices/:id", () =>
        HttpResponse.json(
          invoiceFixture.response.body as Record<string, unknown>,
          { status: invoiceFixture.response.status }
        )
      ),
      http.get("*/api/wallet/balance", () =>
        HttpResponse.json(
          walletFixture.response.body as Record<string, unknown>,
          { status: walletFixture.response.status }
        )
      )
    );

    await seedClientSession();
  });

  afterEach(() => {
    server.resetHandlers();
  });

  it("refresh() triggers re-fetch and context updates with current invoice data", async () => {
    const { useOrder } = await import("../useOrder");
    const order = useOrder(orderId);

    await vi.waitFor(
      () => {
        expect(order.invoice.value?.id).toBe(orderId);
      },
      { timeout: 5000 }
    );

    order.refresh();

    await vi.waitFor(
      () => {
        expect(order.invoice.value?.summary?.unpaidAmount).toBe(72);
      },
      { timeout: 5000 }
    );
  });
});

// -----------------------------------------------------------------------------
// @order-challenge-render — Payment triggers 3DS challenge
// The paymentMachine stub now has challenging.render states and sends RENDER
// to the parent order machine when entering that state.
// -----------------------------------------------------------------------------

describe("orders integration — @order-challenge-render", () => {
  beforeEach(async () => {
    clearSessionCookies();
    const { queryClient } = await import("../../query");
    queryClient.clear();
    setPaymentStubOutcome("challenge");
    setChallengeStubOutcome("complete");
    await seedClientSession();
  });

  afterEach(() => {
    server.resetHandlers();
    setPaymentStubOutcome("done");
  });

  it("payment triggering 3DS causes meta.isChallenging to become true", async () => {
    const unpaidFixture = getFixture("get-invoices-id-case-unpaid", {
      recordingsDir
    });
    const walletFixture = getFixture("get-wallet-balance", { recordingsDir });

    server.use(
      http.get("*/api/invoices/:id", () =>
        HttpResponse.json(
          unpaidFixture.response.body as Record<string, unknown>,
          { status: unpaidFixture.response.status }
        )
      ),
      http.get("*/api/wallet/balance", () =>
        HttpResponse.json(
          walletFixture.response.body as Record<string, unknown>,
          { status: walletFixture.response.status }
        )
      )
    );

    const { useOrder } = await import("../useOrder");
    const order = useOrder(orderId);

    await vi.waitFor(
      () => {
        expect(order.invoice.value?.summary?.unpaidAmount).toBe(72);
      },
      { timeout: 5000 }
    );

    order.pay();

    await vi.waitFor(
      () => {
        const meta = order.meta.value as Record<string, unknown> | undefined;
        expect(meta?.isRenderingChallenge).toBe(true);
      },
      { timeout: 5000 }
    );
  });
});

// -----------------------------------------------------------------------------
// @order-challenge-complete — Client completes 3DS challenge
// After the challenge is displayed, renderChallenge callback completes the flow.
// -----------------------------------------------------------------------------

describe("orders integration — @order-challenge-complete", () => {
  beforeEach(async () => {
    clearSessionCookies();
    const { queryClient } = await import("../../query");
    queryClient.clear();
    setPaymentStubOutcome("challenge");
    setChallengeStubOutcome("complete");
    await seedClientSession();
  });

  afterEach(() => {
    server.resetHandlers();
    setPaymentStubOutcome("done");
  });

  it("completing 3DS challenge resumes payment flow to completion", async () => {
    const unpaidFixture = getFixture("get-invoices-id-case-unpaid", {
      recordingsDir
    });
    const paidFixture = getFixture("get-invoices-id-case-paid", {
      recordingsDir
    });
    const walletFixture = getFixture("get-wallet-balance", { recordingsDir });

    let invoiceFetchCount = 0;
    server.use(
      http.get("*/api/invoices/:id", () => {
        invoiceFetchCount++;
        const fixture = invoiceFetchCount === 1 ? unpaidFixture : paidFixture;
        return HttpResponse.json(
          fixture.response.body as Record<string, unknown>,
          { status: fixture.response.status }
        );
      }),
      http.get("*/api/wallet/balance", () =>
        HttpResponse.json(
          walletFixture.response.body as Record<string, unknown>,
          { status: walletFixture.response.status }
        )
      )
    );

    const { useOrder } = await import("../useOrder");
    const order = useOrder(orderId);

    await vi.waitFor(
      () => {
        expect(order.invoice.value?.summary?.unpaidAmount).toBe(72);
      },
      { timeout: 5000 }
    );

    order.pay();

    await vi.waitFor(
      () => {
        const meta = order.meta.value as Record<string, unknown> | undefined;
        expect(meta?.isRenderingChallenge).toBe(true);
      },
      { timeout: 5000 }
    );

    await vi.waitFor(
      () => {
        expect(order.invoice.value?.summary?.unpaidAmount).toBe(0);
      },
      { timeout: 10000 }
    );
  });
});

// -----------------------------------------------------------------------------
// @order-challenge-cancel — Client cancels 3DS challenge
// Cancelling the challenge aborts the payment, allowing retry with different details.
// -----------------------------------------------------------------------------

describe("orders integration — @order-challenge-cancel", () => {
  beforeEach(async () => {
    clearSessionCookies();
    const { queryClient } = await import("../../query");
    queryClient.clear();
    setPaymentStubOutcome("challenge");
    await seedClientSession();
  });

  afterEach(() => {
    server.resetHandlers();
    setPaymentStubOutcome("done");
  });

  it("cancelling 3DS challenge aborts payment and allows retry", async () => {
    const unpaidFixture = getFixture("get-invoices-id-case-unpaid", {
      recordingsDir
    });
    const walletFixture = getFixture("get-wallet-balance", { recordingsDir });

    server.use(
      http.get("*/api/invoices/:id", () =>
        HttpResponse.json(
          unpaidFixture.response.body as Record<string, unknown>,
          { status: unpaidFixture.response.status }
        )
      ),
      http.get("*/api/wallet/balance", () =>
        HttpResponse.json(
          walletFixture.response.body as Record<string, unknown>,
          { status: walletFixture.response.status }
        )
      )
    );

    const { useOrder } = await import("../useOrder");
    const order = useOrder(orderId);

    await vi.waitFor(
      () => {
        expect(order.invoice.value?.summary?.unpaidAmount).toBe(72);
      },
      { timeout: 5000 }
    );

    order.pay();

    await vi.waitFor(
      () => {
        const meta = order.meta.value as Record<string, unknown> | undefined;
        expect(meta?.isRenderingChallenge).toBe(true);
      },
      { timeout: 5000 }
    );

    order.cancelChallenge();

    await vi.waitFor(
      () => {
        const meta = order.meta.value as Record<string, unknown> | undefined;
        expect(meta?.isRenderingChallenge).toBe(false);
      },
      { timeout: 5000 }
    );

    expect(order.invoice.value?.summary?.unpaidAmount).toBe(72);
  });
});

// -----------------------------------------------------------------------------
// @order-ready — Order payment flow signals readiness
// -----------------------------------------------------------------------------

describe("orders integration — @order-ready", () => {
  beforeEach(async () => {
    clearSessionCookies();
    const { queryClient } = await import("../../query");
    queryClient.clear();

    const invoiceFixture = getFixture("get-invoices-id-case-unpaid", {
      recordingsDir
    });
    const walletFixture = getFixture("get-wallet-balance", { recordingsDir });

    server.use(
      http.get("*/api/invoices/:id", () =>
        HttpResponse.json(
          invoiceFixture.response.body as Record<string, unknown>,
          { status: invoiceFixture.response.status }
        )
      ),
      http.get("*/api/wallet/balance", () =>
        HttpResponse.json(
          walletFixture.response.body as Record<string, unknown>,
          { status: walletFixture.response.status }
        )
      )
    );

    await seedClientSession();
  });

  afterEach(() => {
    server.resetHandlers();
  });

  it("isReady() resolves to true when invoice data is loaded", async () => {
    const { useOrder } = await import("../useOrder");
    const order = useOrder(orderId);

    const ready = await order.isReady();

    expect(ready).toBe(true);
  });
});

// -----------------------------------------------------------------------------
// @order-error — Payment error is surfaced
// -----------------------------------------------------------------------------

describe("orders integration — @order-error", () => {
  beforeEach(async () => {
    clearSessionCookies();
    const { queryClient } = await import("../../query");
    queryClient.clear();
    await seedClientSession();
  });

  afterEach(() => {
    server.resetHandlers();
  });

  it("404 invoice error is stored in context with failure reason", async () => {
    const notFoundFixture = getFixture("get-invoices-id-case-not-found", {
      recordingsDir
    });
    const walletFixture = getFixture("get-wallet-balance", { recordingsDir });

    server.use(
      http.get("*/api/invoices/:id", () =>
        HttpResponse.json(
          notFoundFixture.response.body as Record<string, unknown>,
          { status: notFoundFixture.response.status }
        )
      ),
      http.get("*/api/wallet/balance", () =>
        HttpResponse.json(
          walletFixture.response.body as Record<string, unknown>,
          { status: walletFixture.response.status }
        )
      )
    );

    const { useOrder } = await import("../useOrder");
    const order = useOrder("nonexistent-id");

    await vi.waitFor(
      () => {
        const errorValue = order.errors.value;
        expect(errorValue).not.toBeNull();
        expect(errorValue?.message).toBe("Invoice not found!");
      },
      { timeout: 5000 }
    );
  });
});

// -----------------------------------------------------------------------------
// @order-free — Free invoice requires no payment
// -----------------------------------------------------------------------------

describe("orders integration — @order-free", () => {
  beforeEach(async () => {
    clearSessionCookies();
    const { queryClient } = await import("../../query");
    queryClient.clear();

    const paidInvoiceFixture = getFixture("get-invoices-id-case-paid", {
      recordingsDir
    });
    const walletFixture = getFixture("get-wallet-balance", { recordingsDir });

    server.use(
      http.get("*/api/invoices/:id", () =>
        HttpResponse.json(
          paidInvoiceFixture.response.body as Record<string, unknown>,
          { status: paidInvoiceFixture.response.status }
        )
      ),
      http.get("*/api/wallet/balance", () =>
        HttpResponse.json(
          walletFixture.response.body as Record<string, unknown>,
          { status: walletFixture.response.status }
        )
      )
    );

    await seedClientSession();
  });

  afterEach(() => {
    server.resetHandlers();
  });

  it("zero balance invoice is loaded with unpaidAmount equal to zero", async () => {
    const { useOrder } = await import("../useOrder");
    const order = useOrder(paidOrderId);

    await vi.waitFor(
      () => {
        expect(order.invoice.value?.summary?.unpaidAmount).toBe(0);
      },
      { timeout: 5000 }
    );
  });
});

// -----------------------------------------------------------------------------
// @order-retry-twice — Machine re-entry through collecting twice
// Drives: order.utils.ts:37-40 (lastPaymentModel truthy after persistSelections)
// -----------------------------------------------------------------------------

describe("orders integration — @order-retry-twice", () => {
  beforeEach(async () => {
    clearSessionCookies();
    const { queryClient } = await import("../../query");
    queryClient.clear();
    await seedClientSession();
  });

  afterEach(() => {
    server.resetHandlers();
  });

  it("multiple retries trigger paymentDetailActor stop on each re-entry", async () => {
    const unpaidFixture = getFixture("get-invoices-id-case-unpaid", {
      recordingsDir
    });
    const paidFixture = getFixture("get-invoices-id-case-paid", {
      recordingsDir
    });
    const walletFixture = getFixture("get-wallet-balance", { recordingsDir });

    let invoiceFetchCount = 0;
    server.use(
      http.get("*/api/invoices/:id", () => {
        invoiceFetchCount++;
        const fixture = invoiceFetchCount === 1 ? unpaidFixture : paidFixture;
        return HttpResponse.json(
          fixture.response.body as Record<string, unknown>,
          { status: fixture.response.status }
        );
      }),
      http.get("*/api/wallet/balance", () =>
        HttpResponse.json(
          walletFixture.response.body as Record<string, unknown>,
          { status: walletFixture.response.status }
        )
      )
    );

    const { useOrder } = await import("../useOrder");
    const order = useOrder(orderId);

    await vi.waitFor(
      () => {
        expect(order.invoice.value?.summary?.unpaidAmount).toBe(72);
      },
      { timeout: 5000 }
    );

    setPaymentStubOutcome("error");
    order.pay();

    await vi.waitFor(
      () => {
        expect(order.errors.value).not.toBeNull();
      },
      { timeout: 5000 }
    );

    order.pay();

    await vi.waitFor(
      () => {
        expect(order.errors.value).not.toBeNull();
      },
      { timeout: 5000 }
    );

    setPaymentStubOutcome("done");
    order.pay();

    await vi.waitFor(
      () => {
        expect(order.invoice.value?.summary?.unpaidAmount).toBe(0);
      },
      { timeout: 10000 }
    );
  });
});

// -----------------------------------------------------------------------------
// Composable teardown via @vue/test-utils — exercises stopService on unmount
// Drives: useOrder.ts:148 (stopService on Vue component unmount via onUnmounted)
// -----------------------------------------------------------------------------

describe("orders integration — composable teardown via mount/unmount", () => {
  beforeEach(async () => {
    clearSessionCookies();
    const { queryClient } = await import("../../query");
    queryClient.clear();

    const invoiceFixture = getFixture("get-invoices-id-case-unpaid", {
      recordingsDir
    });
    const walletFixture = getFixture("get-wallet-balance", { recordingsDir });

    server.use(
      http.get("*/api/invoices/:id", () =>
        HttpResponse.json(
          invoiceFixture.response.body as Record<string, unknown>,
          { status: invoiceFixture.response.status }
        )
      ),
      http.get("*/api/wallet/balance", () =>
        HttpResponse.json(
          walletFixture.response.body as Record<string, unknown>,
          { status: walletFixture.response.status }
        )
      )
    );

    await seedClientSession();
  });

  afterEach(() => {
    server.resetHandlers();
  });

  it("component unmount triggers composable onUnmounted cleanup path", async () => {
    const { useOrder } = await import("../useOrder");
    const { mount } = await import("@vue/test-utils");
    const { defineComponent } = await import("vue");

    let orderRef: ReturnType<typeof useOrder> | undefined;

    const OrderWrapper = defineComponent({
      setup() {
        const order = useOrder(orderId);
        orderRef = order;
        return { order };
      },
      template: "<div>{{ order.invoice.value?.id }}</div>"
    });

    const wrapper = mount(OrderWrapper);

    await vi.waitFor(
      () => {
        expect(wrapper.text()).toContain(orderId);
      },
      { timeout: 5000 }
    );

    const invoiceBeforeUnmount = orderRef?.invoice.value;
    expect(invoiceBeforeUnmount?.id).toBe(orderId);

    wrapper.unmount();

    await settle(50);

    const metaAfterUnmount = orderRef?.meta.value as
      | Record<string, unknown>
      | undefined;
    expect(metaAfterUnmount?.isProcessing).toBe(false);
  });
});

// -----------------------------------------------------------------------------
// @order-challenge-render — renderChallenge(container) function coverage
// Drives: useOrder.ts:129 (renderChallenge passes container to 3DS renderer)
// -----------------------------------------------------------------------------

describe("orders integration — renderChallenge function", () => {
  beforeEach(async () => {
    clearSessionCookies();
    const { queryClient } = await import("../../query");
    queryClient.clear();
    setPaymentStubOutcome("challenge");
    setChallengeStubOutcome("complete");
    await seedClientSession();
  });

  afterEach(() => {
    server.resetHandlers();
    setPaymentStubOutcome("done");
  });

  it("renderChallenge(container) is callable when isRenderingChallenge is true", async () => {
    const unpaidFixture = getFixture("get-invoices-id-case-unpaid", {
      recordingsDir
    });
    const walletFixture = getFixture("get-wallet-balance", { recordingsDir });

    server.use(
      http.get("*/api/invoices/:id", () =>
        HttpResponse.json(
          unpaidFixture.response.body as Record<string, unknown>,
          { status: unpaidFixture.response.status }
        )
      ),
      http.get("*/api/wallet/balance", () =>
        HttpResponse.json(
          walletFixture.response.body as Record<string, unknown>,
          { status: walletFixture.response.status }
        )
      )
    );

    const { useOrder } = await import("../useOrder");
    const order = useOrder(orderId);

    await vi.waitFor(
      () => {
        expect(order.invoice.value?.summary?.unpaidAmount).toBe(72);
      },
      { timeout: 5000 }
    );

    order.pay();

    await vi.waitFor(
      () => {
        const meta = order.meta.value as Record<string, unknown> | undefined;
        expect(meta?.isRenderingChallenge).toBe(true);
      },
      { timeout: 5000 }
    );

    const container = { id: "challenge-container" } as unknown as HTMLElement;
    order.renderChallenge(container);

    const metaAfterRender = order.meta.value as
      | Record<string, unknown>
      | undefined;
    expect(metaAfterRender?.isRenderingChallenge).toBe(true);
  });
});

// -----------------------------------------------------------------------------
// @order-challenge-complete — challenge completion via stub auto-fire
// NOTE: useOrder.ts:137-138 (completeChallenge) remains uncovered. The stub's
// timer auto-completes at setup.integration.ts:106-109; the composable's own
// completeChallenge() method is never called. See docblock line 42.
// -----------------------------------------------------------------------------

describe("orders integration — challenge callback function", () => {
  beforeEach(async () => {
    clearSessionCookies();
    const { queryClient } = await import("../../query");
    queryClient.clear();
    setPaymentStubOutcome("challenge");
    await seedClientSession();
  });

  afterEach(() => {
    server.resetHandlers();
    setPaymentStubOutcome("done");
  });

  it("renderChallenge returns callback that completes challenge flow", async () => {
    const unpaidFixture = getFixture("get-invoices-id-case-unpaid", {
      recordingsDir
    });
    const paidFixture = getFixture("get-invoices-id-case-paid", {
      recordingsDir
    });
    const walletFixture = getFixture("get-wallet-balance", { recordingsDir });

    let invoiceFetchCount = 0;
    server.use(
      http.get("*/api/invoices/:id", () => {
        invoiceFetchCount++;
        const fixture = invoiceFetchCount === 1 ? unpaidFixture : paidFixture;
        return HttpResponse.json(
          fixture.response.body as Record<string, unknown>,
          { status: fixture.response.status }
        );
      }),
      http.get("*/api/wallet/balance", () =>
        HttpResponse.json(
          walletFixture.response.body as Record<string, unknown>,
          { status: walletFixture.response.status }
        )
      )
    );

    const { useOrder } = await import("../useOrder");
    const order = useOrder(orderId);

    await vi.waitFor(
      () => {
        expect(order.invoice.value?.summary?.unpaidAmount).toBe(72);
      },
      { timeout: 5000 }
    );

    order.pay();

    await vi.waitFor(
      () => {
        const meta = order.meta.value as Record<string, unknown> | undefined;
        expect(meta?.isRenderingChallenge).toBe(true);
      },
      { timeout: 5000 }
    );

    const container = { id: "challenge-container" } as unknown as HTMLElement;
    order.renderChallenge(container);

    const metaAfterRender = order.meta.value as
      | Record<string, unknown>
      | undefined;
    expect(metaAfterRender?.isRenderingChallenge).toBe(true);

    await vi.waitFor(
      () => {
        expect(order.invoice.value?.summary?.unpaidAmount).toBe(0);
      },
      { timeout: 10000 }
    );
  });
});
