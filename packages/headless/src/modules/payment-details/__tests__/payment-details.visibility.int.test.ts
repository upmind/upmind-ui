// -----------------------------------------------------------------------------
/**
 * @fileoverview paymentDetails visibility contract — the six-row table a
 * storefront reads before it writes a `v-if`
 *
 * ## Job To Be Done
 * `usePaymentDetail`'s `meta` docblock publishes a six-row table of what a page
 * renders in each scenario: the payment section, the gateway list, the stored
 * methods, the actions, and whether the selection is complete. A storefront
 * binds five `v-if`s straight off that table, so the table IS the contract.
 * Nothing else in this module's suite drives it — the sibling specs each prove a
 * single flag in isolation, never a whole published row. This file drives every
 * row through the real composable over the real machine and asserts the
 * published TABLE, never what the code happens to return.
 *
 * ## The oracle — the published table
 * ```
 * | Scenario                       | Section | Gateways | Stored | Actions | Complete |
 * | Normal order, no selection     | YES     | YES      | YES*   | NO      | NO       |
 * | Normal order, gateway selected | YES     | NO       | NO     | YES     | NO       |
 * | Free, no capture needed        | NO      | NO       | NO     | YES     | YES      |
 * | Free, capture needed           | YES     | YES      | YES*   | NO      | NO       |
 * | ADD context (save card)        | YES     | YES      | NO     | NO      | NO       |
 * | Wallet fully covers            | YES     | NO       | NO     | YES     | NO       |
 * ```
 * The starred rows are written for the EMPTY wallet — "no selection" holds only
 * while the client has no method on file.
 *
 * ## Why the two starred rows now read as a PRESELECTED default (FE-3130)
 * `mapPaymentDetails` reads the recording client's gap-keyed 13-record stored
 * list as its full list of cards (fixed on FE-3130), and twelve match an offered
 * gateway, so `hasStoredPaymentMethods` is true. With a default card now on file
 * the unchanged machine preselects it (`context.paymentDetail` is set at boot —
 * proven in `payment-details.machine.int.test.ts`). So "Normal order, no
 * selection" and "Free, capture needed" are no longer reached with an empty
 * choice: the default IS the selection. `showStored` takes its "methods on file"
 * leg, and the preselected default drives `showPaymentActions` on — and, for the
 * free-capture row, closes the gateway list and reads `isComplete`. This is the
 * contract's "default card preselected" at checkout, not a weakened cell. The
 * ADD context still withholds the stored methods — that guard is proven below,
 * unchanged.
 *
 * ## Why no acceptance-criterion id is named
 * The co-located `payment-details.feature` tags no scenario for this table, and
 * `payment-details.traceability.test.ts` enforces the link in BOTH directions —
 * a test naming an untagged criterion fails, and a deferred criterion that
 * quietly acquires a proving test fails too. So the titles below name no
 * criterion id at all and the feature is left untouched. The `meta` docblock's
 * table is this file's whole contract.
 *
 * ## Provenance
 * Every body replayed here was captured by
 * `pnpm fixtures:generate payment-details` into this module's own `fixtures/`
 * dir. No body is authored in this file, and the brand and client ids are read
 * back off the recorded request paths rather than typed in.
 *
 * ## What Breaks If These Fail
 * A storefront that trusts the published table renders the wrong page: a free
 * order asks for a card it does not need, a chosen gateway leaves the gateway
 * list open beside it, or the pay button never appears at all.
 */

import { join } from "node:path";
import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { interpret } from "xstate";
import { getFixture, getFixtureBody } from "@upmind-automation/test-fixtures";
import { GatewayContext } from "@upmind-automation/types";
import { clearSessionCookies } from "../../../__tests__/int-test-helpers";
import paymentDetailsMachine from "../payment-detail.machine";
import { server } from "./setup.integration";
import type { PaymentDetailsContext } from "../payment-details.types";
import type { Interpreter } from "xstate";

// -----------------------------------------------------------------------------

const recordingsDir = join(import.meta.dirname, "fixtures");
const sessionRecordingsDir = join(
  import.meta.dirname,
  "..",
  "..",
  "session-store",
  "__tests__",
  "fixtures"
);

const GATEWAYS_PAY =
  "get-brands-id-gateways-active-1-case-pay-client-id-country-id";
const GATEWAYS_ADD =
  "get-brands-id-gateways-active-1-case-add-client-id-country-id";
const STORED_LIST =
  "get-clients-id-payment-details-active-true-brand-id-country-id";
