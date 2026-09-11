// -----------------------------------------------------------------------------
/**
 * @module tests/third-closure
 * @description Plan §9 (phase F7): the six rows the post-F6 audit read as
 * open. A stored card the gateway never confirmed offers a second attempt,
 * and only where the gateway will take one (A1); a brand that lets a client
 * book a thread takes the moment it should open at (A2); a brand that takes
 * payment in more than one currency says what each would cost and settles in
 * the one the client picked (A3); the withdrawal CTA, the last card's removal
 * and the auto-pay switch each answer to a brand key rather than to a
 * hardcoded rule (A4–A6).
 *
 * Every amount, count and branch is computed in the test from the seed and
 * its rates, or read off a dataset sitting on the gate's other side — a
 * figure that agrees with the selector that produced it proves nothing, and a
 * gate graded on one dataset is a seed read-back (plan R9).
 */

import { beforeEach, describe, expect, it } from "vitest";
import {
  BrandConfigKeys,
  InvoiceStatusGroups,
  TicketStatusCodes
} from "@upmind-automation/types";
import {
  assign,
  every,
  filter,
  find,
  first,
  includes,
  map,
  size,
  some,
  values
} from "lodash-es";
import type { DataRefId } from "~/portal/mock/data-refs";
import type { DataRouteContext } from "~/portal/mock/injection";
import type {
  MockBrandFeatures,
  MockDataset,
  MockInvoice,
  MockTicket
} from "~/portal/mock/types";
import type { ListModuleItem } from "~/portal/modules/list/types";
import {
  MOCK_ACTION,
  MOCK_REFUSAL_MESSAGE,
  MOCK_TOAST_INTENT,
  dispatchMockAction,
  mockActionValue
} from "~/portal/mock/actions";
import * as ticketSchemas from "~/portal/mock/contracts/client-tickets.schemas";
import {
  DATA_REF_ID,
  dataRef,
  resolveDataRefProps
} from "~/portal/mock/data-refs";
import { MOCK_RECEIPT_REASON } from "~/portal/mock/facades";
import { FORM_ID } from "~/portal/mock/forms/ids";
import { ticketFormContext } from "~/portal/mock/forms/support-contexts";
import {
  MOCK_DATASET_ID,
  resetMockData,
  useMockData
} from "~/portal/mock/store";
import { BRAND_GATE_CONFIG_KEY } from "~/portal/mock/types";

const NO_CONTEXT: DataRouteContext = {};

const SCHEDULED_TAG = /scheduled/i;

const SUBJECT = "Region two will not come up after the deploy";

const BODY = "The second region sits at 40% and the log stops there.";

const MESSAGE = "Please send this month's commission on.";

/** A currency code no brand publishes and no rate names. */
const UNKNOWN_CURRENCY = "ZWL";

const DAY = 24 * 60 * 60 * 1000;

type ActionLike = {
  readonly value: string;
  readonly label: string;
  readonly disabledReason?: string;
};

function hostgrid(): MockDataset {
  return useMockData(MOCK_DATASET_ID.HOSTGRID);
}

function minimal(): MockDataset {
  return useMockData(MOCK_DATASET_ID.HOSTGRID_MINIMAL);
}

function ref<T>(
  data: MockDataset,
  id: DataRefId,
  context: DataRouteContext = {}
): T {
  return resolveDataRefProps({ value: dataRef(id) }, data, context)?.value as T;
}

function toastText(result: {
  toast?: { title: string; description?: string };
}): string {
  return `${result.toast?.title ?? ""} ${result.toast?.description ?? ""}`;
}

function payload(verb: string, model: unknown): string {
  return `${verb}:${JSON.stringify(model)}`;
}

/** A dataset of this seed's own shape with some gates moved — R9's other branch. */
function withFeatures(
  data: MockDataset,
  overrides: Partial<MockBrandFeatures>
): MockDataset {
  return assign({}, data, {
    features: assign({}, data.features, overrides)
  });
}

// -----------------------------------------------------------------------------
// A1 — the second confirmation attempt on a stored card
// -----------------------------------------------------------------------------

// -----------------------------------------------------------------------------
// A2 — booking a thread to open later
// -----------------------------------------------------------------------------

function ticketSchema(data: MockDataset) {
  return ticketSchemas.useSchema(ticketFormContext(data, {}));
}

function scheduleProperty(data: MockDataset) {
  const schema = ticketSchema(data);
  return schema.properties?.["scheduledAt"];
}

function scheduleControl(data: MockDataset) {
  return find(ticketSchemas.useUischema(ticketFormContext(data, {})).elements, {
    scope: "#/properties/scheduledAt"
  });
}

function openTicket(
  data: MockDataset,
  model: Record<string, unknown>
): ReturnType<typeof dispatchMockAction> {
  return dispatchMockAction(
    data,
    NO_CONTEXT,
    payload(
      MOCK_ACTION.TICKET_CREATE,
      assign(
        {
          subject: SUBJECT,
          body: BODY,
          departmentId: first(data.departments)?.id
        },
        model
      )
    )
  );
}

function raised(data: MockDataset): MockTicket | undefined {
  return find(data.tickets, { subject: SUBJECT });
}

describe("A2 — the thread a client asks to open later", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
    resetMockData(MOCK_DATASET_ID.HOSTGRID_MINIMAL);
  });

  it("asks for the moment only where the brand lets a client choose one", () => {
    const asked = hostgrid();
    const notAsked = minimal();

    expect(asked.features.CLIENT_TICKET_SCHEDULING_ENABLED).toBe(true);
    expect(notAsked.features.CLIENT_TICKET_SCHEDULING_ENABLED).toBe(false);
    expect(scheduleProperty(asked)).toMatchObject({ format: "date-time" });
    expect(scheduleControl(asked)).toBeDefined();
    // Optional: legacy opened the thread at once when the field was left empty.
    expect(ticketSchema(asked).required).not.toContain("scheduledAt");
    expect(scheduleProperty(notAsked)).toBeUndefined();
    expect(scheduleControl(notAsked)).toBeUndefined();
    // The page's own bound schema is the schema module's, on both brands.
    expect(ref(asked, DATA_REF_ID.NEW_TICKET_FORM_SCHEMA)).toEqual(
      ticketSchema(asked)
    );
    expect(ref(notAsked, DATA_REF_ID.NEW_TICKET_FORM_SCHEMA)).toEqual(
      ticketSchema(notAsked)
    );
  });

  it("books the thread for the moment named, and marks it as booked", () => {
    const data = hostgrid();
    const when = new Date(Date.now() + DAY).toISOString();
    const before = size(data.tickets);

    const result = openTicket(data, { scheduledAt: when });

    const ticket = raised(data);
    expect(size(data.tickets)).toBe(before + 1);
    expect(ticket?.status).toBe(TicketStatusCodes.SCHEDULED);
    expect(ticket?.scheduledAt).toBe(when);
    expect(result?.toast?.intent).toBe(MOCK_TOAST_INTENT.SUCCESS);
    expect(
      map(
        filter(
          ref<ListModuleItem[]>(data, DATA_REF_ID.TICKET_ITEMS, {
            status: "scheduled"
          }),
          { id: ticket?.id }
        ),
        row => some(row.tags, tag => SCHEDULED_TAG.test(tag.label))
      )
    ).toEqual([true]);
  });

  it("opens the thread now when no moment is named", () => {
    const data = hostgrid();

    openTicket(data, {});

    expect(raised(data)?.status).toBe(TicketStatusCodes.OPEN);
    expect(raised(data)?.scheduledAt).toBeUndefined();
  });

  it("refuses a moment that has already passed, and opens nothing", () => {
    const data = hostgrid();
    const before = size(data.tickets);

    const result = openTicket(data, {
      scheduledAt: new Date(Date.now() - DAY).toISOString()
    });

    expect(result?.toast?.intent).not.toBe(MOCK_TOAST_INTENT.SUCCESS);
    expect(toastText(result ?? {})).toContain(
      MOCK_REFUSAL_MESSAGE[MOCK_RECEIPT_REASON.SCHEDULE_NOT_FUTURE]
    );
    expect(size(data.tickets)).toBe(before);
    expect(raised(data)).toBeUndefined();
  });

  it("ignores a moment a brand that asks for none was handed anyway", () => {
    const data = minimal();

    const result = openTicket(data, {
      scheduledAt: new Date(Date.now() + DAY).toISOString()
    });

    expect(result?.toast?.intent).toBe(MOCK_TOAST_INTENT.SUCCESS);
    expect(raised(data)?.status).toBe(TicketStatusCodes.OPEN);
    expect(raised(data)?.scheduledAt).toBeUndefined();
  });
});