const WALLET = "get-wallet-balance";
const CALCULATE = "post-cart-calculate";

/** The ids the recorder actually captured, read back off the recorded paths. */
function recordedIds(): { brandId: string; clientId: string } {
  const brandId = /\/api\/brands\/([0-9a-f-]{36})\/gateways/.exec(
    getFixture(GATEWAYS_PAY, { recordingsDir }).request.path
  )?.[1];
  const clientId = /\/api\/clients\/([0-9a-f-]{36})\/payment_details/.exec(
    getFixture(STORED_LIST, { recordingsDir }).request.path
  )?.[1];

  if (!brandId || !clientId) {
    throw new Error(
      "The recorded payment-details fixtures carry no brand id and client id. " +
        "Re-run `pnpm fixtures:generate payment-details`."
    );
  }
  return { brandId, clientId };
}

const { brandId, clientId } = recordedIds();

const CURRENCY = { id: "e47d7382-4850-7931-56c8-1e642d59e063", code: "USD" };

/**
 * The brand switches in play for a test. Brand config is a SETTING, not journey
 * data, so supplying it here is sanctioned (ADR-021 "mock settings not data").
 */
let brandConfig: Record<string, unknown> = {};

vi.mock("../../brand", () => ({
  useBrand: () => ({
    brandId: { value: brandId },
    currency: { value: CURRENCY },
    currencyId: { value: CURRENCY.id },
    countryId: { value: undefined },
    ensureConfig: () => brandConfig,
    getConfig: () => brandConfig,
    getConfigValue: (key: string) => brandConfig[key]
  })
}));

/** Replay one recorded response for a route, for this test only. */
function replay(method: "get" | "post", route: string, key: string): void {
  const recorded = getFixture(key, { recordingsDir }).response;
  server.use(
    http[method](route, () =>
      HttpResponse.json(recorded.body as Record<string, unknown>, {
        status: recorded.status
      })
    )
  );
}

/** Pin the SUCCESS fixture on every route the capture lifecycle reads. */
function replayHappyPath(): void {
  replay("get", "*/api/clients/:clientId/payment_details", STORED_LIST);
  replay("get", "*/api/brands/:brandId/gateways", GATEWAYS_PAY);
  replay("get", "*/api/wallet/balance", WALLET);
  replay("post", "*/api/cart/calculate", CALCULATE);
}

/** Sign a real client in through the real session store. */
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

/**
 * The context a PAY-context caller supplies. `orderId` and `orderStatus` are
 * load-bearing, not decoration: without them the machine never leaves its
 * pre-flight check, which is the module's documented PAY-context requirement
 * (`payment-details.types.ts`, `PaymentDetailsArgs`).
 */
function payContext(
  over: Partial<PaymentDetailsContext> = {}
): PaymentDetailsContext {
  return {
    ctx: GatewayContext.PAY,
    client: { id: clientId },
    currency: CURRENCY,
    amount: 50,
    orderId: "3de78642-de53-9714-76df-21208469530d",
    orderStatus: "invoice_draft",
    paidAmount: 0,
    address: { id: "825d96e7-63ed-0913-46df-417482528340", country_id: "1" },
    raw: {},
    lookups: { amountsFormatted: { amount: "", outstanding: "", wallet: "" } },
    model: { amount: 50, type: null },
    ...over
  } as unknown as PaymentDetailsContext;
}

type Service = Interpreter<PaymentDetailsContext, never, never, never, never>;

/** Start the machine as a caller does, and wait for it to settle or give up. */
async function boot(
  over: Partial<PaymentDetailsContext> = {}
): Promise<Service> {
  const service = interpret(
    paymentDetailsMachine.withContext(payContext(over)),
    { devTools: false }
  ) as unknown as Service;

  service.start();
  service.send({ type: "AUTHENTICATED" });

  await vi.waitFor(
    () => {
      const settled =
        service.state.matches("available") ||
        service.state.matches("unavailable") ||
        service.state.matches("error");
      expect(settled).toBe(true);
    },
    { timeout: 15000, interval: 50 }
  );

  return service;
}

/** The five published cells of one table row, in the table's column order. */
function cellsOf(meta: Record<string, unknown>): Record<string, unknown> {
  return {
    showPaymentSection: meta.showPaymentSection,
    showGatewaySelection: meta.showGatewaySelection,
    showStoredPaymentMethods: meta.showStoredPaymentMethods,
    showPaymentActions: meta.showPaymentActions,
    isComplete: meta.isComplete
  };
}