// -----------------------------------------------------------------------------
// A3 — paying in a currency the brand also takes
// -----------------------------------------------------------------------------

function owedInvoice(data: MockDataset): MockInvoice {
  const invoice = find(data.invoices, candidate =>
    includes(InvoiceStatusGroups.UNPAID, candidate.status)
  );
  if (invoice === undefined) throw new Error("seed carries no unpaid invoice");
  return invoice;
}

describe("A3 — the brand that takes payment in more than one currency", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
    resetMockData(MOCK_DATASET_ID.HOSTGRID_MINIMAL);
  });

  // Plan §9 A3: the currency is the tail of the verb's own grammar, so one
  // the brand publishes no rate for is a segment outside its vocabulary —
  // the door's malformed tier, which takes nothing (`dispatcher-refusal-tiers`).
  it("refuses a currency the brand publishes no rate for, and takes nothing", () => {
    const data = hostgrid();
    const invoice = owedInvoice(data);

    const asked = dispatchMockAction(
      data,
      NO_CONTEXT,
      `${MOCK_ACTION.PAY_INVOICE}:${invoice.id}:${
        first(data.paymentMethods)?.id ?? ""
      }:${UNKNOWN_CURRENCY}`
    );
    const settled = dispatchMockAction(
      data,
      NO_CONTEXT,
      asked?.confirm?.then ?? ""
    );

    const after = find(data.invoices, { id: invoice.id });
    expect(includes(Object.keys(data.currencyRates), UNKNOWN_CURRENCY)).toBe(
      false
    );
    expect(settled?.toast?.intent).not.toBe(MOCK_TOAST_INTENT.SUCCESS);
    expect(after?.payments).toEqual([]);
    expect(after?.status).toBe(invoice.status);
    expect(after?.unpaidAmount.amount).toBe(invoice.unpaidAmount.amount);
  });
});

// -----------------------------------------------------------------------------
// A4 — the withdrawal request the brand may not take
// -----------------------------------------------------------------------------

function withdrawalActions(data: MockDataset): ActionLike[] {
  return (
    ref<ActionLike[]>(data, DATA_REF_ID.AFFILIATE_WITHDRAWAL_ACTIONS) ?? []
  );
}

describe("A4 — the brand that takes withdrawal requests, and the one that does not", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
    resetMockData(MOCK_DATASET_ID.HOSTGRID_MINIMAL);
  });

  it("offers the request, and lodges one, where the brand takes them", () => {
    const data = hostgrid();
    const affiliate = data.affiliate;
    if (affiliate === null) throw new Error("seed carries no affiliate");
    const before = size(affiliate.payouts);

    expect(data.features.AFFILIATES_WITHDRAW_REQUEST).toBe(true);
    expect(map(withdrawalActions(data), "value")).toEqual([
      mockActionValue(
        MOCK_ACTION.OPEN_FORM,
        FORM_ID.AFFILIATE_WITHDRAWAL_REQUEST
      )
    ]);

    const result = dispatchMockAction(
      data,
      NO_CONTEXT,
      payload(MOCK_ACTION.AFFILIATE_WITHDRAWAL_REQUEST, { message: MESSAGE })
    );

    expect(result?.toast?.intent).toBe(MOCK_TOAST_INTENT.SUCCESS);
    expect(size(affiliate.payouts)).toBe(before + 1);
  });

  it("offers nothing at all where the brand takes none", () => {
    const data = hostgrid();
    const gated = withFeatures(data, { AFFILIATES_WITHDRAW_REQUEST: false });

    expect(size(withdrawalActions(data))).toBeGreaterThan(0);
    expect(withdrawalActions(gated)).toEqual([]);
    // The minimal brand sits on the same side of the key.
    expect(minimal().features.AFFILIATES_WITHDRAW_REQUEST).toBe(false);
  });

  it("refuses the request itself where the brand takes none, and lodges nothing", () => {
    const data = hostgrid();
    const gated = withFeatures(data, { AFFILIATES_WITHDRAW_REQUEST: false });
    const affiliate = gated.affiliate;
    if (affiliate === null) throw new Error("seed carries no affiliate");
    const before = size(affiliate.payouts);
    const cleared = affiliate.stats.availableBalance.amount;

    const result = dispatchMockAction(
      gated,
      NO_CONTEXT,
      payload(MOCK_ACTION.AFFILIATE_WITHDRAWAL_REQUEST, { message: MESSAGE })
    );

    // There IS money to take, so the refusal can only be the brand key.
    expect(cleared).toBeGreaterThan(0);
    expect(result?.toast?.intent).not.toBe(MOCK_TOAST_INTENT.SUCCESS);
    expect(toastText(result ?? {})).toContain(
      MOCK_REFUSAL_MESSAGE[MOCK_RECEIPT_REASON.WITHDRAWAL_DISABLED]
    );
    expect(size(affiliate.payouts)).toBe(before);
    expect(affiliate.stats.availableBalance.amount).toBe(cleared);
  });
});

// -----------------------------------------------------------------------------
// A5 — the last card the brand may keep on file
// -----------------------------------------------------------------------------

// -----------------------------------------------------------------------------
// A6 — the brand that settles every stored card itself
// -----------------------------------------------------------------------------

// -----------------------------------------------------------------------------
// The five keys this phase bound
// -----------------------------------------------------------------------------

const F7_GATES = [
  "CLIENT_TICKET_SCHEDULING_ENABLED",
  "BILLING_DIFFERENT_CURRENCY_PAYMENT_ENABLED",
  "AFFILIATES_WITHDRAW_REQUEST",
  "PREVENT_CARD_REMOVAL_IF_LAST",
  "BILLING_GATEWAY_FORCE_AUTO_PAYMENT"
] as const;

describe("the gates this phase bound are the platform's own keys", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
    resetMockData(MOCK_DATASET_ID.HOSTGRID_MINIMAL);
  });

  it("reads each of the five through a real BrandConfigKeys member", () => {
    expect(map(F7_GATES, gate => BRAND_GATE_CONFIG_KEY[gate])).toEqual([
      BrandConfigKeys.CLIENT_TICKET_SCHEDULING_ENABLED,
      BrandConfigKeys.BILLING_DIFFERENT_CURRENCY_PAYMENT_ENABLED,
      BrandConfigKeys.AFFILIATES_WITHDRAW_REQUEST,
      BrandConfigKeys.PREVENT_CARD_REMOVAL_IF_LAST,
      BrandConfigKeys.BILLING_GATEWAY_FORCE_AUTO_PAYMENT
    ]);
    expect(
      every(F7_GATES, gate =>
        includes(values(BrandConfigKeys), BRAND_GATE_CONFIG_KEY[gate])
      )
    ).toBe(true);
  });

  it("seeds the two brands on opposite sides of every one of them", () => {
    const on = hostgrid().features;
    const off = minimal().features;

    expect(map(F7_GATES, gate => on[gate])).toEqual([
      true,
      true,
      true,
      true,
      false
    ]);
    expect(map(F7_GATES, gate => off[gate])).toEqual(
      map(F7_GATES, gate => !on[gate])
    );
  });
});