// -----------------------------------------------------------------------------

describe("paymentDetails visibility contract — the published table", () => {
  let service: Service | undefined;

  beforeEach(async () => {
    brandConfig = {};
    clearSessionCookies();
    const { queryClient } = await import("../../query");
    queryClient.clear();
    await seedClientSession();
    replayHappyPath();
  });

  afterEach(() => {
    service?.stop();
    service = undefined;
    server.resetHandlers();
  });

  /** One row's caller inputs, booted, with a live reader for its five cells. */
  async function held(
    over: Partial<PaymentDetailsContext> = {},
    gatewaysKey: string = GATEWAYS_PAY
  ) {
    replay("get", "*/api/brands/:brandId/gateways", gatewaysKey);
    service = await boot(over);

    const { usePaymentDetail } = await import("../usePaymentDetail");
    const detail = usePaymentDetail(service as never);

    return {
      detail,
      cells: () =>
        cellsOf(detail.meta.value as unknown as Record<string, unknown>)
    };
  }

  /** The first gateway the brand actually offered for this capture. */
  function firstOfferedGatewayId(): string {
    const offered = service?.state.context.lookups.gateways?.[0] as
      | { gateway_id?: string }
      | undefined;

    expect(offered?.gateway_id).toEqual(expect.any(String));
    return offered?.gateway_id as string;
  }

  /**
   * The machine has finished re-validating the model after an action. Reading a
   * row mid-`available.checking` reads a row the machine is still deciding.
   */
  async function hasFinishedValidating(): Promise<void> {
    await vi.waitFor(() => {
      expect(service?.state.matches({ available: "checking" })).toBe(false);
    });
  }

  it("a normal order preselects the client's default card and opens the pay actions", async () => {
    const { cells } = await held();

    expect(cells()).toEqual({
      showPaymentSection: true,
      showGatewaySelection: true,
      showStoredPaymentMethods: true,
      showPaymentActions: true,
      isComplete: false
    });
  });

  it("a chosen gateway closes the gateway list and opens the actions", async () => {
    const { detail, cells } = await held();

    detail.setGateway(firstOfferedGatewayId());
    await vi.waitFor(() => {
      expect(detail.meta.value.hasSelectedGateway).toBe(true);
    });
    await hasFinishedValidating();

    expect(cells()).toEqual({
      showPaymentSection: true,
      showGatewaySelection: false,
      showStoredPaymentMethods: false,
      showPaymentActions: true,
      isComplete: false
    });
  });

  it("a free order needing no capture hides the section and reads complete", async () => {
    const { cells } = await held({
      amount: 0,
      requirePaymentForFreeOrders: false,
      model: { amount: 0, type: null }
    });

    expect(cells()).toEqual({
      showPaymentSection: false,
      showGatewaySelection: false,
      showStoredPaymentMethods: false,
      showPaymentActions: true,
      isComplete: true
    });
  });

  it("a free order that still needs a card kept is completed by the preselected default", async () => {
    const { cells } = await held(
      {
        amount: 0,
        requirePaymentForFreeOrders: true,
        model: { amount: 0, type: null }
      },
      GATEWAYS_ADD
    );

    expect(cells()).toEqual({
      showPaymentSection: true,
      showGatewaySelection: false,
      showStoredPaymentMethods: true,
      showPaymentActions: true,
      isComplete: true
    });
  });

  it("the add context offers the gateways and never the stored methods", async () => {
    const { cells } = await held(
      {
        ctx: GatewayContext.ADD,
        amount: 0,
        orderId: undefined,
        orderStatus: undefined,
        model: { amount: 0, type: null }
      },
      GATEWAYS_ADD
    );

    expect(cells()).toEqual({
      showPaymentSection: true,
      showGatewaySelection: true,
      showStoredPaymentMethods: false,
      showPaymentActions: false,
      isComplete: false
    });
  });

  it("account credit covering the whole amount closes the gateway list", async () => {
    const { detail, cells } = await held({
      amount: 10,
      model: { amount: 10, type: null }
    });

    detail.setAmountCredit(10);
    await vi.waitFor(() => {
      expect(service?.state.context.model.wallet_amount).toBe(10);
    });
    await hasFinishedValidating();

    expect(cells()).toEqual({
      showPaymentSection: true,
      showGatewaySelection: false,
      showStoredPaymentMethods: false,
      showPaymentActions: true,
      isComplete: false
    });
  });
});
